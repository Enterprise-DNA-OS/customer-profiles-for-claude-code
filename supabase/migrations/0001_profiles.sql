create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table sources (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Z0-9_-]+$'), name text not null,
 owner text not null default '', purpose text not null default '', jurisdiction text not null check(jurisdiction in ('NZ','AU','OTHER')),
 notice_basis text not null default '', freshness_days integer not null default 7 check(freshness_days between 1 and 3650),
 last_import_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table source_records (
 id uuid primary key default gen_random_uuid(), source_id uuid not null references sources(id), external_id text not null check(length(trim(external_id))>0),
 full_name text not null default '', email text not null default '', country text not null default '',
 collected_on date not null, retention_until date not null check(retention_until>=collected_on),
 attributes jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(source_id,external_id)
);
create index record_email on source_records(lower(trim(email))) where email<>'';
create table profiles (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Z0-9_-]+$'), name text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table memberships (
 id uuid primary key default gen_random_uuid(), record_id uuid not null unique references source_records(id), profile_id uuid not null references profiles(id),
 reviewed_by text not null check(length(trim(reviewed_by))>0), reason text not null check(length(trim(reason))>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table consent_events (
 id uuid primary key default gen_random_uuid(), sequence bigint generated always as identity unique,
 profile_id uuid not null references profiles(id), channel text not null check(channel in ('email','sms','phone')),
 purpose text not null check(length(trim(purpose))>0), decision text not null check(decision in ('granted','denied','unknown')),
 observed_on date not null, evidence text not null check(length(trim(evidence))>0), actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table actions (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Z0-9_-]+$'), name text not null,
 owner text not null, due_on date not null, status text not null default 'open' check(status in ('open','closed')),
 evidence text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status<>'closed' or length(trim(evidence))>0)
);
create table audit_log (
 id uuid primary key default gen_random_uuid(), actor text not null check(length(trim(actor))>0), event text not null, details jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
do $$ declare t text; begin
 foreach t in array array['sources','source_records','profiles','memberships','consent_events','actions','audit_log'] loop
 execute format('create trigger touch_updated before update on %I for each row execute function touch_updated_at()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop;
end $$;
create view record_lineage as
 select r.id, s.code as source, r.external_id, r.full_name, r.email, r.country, r.collected_on, r.retention_until,
 p.code as profile, m.reviewed_by, m.reason from source_records r join sources s on s.id=r.source_id
 left join memberships m on m.record_id=r.id left join profiles p on p.id=m.profile_id;
create view duplicate_candidates as
 select a.id as left_id,b.id as right_id, sa.code||':'||a.external_id as left_record,sb.code||':'||b.external_id as right_record,
 a.full_name as left_name,b.full_name as right_name,lower(trim(a.email)) as shared_email,
 case when lower(trim(a.full_name))=lower(trim(b.full_name)) and trim(a.full_name)<>'' then 'same name and email; verify' else 'shared email; names differ' end as review_reason
 from source_records a join source_records b on a.id::text<b.id::text and lower(trim(a.email))=lower(trim(b.email)) and trim(a.email)<>''
 join sources sa on sa.id=a.source_id join sources sb on sb.id=b.source_id
 left join memberships ma on ma.record_id=a.id left join memberships mb on mb.record_id=b.id
 where ma.profile_id is null or mb.profile_id is null or ma.profile_id<>mb.profile_id;
create view profile_conflicts as
 select p.id,p.code,p.name,count(m.record_id)::integer as records,
 count(distinct nullif(lower(trim(r.email)),''))::integer as email_variants,
 count(distinct nullif(lower(trim(r.full_name)),''))::integer as name_variants
 from profiles p left join memberships m on m.profile_id=p.id left join source_records r on r.id=m.record_id
 group by p.id,p.code,p.name;
create view latest_consent as
 select p.code as profile,c.channel,c.purpose,c.decision,c.observed_on,c.evidence,c.actor,c.profile_id from
 (select *,row_number() over(partition by profile_id,channel,purpose order by observed_on desc,
 case decision when 'denied' then 0 when 'unknown' then 1 else 2 end,sequence desc) as rank from consent_events) c
 join profiles p on p.id=c.profile_id where rank=1;
create view source_health as
 select s.id,s.code,s.name,s.owner,s.purpose,s.notice_basis,s.jurisdiction,s.last_import_at,
 case when s.last_import_at is null then 'never imported' when s.last_import_at<now()-s.freshness_days*interval '1 day' then 'stale' else 'current' end as freshness,
 count(r.id)::integer as records,count(r.id) filter(where m.id is null)::integer as unlinked
 from sources s left join source_records r on r.source_id=s.id left join memberships m on m.record_id=r.id group by s.id;
create view retention_review as select * from record_lineage where retention_until<current_date;
create view attention as select code,name,owner,due_on,current_date-due_on as days_overdue from actions where status='open' and due_on<current_date;
create view compliance_findings as
 select 'purpose_missing' as rule,code as reference,'NZ IPP1 / AU APP3: document purpose' as finding from sources where trim(purpose)=''
 union all select 'owner_missing',code,'Assign an accountable data owner' from sources where trim(owner)=''
 union all select 'notice_review',code,'NZ IPP3A / AU APP5: review notification or exception evidence' from sources where trim(notice_basis)=''
 union all select 'retention_review',source||':'||external_id,'NZ IPP9 / AU APP11: review purpose and applicable retention duties' from retention_review
 union all select 'identity_conflict',code,'NZ IPP8 / AU APP10: verify conflicting identity details before use' from profile_conflicts where email_variants>1 or name_variants>1
 union all select 'name_missing',source||':'||external_id,'Accuracy review: source has no name' from record_lineage where trim(full_name)='';
