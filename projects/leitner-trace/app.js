import {trace} from './trace.js';
const fa={label:'آزمایشگاه زمان‌بندی فلش‌کارت',title:'کارت چه روزی برمی‌گردد؟',intro:'ترتیب پاسخ‌ها را وارد کنید تا ببینید کارت به کدام جعبه می‌رود و چند روز بعد برمی‌گردد.',start:'تاریخ اولین مرور',ladder:'فاصلهٔ جعبه‌ها به روز',seq:'پاسخ‌ها به ترتیب (با ویرگول جدا کنید)',keys:'پاسخ‌ها: again یعنی فراموش کردم، hard یعنی سخت، good یعنی خوب و easy یعنی آسان. هر مرور دقیقاً در روز مقرر انجام می‌شود.',run:'نمایش برنامه',reset:'بازگرداندن مثال',out:'نتیجه',chart:'فاصله تا مرور بعدی',expl:'طول هر میله نسبت به بلندترین فاصلهٔ همین دنباله است. تاریخ‌ها و تغییر جعبه در جدول آمده‌اند.',review:'مرور',ond:'تاریخ مرور',grade:'پاسخ',move:'تغییر جعبه',wait:'فاصله (روز)',due:'تاریخ بعدی',foot:'مدل شفاف جعبه‌های لایتنر است و حافظهٔ یک فرد را پیش‌بینی نمی‌کند. روی دستگاه خودتان، بدون حساب کاربری یا ارسال داده، اجرا می‌شود.'};
const doc=document.documentElement, form=document.getElementById('plan'),status=document.getElementById('status');
const strings=Array.from(document.querySelectorAll('[data-key]')).map(e=>[e,e.textContent]);
const button=document.getElementById('lang'),rows=document.getElementById('rows'),bars=document.getElementById('bars');
let persian=false;
const split=s=>s.toLowerCase().replaceAll('،',',').split(',').map(x=>x.trim());
function digits(s){return s.replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-0x6f0)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x660));}
function item(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function run(){
 rows.replaceChildren();bars.replaceChildren();
 try{
  const controls=form.elements;
  const r=trace({start:controls.start.value,ladder:split(digits(controls.ladder.value)).map(Number), grades:split(controls.sequence.value)});
  const mx=Math.max(...r.rows.map(x=>x.days));
  for(const x of r.rows){
   const tr=item('tr');for(const v of [x.review,x.reviewed,x.grade,x.from+' → '+x.to,x.days,x.due]){const td=item('td','',v);td.dir='ltr';tr.append(td);}rows.append(tr);
   const b=item('div','bar'),track=item('div','track'),fill=item('i','fill');
   fill.style.width=(x.days/mx*100)+'%';track.append(fill);b.append(item('span','',x.review+' · '+x.grade),track,item('span','',x.days+(persian?' روز':'d')));bars.append(b);
  }
  status.className='';status.textContent=(persian?'تاریخ مرور بعدی: ':'Next review: ')+r.nextDue;
 }catch(e){status.className='error';status.textContent=persian?'تاریخ، پاسخ‌ها یا فاصله‌ها معتبر نیستند. فاصله‌ها باید عددهای صحیح و مثبت، از کوچک به بزرگ، باشند.':e.message;}
}
function language(value){persian=value;doc.lang=persian?'fa':'en';doc.dir=persian?'rtl':'ltr';button.lang=persian?'en':'fa';button.textContent=persian?'English':'فارسی';for(const [e,en] of strings)e.textContent=persian?fa[e.dataset.key]:en;run();}
form.addEventListener('submit',e=>{e.preventDefault();run()});button.addEventListener('click',()=>language(!persian));
document.getElementById('reset').addEventListener('click',()=>{HTMLFormElement.prototype.reset.call(form);run()});language(new URLSearchParams(location.search).get('lang')==='fa');
