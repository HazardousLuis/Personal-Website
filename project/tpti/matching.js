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
    const fit = 1-(gaps[0]*.25+gaps[1]*.25+gaps[2]*.35+gaps[3]*.15)/100;
    const score = totalWeight
      ? 0.35*(sharedWeight/totalWeight) + 0.22*activity + 0.43*fit
      : 0.35*activity + 0.65*fit;
    return {person,style,score,shared:shared.map(([tag])=>tag),themeTags,gaps};
  })).filter(Boolean);
  ranked.sort((a,b)=>b.score-a.score || b.themeTags.length-a.themeTags.length);
  return ranked[0];
}

export function personalityReason({person,gaps}, axes) {
  const pair = (i, low, high, middle) => axes[i].value < 44 && person.scores[i] < 44 ? low :
    axes[i].value > 56 && person.scores[i] > 56 ? high : middle;
  const reasons = [
    pair(0,'你们都适合留一点安静时间，熟悉之后再慢慢聊。','你们都适合边走边聊，把路上的发现分享给对方。','想象中，你们喜欢交流的程度接近，一起活动时比较容易找到舒服的相处方式。'),
    pair(1,'你们都更容易从熟悉的路线和玩法开始。','你们都偏向尝新，适合一起挑些没试过的地方。','你们尝新的程度相近，可以在熟悉的行程里留一站给新鲜体验。'),
    pair(2,'你们都适合留出空档，逛累了就找个地方坐一会儿。','你们都适合多安排几站，一起把想看的地方串起来。','你们的行程密度接近，适合一天挑几站，也给路上留足时间。'),
    pair(3,'你们都更适合出发前先定好主要安排。','你们都愿意把行程留得灵活一些，遇到喜欢的地方可以临时改。','你们都适合先确定大致路线，再商量哪些安排可以临时调整。')
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
  if(gaps[strengths[0]]>30)return complement || '从一个共同想玩的活动开始。出发前各说一个想保留的安排，抵达后再一起决定下一站。';
  if(complement)return reasons[strengths[0]]+' '+complement;
  return strengths.slice(0,2).filter(i=>gaps[i]<=30).map(i=>reasons[i]).join(' ');
}

export function rankDemos(demos, axes, interests) {
  return demos.map(demo=>{
    const distance=demo.scores.reduce((sum,value,i)=>sum+Math.abs(value-axes[i].value),0);
    const shared=demo.tags.filter(tag=>interests.has(tag)).length;
    const score=1-distance/400+.18*shared;
    return {demo,score};
  }).sort((a,b)=>b.score-a.score).map(({demo})=>demo);
}


export function tripReason({person,style}, axes, activities) {
  const pace = value => value<44?'偏舒缓':value>56?'偏紧凑':'疏密适中';
  const own=pace(axes[2].value), other=pace(person.scores[2]);
  const rhythm=own===other
    ? '你们的节奏都'+own+'。'
    : '你偏向'+own.replace('偏','')+'，对方在这个想象场景里'+other+'，可以把当天分成一段主行程和一段自由时间。';
  const selected=activities.includes(travelStyles.indexOf(style));
  const lead=selected?'你也选了'+style.label+'。':'可以从对方公开作品中的'+style.label+'主题试一趟。';
  const detail={
    'Jimmy Chin':'早上先留一段时间走观景步道，午后在一个取景点停下来拍照，提前约好集合点和回程时间。',
    '小约翰可汗':'选一座城市历史博物馆和附近的老街。先看相关展品，再到街上找展览提到的建筑或地名。'
  };
  return rhythm+' '+lead+' '+(detail[person.name]||style.scene);
}
