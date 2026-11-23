import {profile,resultFor} from './scoring.js';
import {findMatch,interestGroups,personalityReason,rankDemos,tripReason} from './matching.js';
const root=document.querySelector('#app');
const endpoint=new URL('./api/responses',location.href);
const storageKey='trawithu:web:v1';
function loadDraft(){
  try{return JSON.parse(localStorage.getItem(storageKey)||'{}')||{};}catch{return {};}
}
const saved=loadDraft();
const resultsPreview=new URLSearchParams(location.search).get('preview')==='results';
const answers=saved.answers||{};
let id=saved.id || (globalThis.crypto.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const x=crypto.getRandomValues(new Uint8Array(1))[0]&15;return (c==='x'?x:(x&3)|8).toString(16)}));
delete answers.birthMonth;
const interests=new Set(saved.interests||[]);
const highlights=new Set(saved.highlights||[]);
const predefined=new Set(interestGroups.flatMap(group=>group.items));
const openGroups=new Set();
let catalog, resumeIndex=saved.resumeIndex||0;
let nickname=saved.nickname||'', hideRadar=saved.hideRadar===true, privacySet=saved.privacySet===true;
let demos=[];
let participants, participantError=false, matchRequest;
const payload=()=>({id,answers,nickname,shareProfile:!hideRadar,hideRadar,excludeMatching:hideRadar,feedback,questionVersion:2,
  interests:[...interests].filter(tag=>predefined.has(tag)),highlights:[...highlights].filter(tag=>predefined.has(tag))});
