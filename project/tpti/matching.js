export const interestGroups = [
  {name:'球类与运动', icon:'🏸', items:['羽毛球','乒乓球','桌球','足球','篮球','网球','游泳','高尔夫']},
  {name:'户外与自然', icon:'🌿', items:['徒步','骑行','露营','攀岩','观鸟','桨板','滑雪','潜水']},
  {name:'视觉艺术', icon:'🎨', items:['摄影','绘画','插画','看展','建筑','手工']},
  {name:'音乐', icon:'🎵', items:['音乐现场','唱歌','吉他','钢琴','贝斯','架子鼓','古筝']},
  {name:'美食与探店', icon:'☕', items:['咖啡','茶','烘焙','本地小吃','逛市集']},
  {name:'游戏与桌游', icon:'🎮', items:['桌游','剧本杀','密室逃脱','电子游戏']},
  {name:'文化与休闲', icon:'📚', items:['电影','阅读','博物馆','城市漫步','戏剧','非遗']}
];

const travelStyles = [
  {label:'人文体验', tags:['博物馆','看展','建筑','手工','非遗','阅读','戏剧'], scene:'挑一场展或一间手作工作室，边逛边聊作品里的故事。'},
  {label:'自然观察', tags:['观鸟','徒步','摄影','潜水'], scene:'在清晨走一段观景路线，遇到喜欢的风景就停下来拍照。'},
  {label:'城市与在地美食', tags:['城市漫步','逛市集','本地小吃','咖啡','茶','烘焙','建筑'], scene:'从一条老街逛到当地市集，各挑一样没试过的小吃。'},
  {label:'户外探索', tags:['徒步','骑行','露营','攀岩','桨板','滑雪','潜水'], scene:'一起挑一条难度合适的户外路线，把最想看的风景设成终点。'},
  {label:'休闲与现场体验', tags:['咖啡','茶','音乐现场','电影','桌游','唱歌','钢琴','电子游戏','篮球','网球'], scene:'各选一个喜欢的活动，结束后找个地方坐下慢慢聊。'}
];

export function findMatch(catalog, {activities, selected, highlights, axes}) {
  const priority = new Set(highlights);
  const weights = selected.map(tag => [tag, priority.has(tag) ? 2 : 1]);
  const totalWeight = weights.reduce((sum, [,weight]) => sum + weight, 0);
  const ranked = catalog.flatMap(person => travelStyles.map((style, index) => {
    const shared = weights.filter(([tag]) => person.tags.includes(tag));
    const sharedWeight = shared.reduce((sum,[,weight]) => sum + weight,0);
    const themeTags = person.tags.filter(tag => style.tags.includes(tag));
    if (!themeTags.length) return null;
    const activity = activities.includes(index) ? 1 : 0;
    const gaps = person.scores.map((value,axis) => Math.abs(axes[axis].value-value));
    const fit = (axisFit(0,axes[0].value,person.scores[0])*.25 + axisFit(1,axes[1].value,person.scores[1])*.25 + axisFit(2,axes[2].value,person.scores[2])*.35 + axisFit(3,axes[3].value,person.scores[3])*.15);
    const score = totalWeight
      ? 0.35*(sharedWeight/totalWeight) + 0.22*activity + 0.43*fit
      : 0.35*activity + 0.65*fit;
    const localRelevance=person.group||/\p{Script=Han}/u.test(person.name)?0.06:0;
    return {person,style,score:Math.round(score*100),localRelevance,shared:shared.map(([tag])=>tag),themeTags,gaps};
  })).filter(Boolean);
  ranked.sort((a,b)=>b.score-a.score || b.localRelevance-a.localRelevance || b.themeTags.length-a.themeTags.length);
  return ranked[0];
}

export function dimensionMatch(index, own, other) {
  if(!Number.isFinite(own)||!Number.isFinite(other))return '';
  const low=index===0?35:33;
  if((index===0||index===3)&&Math.min(own,other)<=low&&Math.max(own,other)>=100-low)return '高度互补';
  return index!==3&&Math.abs(own-other)<=20?'高度近似':'';
}

function axisFit(index, own, other) {
  if(dimensionMatch(index,own,other)==='高度互补')return 1;
  return 1-Math.abs(own-other)/100;
}

