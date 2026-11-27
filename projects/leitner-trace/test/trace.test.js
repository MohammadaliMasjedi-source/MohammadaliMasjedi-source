import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {trace,DEFAULT_LADDER} from '../trace.js';
import {createCard,schedule,dueCards} from '../srs.js';
const cli=fileURLToPath(new URL('../cli.js',import.meta.url));
const run=(args,tz='UTC')=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8',env:{...process.env,TZ:tz}});
test('on-time replay uses the new box interval; lapse resets to box one',()=>{
 const a=trace({start:'2028-02-28',grades:['good','again','hard','easy']});
 assert.deepEqual(a.rows.map(r=>[r.reviewed,r.from,r.to,r.days,r.due]),[
  ['2028-02-28',1,2,2,'2028-03-01'],['2028-03-01',2,1,1,'2028-03-02'],
  ['2028-03-02',1,1,1,'2028-03-03'],['2028-03-03',1,3,4,'2028-03-07']]);
});
test('custom ladders clamp at top and never mutate caller input',()=>{
 const ladder=Object.freeze([1,5]),grades=Object.freeze(['easy','easy','again']);
 const p=trace({start:'2027-12-31',grades,ladder});
 assert.deepEqual(p.rows.map(r=>r.to),[2,2,1]);assert.equal(p.nextDue,'2028-01-11');
 p.ladder[0]=8;assert.equal(ladder[0],1);assert.ok(Object.isFrozen(DEFAULT_LADDER));
});
test('strict dates reject rollover and unsupported years',()=>{
 for(const start of ['2027-02-29','2028-2-01','2028-00-10','2028-02-29T18:00Z','9999-12-31'])
  assert.throws(()=>trace({start,grades:['good']}));
});
test('malformed sequences and ladders cannot silently produce a plan',()=>{
 for(const ladder of [[],[1,,2],Array(2),[0],[-1],[2.3],[1,3,2],['5'],[3651]])assert.throws(()=>trace({start:'2027-01-01',grades:['good'],ladder}));
 for(const grades of [[],Array(2),['good',,'again'],['Gud'],Array(201).fill('good')])assert.throws(()=>trace({start:'2027-01-01',grades}));
});
test('original card API preserves user data, handles due boundaries and can serialize',()=>{
 const old=Object.freeze({...createCard('iris','flowers','2027-12-31'),front:'زنبق'});
 const next=schedule(old,'easy','2027-12-31');assert.equal(old.box,1);assert.equal(next.front,'زنبق');assert.equal(next.box,3);
 assert.deepEqual(dueCards([next],'2028-01-03'),[]);assert.deepEqual(dueCards([next],'2028-01-04'),[next]);
 assert.deepEqual(JSON.parse(JSON.stringify(next)),next);
});
test('terminal JSON is stable across DST and time zones; matches JS API',()=>{
 const a=['2026-03-28','good,again,easy','--ladder','1,2,6','--json'];
 const berlin=run(a,'Europe/Berlin'), la=run(a,'America/Los_Angeles');
 assert.equal(berlin.status,0);assert.equal(la.status,0);assert.equal(la.stdout,berlin.stdout);
 assert.deepEqual(JSON.parse(la.stdout),trace({start:a[0],grades:a[1].split(','),ladder:[1,2,6]}));
});
test('terminal has usable help; invalid input does not emit a partial trace',()=>{
 assert.match(run(['--help']).stdout,/--ladder/);assert.match(run(['2028-02-28','hard']).stdout,/2028-02-29/);
 for(const a of [['2028-13-01','good'],['2028-02-28','good','--oops'],['2028-02-28','good','--ladder']]){
  const r=run(a);assert.equal(r.status,2);assert.equal(r.stdout,'');assert.match(r.stderr,/Usage/);}
});
