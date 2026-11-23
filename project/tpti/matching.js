export const interestGroups = [
  {name:'球类与运动', icon:'🏸', items:['羽毛球','乒乓球','桌球','足球','篮球','网球','游泳']},
  {name:'户外与自然', icon:'🌿', items:['徒步','骑行','露营','攀岩','观鸟','桨板','滑雪','潜水']},
  {name:'视觉艺术', icon:'🎨', items:['摄影','绘画','插画','看展','建筑','手工']},
  {name:'音乐', icon:'🎵', items:['音乐现场','唱歌','吉他','钢琴','贝斯','架子鼓','古筝']},
  {name:'美食与探店', icon:'☕', items:['咖啡','茶','烘焙','本地小吃','逛市集']},
  {name:'游戏与桌游', icon:'🎮', items:['桌游','剧本杀','密室逃脱','电子游戏']},
  {name:'文化与休闲', icon:'📚', items:['电影','阅读','博物馆','城市漫步','戏剧','非遗']}
];

const travelStyles = [
  {label:'人文体验', tags:['博物馆','看展','建筑','手工','非遗','阅读','戏剧'], scene:'挑一场展或一间手作工作室，边逛边聊作品里的故事。', axes:{2:36}},
  {label:'自然观察', tags:['观鸟','徒步','摄影','潜水'], scene:'在清晨走一段观景路线，遇到喜欢的风景就停下来拍照。', axes:{1:68,2:35}},
  {label:'城市与在地美食', tags:['城市漫步','逛市集','本地小吃','咖啡','茶','烘焙','建筑'], scene:'从一条老街逛到当地市集，各挑一样没试过的小吃。', axes:{1:72,2:46}},
  {label:'户外探索', tags:['徒步','骑行','露营','攀岩','桨板','滑雪','潜水'], scene:'一起挑一条难度合适的户外路线，把最想看的风景设成终点。', axes:{1:84,2:65}},
  {label:'休闲与现场体验', tags:['咖啡','茶','音乐现场','电影','桌游','唱歌','钢琴','电子游戏','篮球','网球'], scene:'各选一个喜欢的活动，结束后找个地方坐下慢慢聊。', axes:{2:29}}
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
    const inferred = Object.entries(style.axes);
    const fit = inferred.reduce((sum,[axis,value]) => sum + (1-Math.abs(axes[axis].value-value)/100),0)/inferred.length;
    const score = totalWeight
      ? 0.6*(sharedWeight/totalWeight) + 0.25*activity + 0.15*fit
      : 0.55*activity + 0.45*fit;
    return {person,style,score,shared:shared.map(([tag])=>tag),themeTags};
  })).filter(Boolean);
  ranked.sort((a,b)=>b.score-a.score || b.themeTags.length-a.themeTags.length);
  return ranked[0];
}
