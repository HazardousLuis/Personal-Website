const agree = ['非常不同意', '不太同意', '比较同意', '非常同意'];
const question = (id, title, options, extra = {}) => ({ id, title, options, kind: 'single', ...extra });
const card = (id, title, description, kind = 'card') => ({ id, title, description, kind });

const pages = [
  question('gender', 'TPTI 旅行人格测试', ['男生', '女生'], {
    kind: 'gender', description: '你的答案将生成专属旅行人格档案，帮助你在与游匹配更合拍的旅行搭子。'
  }),
  question('age', '你的年龄在哪个区间？', ['18–22 岁', '23–25 岁', '26–30 岁', '31–35 岁'], {
    kind: 'age', description: '你的选择将用于完善你的与游个人档案。'
  }),
  card('campus', '超过 1,000 万人', '可能有找旅行搭子的需求', 'campus'),
  question('goals', '你最想实现以下哪个', ['给下一趟长途旅行找个搭子','约附近的搭子周末出去散散心','加入别人发起的活动组局','自己成为与游组局人，邀请搭子加入','加强自己的人脉关系','让自己变得更善于交际','找到自己的爱好圈','先看看自己的旅行人格'], {kind:'multi', description:'你的选择不会影响你的最终匹配体验。可多选。'}),
  card('social', '找搭子，有与游帮你！', '接下来进入社交习惯篇。\n完成测评，领取专属旅行人格卡。', 'illustrated'),
  question('intro', '你觉得自己更偏内向，\n还是更偏外向？', ['偏外向','偏内向','两边都有一点'], {kind:'feedbackChoice'}),
  question('chat', '和刚认识的朋友聊天，你感觉怎么样？', ['有点紧张，常常不知道怎么开口','刚开始有点拘谨，聊一会儿就好了','挺自在，很快就能聊起来']),
  question('speak', '和朋友一起出游时，如果你想玩得和大家不一样，你会担心说出来被嫌扫兴吗？', ['经常会','有时会','几乎不会']),
  question('evening', '旅行时，晚上没安排行程，你更想怎么过？', ['和大家一起待到睡前','一个人安静待着','两者之间']),
  question('walk', '旅行时，和搭子一起散步，你更喜欢哪种节奏？', ['边走边聊，一路分享见闻','一起看看风景，偶尔聊几句']),
  card('explore', '和合拍的搭子，去你们都想去的地方！', '与游通过多模态计算，结合你和搭子的出行偏好，帮你们找到都想去的地方、都喜欢的玩法，再按彼此舒服的节奏出发。接下来让与游了解你的出游偏好。', 'fork'),
  question('food', '旅行时，两家餐馆价位和距离都差不多，我更愿意试试没吃过的当地菜。', agree),
  question('route', '第一次去一座城市，如果两条游览路线都合我胃口，我更想走大多数游客常走的那条。', agree),
  question('pace', '旅行时，我喜欢一天安排得满一些。', agree),
  question('rest', '旅行时，我喜欢在两项活动之间留点时间休息。', agree),
  question('activities', '旅行时，你最想和搭子一起玩哪些组合？', ['人文组合 · 博物馆＋美术馆＋名人故居','自然组合 · 山间观景＋湖边散步＋湿地观鸟','城市组合 · 老街漫步＋逛市集＋吃当地小吃','户外组合 · 徒步＋骑行＋划桨板','度假组合 · 泡温泉＋做 SPA＋在泳池边晒太阳'], {kind:'multi', description:'选出你感兴趣的玩法，可多选。', icons:['🏛︎','♧','⌂','⛰︎','⛱︎']}),
  card('planning', '计划变了，也能玩得尽兴！', '接下来进入计划倾向篇。出发前想定多细，遇到变化又愿意改多少？', 'summary'),
  question('firstDay', '去旅行前，你会先想好第一天去哪儿吗？', ['通常会','有时会','通常到了再决定']),
  question('obstacles', '和搭子安排行程时，哪些事最难定？', ['哪天出发','去哪些地方','每天行程顺序','交通和住宿怎么订','都挺好定','其他'], {kind:'multi', description:'可多选。', exclusive:[4]}),
  question('stay', '到了喜欢的景点，哪怕多待会儿可能影响后面的行程，你会怎么做？', ['按原定时间离开','小改后面的安排，再多待会儿','先多待会儿，后面再调整'], {icons:['🕒','🗺','📷']}),
  card('stayFeedback', '怎么玩，搭子之间说得来就好！', '', 'illustrated'),
  card('radar', '你的旅行偏好，已经有轮廓了！', '接下来，告诉与游你每周能留出几天、哪些时段方便出门。这样约搭子时，除了玩法合拍，也能找到双方都有空的日子。', 'radar'),
  question('days', '每周你有几天有空出去玩？', ['半天','一天','两天','看当周安排'], {description:'约搭子在附近逛逛，或去周边换个地方透透气，半天也算。'}),
  question('availability', '你通常什么时候有空和搭子出去玩？', ['工作日白天','工作日晚上','周六','周日','每周都不太一样'], {kind:'multi', description:'可多选。', exclusive:[4], icons:['☀','☾','▦','▦','◷']}),
  card('generate', '你的 TPTI 旅行人格卡，马上揭晓！', '', 'generate'),
  card('register', '你的 TPTI 旅行人格卡', '', 'register')
];

const money = [
  question('budget','旅行时，你每天愿意花多少？',['300 元及以下','超过 300 至 600 元','超过 600 至 1,000 元','超过 1,000 元'],{description:'按每人算，含住宿、吃饭和门票，不含往返交通。'}),
  question('split','和搭子出游，你通常怎么结账？',['每笔记账，精确 AA','大致轮流请','先凑公共经费，花完再补','谁方便谁付，不细算']),
  question('meal','搭子想去的餐厅超了预算，你会？',['去，难得来一次','去，想拍些好看的照片','各自吃，饭后碰头','不好意思拒绝，就跟着去'],{icons:['🍽','📷','↔','💭']}),
  question('advance','你垫了 80 元，搭子三天没转，你会？',['直接提醒','不好意思开口，再等等','算了，这笔不用还','先记账，旅行结束一起算']),
  question('talk','出发前，你会主动和搭子聊预算和分账吗？',['会','不会'])
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
