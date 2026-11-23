const dimensions = [
  {name:'社交活跃', low:'安静', high:'活跃', items:[
    ['intro',2,[1,0,.5]], ['chat',1,[0,.5,1]], ['evening',3,[1,0,.5]], ['walk',3,[1,0]]
  ]},
  {name:'尝新倾向', low:'熟悉', high:'尝新', items:[
    ['food',2,[0,1/3,2/3,1]], ['route',3,[1,2/3,1/3,0]]
  ]},
  {name:'行程密度', low:'舒缓', high:'紧凑', items:[
    ['pace',3,[0,1/3,2/3,1]], ['rest',2,[1,2/3,1/3,0]]
  ]},
  {name:'计划弹性', low:'预定', high:'应变', items:[
    ['firstDay',2,[0,.5,1]], ['stay',3,[0,.5,1]]
  ]}
];
function scoreColor(value) {
  const rgb = [73,143,220].map((v,i) => Math.round(v + ([220,96,151][i]-v)*value/100));
  return 'rgb(' + rgb.join(',') + ')';
}
function profile(answers) {
  return dimensions.map(({name,low,high,items}) => {
    let sum = 0, weight = 0;
    for (const [key,w,scale] of items) {
      const score = scale[answers[key]];
      if (score !== undefined) { sum += score*w; weight += w; }
    }
    const value = weight ? Math.round(100*sum/weight) : 50;
    return {name,low,high,value,color:scoreColor(value)};
  });
}
function resultFor(axes,flavor) {
  // A balanced answer pattern gets its own descriptor.
  const band = value => value < 45 ? 0 : value > 55 ? 2 : 1;
  const bands = axes.map(axis => band(axis.value));
  const letters = ['QMA','FBN','SER','PCF'];
  const labels = [['静伴','随境','畅聊'],['熟游','兼采','探新'],['慢游','适中','紧凑'],['预排','调和','随行']];
  const words = labels.map((row,i) => row[bands[i]]);
  const situations = [
    ['大家走累了，你会提议找个安静的地方歇一会儿。','搭子还不熟时，你会顺着气氛找个轻松的话题。','刚见面有点冷场时，你会先开口，让大家聊起来。'],
    ['大家拿不定主意时，你会提一个自己熟悉的去处。','有人想尝新、有人想走熟路时，你会提一条兼顾两边的路线。','大家逛腻了常走的路线时，你会推荐一个新去处。'],
    ['大家走得有点赶时，你会提议留出时间慢慢逛。','有人想多逛一站时，你会帮大家找个折中的时间。','想去的地方太多时，你会帮大家把几站串成一条路线。'],
    ['行程临时变动时，你会帮大家确认下一站和集合时间。','行程临时变动时，你会先和搭子商量哪一站值得留下。','错过期待的活动时，你会提议换个去处，让大家重新有期待。']
  ];
  const departures = axes.map(({value}) => Math.abs(value-50));
  const leadingAxis = departures.indexOf(Math.max(...departures));
  return {radarRole:situations[leadingAxis][bands[leadingAxis]],role:situations[leadingAxis][bands[leadingAxis]],
    code:'TPTI · '+letters.map((set,i)=>set[bands[i]]).join(''),
    name:words[0]+words[1]+'－'+words[3]+'型',
    detail:words[2]+'节奏 · '+flavor+'偏好'};
}

export { profile, resultFor };