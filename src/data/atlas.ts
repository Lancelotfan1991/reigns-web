/**
 * 崇祯即位年间的舆图资料。
 *
 * 疆域轮廓见 atlasGeo.ts：以 Natural Earth 1:50m 边界合并为两京十三布政使司，
 * 裁去长城以北、嘉峪关以西与辽东已失之地，海岸线取真实海岸线；
 * 省界为现代省界合并后的近似，仅供游戏内观览，非历史测绘。
 * 每省附崇祯初年按语，与塘报剧情互为表里。
 */

import { ATLAS_RINGS } from './atlasGeo'

export type LonLat = [number, number]

export type RegionKind = 'province' | 'dependency' | 'neighbor'

export interface Region {
  id: string
  name: string
  kind: RegionKind
  /** 治所 / 都城 */
  capital?: string
  /** 面板题下小字 */
  meta: string
  note: string
  facts: string[]
  fill: string
  outline: LonLat[]
  /** 飞地 / 岛屿，与 outline 同属一区 */
  extra?: LonLat[][]
  label: LonLat
  labelSize?: number
  /** 图上省名可与面板全称不同（如辽东都司简作辽东） */
  labelText?: string
  /** 后金斜线、蒙古点阵 */
  hatch?: 'jin' | 'stipple'
}

export type CityKind = 'capital' | 'auxiliary' | 'seat' | 'fort' | 'port'

export interface City {
  id: string
  name: string
  lon: number
  lat: number
  kind: CityKind
  /** 一级常驻；二级随「府州」开关显隐 */
  rank: 1 | 2
  anchor?: 'start' | 'middle' | 'end'
  dx?: number
  dy?: number
  /** 城邑过密处只留点、不留字 */
  hideLabel?: boolean
}

export interface Frontier {
  id: string
  name: string
  lon: number
  lat: number
  /** 图上小字位置；不填则按东西自动放 */
  dx?: number
  dy?: number
  anchor?: 'start' | 'end'
  /** 辽东镇与「辽东」省名重复，只留方点 */
  hideLabel?: boolean
}

export interface River {
  id: string
  name: string
  kind: 'yellow' | 'yangtze' | 'canal'
  points: LonLat[]
}

export interface ChronicleEntry {
  id: string
  date: string
  title: string
  place: string
  text: string
  lon: number
  lat: number
  /** 所属省 / 藩部 id */
  region?: string
  /** 是否在图上落印 */
  pin?: boolean
  pinOffset?: LonLat
}

function shapeOf(id: string): Pick<Region, 'outline' | 'extra'> {
  const rings = ATLAS_RINGS[id] ?? []
  return { outline: rings[0] ?? [], extra: rings.slice(1) }
}

