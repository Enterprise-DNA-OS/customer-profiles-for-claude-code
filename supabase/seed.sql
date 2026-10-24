insert into sources(id,code,name,owner,purpose,jurisdiction,notice_basis,last_import_at) values
 ('10000000-0000-4000-8000-000000000001','CRM','Kauri CRM','Aroha','Customer service','NZ','Collection notice v2',now()-interval '2 days'),
 ('10000000-0000-4000-8000-000000000002','STORE','Kauri Store','Ben','Order support','NZ','Notice review needed',now()-interval '12 days'),
 ('10000000-0000-4000-8000-000000000003','LEGACY','Legacy mailing file','','','AU','',null)
 on conflict do nothing;
insert into source_records(id,source_id,external_id,full_name,email,country,collected_on,retention_until) values
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','C001','Mere Rangi','mere@example.test','NZ',current_date-120,current_date+180),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','S001','Mere Rangi','MERE@example.test','NZ',current_date-90,current_date+180),
 ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','C002','Ben Cole','office@example.test','AU',current_date-400,current_date-5),
 ('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000002','S002','Jo Cole','office@example.test','AU',current_date-10,current_date+300),
 ('20000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000003','L001','Mere Rangi','old-mere@example.test','NZ',current_date-600,current_date-10),
 ('20000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000003','L002','','','NZ',current_date-500,current_date-20)
 on conflict do nothing;
insert into profiles(id,code,name) values ('30000000-0000-4000-8000-000000000001','MERE','Mere Rangi'),('30000000-0000-4000-8000-000000000002','BEN','Ben Cole') on conflict do nothing;
insert into memberships(id,record_id,profile_id,reviewed_by,reason) values
 ('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','Demo operator','Account reference checked'),
 ('40000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000001','Demo operator','Historical link needing review'),
 ('40000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000002','Demo operator','Account reference checked') on conflict do nothing;
insert into consent_events(id,profile_id,channel,purpose,decision,observed_on,evidence,actor) values
 ('50000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','email','newsletter','granted',current_date-20,'Demo preference form','Demo operator'),
 ('50000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','email','newsletter','denied',current_date-1,'Demo withdrawal record','Demo operator') on conflict do nothing;
insert into actions(id,code,name,owner,due_on) values
 ('60000000-0000-4000-8000-000000000001','REVIEW-1','Confirm old Mere address','Aroha',current_date-3),
 ('60000000-0000-4000-8000-000000000002','REVIEW-2','Review legacy purpose and notice','Ben',current_date-1),
 ('60000000-0000-4000-8000-000000000003','REVIEW-3','Reconcile store export totals','Ben',current_date+2) on conflict do nothing;
