// MIT; see ../LICENSE. Regenerate with: node study/timeline.js > study/timeline.svg
import { trace, DEFAULT_LADDER } from '../trace.js';
import { DESIGN } from './workload.js';

const w = 740, h = 250, x = day => 98 + day*10, marks = [];
const tracks = [
  { script:'GAGAGA', y:95, color:'#126059', name:'Alternating' },
  { script:'GGGAAA', y:156, color:'#91410c', name:'Clustered' },
];
for (const {script, y, color, name} of tracks) {
  const grades = Array.from({length:DESIGN.horizonDays},(_,i) => script[i%6] === 'A' ? 'again' : 'good');
  const {rows} = trace({start: DESIGN.start, grades, ladder:DEFAULT_LADDER});
  const offsets = rows.map(r => (Date.parse(r.reviewed) - Date.parse(DESIGN.start))/86400000)
    .filter(d => d < DESIGN.horizonDays);
  marks.push('<g><title>'+name+': '+offsets.length+' reviews. Days: '+offsets.join(', ')+'</title>',
    '<text x="20" y="'+(y-19)+'" font-size="15">'+name+' · '+script+' · '+offsets.length+' reviews</text>',
    '<path d="M98 '+y+'h590" stroke="#c0cad0"/>',
    ...offsets.map(d => '<circle cx="'+x(d)+'" cy="'+y+'" r="3.6" fill="'+color+'"/>'),'</g>');
}
const ticks = [0,15,30,45,59].map(d => '<g><path d="M'+x(d)+' 180v6" stroke="#364955"/><text x="'+x(d)+'" y="204" text-anchor="middle" font-size="14">'+d+'</text></g>');
process.stdout.write([
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" role="img" aria-labelledby="title desc">',
  '<title id="title">Same number of lapses per six reviews, different workload</title>',
  '<desc id="desc">Review days in the first 60 days under the default five-box policy. Alternating good and again gives 40 dots; three good followed by three again gives 20 dots. Each dot is one on-time review.</desc>',
  '<rect width="100%" height="100%" fill="#f8fafb"/>',
  '<g fill="#172f3c" font-family="system-ui,sans-serif">',
  '<text x="20" y="32" font-size="21" font-weight="bold">When reviews fall on the calendar</text>',
  ...marks,'<path d="M98 180h590" stroke="#364955"/>',...ticks,
  '<text x="393" y="232" text-anchor="middle" font-size="14">Days since first review · one dot per review</text>',
  '</g></svg>','',
].join('\n'));