export const PROVINCES: Region[] = [
  {
    id: 'beizhili',
    name: '北直隶',
    kind: 'province',
    capital: '京师（顺天府）',
    meta: '八府 · 蓟、宣、辽东三镇之根本',
    note: '京师居华北平原北端，天子守边，山海关外即辽东战场。崇祯即位之初，魏忠贤伏法、阉党次第斥逐，朝局初更；然九边饷银、京营空额皆待整顿，通州漕粮一断，京师百万口便无以为食。',
    facts: [
      '顺天、保定、河间、真定、顺德、广平、大名、永平八府',
      '通州为漕运终点，京师官俸军饷仰给东南',
      '北边宣府、蓟州、辽东三镇皆倚畿辅转输',
    ],
    ...shapeOf('beizhili'),
    fill: '#d9c5a0',
    label: [115.4, 38.45],
  },
  {
    id: 'nanzhili',
    name: '南直隶',
    kind: 'province',
    capital: '应天府（南京）',
    meta: '留都 · 十四府四州 · 财赋甲天下',
    note: '南京为太祖旧都，六部、都察院并置，是北京之外的第二套朝廷。苏松重赋、漕粮北运，天下财赋半出于此；凤阳为中都皇陵所在。留都官署虽闲，江南士绅的清议却由此出。',
    facts: [
      '应天、凤阳、苏州、松江等十四府，徐、滁、和、广德四州',
      '南直隶漕粮为京师命脉，苏松赋额尤重',
      '凤阳皇陵、南京孝陵，皆置守陵军卫',
    ],
    ...shapeOf('nanzhili'),
    fill: '#d5c8a4',
    label: [117.6, 31.35],
  },
  {
    id: 'shandong',
    name: '山东',
    kind: 'province',
    capital: '济南府',
    meta: '六府 · 登莱控海，东江饷道',
    note: '山东三面濒海，登州、莱州与辽东隔海相望。东江镇粮饷自登莱出海转运，一石粮脚价抵三石；孙元化抚登莱，募澳门炮师、设局铸炮，海防与辽事皆系于此。',
    facts: [
      '济南、兖州、东昌、青州、登州、莱州六府',
      '辽东都司名义上隶山东布政使司',
      '登莱海道为东江镇饷道，亦为辽人内渡之路',
    ],
    ...shapeOf('shandong'),
    fill: '#d7c6a1',
    label: [118.6, 35.75],
  },
  {
    id: 'shanxi',
    name: '山西',
    kind: 'province',
    capital: '太原府',
    meta: '五府三州 · 大同、太原二镇',
    note: '山西表里山河，大同镇当蒙古之冲，太原镇守内边。宣大款市时开时绝，晋商以粮布易边马；崇祯初察哈尔西迁，边外诸部离散，边情更不可测。',
    facts: [
      '太原、平阳、大同、潞安、汾州五府，泽、辽、沁三州',
      '大同为九边重镇，宣大总督驻阳和',
      '晋商输粮塞上，边饷、盐引多经其手',
    ],
    ...shapeOf('shanxi'),
    fill: '#d4c3a0',
    label: [111.9, 36.9],
  },
  {
    id: 'henan',
    name: '河南',
    kind: 'province',
    capital: '开封府',
    meta: '八府一州 · 中原腹地，宗藩最盛',
    note: '河南居天下之中，开封为周王封地，洛阳为福王封国，宗室之众甲于诸省。黄河自开封以东夺淮入海，河工与漕运交相为命；秦晋旱饥一起，流民便循崤函东出。',
    facts: [
      '开封、河南、归德、汝宁、南阳、怀庆、卫辉、彰德八府及汝州',
      '福王朱常洵就国洛阳，富甲诸藩',
      '黄河经开封、徐州夺淮入海，河决则漕运立阻',
    ],
    ...shapeOf('henan'),
    fill: '#d8c8a3',
    label: [113.3, 33.8],
  },
  {
    id: 'shaanxi',
    name: '陕西',
    kind: 'province',
    capital: '西安府',
    meta: '八府 · 三边总督 · 崇祯元年大旱',
    note: '陕西布政使司兼有河西走廊，延绥、宁夏、固原、甘肃四镇并峙，三边总督总其兵。崇祯即位前后，秦中连岁不雨，澄城王二、府谷王嘉胤相继起事，饥民、逃卒、裁驿之众合流，明末民变自此开端。',
    facts: [
      '西安、凤翔、汉中、延安、庆阳、平凉、巩昌、临洮八府',
      '延绥、宁夏、固原、甘肃四镇，三边总督驻节固原',
      '崇祯元年大旱，延安、庆阳一带饥民载道',
    ],
    ...shapeOf('shaanxi'),
    fill: '#d1c09c',
    label: [107.0, 35.3],
  },
  {
    id: 'huguang',
    name: '湖广',
    kind: 'province',
    capital: '武昌府',
    meta: '十五府 · 湖广熟，天下足',
    note: '湖广跨江汉、洞庭南北，武昌为会城，承天为兴献帝陵所在，郧阳控秦楚之交。江汉平原与洞庭湖区的漕粮、木料顺江东下，是京师与九边之外最厚的一块财赋。',
    facts: [
      '武昌、汉阳、黄州、承天、德安、岳州、荆州、襄阳、郧阳、长沙、常德、衡州、永州、宝庆、辰州十五府',
      '施州卫与永顺、保靖等土司错处其间',
      '承天为兴献帝陵所在，设守陵卫所',
    ],
    ...shapeOf('huguang'),
    fill: '#d3c8a6',
    label: [112.2, 29.2],
  },
  {
    id: 'jiangxi',
    name: '江西',
    kind: 'province',
    capital: '南昌府',
    meta: '十三府 · 漕粮与瓷器的出口',
    note: '江西三面环山，赣江纵贯，南昌以下入鄱阳湖，出湖口即长江。景德镇瓷、樟树药、赣南木材与米谷皆由此北上；赣南山区又是闽粤流民往来之径。',
    facts: [
      '南昌、瑞州、饶州、南康、九江、广信、建昌、抚州、吉安、临江、袁州、赣州、南安十三府',
      '景德镇属浮梁县，御器厂烧造不绝',
      '赣关为南北货税要口，饷源所系',
    ],
    ...shapeOf('jiangxi'),
    fill: '#d7caa6',
    label: [115.4, 27.4],
  },
  {
    id: 'zhejiang',
    name: '浙江',
    kind: 'province',
    capital: '杭州府',
    meta: '十一府 · 财赋与海防并重',
    note: '浙江杭嘉湖为天下最腴之地，丝绸、漕粮、盐课甲于东南；宁波、温州为海道门户。嘉靖倭患后浙海设防渐密，崇祯初海上郑芝龙势盛，浙闽海商多与之通。',
    facts: [
      '杭州、嘉兴、湖州、宁波、绍兴、台州、金华、衢州、严州、温州、处州十一府',
      '杭嘉湖漕粮与丝织为朝廷所倚',
      '宁波为日本勘合贸易旧口，海商往来不绝',
    ],
    ...shapeOf('zhejiang'),
    fill: '#d2c6a3',
    label: [120.0, 29.0],
  },
  {
    id: 'fujian',
    name: '福建',
    kind: 'province',
    capital: '福州府',
    meta: '八府 · 月港海贸，郑氏初起',
    note: '福建负山面海，福州为会城，漳州月港为出海正口。崇祯元年，福建巡抚熊文灿招抚郑芝龙，授海防游击；郑氏以泉州安平为巢，商舶往来日本、吕宋，海上之势自此渐成。',
    facts: [
      '福州、建宁、泉州、延平、汀州、兴化、邵武、漳州八府及福宁州',
      '月港为明末准贩东西洋的口岸，税饷岁入不赀',
      '郑芝龙受抚后，东南舟师渐归其统',
    ],
    ...shapeOf('fujian'),
    fill: '#d5c7a2',
    label: [117.9, 26.3],
  },
  {
    id: 'guangdong',
    name: '广东',
    kind: 'province',
    capital: '广州府',
    meta: '十府 · 澳门与广州一口',
    note: '广东濒南海，广州为岭南会城，澳门为葡萄牙人赁居之地，岁输地租。崇祯初徐光启等议用西法铸炮，澳门炮师应募北来，入登莱炮局；琼州隔海，黎汉杂处。',
    facts: [
      '广州、韶州、南雄、惠州、潮州、肇庆、高州、廉州、雷州、琼州十府',
      '葡萄牙人自嘉靖间赁居澳门，设炮台、通海舶',
      '琼州孤悬海外，设府治，黎峒土舍错处',
    ],
    ...shapeOf('guangdong'),
    fill: '#d1c5a1',
    label: [113.8, 24.3],
  },
  {
    id: 'guangxi',
    name: '广西',
    kind: 'province',
    capital: '桂林府',
    meta: '十一府 · 桂西诸土司',
    note: '广西东接广东，北连湖广、贵州，西与云南、安南相邻。桂林为靖江王封国，桂西土司林立，狼兵以骁勇闻；赋税薄而用兵多，常仰给广东、湖广协济。',
    facts: [
      '桂林、柳州、庆远、平乐、梧州、浔州、南宁、太平、思明、镇安、思恩十一府',
      '靖江王就国桂林，为明代唯一藩国于广西者',
      '桂西诸土司与安南边境犬牙相错',
    ],
    ...shapeOf('guangxi'),
    fill: '#d6c9a5',
    label: [108.7, 24.0],
  },
  {
    id: 'yunnan',
    name: '云南',
    kind: 'province',
    capital: '云南府',
    meta: '土司与卫所杂置 · 沐氏世镇',
    note: '云南远处西南，沐英之后世镇云南，黔国公府与巡抚、巡按并治。昆明以西土司、宣慰司林立，腾冲、永昌为滇西门户；滇铜、盐井、象马之利皆在土司之手。',
    facts: [
      '云南府为会城，大理、临安、永昌、丽江等府及诸宣慰司',
      '沐氏世镇云南二百余年，兵权与财赋皆重',
      '滇西腾冲、陇川诸关为缅甸、木邦入贡孔道',
    ],
    ...shapeOf('yunnan'),
    fill: '#d2c4a0',
    label: [100.5, 24.6],
  },
  {
    id: 'guizhou',
    name: '贵州',
    kind: 'province',
    capital: '贵阳府',
    meta: '府卫所与土司杂置 · 奢安之乱未息',
    note: '贵州山高谷深，田少赋薄，官俸军饷多仰四川、湖广协济。天启元年永宁奢崇明、水西安邦彦反，陷重庆、围成都、困贵阳，至崇祯初仍用兵未息。',
    facts: [
      '贵阳、思南、思州、镇远、石阡、铜仁、黎平、安顺、都匀、平越、普安等府',
      '省小兵多，岁饷常取给于川、湖',
      '水西安氏、永宁奢氏皆为一方大土司',
    ],
    ...shapeOf('guizhou'),
    fill: '#d8c9a5',
    label: [106.35, 25.25],
  },
  {
    id: 'sichuan',
    name: '四川',
    kind: 'province',
    capital: '成都府',
    meta: '八府 · 天府之饶，奢安之乱波及',
    note: '四川盆地沃野千里，成都为蜀王封国，重庆扼大江上游。天启间永宁宣抚使奢崇明叛，据重庆、围成都，石砫宣抚秦良玉率白杆兵赴援；崇祯初乱事渐平，而川东、川南疮痍未复。',
    facts: [
      '成都、保宁、顺庆、夔州、重庆、叙州、马湖、龙安八府，及潼川、嘉定、雅州等直隶州',
      '遵义府时隶四川，后改隶贵州',
      '石砫宣抚秦良玉以白杆兵闻于天下',
    ],
    ...shapeOf('sichuan'),
    fill: '#d4c3a0',
    label: [104.2, 29.4],
  },
  {
    id: 'liaodong',
    name: '辽东都司',
    kind: 'dependency',
    capital: '宁远（残）',
    meta: '辽西走廊 · 关宁锦防线',
    note: '天启二年广宁失陷后，明军退守辽西走廊，山海关—宁远—锦州一线成为关外孤垒。天启七年宁锦之战，袁崇焕凭城用红夷炮击退皇太极；崇祯即位时，明在辽东仅存此走廊与海上东江镇。',
    facts: [
      '山海关、宁远、锦州为关宁锦防线三城',
      '广宁、辽阳、沈阳已入后金之手',
      '东江镇毛文龙据皮岛，以海道牵制后金后方',
    ],
    ...shapeOf('liaodong'),
    fill: '#d9c8a4',
    label: [120.4, 40.35],
    labelText: '辽东',
    labelSize: 9.5,
  },
]

