import { Task } from '../types';

export const tasks: Task[] = [
  {
    id: 'task-elder-0',
    roleId: 'elder',
    templeId: 'starting-point',
    title: '主持本主祭祀大典',
    description: '作为德高望重的长老，你需要主持绕三灵开幕的本主祭祀大典。按照传统仪轨，依次完成迎神、献供、诵经、祈福等环节，祈求本主保佑全村平安顺遂。',
    dialogue: '老朽承蒙众乡亲信赖，今日主持本主祭祀大典，愿以虔诚之心，上达天听，祈求本主护佑！',
    interactionType: '祭祀',
    meritReward: 60,
    difficulty: '困难'
  },
  {
    id: 'task-jinhua-0',
    roleId: 'jinhua',
    templeId: 'starting-point',
    title: '准备精美祭祀供品',
    description: '心灵手巧的金花需要精心准备祭祀用的供品。你要挑选最新鲜的乳扇、雕梅、洱海鲜鱼等，按照传统方式摆放整齐，表达对本主的虔诚敬意。',
    dialogue: '姐姐们，咱们一起把供品摆好，乳扇要摆成莲花形，雕梅要摆成吉祥图案，让本主看到我们的心意！',
    interactionType: '祈福',
    meritReward: 40,
    difficulty: '简单'
  },
  {
    id: 'task-apeng-0',
    roleId: 'apeng',
    templeId: 'starting-point',
    title: '搭建祭祀神坛',
    description: '勤劳的阿鹏需要带领青年们搭建祭祀神坛。你要挑选最好的木材，按照传统形制搭建，悬挂五色布幔，摆放香案，确保祭祀大典顺利进行。',
    dialogue: '兄弟们，跟我来！把神坛搭得结结实实的，五色布幔挂端正了，这是咱们白族的大事，可不能马虎！',
    interactionType: '祭祀',
    meritReward: 45,
    difficulty: '中等'
  },
  {
    id: 'task-elder-1',
    roleId: 'elder',
    templeId: 'temple-1',
    title: '诵读祈福经文',
    description: '到达佛都寺后，长老需要带领众人诵读《消灾延寿经》。你要以庄重的语调诵读经文，为众生祈福，愿佛祖保佑风调雨顺、国泰民安。',
    dialogue: '阿弥陀佛，诸位善信，随老朽一同诵经祈福，愿佛祖慈悲，消灾延寿，保我白族子民平安喜乐！',
    interactionType: '讲述',
    meritReward: 55,
    difficulty: '中等'
  },
  {
    id: 'task-jinhua-1',
    roleId: 'jinhua',
    templeId: 'temple-1',
    title: '敬献鲜花礼佛',
    description: '金花需要采摘最美的鲜花，编成花篮敬献给佛祖。你要在大雄宝殿前行三跪九叩大礼，许下美好的心愿，让袅袅青烟带去你的虔诚。',
    dialogue: '佛祖在上，金花以此鲜花敬献，愿家人平安健康，愿来年风调雨顺，也愿……那个打霸王鞭的傻小子一切安好。',
    interactionType: '祈福',
    meritReward: 35,
    difficulty: '简单'
  },
  {
    id: 'task-apeng-1',
    roleId: 'apeng',
    templeId: 'temple-1',
    title: '护卫绕三灵队伍',
    description: '阿鹏需要带领青年护卫队，维护绕三灵队伍的秩序。你要确保队伍安全到达佛都寺，同时帮助年迈的老人和年幼的孩子，体现白族青年的担当。',
    dialogue: '大爹大妈们慢点走，我来搀着您！小娃娃别跑远了，跟紧队伍！兄弟们，注意前后安全，保护好了！',
    interactionType: '祭祀',
    meritReward: 40,
    difficulty: '中等'
  },
  {
    id: 'task-elder-2',
    roleId: 'elder',
    templeId: 'temple-2',
    title: '讲述本主传说故事',
    description: '在神都寺，长老需要向年轻人们讲述中央本主段宗榜的传奇故事。你要绘声绘色地讲述他南征北战、保家卫国的英雄事迹，让白族文化代代相传。',
    dialogue: '娃娃们坐好，听老朽给你们讲段宗榜大将军的故事，他当年南征北战，保家卫国，可是咱们白族的骄傲啊！',
    interactionType: '讲述',
    meritReward: 50,
    difficulty: '中等'
  },
  {
    id: 'task-jinhua-2',
    roleId: 'jinhua',
    templeId: 'temple-2',
    title: '白族调对歌大赛',
    description: '在神都寺的对歌场上，金花要一展歌喉，参加白族调对歌大赛。你要用优美的歌声赞美生活、歌颂爱情，与对手一较高下，争夺歌仙的美誉。',
    dialogue: '苍山脚下好风光，洱海边上好姑娘。金花开口唱一调，不信你不回头望！来吧，谁先出题？',
    interactionType: '对歌',
    meritReward: 65,
    difficulty: '困难'
  },
  {
    id: 'task-apeng-2',
    roleId: 'apeng',
    templeId: 'temple-2',
    title: '男子汉对歌挑战',
    description: '阿鹏也要参加对歌大赛，用白族调子唱出白族小伙的豪情壮志。你要与金花对唱，用歌声表达爱慕之情，展现白族青年的风采。',
    dialogue: '嘿！对歌场上怎能少了我们白族小伙！阿鹏我今天也要放歌一曲，唱出心中的情意！金花姑娘，接招吧！',
    interactionType: '对歌',
    meritReward: 55,
    difficulty: '困难'
  },
  {
    id: 'task-elder-3',
    roleId: 'elder',
    templeId: 'temple-3',
    title: '主持送神仪式',
    description: '到达绕三灵的终点仙都寺，长老需要主持隆重的送神仪式。你要感谢诸神的庇佑，恭送本主神灵返回天庭，祈求来年风调雨顺、五谷丰登。',
    dialogue: '诸位神灵在上，蒙尔庇佑，绕三灵圆满。今恭送诸位神灵回天，愿来年再降甘霖，保我白族五谷丰登、六畜兴旺！',
    interactionType: '祭祀',
    meritReward: 70,
    difficulty: '困难'
  },
  {
    id: 'task-jinhua-3',
    roleId: 'jinhua',
    templeId: 'temple-3',
    title: '八角鼓舞打跳',
    description: '在仙都寺的篝火晚会上，金花手持八角鼓，加入打跳的队伍。你要跳出白族少女的柔美与灵动，让欢乐的气氛感染每一个人。',
    dialogue: '姐妹们，跳起来！今晚是绕三灵最欢乐的时刻，金花要跳出最美的舞步，让八角鼓的节奏带我们一起欢庆！',
    interactionType: '打跳',
    meritReward: 60,
    difficulty: '困难'
  },
  {
    id: 'task-apeng-3',
    roleId: 'apeng',
    templeId: 'temple-3',
    title: '霸王鞭舞表演',
    description: '阿鹏手持霸王鞭，在打跳队伍中领舞。你要舞出白族青年的刚劲与力量，霸王鞭上下翻飞，节奏明快有力，将绕三灵的气氛推向最高潮。',
    dialogue: '兄弟们，霸王鞭舞起来！今晚阿鹏领舞，让乡亲们看看咱们白族汉子的气势！嘿！哈！霸王鞭上下翻飞，气势如虹！',
    interactionType: '打跳',
    meritReward: 65,
    difficulty: '困难'
  }
];