function requestMatch(){
  if(matchRequest)return;
  const request=fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload(),feedback:undefined,action:'match'}),signal:AbortSignal.timeout(12000)});
  matchRequest=request;
  request.then(async response=>{
    if(!response.ok)throw new Error('Matching unavailable');
    const data=await response.json();
    participants=data.participants??(data.participant?[data.participant]:[]);
  }).catch(()=>{participantError=true;}).finally(()=>{
    matchRequest=null;
    if(steps[index].kind==='celebrity')render();
  });
}
let index=saved.index||0, feedback=saved.feedback||'', busy=false;
const {pages,money}=await fetch('./questions.json',{cache:'no-cache'}).then(r=>r.json());
const hasCompletedQuiz=[...pages.filter(page=>page.options),...money].every(question=>answers[question.id]!==undefined);
if(resultsPreview&&!hasCompletedQuiz){
  Object.assign(answers,{gender:0,activities:[0],intro:2,chat:1,evening:2,walk:1,food:3,route:0,pace:1,rest:3,firstDay:0,stay:1});
  interests.clear();
  highlights.clear();
  interests.add('博物馆');
  interests.add('阅读');
  hideRadar=false;
}
const steps=[...pages,...money.map((q,i)=>({...q,phase:i+1})),{kind:'money-complete'},{kind:'results'},{kind:'interests'},{kind:'nickname'},{kind:'celebrity'},{kind:'feedback'},{kind:'done'}];
if (!saved.version && index >= pages.length + money.length) index += 1;
if ((saved.version||0)<3 && index===steps.length-4) index+=3;
index=Math.min(Math.max(index,0),steps.length-1);
if(!privacySet && ['celebrity','feedback'].includes(steps[index].kind))index=steps.findIndex(step=>step.kind==='nickname');
if(index>0 && steps[index].kind!=='done' && !answers.adultConfirmed){resumeIndex=index;index=0;}
if(resultsPreview){
  index=steps.findIndex(step=>step.kind==='celebrity');
  participants=[];
}
const path=name=>'./assets/'+name;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const interestClass=tag=>{
  const index=interestGroups.findIndex(group=>group.items.includes(tag));
  return 'tag-tone-'+(index<0?'other':index);
};
const interestTag=tag=>`<span class="interest-tag ${interestClass(tag)}">${esc(tag)}</span>`;
const personaRow=(axes,image,alt)=>{
  const {code,name}=resultFor(axes,'');
  const formatted=code.replace(/([A-Z]{2})([A-Z]{2})$/u,'$1-$2');
  return `<div class="celebrity-persona"><img class="participant-art" src="${image}" alt="${alt}"><div>
    <p class="persona-code">${esc(formatted)}</p><p class="persona-name">${esc(name)}</p></div></div>`;
};
const encyclopedia=person=>{
  const entries={'Jimmy Chin':'/item/%E9%87%91%E5%9B%BD%E5%A8%81/23305784','小约翰可汗':'/item/%E5%B0%8F%E7%BA%A6%E7%BF%B0%E5%8F%AF%E6%B1%97/55677637'};
  const query=person.name.split(' · ').at(-1);
  return 'https://baike.baidu.com'+(entries[person.name]||'/search/word?word='+encodeURIComponent(query));
};
const save=()=>localStorage.setItem(storageKey,JSON.stringify({version:3,id,index,resumeIndex,answers,feedback,nickname,privacySet,hideRadar,interests:[...interests],highlights:[...highlights]}));
const move=offset=>{
  index+=offset;
  save();
  render();
  root.querySelector('h1')?.focus({preventScroll:true});
  window.scrollTo({top:0,left:0,behavior:'instant'});
};
const button=label=>`<button class="primary" data-next>${label}</button>`;
const art=gender=>path(gender===1?'default-female.webp':'default-male.webp');
const brand=()=>`<div class="mark"><span class="brand-line"><img src="./assets/youyou-backpack.webp" alt=""><span class="cn">与游</span></span><span class="en">TraWithU</span></div>`;
const disclaimer='本测评与名人搭子结果仅供娱乐，不作参考。名人的性格及旅行风格为根据公开作品作出的娱乐推测，未经本人确认，不代表真实人格、本人意见或与游合作。请勿将结果作为择伴、行程或其他实际决策依据。';
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
  return radarChart(axes)+`<p class="radar-role">${esc(result.radarRole)}</p>`;
}
function radarChart(axes, scope='quiz'){
  const point=(r,i)=>[[130,130-r],[130+r,130],[130,130+r],[130-r,130]][i];
  const vertices=axes.map((axis,i)=>point(axis.value*.64,i));
  const ring=r=>axes.map((_,i)=>point(r,i).join(',')).join(' ');
  const color=r=>'rgb('+[73,143,220].map((v,i)=>Math.round(v+([220,96,151][i]-v)*r/64)).join(',')+')';
  const edges=vertices.map(([x,y],i)=>{
    const next=(i+1)%4,[ex,ey]=vertices[next];
    if(x===ex&&y===ey)return '';
    return `<linearGradient id="${scope}-radar-edge-${i}" gradientUnits="userSpaceOnUse" x1="${x}" y1="${y}" x2="${ex}" y2="${ey}"><stop stop-color="${axes[i].color}"/><stop offset="1" stop-color="${axes[next].color}"/></linearGradient>`;
  }).join('');
  const chart=`<svg class="radar" viewBox="0 0 260 260" role="img" aria-label="${esc(axes.map(a=>a.name+' '+a.value).join('，'))}">
    <defs><radialGradient id="${scope}-radar-fill" gradientUnits="userSpaceOnUse" cx="130" cy="130" r="65"><stop stop-color="#5690f4" stop-opacity=".51"/><stop offset="1" stop-color="#f370b1" stop-opacity=".50"/></radialGradient>${edges}</defs>
    ${[16,32,48,64].map(r=>`<polygon points="${ring(r)}" fill="none" stroke="${color(r)}"/>`).join('')}
    <polygon points="${vertices.map(p=>p.join(',')).join(' ')}" fill="url(#${scope}-radar-fill)"/>
    ${vertices.map(([x,y],i)=>{const [ex,ey]=vertices[(i+1)%4];return x===ex&&y===ey?'':`<line x1="${x}" y1="${y}" x2="${ex}" y2="${ey}" stroke="url(#${scope}-radar-edge-${i})" stroke-width="2"/>`;}).join('')}
    ${vertices.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="3.3" fill="${axes[i].color}"/>`).join('')}
    <g text-anchor="middle" fill="#393055" font-size="13" font-weight="650">${[[130,51],[225,135],[130,217],[35,135]].map(([x,y],i)=>`<text x="${x}" y="${y}">${axes[i].name}</text>`).join('')}</g></svg>`;
  return `<div class="panel radar-panel">${chart}</div>`;
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
  const back=index>0&&!resultsPreview?'<button class="back" aria-label="返回上一页" data-back>‹</button>':'';
  const title=text=>`<h1 class="title" tabindex="-1">${text}</h1>`;
  let content='', action='', modal='', kind=q.kind;
  if(q.kind==='done'){
    root.innerHTML=`<div class="shell"><div class="done"><img src="${path('project-logo.png')}" alt="与游 TraWithU"><h1 class="title" tabindex="-1">遇见同频的人<br>去更远的地方</h1><p>平台开发中，敬请期待</p><p class="business-contact">商业合作 <a href="mailto:luislu@koileapcapital.com">luislu@koileapcapital.com</a></p></div></div>`;
    return;
  }
  if(q.kind==='feedback'){
    content=`<img class="feedback-art" src="${look().portrait}" alt="">${title('请留下您对这份问卷的宝贵建议，谢谢！')}<div class="feedback-card"><label for="feedback">问卷改进建议 <small>选填</small></label><textarea id="feedback" maxlength="500" rows="5" placeholder="写下你的建议…">${esc(feedback)}</textarea></div><p id="error" role="alert"></p>`;
    action=`<button class="primary" data-submit>${feedback.trim()?'提交答卷与建议':'提交答卷'}</button>`;
  }else if(q.kind==='results'){
    const {portrait,result}=look();
    content=`${title('你的 TPTI 旅行人格卡')}<div class="registration-preview"><img src="${portrait}" alt="与游旅行人格角色"><span class="type-code">${esc(result.code)}</span><strong>${esc(result.name)}</strong><span class="type-detail">${esc(result.detail)}</span></div>`;
    action=button('继续');
  }else if(q.kind==='interests'){
    const chip=(tag,attr,label,pressed)=>`<button type="button" class="interest-chip ${attr==='data-interest'&&label===tag?interestClass(tag):''}" ${attr}="${esc(tag)}" aria-pressed="${pressed}">${esc(label)}</button>`;
    const picked=[...interests].map(tag=>`<li>${interestTag(tag)}<div>${chip(tag,'data-highlight',highlights.has(tag)?'★ 已置顶':'☆ 置顶',highlights.has(tag))}${chip(tag,'data-interest','移除',false)}</div></li>`).join('');
    content=`${title('平时想和搭子一起做什么？')}<p class="description">可多选。最想和搭子一起做的事可以置顶，最多三项。</p>
      <div class="interest-list">${interestGroups.map((group,i)=>`<details data-group="${i}" ${openGroups.has(String(i))?'open':''}><summary>${group.icon} ${esc(group.name)}</summary><div class="interest-tags">${group.items.map(tag=>chip(tag,'data-interest',tag,interests.has(tag))).join('')}</div></details>`).join('')}</div>
      ${picked?`<section class="panel picked-interests"><h2 class="prompt">已选兴趣</h2><ul>${picked}</ul></section>`:''}
      <form class="custom-interest"><label for="custom-interest">其他兴趣</label><div><input id="custom-interest" maxlength="12" placeholder="最多 6 个字"><button class="interest-chip" type="submit">添加</button></div><p class="note" role="status"></p></form>`;
    action=button(interests.size?'继续':'跳过兴趣');
  }else if(q.kind==='nickname'){
    content=`${title('搭子该怎么称呼你？')}<form id="nickname-form" class="panel name-card">
      <label for="nickname">昵称</label><input id="nickname" name="nickname" maxlength="32" autocomplete="off" placeholder="1–16 个字" value="${esc(nickname)}" required>
      <p class="note">默认参与趣味匹配，与你匹配的参与者可以查看昵称、雷达图、Q 版形象和预设兴趣。</p>
      <p id="name-error" role="alert"></p></form><div class="profile-private-choice"><p>或</p><label class="hide-quiz-profile"><input type="checkbox" name="hide" form="nickname-form" ${hideRadar?'checked':''}>隐藏我的测评资料，不允许用于趣味匹配</label></div>`;
    action='<button class="primary" type="submit" form="nickname-form">查看我的搭子</button>';
  }else if(q.kind==='celebrity'){
    const myAxes=look().axes;
    const match=catalog&&findMatch(catalog,{activities:answers.activities||[],selected:[...interests],highlights:[...highlights],axes:myAxes});
    if(match){
      const {person,style,shared}=match;
      const illustration=path('personality-'+(style.label==='自然观察'||style.label==='户外探索'?'2':'0')+'-0.webp');
      const photo=person.photo;
      const image=photo?`<img class="celebrity-photo" src="${path(esc(photo.fileName))}" alt="${esc(person.name)}的头像">`:
        `<span class="initial-avatar" aria-label="姓名头像">${esc(Array.from(person.name)[0])}</span>`;
      const credit=photo?.license?`<p class="photo-credit">图片署名：<a href="${esc(photo.source)}" target="_blank" rel="noopener noreferrer">${esc(photo.author)}</a> · <a href="${esc(photo.license)}" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a></p>`:'';
      const axes=person.scores.map((value,i)=>({...myAxes[i],value,color:'#8a65bd'}));
      content=`${title('谁是你的合拍搭子？')}<article class="panel celebrity-card">
        <header class="celebrity-header">${image}<p class="result-kicker">你的名人搭子</p><h2>${esc(person.name)}</h2><p class="entertainment-note">娱乐用途，不做参考</p></header>
        <section class="result-box"><h3>这位是谁？</h3><p>${esc(person.bio)}</p><div class="interest-tags">${person.tags.map(interestTag).join('')}</div>
        <a href="${esc(encyclopedia(person))}" target="_blank" rel="noopener noreferrer">他的百科 ↗</a></section>
        <section class="result-box match-reasons"><h3>你们哪里合拍？</h3>
          <section><h4>相处与分工</h4><p>${esc(personalityReason(match,myAxes))}</p></section>
          ${shared.length?`<section><h4>共同主题</h4><div class="interest-tags">${shared.map(interestTag).join('')}</div></section>`:''}
          <section><h4>节奏与玩法</h4><p>${esc(tripReason(match,myAxes,answers.activities||[]))}</p></section>
        </section>
        <section class="result-box"><h3>TPTI 旅行风格推测</h3><p class="note">依据公开作品风格设定。雷达图是娱乐推测，并非本人测评。</p>${radarChart(axes,'celebrity')}
        ${personaRow(axes,illustration,'旅行主题 Q 版示意')}</section>${credit}
        </article><p class="match-disclaimer">${disclaimer}</p>`;
    }else{
      content=`${title('谁是你的合拍搭子？')}<p class="description">${catalog===null?'名人资料暂时无法加载，可直接继续。':'正在整理匹配结果…'}</p>`;
      if(catalog===undefined)Promise.all([fetch('./celebrities.json',{cache:'no-cache'}).then(response=>{
        if(!response.ok)throw new Error('Catalog unavailable');
        return response.json();
      }),fetch('./demo-participants.json').then(response=>response.ok?response.json():[]).catch(()=>[])]).then(([data,samples])=>{catalog=data;demos=samples;}).catch(()=>{catalog=null;}).finally(()=>{
        if(steps[index].kind==='celebrity')render();
      });
    }
    action=resultsPreview?'':button('继续').replace('data-next',catalog===undefined||participants===undefined&&!participantError?'data-next disabled':'data-next');
    if(participants===undefined&&!participantError)requestMatch();
    const ranked=participants??[];
    const buddies=hideRadar||participants===undefined?[]:
      [...ranked,...rankDemos(demos,myAxes,interests)].slice(0,3);
    const details=buddies.map((buddy,index)=>{
      const tags=buddy.tags?.map(interestTag).join('');
      const axes=buddy.scores?.map((value,i)=>({...myAxes[i],value,color:'#8a65bd'}));
      return `<details><summary>${esc(buddy.nickname)} <span>查看资料 ›</span></summary>
        ${axes?personaRow(axes,path(esc(buddy.portrait)),'搭子的与游 Q 版形象')+radarChart(axes,'participant-'+index):''}
        <h3>兴趣爱好</h3><div class="interest-tags">${tags||'暂无公开兴趣'}</div></details>`;
    });
    content+=`<section class="panel participant-card"><h2 class="prompt">与你最合拍的问卷搭子</h2>
      ${buddies.some(buddy=>buddy.fictional)?'<p class="note participant-note">候选包含虚拟示例。</p>':''}
      ${details.length?details.join(''):`<p class="note">${hideRadar?'你已选择隐藏资料，本次不参与用户匹配。':participantError?'用户匹配暂时无法加载。':participants===undefined?'正在匹配…':'暂时没有符合条件的搭子。'}</p>`}
      ${participantError?'<button class="interest-chip" data-retry-match>重试用户匹配</button>':''}</section>`;
    if(resultsPreview)content+=`<p class="note">${hasCompletedQuiz?'根据本机已完成的答卷预览。':'当前浏览器没有已完成的答卷，正在展示示例。'} 此页不会提交答卷，问卷搭子仅展示虚拟示例。</p>`;
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
        content+=`<label class="adult-confirm"><input id="adult-confirm" type="checkbox" ${answers.adultConfirmed?'checked':''}>我已满 18 岁</label><details class="policy"><summary>娱乐测评与答卷说明</summary><p class="note">${disclaimer}</p><p class="note">年龄声明和自填兴趣仅保存在当前设备。提交时保存昵称、答题选项、预设兴趣及选填建议，用于改进测评。请勿在建议中填写联系方式。</p></details>`;
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
  const adult=root.querySelector('#adult-confirm');
  if(adult){
    const next=root.querySelector('[data-next]');
    const update=()=>{next.disabled=answers.gender===undefined||!adult.checked;};
    adult.addEventListener('change',()=>{answers.adultConfirmed=adult.checked;update();save();});
    update();
  }
  for(const group of root.querySelectorAll('[data-group]')){
    group.addEventListener('toggle',()=>{
      if(!group.isConnected)return;
      if(group.open)openGroups.add(group.dataset.group);
      else openGroups.delete(group.dataset.group);
    });
  }
  const field=root.querySelector('textarea');
  field?.addEventListener('input',()=>{feedback=field.value;save();root.querySelector('[data-submit]').textContent=feedback.trim()?'提交答卷与建议':'提交答卷';});
}
root.addEventListener('click',async event=>{
  const target=event.target.closest('button');
  if(!target||busy)return;
  if(matchRequest&&target.hasAttribute('data-back'))return;
  const q=steps[index];
  if(target.hasAttribute('data-retry-match')){participantError=false;requestMatch();render();return;}
  if(target.hasAttribute('data-back'))return move(q.phase===1?-2:-1);
  if(target.hasAttribute('data-next')){
    if(index===0&&resumeIndex){
      const destination=resumeIndex;
      resumeIndex=0;
      return move(destination);
    }
    return move(1);
  }
  if(target.dataset.interest!==undefined || target.dataset.highlight!==undefined){
    const {interest,highlight}=target.dataset;
    if(interest!==undefined){
      if(interests.has(interest)){interests.delete(interest);highlights.delete(interest);}
      else interests.add(interest);
    }else if(highlights.has(highlight))highlights.delete(highlight);
    else if(highlights.size<3)highlights.add(highlight);
    else{
      root.querySelector('.custom-interest [role=status]').textContent='最多置顶 3 项兴趣。';
      return;
    }
    save();render();
    [...root.querySelectorAll('[data-interest],[data-highlight]')].find(el=>
      interest!==undefined ? el.dataset.interest===interest : el.dataset.highlight===highlight)?.focus({preventScroll:true});
    return;
  }
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
      const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload())});
      if(!res.ok||!(await res.json()).saved)throw Error();
      move(1);
    }catch{
      document.querySelector('#error').textContent='答卷暂未提交，已保存在本机。请稍后重试。';
      target.disabled=false;
    }finally{busy=false;}
  }
});
root.addEventListener('submit',event=>{
  if(event.target.id==='nickname-form'){
    event.preventDefault();
    const form=event.target;
    const name=form.elements.nickname.value.trim();
    if(!name||Array.from(name).length>16||/[\p{C}@]|\d{6}/u.test(name)){
      root.querySelector('#name-error').textContent='请填写 1–16 个字的昵称，避免使用联系方式。';
      return;
    }
    nickname=name;
    hideRadar=form.elements.hide.checked;
    privacySet=true;
    participants=undefined;
    participantError=false;
    move(1);
    return;
  }
  if(!event.target.matches('.custom-interest'))return;
  event.preventDefault();
  const tag=event.target.querySelector('input').value.trim().replace(/^[#＃]+/u,'').trim();
  if(!tag||Array.from(tag).length>6){
    event.target.querySelector('[role=status]').textContent='请输入 1 至 6 个字。';
    return;
  }
  interests.add(tag);
  save();render();
  root.querySelector('#custom-interest')?.focus();
});
render();