export const NEIGHBORS: Region[] = [
  {
    id: 'houjin',
    name: '后金',
    kind: 'neighbor',
    capital: '盛京（沈阳）',
    meta: '天聪元年 · 皇太极新立',
    note: '建州女真自萨尔浒一战而后，尽有辽河以东。努尔哈赤崩于天启六年，皇太极继位，改元天聪；天聪元年正月遣阿敏征朝鲜，三月盟于江华岛。其国新主初立，兄弟并握重兵，而八旗兵锋甚锐。',
    facts: [
      '都盛京（沈阳），据辽阳、广宁、辽南诸城',
      '八旗制度，满洲、蒙古、汉军渐次扩编',
      '天聪元年征朝鲜，结“兄弟之国”之盟',
    ],
    ...shapeOf('houjin'),
    fill: '#cbb2a1',
    hatch: 'jin',
    label: [126.1, 43.0],
  },
  {
    id: 'menggu',
    name: '蒙古诸部',
    kind: 'neighbor',
    capital: '察哈尔 · 林丹汗',
    meta: '漠南诸部离散',
    note: '长城以北，察哈尔、土默特、喀喇沁、鄂尔多斯诸部并立。林丹汗以元裔称大汗，然部众携贰；后金东来，科尔沁等部已附，察哈尔被迫西迁，漠南之势渐为后金所并。',
    facts: [
      '察哈尔林丹汗为蒙古名义共主，驻帐宣大边外',
      '科尔沁、内喀尔喀诸部已与后金盟誓',
      '河套为鄂尔多斯部牧地，明人以“套虏”称之',
    ],
    ...shapeOf('menggu'),
    fill: '#d7ceb6',
    hatch: 'stipple',
    label: [110.2, 43.4],
  },
  {
    id: 'chaoxian',
    name: '朝鲜',
    kind: 'neighbor',
    capital: '汉城',
    meta: '丁卯之盟 · 仍奉明正朔',
    note: '朝鲜李氏王朝事明甚谨。天聪元年正月，后金阿敏率军渡鸭绿江，连陷义州、平壤，朝鲜仁祖避居江华岛，三月与后金盟，约为兄弟之国；然其君臣仍奉明朝正朔，暗中接济东江。',
    facts: [
      '鸭绿江为明、鲜、后金三方交界',
      '丁卯之役后，朝鲜岁输后金米帛',
      '义州、皮岛间海道为东江饷道与逃人之路',
    ],
    ...shapeOf('chaoxian'),
    fill: '#d2cdb4',
    label: [127.7, 37.9],
  },
  {
    id: 'wusizang',
    name: '乌斯藏',
    kind: 'neighbor',
    capital: '拉萨',
    meta: '羁縻之地 · 藏巴汗与格鲁派',
    note: '明设乌思藏都司、朵甘都司，以羁縻诸部，实权在藏巴汗与各教派之手。崇祯初格鲁派与藏巴汗相争，蒙古喀尔喀部入藏，明廷远不能制，仅通贡使而已。',
    facts: [
      '洪武间设乌思藏都司，封授法王、国师',
      '万历后藏巴汗据卫藏，格鲁派求援于蒙古',
      '贡道经洮州、河州入中原',
    ],
    ...shapeOf('wusizang'),
    fill: '#d5ccb4',
    label: [98.0, 31.0],
    labelSize: 10,
  },
  {
    id: 'taiwan',
    name: '台湾',
    kind: 'neighbor',
    capital: '大员（荷据）',
    meta: '荷兰东印度公司据守',
    note: '天启四年，荷兰东印度公司退出澎湖，入据大员（今台南安平），筑热兰遮城，与福建海商争海上之利。明廷视之为化外，不置官守；郑芝龙受抚后，其部与荷兰人时和时战。',
    facts: [
      '荷兰人筑热兰遮城、普罗民遮城',
      '汉人渔商、原住民部落错处',
      '澎湖设巡检，隶福建',
    ],
    ...shapeOf('taiwan'),
    fill: '#d3c9ae',
    label: [121.15, 22.55],
    labelSize: 9,
  },
]

