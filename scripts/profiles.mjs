#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {table} from './lib/format.mjs';
import {parseCsv} from './lib/csv.mjs';

export const commands = {
 help:'List commands and options', sources:'Source ownership and purpose', records:'Source records and profile links',
 profiles:'Reviewed profiles and conflicting values', profile:'One profile with source lineage (--ref)',
 duplicates:'Same-email candidates requiring human review', conflicts:'Profiles with conflicting identity values',
 'consent-review':'Latest recorded preferences; not permission to send', 'retention-review':'Records past their operator-set review date',
 'source-health':'Import freshness and unlinked counts', attention:'Overdue review actions', actions:'All review actions',
 compliance:'Privacy and accuracy review findings', audit:'Operator change history', 'weekly-review':'Source health, conflicts and attention',
 'add-source':'--code --name --owner --purpose --jurisdiction --notice --actor [--freshness-days]',
 'add-record':'--source --external-id --name --email --country --collected-on --retention-until --actor',
 'create-profile':'--code --name --actor', link:'--record --profile --reason --actor', unlink:'--record --reason --actor',
 'record-consent':'--profile --channel --purpose --decision --observed-on --evidence --actor',
 'add-action':'--code --name --owner --due-on --actor', 'close-action':'--ref --evidence --actor',
 log:'--note --actor', import:'salesforce-data-cloud --source --file --actor [--dry-run] [--update]',
 export:'--file (full JSON archive, no overwrite)', 'draft-review':'--file (under drafts/, no send or overwrite)'
};
const known=new Set(['json','ref','source','profile','record','code','name','owner','purpose','jurisdiction','notice','freshness-days','external-id','email','country','collected-on','retention-until','actor','reason','channel','decision','observed-on','evidence','due-on','note','file','dry-run','update']);
export function parseArgs(argv){
 const options={},pos=[];
 for(let i=0;i<argv.length;i++){
  const a=argv[i]; if(!a.startsWith('--')){pos.push(a);continue;}
  const at=a.indexOf('='), k=a.slice(2,at<0?undefined:at);
  if(!known.has(k))throw Error(`Unknown option --${k}`);
  if(k in options)throw Error(`Repeated option --${k}`);
  if(['json','dry-run','update'].includes(k)){if(at>=0)throw Error(`--${k} is a boolean flag`);options[k]=true;}
  else {const value=at<0?argv[++i]:a.slice(at+1);if(value===undefined||value.startsWith('--'))throw Error(`Missing value --${k}`);options[k]=value;}
 }
 return {cmd:pos[0]||'help',arg:pos[1],options,pos};
}
const need=(o,k)=>{const v=o[k];if(typeof v!=='string'||!v.trim())throw Error(`Required --${k}`);return v.trim();};
const date=(v)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`Invalid calendar date: ${v}`);return v;};
const code=(v)=>{v=v.toUpperCase();if(!/^[A-Z0-9_-]+$/.test(v))throw Error('Code must contain letters, digits, underscore or hyphen');return v;};
const choice=(v,values)=>{if(!values.includes(v))throw Error(`Expected one of: ${values.join(', ')}`);return v;};
async function resolve(db,kind,ref){
 const spec={source:['sources','code','name'],profile:['profiles','code','name'],action:['actions','code','name']};
 let rows;
 if(kind==='record')rows=await db.query('select id,source||\':\'||external_id as code,full_name as name from record_lineage order by source,external_id');
 else {const [t,c,n]=spec[kind];rows=await db.query(`select id,${c} as code,${n} as name from ${t} order by ${c}`);}
 const q=ref.toLowerCase();const exact=rows.filter(r=>r.code.toLowerCase()===q||r.id===q);
 const found=exact.length?exact:rows.filter(r=>r.id.toLowerCase().startsWith(q)||r.name.toLowerCase().includes(q));
 if(found.length!==1)throw Error(`${kind} ${ref}: ${found.length?'ambiguous':'not found'}\n${format(found.length?found:rows)}`);
 return found[0];
}
async function audit(db,actor,event,details){await db.query('insert into audit_log(actor,event,details) values($1,$2,$3::jsonb)',[actor,event,JSON.stringify(details)]);}
async function tx(db,fn,dry=false){await db.exec('BEGIN');try{const out=await fn();await db.exec(dry?'ROLLBACK':'COMMIT');return out;}catch(e){await db.exec('ROLLBACK');throw e;}}
export function format(value){
 if(Array.isArray(value)){if(!value.length)return '  (none)';const rows=value.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,typeof v==='object'&&v!==null?JSON.stringify(v):v])));return table(rows,Object.keys(rows[0]).map(key=>({key,label:key.replaceAll('_',' ')})));}
 if(value&&typeof value==='object')return Object.entries(value).map(([k,v])=>`${k.replaceAll('_',' ')}\n${format(Array.isArray(v)?v:[typeof v==='object'?v:{value:v}])}`).join('\n\n');
 return String(value);
}
function validateRecord(row){
 if(!row||typeof row!=='object'||Array.isArray(row))throw Error('Expected a record object');
 for(const k of ['record_id','full_name','email','country','collected_on','retention_until'])if(typeof row[k]!=='string')throw Error(`Import requires text column ${k}`);
 const r={external_id:row.record_id.trim(),full_name:row.full_name.trim(),email:row.email.trim(),country:row.country.trim().toUpperCase(),collected_on:date(row.collected_on),retention_until:date(row.retention_until)};
 if(!r.external_id)throw Error('Empty record_id');
 if(r.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email))throw Error(`Invalid email for ${r.external_id}`);
 if(r.country&&!/^[A-Z]{2}$/.test(r.country))throw Error('Country must be a two-letter code or empty');
 if(r.retention_until<r.collected_on)throw Error('Retention date precedes collection');
 if(r.collected_on>new Date().toISOString().slice(0,10))throw Error('Collection date cannot be in the future');
 return {...r,attributes:row};
}
export function readImport(file){
 const text=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'');let rows;
 if(file.toLowerCase().endsWith('.csv'))rows=parseCsv(text);
 else {
  const doc=JSON.parse(text); const batches=Array.isArray(doc)?doc:[doc];
  if(!batches.length)throw Error('No export batches');
  let queryId;
  rows=batches.flatMap((b,i)=>{
   if(!b||!Array.isArray(b.data)||typeof b.done!=='boolean'||!Number.isInteger(b.rowCount)||b.rowCount!==b.data.length)throw Error('Invalid Query V2 response or rowCount mismatch');
   if(typeof b.queryId!=='string'||!b.queryId.trim())throw Error('Missing queryId');
   if(queryId&&queryId!==b.queryId)throw Error('Mixed query IDs');queryId=b.queryId;
   if(i<batches.length-1&&(b.done||!b.nextBatchId))throw Error('Invalid batch sequence');
   if(i===batches.length-1&&!b.done)throw Error('Incomplete export: fetch remaining batches before import');
   return b.data;
  });
 }
 const result=rows.map(validateRecord),seen=new Set();
 for(const r of result){if(seen.has(r.external_id))throw Error(`Duplicate record_id in file: ${r.external_id}`);seen.add(r.external_id);}
 return result;
}
async function storeRecord(db,source,r,allowUpdate,actor){
 const old=(await db.query('select * from source_records where source_id=$1 and external_id=$2 for update',[source,r.external_id]))[0];
 if(old){
  const keys=['full_name','email','country','collected_on','retention_until'];
  const same=keys.every(k=>old[k]===r[k]) && JSON.stringify(stable(old.attributes))===JSON.stringify(stable(r.attributes));
  if(same)return 'skipped';
  if(!allowUpdate)throw Error(`Changed existing record ${r.external_id}; review then use --update`);
  const identityChanged=['full_name','email','country'].some(k=>old[k]!==r[k]);
  if(identityChanged){const links=await db.query('delete from memberships where record_id=$1 returning *',[old.id]);if(links.length)await audit(db,actor,'identity_change_unlinked',{record:old.id,links});}
  await db.query('update source_records set full_name=$1,email=$2,country=$3,collected_on=$4,retention_until=$5,attributes=$6::jsonb where id=$7',[r.full_name,r.email,r.country,r.collected_on,r.retention_until,JSON.stringify(r.attributes),old.id]);
  await audit(db,actor,'record_updated',{before:old,after:r});return 'updated';
 }
 await db.query('insert into source_records(source_id,external_id,full_name,email,country,collected_on,retention_until,attributes) values($1,$2,$3,$4,$5,$6,$7,$8::jsonb)',[source,r.external_id,r.full_name,r.email,r.country,r.collected_on,r.retention_until,JSON.stringify(r.attributes)]);return 'inserted';
}
function stable(v){return Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;}
export async function run(db,argv){
 const {cmd,arg,options:o,pos}=parseArgs(argv);
 if(!commands[cmd])throw Error(`Unknown command: ${cmd}`);
 if(pos.length>(cmd==='import'?2:1))throw Error('Unexpected positional argument');
 const allowed = cmd==='import' ? ['source','file','actor','dry-run','update'] : cmd==='profile' ? ['ref'] : cmd==='export'||cmd==='draft-review' ? ['file'] : cmd==='unlink' ? ['record','reason','actor'] : cmd==='link' ? ['record','profile','reason','actor'] : [...commands[cmd].matchAll(/--([a-z-]+)/g)].map(m=>m[1]);
 for(const k of Object.keys(o))if(k!=='json'&&!allowed.includes(k))throw Error(`--${k} is not used by ${cmd}`);
 if(cmd==='help')return Object.entries(commands).map(([command,usage])=>({command,usage}));
 const reads={sources:'select code,name,owner,purpose,jurisdiction,notice_basis from sources order by code',records:'select source,external_id,full_name,email,country,profile,retention_until from record_lineage order by source,external_id',profiles:'select code,name,records,email_variants,name_variants from profile_conflicts order by code',duplicates:'select left_record,right_record,left_name,right_name,shared_email,review_reason from duplicate_candidates order by left_record,right_record',conflicts:'select code,name,records,email_variants,name_variants from profile_conflicts where email_variants>1 or name_variants>1 order by code','consent-review':'select profile,channel,purpose,decision,observed_on,evidence from latest_consent order by profile,channel,purpose','retention-review':'select source,external_id,full_name,retention_until,profile from retention_review order by retention_until,source,external_id','source-health':'select code,owner,freshness,records,unlinked from source_health order by code',attention:'select * from attention order by due_on,code',actions:'select code,name,owner,due_on,status,evidence from actions order by due_on,code',compliance:'select * from compliance_findings order by rule,reference',audit:'select actor,event,details,created_at from audit_log order by created_at,id'};
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='profile'){
  const p=await resolve(db,'profile',need(o,'ref'));
  return {profile:await db.query('select code,name,records,email_variants,name_variants from profile_conflicts where id=$1',[p.id]),lineage:await db.query('select source,external_id,full_name,email,reviewed_by,reason from record_lineage where profile=$1 order by source,external_id',[p.code]),preferences:await db.query('select channel,purpose,decision,observed_on,evidence from latest_consent where profile_id=$1 order by channel,purpose',[p.id])};
 }
 if(cmd==='weekly-review'||cmd==='draft-review'){
  const report={source_health:await run(db,['source-health']),conflicts:await run(db,['conflicts']),attention:await run(db,['attention']),privacy_checks:await run(db,['compliance'])};
  if(cmd==='weekly-review')return report;
  const root=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');const file=path.resolve(root,need(o,'file'));
  if(!file.startsWith(root+path.sep)||!file.endsWith('.md'))throw Error('Draft must be a .md file inside drafts/');
  fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});fs.writeFileSync(file,`# Weekly customer data review\n\n${format(report)}\n\nDraft for internal review. Nothing sent.\n`,{flag:'wx',mode:0o600});return [{file,status:'drafted, not sent'}];
 }
 if(cmd==='export'){
  const file=path.resolve(need(o,'file'));const data=await tx(db,async()=>{
   await db.exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY');
   const out={format:'customer-profiles/v1',exported_at:new Date().toISOString()};
   for(const t of ['sources','source_records','profiles','memberships','consent_events','actions','audit_log'])out[t]=await db.query(`select * from ${t} order by id`);
   return out;
  });
  fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});return [{file,status:'exported'}];
 }
 const actor=need(o,'actor');
 return tx(db,async()=>{
  let result;
  if(cmd==='add-source'){
   const days=Number(o['freshness-days']||7);if(!Number.isInteger(days)||days<1||days>3650)throw Error('freshness-days must be 1..3650');
   result=await db.query('insert into sources(code,name,owner,purpose,jurisdiction,notice_basis,freshness_days) values($1,$2,$3,$4,$5,$6,$7) returning code,name',[code(need(o,'code')),need(o,'name'),need(o,'owner'),need(o,'purpose'),choice(need(o,'jurisdiction'),['NZ','AU','OTHER']),need(o,'notice'),days]);
  }else if(cmd==='create-profile')result=await db.query('insert into profiles(code,name) values($1,$2) returning code,name',[code(need(o,'code')),need(o,'name')]);
  else if(cmd==='add-record'){
   const s=await resolve(db,'source',need(o,'source'));const r=validateRecord({record_id:need(o,'external-id'),full_name:need(o,'name'),email:o.email||'',country:o.country||'',collected_on:need(o,'collected-on'),retention_until:need(o,'retention-until')});
   result=[{record:r.external_id,status:await storeRecord(db,s.id,r,false,actor)}];
  }else if(cmd==='link'){
   const r=await resolve(db,'record',need(o,'record')),p=await resolve(db,'profile',need(o,'profile'));
   result=await db.query('insert into memberships(record_id,profile_id,reviewed_by,reason) values($1,$2,$3,$4) returning record_id,profile_id',[r.id,p.id,actor,need(o,'reason')]);
  }else if(cmd==='unlink'){
   const r=await resolve(db,'record',need(o,'record'));need(o,'reason');
   result=await db.query('delete from memberships where record_id=$1 returning record_id,profile_id,reason',[r.id]);if(!result.length)throw Error('Record is not linked');
  }else if(cmd==='record-consent'){
   const p=await resolve(db,'profile',need(o,'profile')),d=date(need(o,'observed-on'));
   if(d>new Date().toISOString().slice(0,10))throw Error('Preference date cannot be in the future');
   result=await db.query('insert into consent_events(profile_id,channel,purpose,decision,observed_on,evidence,actor) values($1,$2,$3,$4,$5,$6,$7) returning channel,purpose,decision,observed_on',[p.id,choice(need(o,'channel'),['email','sms','phone']),need(o,'purpose').toLowerCase(),choice(need(o,'decision'),['granted','denied','unknown']),d,need(o,'evidence'),actor]);
  }else if(cmd==='add-action')result=await db.query('insert into actions(code,name,owner,due_on) values($1,$2,$3,$4) returning code,name,due_on',[code(need(o,'code')),need(o,'name'),need(o,'owner'),date(need(o,'due-on'))]);
  else if(cmd==='close-action'){
   const a=await resolve(db,'action',need(o,'ref'));result=await db.query("update actions set status='closed',evidence=$1 where id=$2 and status='open' returning code,status,evidence",[need(o,'evidence'),a.id]);if(!result.length)throw Error('Action already closed');
  }else if(cmd==='log'){result=[{note:need(o,'note')}];}
  else if(cmd==='import'){
   if(arg!=='salesforce-data-cloud')throw Error('Import format must be salesforce-data-cloud');
   const s=await resolve(db,'source',need(o,'source'));const rows=readImport(need(o,'file'));const counts={inserted:0,updated:0,skipped:0,dry_run:!!o['dry-run']};
   for(const r of rows)counts[await storeRecord(db,s.id,r,!!o.update,actor)]++;
   await db.query('update sources set last_import_at=now() where id=$1',[s.id]);result=[counts];
  }
  await audit(db,actor,cmd,{options:o,result});return result;
 },!!o['dry-run']);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;
 try{db=await getDb();const out=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(out,null,2):format(out));}
 catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