export function personalityReason({person,gaps}, axes) {
  const pair = (i, low, high, middle) => axes[i].value < 44 && person.scores[i] < 44 ? low :
    axes[i].value > 56 && person.scores[i] > 56 ? high : middle;
  const reasons = [
    pair(0,'你们都能享受安静的一段路。遇到有意思的事，再停下来聊聊。','你们都愿意边走边聊，看到有意思的地方会顺手分享。','你们都能聊几句，也能安静走上一段。刚见面可以先从路上看到的东西聊起。'),
    pair(1,'你们都偏爱熟悉的玩法，可以先从各自去过的地方挑一站。','你们都乐意尝新，可以各挑一个没去过的地方。','可以先安排一站熟悉的，再留一站试点新鲜的。'),
    pair(2,'你们都喜欢慢一点。一天挑一两个想去的地方，走累了就歇会儿。','你们都喜欢一天多看几处。把顺路的点排在一起，省得来回跑。','你们可以先挑几站最想去的，中间给吃饭和走路留够时间。'),
    pair(3,'你们都习惯先定下怎么去、几点集合，到了再慢慢逛。','你们都愿意临时改安排，遇到喜欢的地方可以多待一会儿。','先定个大概，把能临时改的几站留出来。')
  ];
  const strengths = [0,3,1].sort((a,b)=>gaps[a]-gaps[b]);
  const plan = axes[3].value<=33&&person.scores[3]>=67
    ? '你可以先订好交通和集合时间，对方在想象场景里负责临时挑顺路的小站。'
    : axes[3].value>=67&&person.scores[3]<=33
      ? '对方可以先定下交通和集合时间，你负责在路上发现值得多停一会儿的地方。' : '';
  const social = axes[0].value>=65&&person.scores[0]<=35
    ? '可以由你先开话题、和当地人打招呼，对方留心沿途的细节，再找个安静处聊发现。'
    : axes[0].value<=35&&person.scores[0]>=65
      ? '遇到需要问路或和店主交流的场合，可以让对方先开口，你负责观察和挑下一站。' : '';
  const complement=plan||social;
  if(gaps[strengths[0]]>30)return complement || '先选一件两个人都想做的事。各留一个一定要去的点，剩下的到时候商量。';
  if(complement)return reasons[strengths[0]]+' '+complement;
  return strengths.slice(0,2).filter(i=>gaps[i]<=30).map(i=>reasons[i]).join(' ');
}

export const minimumBuddyScore = 65;

export function buddyScore(me, other) {
  if(other?.hideRadar || !Array.isArray(other?.scores) || other.scores.length!==4 ||
    !other.scores.every(value=>Number.isFinite(value)&&value>=0&&value<=100))return null;
  const factors = [[15,0],[5,1],[20,2],[15,3]].map(([weight,i])=>[weight,axisFit(i,me.scores[i],other.scores[i])]);
  if(me.activities?.length&&other.activities?.length){
    const total=new Set([...me.activities,...other.activities]).size;
    const shared=me.activities.filter(value=>other.activities.includes(value)).length;
    factors.push([30,shared/total]);
  }
  if(Number.isInteger(me.budget)&&Number.isInteger(other.budget))factors.push([15,1-Math.abs(me.budget-other.budget)/3]);
  if(me.tags.length&&Array.isArray(other.tags)){
    const weights=me.tags.map(tag=>[me.highlights.includes(tag)?2:1,other.tags.includes(tag)]);
    factors.push([15,weights.reduce((sum,[weight,shared])=>sum+(shared?weight:0),0)/weights.reduce((sum,[weight])=>sum+weight,0)]);
  }
  return Math.round(100*factors.reduce((sum,[weight,fit])=>sum+weight*fit,0)/factors.reduce((sum,[weight])=>sum+weight,0));
}

export function tripReason({person,style}, axes, activities) {
  const pace = value => value<44?'偏舒缓':value>56?'偏紧凑':'疏密适中';
  const own=pace(axes[2].value), other=pace(person.scores[2]);
  const rhythm=own===other
    ? '你们的节奏都'+own+'。'
    : '你喜欢'+own.replace('偏','')+'，想象中的搭子'+other+'。可以先一起走一段，之后各留一点自由时间。';
  const selected=activities.includes(travelStyles.indexOf(style));
  const lead=selected?'你也选了'+style.label+'，可以从这个开始。':'想试试'+style.label+'的话，可以从对方作品里找个点子。';
  const detail={
    'Jimmy Chin':'早上先留一段时间走观景步道，午后在一个取景点停下来拍照，提前约好集合点和回程时间。',
    '小约翰可汗':'选一座城市历史博物馆和附近的老街。先看相关展品，再到街上找展览提到的建筑或地名。'
  };
  return rhythm+' '+lead+' '+(person.tripScene||detail[person.name]||style.scene);
}
