const agree = ['非常不同意', '不太同意', '比较同意', '非常同意'];
const question = (id, title, options, extra = {}) => ({ id, title, options, kind: 'single', ...extra });
const card = (id, title, description, kind = 'card') => ({ id, title, description, kind });

const pages = [
  question('gender', 'TPTI 旅行人格测试', ['男生', '女生'], {
    kind: 'gender', description: '答完这份测评，你会拿到一张旅行人格卡，看看自己和什么样的搭子更合拍。'
  }),
  question('age', '你在哪个年龄段？', ['18–22 岁', '23–25 岁', '26–30 岁', '31 岁及以上'], {
    kind: 'age', description: '选一个符合你的年龄段。'
  }),
  card('campus', '超过 1,000 万人', '可能有找旅行搭子的需求', 'campus'),
  question('goals', '你最想实现哪个', ['给下一趟长途旅行找个搭子','约附近的搭子周末出去散散心','加入别人发起的活动组局','自己成为活动出行组织者','加强自己的人脉关系','让自己变得更善于交际','找到自己的爱好圈','先看看自己的旅行人格'], {kind:'multi', description:'可多选。这题不影响搭子匹配结果。'}),
  card('social', '找搭子，有与游帮你！', '先聊聊你和搭子相处时，通常是什么样子。', 'illustrated'),
  question('intro', '你觉得自己更偏内向，还是更偏外向？', ['偏外向','偏内向','两边都有一点'], {kind:'feedbackChoice'}),
  question('chat', '和刚认识的人聊天，你通常是什么感觉？', ['有点紧张，不太知道怎么开口','刚开始有点拘谨，聊一会儿就好了','挺自在，很快就能聊起来']),
  question('speak', '和朋友旅行时，如果你想去的地方和大家不一样，你会担心说出来扫兴吗？', ['经常会','有时会','几乎不会']),
  question('evening', '旅行时，晚上没安排行程，你更想怎么过？', ['和大家聊聊、玩玩，待到睡前','一个人安静待着','有时想聚一会儿，有时想自己待着']),
  question('walk', '旅行时，和搭子一起散步，你更喜欢怎么相处？', ['边走边聊，一路分享见闻','一起看看风景，偶尔聊几句']),
  card('explore', '和合拍的搭子，去你们都想去的地方！', '与游会结合你和搭子的出行偏好，把你们想去的地方、喜欢的玩法和彼此舒服的节奏放在一起看。接下来，先让与游了解你的出游偏好。', 'fork'),
  question('food', '旅行时，两家餐馆价位和距离都差不多，我更愿意试试没吃过的当地菜。', agree),
  question('route', '第一次去一座城市，有两条路线我都感兴趣，我更想走大多数游客常走的那条。', agree),
  question('pace', '旅行时，我喜欢一天安排得满一些。', agree),
  question('rest', '旅行时，我喜欢在两项活动之间留点空档。', agree),
  question('activities', '旅行时，你最想和搭子一起玩哪些？', ['人文组合 · 博物馆＋美术馆＋名人故居','自然组合 · 山间观景＋湖边散步＋湿地观鸟','城市组合 · 老街漫步＋逛市集＋吃当地小吃','户外组合 · 徒步＋骑行＋划桨板','度假组合 · 泡温泉＋做 SPA＋在泳池边晒太阳'], {kind:'multi', description:'挑出你感兴趣的玩法，可多选。', icons:['🏛︎','♧','⌂','⛰︎','⛱︎']}),
  card('planning', '计划变了，也能玩得尽兴！', '出发前，你习惯定好多少？到了地方，哪些安排你愿意临时改？', 'summary'),
  question('firstDay', '出发前，你会先想好第一天去哪儿吗？', ['通常会','有时会','通常到了再决定']),
  question('obstacles', '和搭子安排行程时，哪些事最难定？', ['哪天出发','去哪些地方','每天行程顺序','交通和住宿怎么订','都挺好定','其他'], {kind:'multi', description:'可多选。', exclusive:[4]}),
  question('stay', '到了一个很喜欢的地方，多待一会儿可能会影响后面的行程。你会怎么选？', ['按原定时间离开','小改后面的安排，再多待会儿','先多待会儿，后面再调整'], {icons:['🕒','🗺','📷']}),
  card('stayFeedback', '怎么玩，搭子之间说得来就好！', '', 'illustrated'),
  card('radar', '什么时候方便和搭子出门？', '接下来，告诉与游你每周能留出几天、哪些时段方便出门。约搭子不只看玩法合不合拍，也要把时间对上。', 'radar'),
  question('days', '每周你有几天有空出去玩？', ['半天','一天','两天','看当周安排'], {description:'在附近逛逛，或去周边换个地方透透气，半天也算。'}),
  question('availability', '你一般什么时候有空和搭子出去玩？', ['工作日白天','工作日晚上','周六','周日','每周都不太一样'], {kind:'multi', description:'可多选。', exclusive:[4], icons:['☀','☾','▦','▦','◷']}),
  card('generate', '你的 TPTI 旅行人格卡，马上揭晓！', '', 'generate'),
  card('register', '你的 TPTI 旅行人格卡', '', 'register')
];

const money = [
  question('budget','出去旅行，你愿意每天花多少钱？',['300 元及以下','超过 300 至 600 元','超过 600 至 1,000 元','超过 1,000 元'],{description:'按每人每天算，包括住宿、吃饭和门票，往返交通另算。'}),
  question('split','和搭子出游，你通常怎么结账？',['每笔记账，精确 AA','大致轮流请','先凑公共经费，花完再补','谁方便谁付，不细算']),
  question('meal','搭子想去的餐厅超出你的预算，你会怎么做？',['去，难得来一次','去，想拍些好看的照片','各自吃，饭后碰头','不好意思拒绝，就跟着去'],{icons:['🍽','📷','↔','💭']}),
  question('advance','你先付了 80 元，搭子过了三天还没转给你。你会怎么做？',['直接提醒','不好意思开口，再等等','算了，这笔不用还','先记账，旅行结束一起算']),
  question('talk','出发前，你会主动和搭子聊怎么花钱、怎么分账吗？',['会','不会'])
];

// Keep the final few characters together even on WebViews without text-wrap: balance.
for (const item of [...pages, ...money]) {
  const lastLine = item.title.slice(item.title.lastIndexOf('\n') + 1);
  const tail = lastLine.match(/[\p{Script=Han}]{3,4}[。？！：!?.]?$/u)?.[0] || '';
  item.heading = {
    lead: item.title.slice(0, item.title.length - tail.length),
    tail
  };
}

module.exports = {pages, money};
