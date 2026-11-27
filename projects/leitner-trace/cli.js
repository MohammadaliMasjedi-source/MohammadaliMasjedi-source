// MIT · Copyright (c) 2026 Mohammadali Masjedi
import {trace} from './trace.js';
const args=process.argv.slice(2);
const usage='node cli.js YYYY-MM-DD good,again,hard,easy [--ladder 1,2,4,9,21] [--json]';
if (args.length===1 && ['-h','--help'].includes(args[0])) {console.log(usage);process.exit(0);}
try {
  const [start,sequence,...flags]=args;
  let json=false,ladder;
  for (let i=0;i<flags.length;i++) {
    if(flags[i]==='--json' && !json) json=true;
    else if(flags[i]==='--ladder' && ladder===undefined && flags[i+1]) ladder=flags[++i].split(',').map(Number);
    else throw Error('unknown, incomplete or duplicate flag: '+flags[i]);
  }
  const result=trace({start,grades:sequence?.split(','),ladder});
  if(json) console.log(JSON.stringify(result,null,2));
  else {
    console.log('Review | Reviewed   | Grade | Box transition | Wait | Next due');
    for (const r of result.rows) console.log(
      String(r.review).padStart(6)+' | '+r.reviewed+' | '+r.grade.padEnd(5)+' | '+
      (r.from+' → '+r.to).padEnd(14)+' | '+(r.days+'d').padEnd(4)+' | '+r.due);
  }
} catch(err) {console.error(err.message+'\nUsage: '+usage); process.exitCode=2;}
