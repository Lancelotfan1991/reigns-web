import type { GameEvent } from '../types'

/**
 * 事件卡库：每张卡代表一次朝堂觐见。
 * 左滑 / 右滑对应两种决策，effects 为四项资源的增减。
 */
export const EVENTS: GameEvent[] = [
  {
    id: 'chancellor',
    avatar: '🧙‍♂️',
    name: '宰相',
    text: '陛下，今年收成不佳，农民苦不堪言。是否减免赋税，以示皇恩？',
    left: {
      label: '减免赋税',
      effects: { gold: -15, people: 12 },
      response: '百姓们传颂着陛下的仁慈，只是国库又瘪了几分。',
    },
    right: {
      label: '照旧征收',
      effects: { gold: 15, people: -12 },
      response: '金币叮当作响地流入国库，乡间却响起了抱怨声。',
    },
  },
  {
    id: 'bishop',
    avatar: '⛪',
    name: '主教',
    text: '城中的大教堂年久失修，屋顶漏雨，圣像蒙尘。恳请陛下拨款修缮。',
    left: {
      label: '拨款修缮',
      effects: { gold: -12, church: 14 },
      response: '钟声重新响彻云霄，教士们为陛下虔诚祈祷。',
    },
    right: {
      label: '婉言拒绝',
      effects: { gold: 6, church: -14 },
      response: '主教拂袖而去，布道时似乎总有些含沙射影。',
    },
  },
  {
    id: 'general',
    avatar: '🎖️',
    name: '将军',
    text: '边境告急！蛮族蠢蠢欲动，将士们已三个月没领到军饷了。',
    left: {
      label: '补发军饷',
      effects: { gold: -15, army: 14 },
      response: '军营里欢声雷动，士兵们誓死效忠陛下。',
    },
    right: {
      label: '再等等吧',
      effects: { gold: 6, army: -14 },
      response: '将军铁青着脸离开，军中开始流传不满的流言。',
    },
  },
  {
    id: 'peasant',
    avatar: '🧑‍🌾',
    name: '农民',
    text: '陛下！贵族老爷强占了我们的土地，全家老小快要饿死了，请陛下做主啊！',
    left: {
      label: '为民做主',
      effects: { people: 14, gold: -8 },
      response: '土地回到了农民手中，贵族们却在暗中咬牙切齿。',
    },
    right: {
      label: '偏袒贵族',
      effects: { people: -14, gold: 10 },
      response: '贵族献上重金答谢，而村庄里只剩下哭声。',
    },
  },
  {
    id: 'queen',
    avatar: '👸',
    name: '王后',
    text: '亲爱的陛下，为庆祝结婚纪念日，为我举办一场盛大的舞会吧？',
    left: {
      label: '欣然举办',
      effects: { gold: -12, people: 10 },
      response: '舞会的灯火照亮了整座城市，人人称颂王室的美满。',
    },
    right: {
      label: '国事为重',
      effects: { gold: 5, people: -8 },
      response: '王后沉默地行了一礼，宫里的空气冷了几分。',
    },
  },
  {
    id: 'witch',
    avatar: '🧙‍♀️',
    name: '女巫',
    text: '我在迷雾森林里发现了宝藏，分你一半。只要你庇护我，不让教会抓我。',
    left: {
      label: '暗中庇护',
      effects: { gold: 16, church: -13 },
      response: '深夜，一箱宝藏悄悄运进王宫地窖。',
    },
    right: {
      label: '交给教会',
      effects: { church: 13, people: -7 },
      response: '火刑柱上升起的黑烟，让村民们议论纷纷。',
    },
  },
  {
    id: 'merchant',
    avatar: '🧔',
    name: '商人',
    text: '陛下，请允许我开辟通往东方的贸易路线，利润定让您满意。',
    left: {
      label: '批准通行',
      effects: { gold: 14, church: -6 },
      response: '商队络绎不绝，市集上出现了前所未见的奇货。',
    },
    right: {
      label: '恐有异端',
      effects: { church: 7, gold: -7 },
      response: '主教赞许地点头，商人们却绕开了您的王国。',
    },
  },
  {
    id: 'knight',
    avatar: '🤺',
    name: '骑士',
    text: '陛下，邻国将举办比武大会。请资助我出征，我定为您赢得荣耀！',
    left: {
      label: '慷慨资助',
      effects: { gold: -9, army: 11 },
      response: '骑士夺得桂冠，扬言荣耀归于陛下与王国。',
    },
    right: {
      label: '不予理会',
      effects: { army: -9 },
      response: '骑士黯然解下纹章，军中的士气又低落了些。',
    },
  },
  {
    id: 'doctor',
    avatar: '🥼',
    name: '瘟疫医生',
    text: '陛下，南边的村庄爆发了瘟疫！急需资金购买药材，否则疫情将蔓延全国。',
    left: {
      label: '全力救治',
      effects: { gold: -14, people: 15 },
      response: '疫情被及时遏制，幸存的村民为陛下立了长生牌位。',
    },
    right: {
      label: '封锁村庄',
      effects: { people: -16, gold: 4 },
      response: '村庄被木板钉死，夜里隐约传来的哭声令人不安。',
    },
  },
  {
    id: 'minstrel',
    avatar: '🎻',
    name: '吟游诗人',
    text: '伟大的陛下！请付我几枚金币，我将为您写下流传千古的赞美诗！',
    left: {
      label: '付钱听歌',
      effects: { gold: -6, people: 9 },
      response: '酒馆里人人传唱陛下的英名，连孩子都会哼上两句。',
    },
    right: {
      label: '轰他出去',
      effects: { people: -7 },
      response: '诗人离开后，关于陛下的歌谣似乎变了些味道……',
    },
  },
  {
    id: 'envoy',
    avatar: '📜',
    name: '教皇特使',
    text: '教皇陛下发起新的圣战，命您派遣军队加入，以彰显虔诚。',
    left: {
      label: '奉旨出兵',
      effects: { army: -10, gold: -10, church: 16 },
      response: '十字军旗帜招展出征，教皇亲笔送来祝福信。',
    },
    right: {
      label: '婉言谢绝',
      effects: { church: -16, gold: 6 },
      response: '特使阴沉着脸离去，罗马那边恐怕要记上一笔。',
    },
  },
  {
    id: 'spy',
    avatar: '🕵️',
    name: '间谍',
    text: '我可以为您打探邻国的一切军情——城防、兵力、弱点。报酬嘛，好商量。',
    left: {
      label: '重金雇佣',
      effects: { gold: -10, army: 12 },
      response: '一份份密报送入王宫，您对邻国的动向了如指掌。',
    },
    right: {
      label: '处以绞刑',
      effects: { church: 6, army: -8 },
      response: '间谍上了绞架，只是军方的情报网从此成了瞎子。',
    },
  },
  {
    id: 'innkeeper',
    avatar: '🍺',
    name: '酒馆老板',
    text: '陛下，一群士兵在我酒馆里喝醉闹事，砸了桌椅还打伤了客人，请陛下管管军队！',
    left: {
      label: '严惩肇事者',
      effects: { army: -12, people: 10 },
      response: '闹事士兵被军法处置，百姓称赞陛下治军严明。',
    },
    right: {
      label: '小事一桩',
      effects: { army: 8, people: -10 },
      response: '士兵们愈发肆无忌惮，酒馆纷纷提前打烊。',
    },
  },
  {
    id: 'astrologer',
    avatar: '🔮',
    name: '占星师',
    text: '陛下，星象显示灾祸将至！建议立即举行祈福大典，方可转危为安。',
    left: {
      label: '举行大典',
      effects: { gold: -8, church: 10 },
      response: '大典庄严肃穆，教士与信徒都安心了不少。',
    },
    right: {
      label: '一派胡言',
      effects: { church: -10, people: 5 },
      response: '占星师被赶出宫廷，不过私下仍有人偷偷观星。',
    },
  },
  {
    id: 'refugee',
    avatar: '🧳',
    name: '逃难者',
    text: '陛下，战火毁掉了我们的家园，几百人逃难到此。求您收留我们吧！',
    left: {
      label: '开城收留',
      effects: { people: 12, gold: -9, army: -4 },
      response: '难民们感激涕零，很快就成了勤恳的新子民。',
    },
    right: {
      label: '关闭城门',
      effects: { people: -12, army: 6 },
      response: '军队执行了命令，城门外的哭声持续了一整夜。',
    },
  },
  {
    id: 'blacksmith',
    avatar: '⚒️',
    name: '铁匠',
    text: '陛下，我可以为军队打造最锋利的剑与最坚固的甲，只需要一笔经费。',
    left: {
      label: '拨款打造',
      effects: { gold: -10, army: 12 },
      response: '崭新的兵甲闪着寒光，军队的战力大大提升。',
    },
    right: {
      label: '没有经费',
      effects: { army: -10 },
      response: '士兵们依旧用着卷刃的旧剑，士气低落。',
    },
  },
  {
    id: 'abbot',
    avatar: '📿',
    name: '修道院长',
    text: '有异端分子在集市散布渎神言论，蛊惑人心！请陛下批准宗教审判。',
    left: {
      label: '批准审判',
      effects: { church: 14, people: -12 },
      response: '审判庭设立了，集市上人人自危，不敢高声言语。',
    },
    right: {
      label: '禁止审判',
      effects: { church: -12, people: 10 },
      response: '百姓称颂陛下宽厚，修道院里却传出愤怒的祷告。',
    },
  },
  {
    id: 'bandit',
    avatar: '🏴‍☠️',
    name: '盗贼头目',
    text: '嘿嘿，陛下。商道上可不太平，交点「保护费」，我们保您商队平安。',
    left: {
      label: '派兵围剿',
      effects: { gold: -8, army: 6, people: 9 },
      response: '军队捣毁了匪巢，商路恢复了安全畅通。',
    },
    right: {
      label: '花钱消灾',
      effects: { gold: -13, people: -8 },
      response: '盗贼收了钱却变本加厉，民间骂声一片。',
    },
  },
  {
    id: 'ambassador',
    avatar: '💌',
    name: '邻国使节',
    text: '我国公主倾慕陛下，愿与王室联姻，并奉上富可敌国的嫁妆。',
    left: {
      label: '欣然接受',
      effects: { gold: 15, church: 6, people: -7 },
      response: '婚礼盛大举行，只是民间对这位外国王妃议论纷纷。',
    },
    right: {
      label: '礼貌婉拒',
      effects: { people: 7, church: -6 },
      response: '百姓为王室的「忠贞」欢呼，邻国的脸色却不太好看。',
    },
  },
  {
    id: 'overseer',
    avatar: '⛏️',
    name: '矿场监工',
    text: '陛下！矿场发现了新矿脉，储量惊人！要不要扩大开采规模？',
    left: {
      label: '扩大开采',
      effects: { gold: 16, people: -10 },
      response: '金矿源源不断运出，矿工们却在黑暗中超负荷劳作。',
    },
    right: {
      label: '保持现状',
      effects: { people: 7, gold: -5 },
      response: '矿工们保住了性命，国库的进项却平平无奇。',
    },
  },
  {
    id: 'physician',
    avatar: '🩺',
    name: '御医',
    text: '陛下近来气色欠佳，臣新调配了一剂汤药，虽苦口，却利于龙体。',
    left: {
      label: '服药静养',
      effects: { gold: -6, church: 5 },
      response: '汤药苦得让人皱眉，不过陛下的精神确实好了些。',
    },
    right: {
      label: '朕没病',
      effects: { army: 5, people: 3 },
      response: '陛下照常理政阅兵，臣民钦佩这份硬朗。',
    },
  },
  {
    id: 'orphan',
    avatar: '🧒',
    name: '孤儿',
    text: '陛下……我已经三天没吃东西了，可以给我一块面包吗？',
    left: {
      label: '给他食物',
      effects: { gold: -4, people: 10 },
      response: '孩子狼吞虎咽地吃着，眼中重新有了光。',
    },
    right: {
      label: '视而不见',
      effects: { people: -9, church: -4 },
      response: '那一幕被路人看在眼里，王室的仁慈之名蒙了尘。',
    },
  },
  {
    id: 'taxman',
    avatar: '🧮',
    name: '税务官',
    text: '陛下，臣建议提高商税两成，国库必将迅速充盈。',
    left: {
      label: '准奏加税',
      effects: { gold: 16, people: -12 },
      response: '国库丰盈了，商铺却接连关门，民怨渐起。',
    },
    right: {
      label: '与民休息',
      effects: { people: 9, gold: -6 },
      response: '商户们松了口气，市集渐渐又热闹起来。',
    },
  },
  {
    id: 'mercenary',
    avatar: '🗡️',
    name: '佣兵队长',
    text: '我们是为钱而战的利剑。雇佣我们，任何敌人都将在陛下面前跪下。',
    left: {
      label: '签订契约',
      effects: { gold: -14, army: 15 },
      response: '佣兵团进驻营地，王国的军力一夜壮大。',
    },
    right: {
      label: '不需要你',
      effects: { army: -7, church: 5 },
      response: '佣兵队长耸耸肩离开，教会称赞陛下不依赖「嗜血之徒」。',
    },
  },
  {
    id: 'nun',
    avatar: '🕊️',
    name: '修女',
    text: '陛下，修道院附属的孤儿院已断粮三日，恳请陛下大发慈悲捐助。',
    left: {
      label: '慷慨捐助',
      effects: { gold: -10, church: 12, people: 6 },
      response: '孩子们喝上了热汤，修道院的钟声为陛下而鸣。',
    },
    right: {
      label: '爱莫能助',
      effects: { church: -11, people: -6 },
      response: '修女含泪离去，教会与百姓都记住了这一天。',
    },
  },
  {
    id: 'rebel',
    avatar: '🔥',
    name: '叛军首领',
    text: '听着，国王！立刻降低赋税，否则我们将揭竿而起，踏平你的城堡！',
    left: {
      label: '被迫妥协',
      effects: { gold: -13, people: 12 },
      response: '税令修改了，叛军解散了，但王室颜面扫地。',
    },
    right: {
      label: '武力镇压',
      effects: { army: -9, people: -14 },
      response: '叛乱被血腥镇压，乡间弥漫着恐惧与仇恨。',
    },
  },
  {
    id: 'alchemist',
    avatar: '⚗️',
    name: '炼金术士',
    text: '陛下！我炼出了威力惊人的火药配方！价钱嘛……您懂的。',
    left: {
      label: '买下配方',
      effects: { gold: -12, army: 14, church: -6 },
      response: '试爆声震碎了教堂的彩窗，主教气得浑身发抖。',
    },
    right: {
      label: '妖术邪说',
      effects: { church: 7, army: -5 },
      response: '炼金术士转投邻国，教会为陛下「抵制邪术」而欢呼。',
    },
  },
  {
    id: 'architect',
    avatar: '🏰',
    name: '皇家建筑师',
    text: '陛下，修建一座空前宏伟的大教堂吧！它将成为王国信仰的丰碑。',
    left: {
      label: '动工修建',
      effects: { gold: -18, church: 18 },
      response: '大教堂拔地而起，香火鼎盛，陛下被誉为「虔诚者」。',
    },
    right: {
      label: '驳回提案',
      effects: { church: -12, gold: 7 },
      response: '建筑师悻悻而归，主教布道时频频叹息。',
    },
  },
  {
    id: 'gamekeeper',
    avatar: '🏹',
    name: '猎场看守',
    text: '陛下，抓到一名在皇家猎场偷猎的贵族，按律当重罚。如何处置？',
    left: {
      label: '依法惩处',
      effects: { people: 12, gold: -6 },
      response: '贵族被流放，平民欢呼「王子犯法与庶民同罪」。',
    },
    right: {
      label: '收钱放行',
      effects: { gold: 9, people: -10 },
      response: '贵族留下了赎金，街头巷尾却多了不少讽刺的歌谣。',
    },
  },
  {
    id: 'jester',
    avatar: '🃏',
    name: '宫廷小丑',
    text: '陛下整日愁眉不展，这可是国家的损失！看我的新段子，保您开怀大笑！',
    left: {
      label: '打赏他',
      effects: { gold: -6, people: 8 },
      response: '陛下的笑声传遍宫廷，连侍卫都忍不住偷笑。',
    },
    right: {
      label: '朕没心情',
      effects: { people: -5, church: 3 },
      response: '小丑鞠躬退下，当晚教堂里多了一场为国王排忧的弥撒。',
    },
  },
  {
    id: 'archbishop',
    avatar: '✝️',
    name: '大主教',
    text: '陛下，今年的什一税该上缴教会了。信仰的账目，可不容拖欠。',
    left: {
      label: '足额上缴',
      effects: { gold: -12, church: 14 },
      response: '大主教满意地在账本上画了勾，为上帝的仆人祈祷。',
    },
    right: {
      label: '拖欠税款',
      effects: { gold: 9, church: -14 },
      response: '金币留在了国库，教堂的布道声里多了些火药味。',
    },
  },
  {
    id: 'messenger',
    avatar: '🐎',
    name: '边防信使',
    text: '陛下！蛮族大军压境，提出只要进贡百箱黄金便退兵。否则……兵临城下！',
    left: {
      label: '忍辱进贡',
      effects: { gold: -15, people: -5 },
      response: '蛮族满载而归，百姓却为这份屈辱抬不起头。',
    },
    right: {
      label: '奋起迎战',
      effects: { army: -12, gold: -8, people: 9 },
      response: '军队浴血奋战击退蛮族，举国高呼陛下是真正的王。',
    },
  },
]