export const ALL_REGIONS: Region[] = [...PROVINCES, ...NEIGHBORS]

export const CITIES: City[] = [
  { id: 'beijing', name: '京师', lon: 116.4, lat: 39.9, kind: 'capital', rank: 1, anchor: 'end', dx: -7, dy: -4 },
  { id: 'nanjing', name: '南京', lon: 118.8, lat: 32.06, kind: 'auxiliary', rank: 1, dx: 7, dy: 5 },
  { id: 'shanghaiguan', name: '山海关', lon: 119.75, lat: 40.0, kind: 'fort', rank: 1, anchor: 'end', dx: -7, dy: 4 },
  { id: 'ningyuan', name: '宁远', lon: 120.72, lat: 40.7, kind: 'fort', rank: 1, dx: 7, dy: 6 , hideLabel: true },
  { id: 'jinzhou', name: '锦州', lon: 121.13, lat: 41.1, kind: 'fort', rank: 1, dx: 8, dy: -3 , hideLabel: true },
  { id: 'dengzhou', name: '登州', lon: 120.76, lat: 37.8, kind: 'port', rank: 1, dx: 8, dy: 3 },
  { id: 'pidao', name: '皮岛', lon: 123.5, lat: 39.45, kind: 'port', rank: 1, dx: 8, dy: 10 },
  { id: 'jinan', name: '济南', lon: 117.0, lat: 36.65, kind: 'seat', rank: 1, dx: 8, dy: 3 },
  { id: 'taiyuan', name: '太原', lon: 112.55, lat: 37.87, kind: 'seat', rank: 1, anchor: 'end', dx: -7, dy: 4 , hideLabel: true },
  { id: 'datong', name: '大同', lon: 113.3, lat: 40.08, kind: 'fort', rank: 1, anchor: 'end', dx: -7, dy: -2 , hideLabel: true },
  { id: 'xuanfu', name: '宣府', lon: 115.05, lat: 40.8, kind: 'fort', rank: 1, anchor: 'end', dx: -7, dy: -3 , hideLabel: true },
  { id: 'kaifeng', name: '开封', lon: 114.35, lat: 34.8, kind: 'seat', rank: 1, dx: 7, dy: 4 },
  { id: 'luoyang', name: '洛阳', lon: 112.45, lat: 34.62, kind: 'seat', rank: 1, anchor: 'end', dx: -7, dy: 3 , hideLabel: true },
  { id: 'xian', name: '西安', lon: 108.94, lat: 34.34, kind: 'seat', rank: 1, anchor: 'end', dx: -7, dy: 4 },
  { id: 'lanzhou', name: '兰州', lon: 103.8, lat: 36.06, kind: 'seat', rank: 1, anchor: 'end', dx: -7, dy: 2 , hideLabel: true },
  { id: 'ganzhou', name: '甘州', lon: 100.45, lat: 38.93, kind: 'fort', rank: 1, anchor: 'end', dx: -7, dy: 2 , hideLabel: true },
  { id: 'yulin', name: '榆林', lon: 109.73, lat: 38.28, kind: 'fort', rank: 1, dx: 7, dy: 5 , hideLabel: true },
  { id: 'ningxia', name: '宁夏', lon: 106.27, lat: 38.47, kind: 'fort', rank: 1, dx: 7, dy: 5 , hideLabel: true },
  { id: 'guyuan', name: '固原', lon: 106.28, lat: 36.0, kind: 'fort', rank: 1, dx: 7, dy: 6 , hideLabel: true },
  { id: 'xuzhou', name: '徐州', lon: 117.18, lat: 34.26, kind: 'seat', rank: 1, anchor: 'end', dx: -7, dy: 5 , hideLabel: true },
  { id: 'yangzhou', name: '扬州', lon: 119.42, lat: 32.39, kind: 'seat', rank: 1, dx: 7, dy: -3 , hideLabel: true },
  { id: 'suzhou', name: '苏州', lon: 120.62, lat: 31.3, kind: 'seat', rank: 1, dx: 7, dy: 2 , hideLabel: true },
  { id: 'hangzhou', name: '杭州', lon: 120.16, lat: 30.27, kind: 'seat', rank: 1, dx: 7, dy: 6 },
  { id: 'nanchang', name: '南昌', lon: 115.89, lat: 28.68, kind: 'seat', rank: 1, dx: 7, dy: 2 },
  { id: 'wuchang', name: '武昌', lon: 114.3, lat: 30.55, kind: 'seat', rank: 1, dx: 7, dy: -4 },
  { id: 'xiangyang', name: '襄阳', lon: 112.14, lat: 32.04, kind: 'seat', rank: 1, anchor: 'end', dx: -7, dy: 5 , hideLabel: true },
  { id: 'chengdu', name: '成都', lon: 104.07, lat: 30.67, kind: 'seat', rank: 1, anchor: 'end', dx: -7, dy: 5 },
  { id: 'chongqing', name: '重庆', lon: 106.5, lat: 29.56, kind: 'seat', rank: 1, dx: 7, dy: 5 },
  { id: 'guiyang', name: '贵阳', lon: 106.63, lat: 26.65, kind: 'seat', rank: 1, dx: 7, dy: 3 },
  { id: 'kunming', name: '昆明', lon: 102.71, lat: 25.04, kind: 'seat', rank: 1, dx: 7, dy: 5 },
  { id: 'guilin', name: '桂林', lon: 110.3, lat: 25.28, kind: 'seat', rank: 1, anchor: 'end', dx: -7, dy: 2 },
  { id: 'guangzhou', name: '广州', lon: 113.26, lat: 23.13, kind: 'seat', rank: 1, dx: 7, dy: 6 },
  { id: 'fuzhou', name: '福州', lon: 119.3, lat: 26.08, kind: 'seat', rank: 1, dx: 7, dy: 5 },
  { id: 'quanzhou', name: '泉州', lon: 118.6, lat: 24.9, kind: 'port', rank: 1, dx: 7, dy: 5 },
  { id: 'qiongzhou', name: '琼州', lon: 110.35, lat: 20.0, kind: 'seat', rank: 1, anchor: 'end', dx: -6, dy: 2 },
  { id: 'tianjin', name: '天津', lon: 117.2, lat: 39.13, kind: 'port', rank: 2, dx: 7, dy: 4 },
  { id: 'baoding', name: '保定', lon: 115.48, lat: 38.87, kind: 'seat', rank: 2, anchor: 'end', dx: -7, dy: 3 , hideLabel: true },
  { id: 'zhending', name: '真定', lon: 114.57, lat: 38.14, kind: 'seat', rank: 2, anchor: 'end', dx: -7, dy: 4 , hideLabel: true },
  { id: 'daming', name: '大名', lon: 115.15, lat: 36.28, kind: 'seat', rank: 2, dx: 7, dy: 5 , hideLabel: true },
  { id: 'qingzhou', name: '青州', lon: 118.48, lat: 36.7, kind: 'seat', rank: 2, dx: 7, dy: 5 , hideLabel: true },
  { id: 'yanzhou', name: '兖州', lon: 116.83, lat: 35.55, kind: 'seat', rank: 2, dx: 7, dy: 5 , hideLabel: true },
  { id: 'huaian', name: '淮安', lon: 119.02, lat: 33.5, kind: 'seat', rank: 2, dx: 7, dy: 5 , hideLabel: true },
  { id: 'ningbo', name: '宁波', lon: 121.55, lat: 29.87, kind: 'port', rank: 2, dx: 7, dy: 4 },
  { id: 'wenzhou', name: '温州', lon: 120.7, lat: 28.0, kind: 'port', rank: 2, dx: 7, dy: 5 },
  { id: 'zhangzhou', name: '漳州', lon: 117.65, lat: 24.51, kind: 'port', rank: 2, anchor: 'end', dx: -7, dy: 5 },
  { id: 'chaozhou', name: '潮州', lon: 116.62, lat: 23.66, kind: 'port', rank: 2, anchor: 'end', dx: -7, dy: 4 },
  { id: 'huizhou', name: '惠州', lon: 114.42, lat: 23.11, kind: 'seat', rank: 2, anchor: 'end', dx: -7, dy: 5 },
  { id: 'shaozhou', name: '韶州', lon: 113.6, lat: 24.8, kind: 'seat', rank: 2, anchor: 'end', dx: -7, dy: 3 },
  { id: 'zhaoqing', name: '肇庆', lon: 112.47, lat: 23.05, kind: 'seat', rank: 2, anchor: 'end', dx: -7, dy: 5 },
  { id: 'leizhou', name: '雷州', lon: 110.1, lat: 20.9, kind: 'seat', rank: 2, anchor: 'end', dx: -7, dy: 5 },
  { id: 'nanning', name: '南宁', lon: 108.37, lat: 22.82, kind: 'seat', rank: 2, anchor: 'end', dx: -7, dy: 5 },
  { id: 'liuzhou', name: '柳州', lon: 109.4, lat: 24.33, kind: 'seat', rank: 2, anchor: 'end', dx: -7, dy: 4 },
  { id: 'hengzhou', name: '衡州', lon: 112.57, lat: 26.9, kind: 'seat', rank: 2, dx: 7, dy: 5 },
  { id: 'changsha', name: '长沙', lon: 112.94, lat: 28.2, kind: 'seat', rank: 2, dx: 7, dy: 5 },
  { id: 'changde', name: '常德', lon: 111.7, lat: 29.0, kind: 'seat', rank: 2, anchor: 'end', dx: -7, dy: 5 },
  { id: 'jingzhou', name: '荆州', lon: 112.24, lat: 30.33, kind: 'seat', rank: 2, anchor: 'end', dx: -7, dy: 5 },
  { id: 'nanyang', name: '南阳', lon: 112.53, lat: 33.0, kind: 'seat', rank: 2, dx: 7, dy: 5 },
  { id: 'hanzhong', name: '汉中', lon: 107.03, lat: 33.07, kind: 'seat', rank: 2, anchor: 'end', dx: -7, dy: 5 },
  { id: 'jizhou', name: '蓟州', lon: 117.4, lat: 40.05, kind: 'fort', rank: 2, dx: 7, dy: -3 },
]

