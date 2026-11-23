import {profile,resultFor} from './scoring.js';
const root=document.querySelector('#app');
const endpoint=new URL('./api/responses',location.href);
const storageKey='trawithu:web:v1';
function loadDraft(){
  try{return JSON.parse(localStorage.getItem(storageKey)||'{}')||{};}catch{return {};}
}
const saved=loadDraft();
const answers=saved.answers||{};
let id=saved.id || (globalThis.crypto.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const x=crypto.getRandomValues(new Uint8Array(1))[0]&15;return (c==='x'?x:(x&3)|8).toString(16)}));
let birthMonth=saved.birthMonth||'';
let index=saved.index||0, feedback=saved.feedback||'', busy=false;
const {pages,money}=await fetch('./questions.json',{cache:'no-cache'}).then(r=>r.json());
const steps=[...pages,...money.map((q,i)=>({...q,phase:i+1})),{kind:'money-complete'},{kind:'results'},{kind:'feedback'},{kind:'done'}];
if (!saved.version && index >= pages.length + money.length) index += 1;
index=Math.min(Math.max(index,0),steps.length-1);
const path=name=>'./assets/'+name;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const save=()=>localStorage.setItem(storageKey,JSON.stringify({version:2,id,index,answers,feedback,birthMonth}));
const move=offset=>{index+=offset;save();render();scrollTo(0,0);root.querySelector('h1')?.focus();};
const button=label=>`<button class="primary" data-next>${label}</button>`;
const art=gender=>path(gender===1?'default-female.webp':'default-male.webp');
const brand=()=>`<div class="mark"><span class="cn">与游</span><span class="en">TraWithU</span></div>`;
function look(){
  const axes=profile(answers);
  const picks=answers.activities||[];
  const nature=picks.filter(i=>[1,3].includes(i)).length, culture=picks.filter(i=>[0,2].includes(i)).length;
  const flavor=nature>culture?'自然':culture>nature?'人文':nature?'人文与自然':'休闲';
  const type=(axes[0].value>=50?0:2)+(axes[1].value>=50?0:1);
  return {axes,result:resultFor(axes,flavor), portrait:path('personality-'+((answers.gender===1?1:0)+(flavor==='自然'?2:0))+'-'+type+'.webp')};
}
function profileCard(kind){
  const {axes,result,portrait}=look();
  const labels=axes.slice(0,kind==='summary'?3:4).map(({low,high,value},i)=>`<div class="axis"><div>${axes[i].name}</div><div class="track"><i class="pin" style="left:${value}%;background:${axes[i].color};border-color:${axes[i].color}"></i></div><div class="scale"><span>${low}</span><span>${high}</span></div></div>`).join('');
  if(kind!=='radar')return `<div class="panel profile"><img class="profile-art" src="${portrait}" alt="你的与游角色"><div class="axes">${labels}</div></div><p class="role-copy">${esc(result.role)}</p>`;
  const point=(r,i)=>[[130,130-r],[130+r,130],[130,130+r],[130-r,130]][i];
  const vertices=axes.map((axis,i)=>point(axis.value*.64,i));
  const ring=r=>axes.map((_,i)=>point(r,i).join(',')).join(' ');
  const color=r=>'rgb('+[73,143,220].map((v,i)=>Math.round(v+([220,96,151][i]-v)*r/64)).join(',')+')';
  const edges=vertices.map(([x,y],i)=>{
    const next=(i+1)%4,[ex,ey]=vertices[next];
    if(x===ex&&y===ey)return '';
    return `<linearGradient id="radar-edge-${i}" gradientUnits="userSpaceOnUse" x1="${x}" y1="${y}" x2="${ex}" y2="${ey}"><stop stop-color="${axes[i].color}"/><stop offset="1" stop-color="${axes[next].color}"/></linearGradient>`;
  }).join('');
  const chart=`<svg class="radar" viewBox="0 0 260 260" role="img" aria-label="${esc(axes.map(a=>a.name+' '+a.value).join('，'))}">
    <defs><radialGradient id="radar-fill" gradientUnits="userSpaceOnUse" cx="130" cy="130" r="65"><stop stop-color="#5690f4" stop-opacity=".51"/><stop offset="1" stop-color="#f370b1" stop-opacity=".50"/></radialGradient>${edges}</defs>
    ${[16,32,48,64].map(r=>`<polygon points="${ring(r)}" fill="none" stroke="${color(r)}"/>`).join('')}
    <polygon points="${vertices.map(p=>p.join(',')).join(' ')}" fill="url(#radar-fill)"/>
    ${vertices.map(([x,y],i)=>{const [ex,ey]=vertices[(i+1)%4];return x===ex&&y===ey?'':`<line x1="${x}" y1="${y}" x2="${ex}" y2="${ey}" stroke="url(#radar-edge-${i})" stroke-width="2"/>`;}).join('')}
    ${vertices.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="3.3" fill="${axes[i].color}"/>`).join('')}
    <g text-anchor="middle" fill="#393055" font-size="13" font-weight="650">${[[130,51],[225,135],[130,217],[35,135]].map(([x,y],i)=>`<text x="${x}" y="${y}">${axes[i].name}</text>`).join('')}</g></svg>`;
  return `<div class="panel radar-panel">${chart}</div><p class="radar-role">${esc(result.radarRole)}</p>`;
}
const introFeedback = [
  '你愿意先聊两句，能让刚认识的搭子更快放松。路上遇到有意思的人或地方，也可以把自己的好奇分享给大家。',
  '你可以慢慢熟悉新搭子。一起看风景、留意对方喜欢的小细节，或安静走一段路，都是建立默契的方式。',
  '你可以跟着当下的气氛切换。想聊时聊几句，想安静时一起看看风景，也能给搭子留出自己的节奏。'
];
const stayPoems = [
  {line:'客路青山外，行舟绿水前。', source:'王湾《次北固山下》'},
  {line:'山重水复疑无路，柳暗花明又一村。', source:'陆游《游山西村》'},
  {line:'采菊东篱下，悠然见南山。', source:'陶渊明《饮酒·其五》'}
];
const stayFeedback = [
  '按约好的时间出发，大家都知道下一步怎么走。',
  '和搭子商量一下，给喜欢的地方多留一点时间。',
  '先享受当下，之后再一起看看怎么走。'
];
const optionIcons = {
  goals:['🧳','🍃','🎟','📣','🤝','💬','🎨','🧭'],
  intro:['🌞','🌙','✨'], chat:['🫧','💬','🗨'], speak:['🌧','⛅','☀'],
  evening:['🎉','🌙','☕'], walk:['💬','🌿'], firstDay:['📅','📍','🧭'],
  obstacles:['📆','📍','🗺','🚆','👌','•••'],
  days:['◐','☀','▦','◷'], budget:['¥','¥','¥','¥'],
  split:['🧾','🤝','💰','👛'], advance:['💬','◷','↪','🧾'], talk:['💬','◷']
};
const agreementIcons = ['❌','👎','👍','✅'];
const scenes = [
  {art:'./assets/story-time.webp', icon:'▦', title:'都想逛展，时间却对不上', conflict:'你周六有空，搭子只能周日。', solution:'按常有空的时段，优先推荐时间对得上的搭子和活动。'},
  {art:'./assets/story-pace.webp', icon:'♧', title:'一个想逛四站，一个想慢慢看', conflict:'你们都爱逛展，但一个想在展馆待半天。', solution:'先对照彼此的出游节奏，聊好哪些一起逛、哪些各自玩。'},
  {art:'./assets/story-money.webp', icon:'¥', title:'一顿饭超了预算，谁先开口？', conflict:'搭子想吃人均 300 元的饭，你原本只想花 100 元。', solution:'用「钱的约定卡」先聊清楚哪笔钱要商量、共同开销怎么分。'}
];

const chapterEnds=['social','explore','planning','radar','generate'].map(id=>steps.findIndex(q=>q.id===id));
let typingTimer, carouselTimer, generationTimer, sceneIndex=0;
const heading=q=>q.heading ? esc(q.heading.lead)+'<span class="heading-tail">'+esc(q.heading.tail)+'</span>' : esc(q.title);
function progressBar(){
  const nodes=[...chapterEnds,steps.length-3];
  const current=nodes.findIndex(end=>index<end);
  const start=nodes[current-1]??0;
  const width=current<0?100:(current+(index-start)/(nodes[current]-start))*100/nodes.length;
  return `<div class="progress" role="progressbar" aria-label="问卷进度" aria-valuenow="${Math.round(width)}"><div class="progress-fill" style="width:${width}%"></div>${nodes.map((end,i)=>`<span class="progress-node" style="left:${(i+1)*100/nodes.length}%">${index>=end?'<span class="chapter-check">✓</span>':''}</span>`).join('')}</div>`;
}
function choices(q){
  const selected=Array.isArray(answers[q.id])?answers[q.id]:[answers[q.id]];
  return q.options.map((label,i)=>{
    const on=selected.includes(i);
    if(['age','gender'].includes(q.kind)){
      const gender=q.kind==='gender';
      const image=gender?art(i):path('age-'+(answers.gender===1?1:0)+'-'+i+'.webp');
      const ghost=gender?'':`<img class="age-ghost" src="${art(answers.gender)}" alt="">`;
      return `<button class="portrait ${gender?'default-portrait':''} ${on?'selected':gender&&answers.gender!==undefined?'muted-portrait':''}" aria-pressed="${on}" data-choice="${i}">${ghost}<img class="${gender?'':'age-variant'}" src="${image}" alt=""><span class="portrait-label">${esc(label)} <span aria-hidden="true">›</span></span></button>`;
    }
    const icon=q.icons?.[i]||optionIcons[q.id]?.[i]||(q.options[0]==='非常不同意'?agreementIcons[i]:'');
    return `<button class="choice ${on?'selected':''}" aria-pressed="${on}" data-choice="${i}">${icon?`<span class="icon" aria-hidden="true">${esc(icon)}</span>`:''}<span class="label">${esc(label)}</span>${q.kind==='multi'?`<span class="check" aria-hidden="true">${on?'✓':'□'}</span>`:''}</button>`;
  }).join('');
}
function generation(q){
  const statuses=['分析你的回答','整理你的出游偏好','补充你的旅伴金钱观','生成你的旅行人格卡','完成 TPTI 评估'];
  const complete=q.kind==='money-complete';
  const active=complete?statuses.length:q.phase?q.phase-1:0;
  return `<h1 class="title" tabindex="-1">你的 TPTI 旅行人格卡，马上揭晓！</h1><div class="panel">${statuses.slice(0,active+1).map((label,i)=>`<div class="status-row"><div class="status"><span>${label}</span><span class="status-mark">${i<active?'✓':'○'}</span></div>${i===active?`<div class="status-track"><div class="progress-fill status-animate" style="--from:0%;--to:${q.phase?48:100}%"></div></div>`:''}</div>`).join('')}</div><h2 class="prompt">和搭子出发时，与游能帮什么？</h2><div class="scenes" aria-label="搭子出行场景">${scenes.map(scene=>`<article class="scenario panel"><div class="eyebrow">${esc(scene.icon)} ${esc(scene.title)}</div><div class="conflict">${esc(scene.conflict)}</div><div class="solution">${esc(scene.solution)}</div><img class="story-art" src="${scene.art}" alt=""></article>`).join('')}</div>`;
}
function render(){
  clearInterval(typingTimer);
  clearTimeout(generationTimer);
  const q=steps[index];
  const back=index>0?'<button class="back" aria-label="返回上一页" data-back>‹</button>':'';
  const title=text=>`<h1 class="title" tabindex="-1">${text}</h1>`;
  let content='', action='', modal='', kind=q.kind;
  if(q.kind==='done'){
    root.innerHTML=`<div class="shell"><div class="done"><img src="${path('project-logo.png')}" alt="与游 TraWithU"><h1 class="title" tabindex="-1">遇见同频的人<br>去更远的地方</h1><p>平台开发中，敬请期待</p></div></div>`;
    return;
  }
  if(q.kind==='feedback'){
    content=`<img class="feedback-art" src="${look().portrait}" alt="">${title('请留下您对这份问卷的宝贵建议，谢谢！')}<div class="feedback-card"><label for="feedback">问卷改进建议 <small>选填</small></label><textarea id="feedback" maxlength="500" rows="5" placeholder="写下你的建议…">${esc(feedback)}</textarea></div><p id="error" role="alert"></p>`;
    action=`<button class="primary" data-submit>${feedback.trim()?'提交答卷与建议':'提交答卷'}</button>`;
  }else if(q.kind==='results'){
    const {portrait,result}=look();
    content=`${title('你的 TPTI 旅行人格卡')}<div class="registration-preview"><img src="${portrait}" alt="与游旅行人格角色"><span class="type-code">${esc(result.code)}</span><strong>${esc(result.name)}</strong><span class="type-detail">${esc(result.detail)}</span></div>`;
    action=button('继续');
  }else if(q.kind==='generate'||q.phase||q.kind==='money-complete'){
    kind='generate';
    content=generation(q);
    if(q.kind==='money-complete') action=button('继续');
    if(q.phase){
      modal=`<div class="overlay money-overlay"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="money-title"><div class="eyebrow">旅伴金钱观 · ${q.phase}/${money.length}</div><h1 id="money-title" class="dialog-title" tabindex="-1">${heading(q)}</h1>${q.description?`<p class="description">${esc(q.description)}</p>`:''}<div class="${q.id==='talk'?'two':''}">${choices(q)}</div></section></div>`;
    }
  }else{
    content=title(heading(q));
    if(q.description&&!['fork','illustrated','summary','radar'].includes(q.kind)) content+=`<p class="description header-note">${esc(q.description)}</p>`;
    if(['gender','age'].includes(q.kind)){
      const isGender=q.kind==='gender';
      content+=`<div class="portrait-group">${isGender?'<h2 class="prompt">请选择你的性别</h2>':''}<div class="grid">${choices(q)}</div></div>`;
      if(isGender){
        const now=new Date();
        const [year,month]=birthMonth.split('-');
        const options=(values,selected,suffix)=>values.map(value=>`<option value="${value}" ${value===selected?'selected':''}>${value}${suffix}</option>`).join('');
        const years=Array.from({length:now.getFullYear()-1899},(_,i)=>String(now.getFullYear()-i));
        const months=Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0'));
        content+=`<div class="birth-section"><p class="prompt" id="birth-label">请选择出生年月</p><div class="birth-fields" role="group" aria-labelledby="birth-label"><select id="birth-year" class="birth-picker" aria-label="出生年份"><option value="">年份</option>${options(years,year,' 年')}</select><select id="birth-month" class="birth-picker" aria-label="出生月份"><option value="">月份</option>${options(months,month,' 月')}</select></div></div><details class="policy"><summary>答卷与隐私说明</summary><p class="note">出生年月仅保留在当前设备，提交时保存答题选项和可选建议。</p></details>`;
        action=button('继续');
      }
    }else if(q.kind==='campus'){
      content+=`<div class="panel review"><div class="review-heading"><strong class="eyebrow">用户分享</strong><span class="stars" aria-hidden="true">★★★★★</span></div><div class="quote">“以前到了才知道，搭子想一天打卡五站，我只想慢慢逛。与游把游玩节奏和预算先摆出来，我们出发前就知道哪些要一起玩、哪笔钱要先商量。”</div><div class="sample-credit">模拟体验分享</div></div><div class="panel campus-schools"><div class="eyebrow">与游校园体验计划</div><div class="note">拟邀请高校</div><div class="school-grid">${['香港中文大学（深圳）','深圳大学','南方科技大学','哈尔滨工业大学（深圳）'].map(s=>`<span>${s}</span>`).join('')}</div></div><p class="note">需求人数为原型阶段的情景估算。</p>`;
      action=button('继续');
    }else if(['illustrated','fork'].includes(q.kind)){
      const stay=answers.stay??0;
      const image=q.id==='social'?'chapter-social.webp':q.kind==='fork'?'chapter-fork.webp':'stay-'+stay+'.webp';
      content+=`<img class="chapter-art ${q.id==='stayFeedback'?'stay-art':''}" src="${path(image)}" alt="">`;
      if(q.description)content+=`<p class="description chapter-copy">${esc(q.description)}</p>`;
      if(q.id==='stayFeedback'){
        const poem=stayPoems[stay];
        content+=`<div class="panel poem"><div>${esc(poem.line)}</div><div class="note">——${esc(poem.source)}</div><p class="description">${esc(stayFeedback[stay])}</p></div>`;
      }
      action=button('继续');
    }else if(['summary','radar'].includes(q.kind)){
      content+=profileCard(q.kind)+`<p class="chapter-next">${esc(q.description)}</p>`;
      action=button('继续');
    }else if(q.options){
      if(q.options[0]==='非常不同意')content+='<p class="description header-note">你有多同意这句话？</p>';
      content+=`<div class="${q.id==='stay'?'scene-options':''}">${choices(q)}</div>`;
      if(q.kind==='feedbackChoice'){
        content+=`<div class="feedback-slot">${answers.intro===undefined?'':'<div class="panel feedback"><div class="eyebrow">你有自己的旅行优势！</div><span id="typed-feedback"></span></div>'}</div>`;
      }
      if(['multi','feedbackChoice'].includes(q.kind)){
        const enabled=q.kind==='multi'?answers[q.id]?.length:answers[q.id]!==undefined;
        action=button('继续').replace('data-next',enabled?'data-next':'data-next disabled');
      }
    }
  }
  root.innerHTML=`<div class="shell"><header class="nav">${back}${brand()}</header>${index>0?progressBar():''}<section class="body page-${kind}">${content}</section>${action?`<div class="footer">${action}</div>`:''}${modal}</div>`;
  const typed=root.querySelector('#typed-feedback');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(typed){
    const message=introFeedback[answers.intro];
    let length=0;
    if(reduced)typed.textContent=message;
    else typingTimer=setInterval(()=>{typed.textContent=message.slice(0,length+=3);if(length>=message.length)clearInterval(typingTimer);},28);
  }
  if(q.kind==='generate')generationTimer=setTimeout(()=>move(1),reduced?50:760);
  const carousel=root.querySelector('.scenes');
  if(carousel&&!reduced){
    const offset=(track,card)=>card.getBoundingClientRect().left-track.getBoundingClientRect().left+track.scrollLeft;
    carousel.scrollLeft=offset(carousel,carousel.children[sceneIndex]);
    if(!carouselTimer)carouselTimer=setInterval(()=>{
      const track=root.querySelector('.scenes');
      if(!track)return;
      const cards=[...track.children];
      const nearest=cards.reduce((best,card,i)=>Math.abs(offset(track,card)-track.scrollLeft)<Math.abs(offset(track,cards[best])-track.scrollLeft)?i:best,0);
      sceneIndex=(nearest+1)%cards.length;
      track.scrollTo({left:offset(track,cards[sceneIndex]),behavior:'smooth'});
    },4800);
  }else{
    clearInterval(carouselTimer);
    carouselTimer=undefined;
    sceneIndex=0;
  }
  const year=root.querySelector('#birth-year');
  const month=root.querySelector('#birth-month');
  if(year&&month){
    const update=()=>{
      const now=new Date();
      const limit=Number(year.value)===now.getFullYear()?now.getMonth()+1:12;
      for(const option of month.options)option.disabled=Number(option.value)>limit;
      if(Number(month.value)>limit)month.value='';
      birthMonth=year.value||month.value?`${year.value}-${month.value}`:'';
      root.querySelector('[data-next]').disabled=answers.gender===undefined||!year.value||!month.value;
    };
    for(const field of [year,month])field.addEventListener('change',()=>{update();save();});
    update();
  }
  const field=root.querySelector('textarea');
  field?.addEventListener('input',()=>{feedback=field.value;save();root.querySelector('[data-submit]').textContent=feedback.trim()?'提交答卷与建议':'提交答卷';});
}
root.addEventListener('click',async event=>{
  const target=event.target.closest('button');
  if(!target||busy)return;
  const q=steps[index];
  if(target.hasAttribute('data-back'))return move(q.phase===1?-2:-1);
  if(target.hasAttribute('data-next'))return move(1);
  if(target.dataset.choice!==undefined){
    const option=Number(target.dataset.choice);
    if(q.kind==='multi'){
      const old=answers[q.id]||[];
      const exclusive=q.exclusive||[];
      answers[q.id]=old.includes(option)?old.filter(v=>v!==option):exclusive.includes(option)?[option]:[...old.filter(v=>!exclusive.includes(v)),option];
      save();render();
    }else{
      answers[q.id]=option;
      if(q.phase){
        busy=true;
        save();
        const overlay=root.querySelector('.money-overlay');
        const bar=root.querySelector('.status-animate');
        overlay.classList.add('closing');
        overlay.inert=true;
        bar.classList.add('status-complete');
        setTimeout(()=>{busy=false;move(1);},matchMedia('(prefers-reduced-motion: reduce)').matches?30:425);
      }else if(['gender','feedbackChoice'].includes(q.kind)){save();render();}else move(1);
    }
  }
  if(target.hasAttribute('data-submit')){
    busy=true;target.disabled=true;
    document.querySelector('#error').textContent='';
    try{
      const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,answers,feedback})});
      if(!res.ok||!(await res.json()).saved)throw Error();
      move(1);
    }catch{
      document.querySelector('#error').textContent='答卷暂未提交，已保存在本机。请稍后重试。';
      target.disabled=false;
    }finally{busy=false;}
  }
});
render();