/** 九边重镇，图上以方点标示 */
export const FRONTIERS: Frontier[] = [
  { id: 'liaodong', name: '辽东镇', lon: 120.85, lat: 40.75, hideLabel: true },
  { id: 'jizhou', name: '蓟州', lon: 117.65, lat: 40.2, dx: 6, dy: -4 },
  { id: 'xuanfu', name: '宣府', lon: 115.05, lat: 40.8, anchor: 'end', dx: -6, dy: -4 },
  { id: 'datong', name: '大同', lon: 113.3, lat: 40.08, anchor: 'end', dx: -6, dy: -4 },
  { id: 'shanxi', name: '偏关', lon: 111.55, lat: 39.4, anchor: 'end', dx: -6, dy: 8 },
  { id: 'yansui', name: '榆林', lon: 109.73, lat: 38.28, dx: 6, dy: 8 },
  { id: 'ningxia', name: '宁夏', lon: 106.27, lat: 38.47, dx: 5, dy: 7 },
  { id: 'guyuan', name: '固原', lon: 106.28, lat: 36.0, dx: 6, dy: 7 },
  { id: 'gansu', name: '甘州', lon: 100.45, lat: 38.93, anchor: 'end', dx: -6, dy: 2 },
]

/** 崇祯元年黄河仍夺淮入海，与今日河道不同 */
export const RIVERS: River[] = [
  {
    id: 'huanghe',
    name: '黄河',
    kind: 'yellow',
    points: [
      [103.8, 36.06],
      [105.4, 37.3],
      [106.5, 38.3],
      [106.9, 39.3],
      [107.4, 40.4],
      [108.8, 40.7],
      [110.4, 40.5],
      [111.2, 39.8],
      [110.7, 38.4],
      [110.5, 36.9],
      [110.4, 35.4],
      [110.3, 34.7],
      [111.5, 34.85],
      [112.7, 34.95],
      [114.1, 34.95],
      [115.3, 34.7],
      [116.4, 34.55],
      [117.3, 34.3],
      [118.2, 33.95],
      [119.0, 33.6],
      [119.9, 34.15],
    ],
  },
  {
    id: 'changjiang',
    name: '长江',
    kind: 'yangtze',
    points: [
      [100.2, 26.8],
      [101.6, 26.6],
      [102.6, 27.4],
      [103.6, 28.2],
      [104.6, 28.8],
      [105.5, 29.2],
      [106.5, 29.6],
      [107.5, 30.0],
      [108.4, 30.4],
      [109.5, 31.0],
      [110.4, 30.9],
      [111.3, 30.7],
      [112.2, 30.3],
      [113.3, 30.6],
      [114.3, 30.6],
      [115.2, 30.2],
      [116.0, 29.7],
      [117.0, 30.5],
      [118.0, 31.2],
      [118.8, 32.06],
      [119.5, 32.2],
      [120.3, 31.9],
      [121.2, 31.7],
      [121.9, 31.4],
    ],
  },
  {
    id: 'yunhe',
    name: '大运河',
    kind: 'canal',
    points: [
      [120.16, 30.27],
      [120.7, 30.75],
      [120.62, 31.3],
      [119.95, 31.8],
      [119.45, 32.2],
      [119.42, 32.4],
      [119.02, 33.5],
      [118.3, 33.95],
      [117.4, 34.7],
      [116.6, 35.4],
      [115.7, 36.85],
      [116.3, 37.45],
      [117.2, 39.13],
      [116.65, 39.9],
    ],
  },
]

/** 明长城：嘉峪关至山海关 */
export const WALL: LonLat[] = [
  [98.3, 39.8],
  [99.4, 39.5],
  [100.4, 39.1],
  [101.5, 38.6],
  [102.6, 38.3],
  [103.7, 38.0],
  [104.8, 37.95],
  [105.9, 38.15],
  [106.9, 38.45],
  [107.8, 38.05],
  [108.7, 38.2],
  [109.5, 38.6],
  [110.4, 39.1],
  [111.2, 39.75],
  [112.2, 40.15],
  [113.3, 40.25],
  [114.3, 40.45],
  [115.2, 40.75],
  [116.2, 40.6],
  [117.2, 40.35],
  [118.2, 40.25],
  [119.2, 40.15],
  [119.8, 40.05],
]

export const CHRONICLE: ChronicleEntry[] = [
  {
    id: 'chengcheng',
    date: '天启七年',
    title: '澄城民变',
    place: '陕西 · 澄城',
    text: '秦中连岁旱饥，澄城知县张斗耀仍严催钱粮。白水人王二率众入城，杀知县，聚饥民于山中。陕西流民之乱自此始，府谷王嘉胤、安塞高迎祥相继而起。',
    lon: 109.94,
    lat: 35.18,
    region: 'shaanxi',
    pin: true,
    pinOffset: [-10, -10],
  },
  {
    id: 'ningjin',
    date: '天启七年五月',
    title: '宁锦之战',
    place: '辽东 · 锦州',
    text: '皇太极率八旗攻锦州、宁远，赵率教、满桂、袁崇焕凭城拒守，以红夷大炮击退攻城之众。明军守住关宁锦一线，然关外仅余此走廊，朝鲜亦于是春被后金征服。',
    lon: 121.05,
    lat: 41.05,
    region: 'liaodong',
    pin: true,
    pinOffset: [14, -12],
  },
  {
    id: 'jisi',
    date: '天启七年八月',
    title: '信王入继大统',
    place: '京师',
    text: '熹宗崩于乾清宫，无嗣。遗诏以皇弟信王朱由检嗣位，时年十七。新君入宫之夜，持烛独行，不敢食宫中物；诏以明年为崇祯元年。',
    lon: 116.4,
    lat: 39.9,
    region: 'beizhili',
  },
  {
    id: 'tiancong',
    date: '天启七年',
    title: '皇太极改元天聪',
    place: '盛京',
    text: '努尔哈赤崩后，四贝勒皇太极继位，改元天聪。新汗初立，诸兄弟各拥重兵，而对外用兵不辍：东征朝鲜，西抚蒙古，南窥辽西。',
    lon: 123.43,
    lat: 41.8,
    region: 'houjin',
    pin: true,
    pinOffset: [12, -12],
  },
  {
    id: 'weizhongxian',
    date: '天启七年十一月',
    title: '魏忠贤伏法',
    place: '京师',
    text: '嘉兴贡生钱嘉征劾魏忠贤十大罪。帝命安置凤阳，行至阜城，忠贤自缢；客氏伏诛，崔呈秀自尽。阉党虽除，门户之见未消，朝臣复以党争相攻。',
    lon: 116.4,
    lat: 39.9,
    region: 'beizhili',
  },
  {
    id: 'chongzhen',
    date: '崇祯元年正月',
    title: '改元崇祯',
    place: '京师',
    text: '正月，改元崇祯，大赦天下。帝御平台，召见群臣，锐意求治；然太仓空虚，辽饷加派不已，九边欠饷动辄数百万。',
    lon: 116.4,
    lat: 39.9,
    region: 'beizhili',
  },
  {
    id: 'drought',
    date: '崇祯元年',
    title: '秦晋大旱',
    place: '陕西 · 府谷',
    text: '陕西、山西连岁不雨，延安、庆阳一带斗米千钱，饥民采蓬草、剥树皮以食。府谷王嘉胤聚众起事，与王二合流，官兵不能制。',
    lon: 111.07,
    lat: 39.03,
    region: 'shaanxi',
    pin: true,
    pinOffset: [12, 4],
  },
  {
    id: 'zhengzhilong',
    date: '崇祯元年',
    title: '郑芝龙受抚',
    place: '福建 · 泉州',
    text: '福建巡抚熊文灿招抚郑芝龙，授海防游击。郑氏以安平为巢，收编海上诸寨，商舶往来日本、吕宋；东南海防自此倚郑氏舟师。',
    lon: 118.6,
    lat: 24.9,
    region: 'fujian',
    pin: true,
    pinOffset: [16, 18],
  },
  {
    id: 'pingtai',
    date: '崇祯元年七月',
    title: '平台召对',
    place: '京师',
    text: '袁崇焕奉召入京，平台召对，自许“五年复辽”。帝赐尚方剑，许便宜行事；退朝后，给事中许誉卿问其凭据，崇焕答：“聊慰上意。”',
    lon: 116.4,
    lat: 39.9,
    region: 'beizhili',
  },
  {
    id: 'aomen',
    date: '崇祯元年',
    title: '西法铸炮',
    place: '广东 · 澳门',
    text: '徐光启奉召入京，与李之藻等议用西法造炮、练兵。澳门葡人炮师应募北来，携红夷炮与铸法，后入登莱炮局，孙元化倚之成军。',
    lon: 113.55,
    lat: 22.2,
    region: 'guangdong',
    pin: true,
    pinOffset: [-4, 14],
  },
  {
    id: 'shean',
    date: '崇祯元年',
    title: '奢安之乱未息',
    place: '贵州 · 贵阳',
    text: '天启元年，永宁宣抚奢崇明、水西安邦彦反，陷重庆、围成都、困贵阳。至崇祯初，官军合川、湖、贵之力渐次平定，然黔中疮痍，饷械久不能复。',
    lon: 106.63,
    lat: 26.65,
    region: 'guizhou',
    pin: true,
    pinOffset: [12, -8],
  },
]

export function findRegion(id: string): Region | null {
  return ALL_REGIONS.find((region) => region.id === id) ?? null
}
