import type { Choice, Effects, GameEvent, StoryChapter } from '../types'
import { SCRIPT_EVENTS } from './events'
import { REFORM_EVENTS } from './reforms'

// 原卡只作素材。所有复制、条件覆盖及排期都发生在新对象上。
const originals = new Map([...SCRIPT_EVENTS, ...REFORM_EVENTS].map(event => [event.id, event]))

function option(label: string, effects: Effects, response: string, sets?: string[]): Choice {
  return { label, effects, response, ...(sets ? { sets } : {}) }
}

function copyChoice(choice: Choice): Choice {
  return { ...choice, effects: { ...choice.effects }, ...(choice.sets ? { sets: [...choice.sets] } : {}) }
}

function source(id: string, requires: string[] = [], patch: Partial<GameEvent> = {}): GameEvent {
  const original = originals.get(id)
  if (!original) throw new Error(`缺少篇章素材：${id}`)
  const event = { ...original, requires: requires.length ? [...requires] : undefined, excludes: undefined, ...patch }
  return {
    ...event,
    left: copyChoice(event.left),
    right: copyChoice(event.right),
    requires: event.requires?.map(rule => typeof rule === 'string' ? rule : { ...rule }),
    excludes: event.excludes ? [...event.excludes] : undefined,
  }
}

function card(
  id: string,
  name: string,
  text: string,
  left: Choice,
  right: Choice,
  requires: string[] = [],
): GameEvent {
  return { id, name, avatar: '议', text, left, right, requires: requires.length ? requires : undefined }
}

function at(slot: number, event: GameEvent): GameEvent {
  return { ...event, year: Math.floor(slot / 5), order: slot % 5 + 1 }
}

function chapter(id: string, name: string, start: number, steps: GameEvent[][]): StoryChapter {
  return { id, name, start, steps: steps.map((candidates, index) => candidates.map(event => at(start + index, event))) }
}

// 同一步按数组顺序取首张可用卡；条件变体在前，最后一张永远无条件兜底。
// 同一原卡只归属一个步骤；新增的中间决定用旗标进入本章后续验收。
export const STORY_CHAPTERS: StoryChapter[] = [
  chapter('institute', '器院立局', 3, [
    [source('g-institute')],
    [
      source('g-budget', ['gewu-institute']),
      card('c-institute-budget-old', '旧作坊的欠款',
        '器院未能设立，旧作坊却交来一摞欠料单，催问验收过的军器何时付款。户部请先清偿旧账，好让供料人继续送货；内廷想把付款压到来年，留银应付急饷。两处都在等这笔钱。',
        option('核实旧单，先付欠款', { gold: -4, law: 2, people: 2 }, '供料人领到了旧欠，答应继续供货。旧坊得以修器，只是往后的开支仍要逐笔请款。'),
        option('缓付料款，留钱应急', { gold: 3, army: 2, people: -3 }, '眼前急饷留住了，供料人只肯接现钱活，旧坊交货也慢下来。')),
    ],
    [
      source('g-artisans', ['gewu-institute', 'gewu-budget']),
      card('c-institute-artisans-repairs', '工匠等不到长约',
        '器院的常年经费没有落实，民间熟手怕来了京城领不到工钱，不敢举家搬迁。一批军器却急等修理，工部请拿现银雇短工；营官主张照旧征发匠户轮流服役，省下钱先顾军营。',
        option('付现钱雇短工', { gold: -3, army: 2, people: 2 }, '工匠当面领钱，接下这批急修活计。活做完便各自回坊，下次再雇还得备好现银。'),
        option('按旧例征轮役', { gold: 2, army: 3, people: -4 }, '军器照交，匠户耽误自家生计，仍不肯把秘技和家眷交给官坊。')),
    ],
    [
      source('g-measure', ['gewu-institute', 'gewu-budget', 'gewu-artisans'], {
        text: '器院、公费和雇约已有着落，第一批修造却遇上难题：各坊尺秤不同，炮膛、车轴也各凭手感。徐光启请先制官样和试验簿，再让不同工师复做；赶着领军器的营官嫌这一步太慢。',
      }),
      card('c-institute-measure-samples', '先给急件留个样',
        '各坊的经费和人手尚未安排妥当，工部找不到能常年校验尺秤的人。营官催着领走车轴和炮具，工师却想留下几件合用的作样本；否则下次修配，还得各凭老师傅的手感。',
        option('留样件，少交一批军器', { gold: -2, army: -2, law: 2 }, '几件合用的车轴和炮具封存作样，工师日后修配有了参照；军营这次能领到的数目少了。'),
        option('全数交营，随坏随修', { gold: 2, army: 3, law: -2 }, '军营领齐了这批器物。旧坊没有留下样件，日后更换零件仍要请熟手照实物修配。')),
    ],
  ]),
  chapter('yuan', '袁崇焕之狱', 13, [
    [source('s-jisi', [], {
      text: '皇太极绕道入塞，兵锋逼近北京。袁崇焕率关宁军赶来勤王，请给营地和口粮。城里担心客兵扰民，城外将士却已连日奔走；先怎样安置这支援军？',
      left: option('划营给粮，准其休整', { gold: -6, army: 8, court: -4, people: 2 }, '关宁军领粮整队，随后在城外迎敌。京城官民仍担心客兵滋扰，要求营官严加约束。', ['jisi-muster']),
      right: option('不许入城，城外接战', { army: -6, court: 4, people: -2 }, '关宁军疲惫接战，怨城内不肯接济；守城官员又怕援军生乱，双方来往愈发紧张。', ['jisi-outside']),
    })],
    [
      source('s-jisi2', ['jisi-muster'], {
        text: '勤王军已经得到休整，城下交战仍让京师惊恐。流言说袁崇焕故意引敌来京，密报又指后金军在放反间消息。是先关押主将，还是保留其职、把调兵记录交法司查验？',
        left: option('收押候审，另派人接军', { court: 6, law: -6, army: -8 }, '袁崇焕入狱候审，新将仓促接军，部将心生疑惧。法司开始调取文书，核查通敌指控。', ['yuan-imprisoned', 'exec']),
        right: option('留职核查，不凭流言定罪', { court: -4, law: 4, army: 6, gold: -2 }, '袁崇焕继续领军，来往文书送交法司。要求拿人的奏疏仍不断送来，朝中争论更烈。', ['yuan-free']),
      }),
      card('c-yuan-rumour-outside', '城外援军也卷入流言',
        '关宁军在城外苦战，未得充分休整，京城仍有人把敌军到来归罪袁崇焕。要求拿人的奏疏与催粮的军报一同送到，是将他收押换将，还是补查军报、先把欠下的口粮发给将士？',
        option('收押换将，再查文书', { court: 6, law: -6, army: -8 }, '袁崇焕入狱候审，换将又耗数日。部将忙于交接，法司尚在核对各营进退的军报。', ['yuan-imprisoned', 'exec']),
        option('补粮留任，交法司核查', { gold: -4, court: -4, law: 4, army: 6 }, '城外将士得到补粮，袁崇焕继续领军。连日苦战的疲惫尚未缓过，营中仍有怨言。', ['yuan-free'])),
    ],
    [
      source('s-yuan-liaodong', ['yuan-free'], {
        text: '法司核查军报，未能证实袁崇焕通敌，他仍在辽东任事。如今他请修筑大凌河城，以屯田接济驻军；户部却说现有饷银难兼顾筑城与守边。是准他向前经营，还是把兵粮集中到宁远、锦州一线？',
      }),
      source('s-yuanshi', [], {
        text: '袁崇焕案到了最后裁决。先前收押造成的军心动摇尚未平息，法司却仍拿不出谋款引敌的实证。是迎合京城众议处死他，还是撤去无实证的罪名、让他回辽任事？',
      }),
    ],
  ]),
  chapter('wuqiao', '吴桥兵变', 23, [
    [source('s-wuqiao', [], {
      name: '吴桥传来起事军报',
      text: '孔有德部经过吴桥，因缺粮和地方冲突起事，已有军士结伙抢夺。登州尚未全失，孙元化急报：炮局、图册和工匠家眷都在乱军可能经过的路上。先封住要道，还是派使者探明各营诉求？',
      left: option('封住炮局要道，护送军报', { gold: -4, army: 2, people: -2 }, '守兵分赴路口，叛军行动受阻，附近百姓出入也受影响。炮局还来得及安排转移。', ['wuqiao-cordon']),
      right: option('先派使者，分辨各营诉求', { gold: -2, court: -2, people: 2 }, '使者带回缺粮与抢掠名单，乱军尚未尽散。道路未能及时控制，后续救人必须另找通路。', ['wuqiao-envoys']),
    })],
    [
      card('g-wuqiao-protect', '炮能再铸，工师不能丢',
        '登莱匠人已有雇约，孙元化能按名册找到工师和家眷。乱军逼近，他请先送人、图册和量具去守军营地。营官却急着运炮：车船只有这些，接上匠户，就得暂时留下部分成炮。',
        option('连家眷图册一起护送', { gold: -4, army: -2, people: 4 }, '工师与家人一同撤出，图册和量具也送到守营。留在原处的炮械仍面临被乱军夺走的危险。', ['wuqiao-protected', 'wuqiao-artisans-safe']),
        option('车船先运成炮', { gold: 2, army: 4, people: -4 }, '一批成炮先入守营，工师家眷只得各自避乱。图册散失，日后修炮铸炮都更依赖少数熟手。'),
        ['gewu-artisans']),
      card('c-wuqiao-protect-scattered', '散匠该往哪里逃',
        '没有稳定雇约和完整名册，孙元化一时点不齐散在民坊的工匠。城外渡口挤满逃难家口，是拨船不分身份先救人，还是仅接应已到营门的修炮熟手？',
        option('拨船接家口，张榜寻散匠', { gold: -4, army: -2, people: 4 }, '一批工匠与家人渡河脱险，官员继续张榜寻人。带出的图册零散，眼下只能筹办修器小坊。', ['wuqiao-artisans-safe']),
        option('只接营门熟手，少占运力', { gold: 2, army: 2, people: -4 }, '军营接入几名修炮熟手，运炮车船得以先走。渡口的工匠与家人仍挤在岸边，各寻出路。')),
    ],
    [
      card('g-wuqiao-rations', '补粮和审案分开办',
        '要道已有守兵，军士姓名与欠饷数目也能逐一核对。孙元化请先给愿归队者补粮，再查谁曾抢掠、谁在煽动；另有官员主张把赏银交给旧头领，借他们约束部众，尽快平息乱事。',
        option('逐人补粮，抢掠另案审', { gold: -4, court: -2, law: 2, army: 2, people: 2 }, '愿归队者得到口粮，抢掠案仍凭证查办。普通军士有了离开乱营的出路，头领更难裹挟部众。', ['wuqiao-disciplined']),
        option('一笔赏银交旧头领分发', { gold: -2, court: 2, army: 2, law: -4 }, '头领答应约束部众，朝廷却查不清赏银分给了谁。军士能否领到钱，仍取决于头领的亲疏。'),
        ['wuqiao-cordon', 'gewu-payroll']),
      card('c-wuqiao-rations-emergency', '乱营军士到哪里领粮',
        '官府尚难查清各营人数和道路情形，缺粮的军士与趁乱抢掠的人又混在一起。督抚请设临时给粮点，逐人登记查问；守城将领则想把粮先收入城内，免得城门失守。',
        option('设给粮点，逐人登记查问', { gold: -4, army: -2, people: 4 }, '一部分军士离开乱营来领粮，官员记下姓名和去向。各营旧册仍待核对，抢掠案件尚难查清。', ['wuqiao-rations-emergency']),
        option('粮先入守城营，收缩哨卡', { gold: 2, army: 2, people: -3 }, '守城军有粮可吃，外围哨兵撤回。城外军士找不到接济之处，离开乱营归队的人更少了。')),
    ],
    [
      source('g-wuqiao', ['gewu-artisans', 'gewu-payroll', 'gewu-review', 'wuqiao-protected', 'wuqiao-disciplined'], {
        name: '登莱炮局的去留',
        text: '工师家眷和图册已安置，补粮与查案分开办理，乱军的联系渐被切断。孙元化请拨款恢复炮局、修船整军，并逐项复查开支；户部担心钱粮难继，主张带工匠撤走，放弃当地厂坊。',
      }),
      card('c-wuqiao-artisans', '脱险匠户的生计',
        '一批工匠和家眷已经救出，炮局的图册、船料却有不少失落，原处也难以复工。孙元化呈上损失清单，请在异地拨料开一间小坊；户部另议发给路费，让匠户先回乡谋生。',
        option('拨料开小坊，续雇救出的工匠', { gold: -4, army: 2, people: 2 }, '小坊开工修器，工匠有了工钱，缺失的图册还得重绘。孙元化交出人员与损失清单，等候查问。', ['wuqiao-workshop-saved']),
        option('给路费返乡，暂不重开炮局', { gold: -2, army: -2, people: 3 }, '匠户领到路费，携家返乡。朝廷省下重开炮局的开支，军营修炮却少了一处可用的作坊。'),
        ['wuqiao-artisans-safe']),
      card('c-wuqiao-losses', '登莱的损失清单',
        '工师家口没能成批护出，营伍也未恢复秩序，叛军抢去部分炮械船只。孙元化因失守被问罪：是先接济逃散人员、查明责任再判，还是处死巡抚、撤并据点，把余粮留给后方？',
        option('接济逃散者，查损追责', { gold: -4, law: 2, people: 2, army: -2 }, '逃散者得到接济，炮械与船只的损失逐项登记。孙元化交接候审，法司将查明各处失守的责任。'),
        option('处死孙元化，撤并据点', { gold: 3, army: -4, people: -2 }, '孙元化以失守罪被处死，据点撤并后省下一段守费。叛军仍占有炮船，失散匠户也尚未寻回。')),
    ],
  ]),
  chapter('shipping', '海贸立约', 27, [
    [
      source('g-shipping', ['gewu-review']),
      card('c-shipping-charterless', '铁料等船出港',
        '货损争议该由谁查验，朝廷与船商还没议定，郑芝龙因此不肯签下长年承运的契约。军营催着要一批铁料，是付现钱按船试运、当面交货，还是多花脚价，改从陆路绕行？',
        option('现钱租一船，逐件点货', { gold: -3, army: 2, law: -2 }, '这一船铁料当面点清交割，船商领走运费。双方只议定这趟价钱，下批货还得重新谈。'),
        option('改走陆路，留足脚价', { gold: -5, army: -2, people: 2 }, '货物绕路送达，地方不必被临时摊派船只。长途运费的难题仍在。')),
    ],
    [
      source('g-customs', ['gewu-shipping']),
      card('c-shipping-customs-port', '旧关口还在收杂费',
        '公开分包的海运契约没立成，各港仍各收杂费。港官要留钱养巡船，商人只求同一批货别被重复征收。眼下先并一处关卡，还是让各港包干守海？',
        option('并掉重复关卡，官补巡费', { gold: -3, law: 2, people: 2, army: -2 }, '商船少过一道收费关卡，港官改向官库请领巡船费用。款项未到之前，出海巡查只得减少。'),
        option('准各港包干，先足巡船', { gold: 2, army: 3, people: -3 }, '各港留下所收银钱供养巡船，官库暂少支出。商船仍得逐港交费，常为一批货付上几次钱。')),
    ],
    [
      source('g-audit', ['gewu-customs', 'gewu-budget']),
      card('c-shipping-audit-receipts', '散落的收条怎么查',
        '一船铁料已经送到，商家却说尚有尾款未付，港口和军营手里的收条又对不上。户部想另请人验货查账；营官催着结清放行，怕船商扣住下一船军料。是先追查款项，还是先按实物付款？',
        option('封存收条，付费另请验货人', { gold: -3, law: 3, army: -2 }, '收条集中封存，另请的验货人开始核对重量与价钱。争议未清，船商暂缓发出下一船货。'),
        option('只验现货，先结这笔款', { gold: 2, army: 2, law: -3 }, '铁料验过便交军营使用，商家领款继续运货。收条中的价差暂且搁下，追索要等日后查账。')),
    ],
    [
      card('g-shipping-dispute', '风损账里的疑点',
        '有船商指控郑氏亲信虚报风损，港官又想把明年的航路全交熟人。公开税册与独立验货记录都在，是调账仲裁、让郑氏回避涉案航段，还是接受私下补货，换取按期交粮？',
        option('按账仲裁，争议航段重新招船', { gold: 2, court: -2, law: 3, army: -2 }, '查账后，风损与虚报分别定责，争议航段另招船商。郑氏其余承运照旧，这批货须等重新交接。', ['shipping-arbitrated']),
        option('接受补货，暂不另招船商', { gold: 4, army: 2, law: -3 }, '郑氏补足短货，军粮按期到港。港官仍沿用熟商，别家船主质疑虚报货损的人为何还能接单。'),
        ['gewu-shipping', 'gewu-customs', 'gewu-audit']),
      card('c-shipping-dispute-private', '短少的货该由谁赔',
        '一船货到港后短了数目，郑氏说港官漏记，港官说船上少装，验货凭据又不足以定责。小货主等着收回本钱，是由官库先行垫赔、再查旧单，还是扣住承运押金，等双方核清账目？',
        option('垫偿小货主，限期追查旧单', { gold: -4, people: 3, law: 1 }, '小货主领到垫款，可以偿债进货。官库先付了钱，须等查明责任后再向应当赔偿的一方追索。'),
        option('扣押金对单，暂停争议航次', { gold: 2, army: -3, people: -2, law: 2 }, '承运押金暂留官库，双方补交装卸凭据。争议航次停运，几船军料延误，小货主也还领不到赔款。')),
    ],
  ]),
  chapter('relief', '工赈与收编', 43, [
    [
      source('g-relief', ['gewu-budget', 'gewu-council']),
      card('c-relief-temporary-grain', '饥民已到城外',
        '饥民已到城外，地方官却还没议妥工赈的用人和开支，眼下组织不了常年工程。仓中余粮有限，是先开棚给老幼口粮，还是折价售粮、收回一部分钱，再为后来灾民留下些粮食？',
        option('开棚给口粮，先救老幼', { gold: -4, people: 4, army: -2 }, '老幼先在棚中领到口粮，仓粮消耗加快。能干活的人仍找不到长期活计，只得留在城外等候。'),
        option('折价售粮，保留部分仓底', { gold: 2, people: -3, court: 2 }, '官仓收回部分银钱，也留住一些余粮。身无分文的灾民仍买不起粮，只能四处求食。')),
    ],
    [
      source('g-taxroll', ['gewu-relief', 'gewu-measure']),
      card('c-relief-taxroll-disputes', '荒田争界先别催税',
        '返乡农人已在荒地上耕种，大户却拿旧契前来索地。县里暂时备不齐人手和丈量凭据，春耕又等不得。是登记实际耕种的农户、暂缓征税，还是收下大户代缴的钱，先照旧契给地？',
        option('登记耕户，缓税等候丈量', { gold: -3, court: -2, people: 3 }, '返乡农户得以先下种，争田暂不催税。大户仍拿旧契申诉，官府须另派人丈量田界。'),
        option('准大户代缴，暂按旧契给地', { gold: 4, law: 2, people: -4 }, '官库先收到了税钱，土地暂归旧契持有人。返乡农户若想继续耕种，还得向大户求租。')),
    ],
    [source('s-chuangjiang', [], {
      text: '高迎祥被官军擒获，旧部向各地溃散。兵部送来献俘案，请一并裁定是否给降众归籍期限。招抚名单中的李鸿基另涉早年的杀督队官案，法司要求继续查证；各地则催问，愿降者该如何接纳？',
      left: option('处决高迎祥，降众照捕令办', { gold: 4, court: 6, army: 4, people: -6 }, '高迎祥伏法，各地继续依捕令追缉，愿降者更怕入营。法司仍在追查李鸿基所涉旧案。', ['gao-executed']),
      right: option('收押高迎祥，限期接纳归籍', { gold: -4, court: -2, law: -2, army: 4, people: 4 }, '高迎祥收押候审，归降条件明示各营，普通降众与旧案当事人分开核查。', ['gao-amnesty']),
    })],
    [
      source('g-recruit', ['post-kept', 'gewu-payroll', 'gewu-relief', 'gewu-taxroll', 'gao-amnesty']),
      source('s-licheng-officer', ['post-kept'], {
        name: '驿站送来了求归名册',
        text: '驿站送来了李鸿基旧案的文书和降众求归名单。地方尚未备妥收编所需的钱粮与安置手续，法司也在追查旧案。是另设营地给愿归者临时口粮、等候查问，还是暂不收编，退回地方继续追查？',
        left: option('另设候审营，给临时口粮', { gold: -4, army: -2, people: 3, law: 2 }, '愿归者暂有营地和口粮，旧案继续查证。李鸿基的收编尚无定议，军职与长期饷银也未安排。'),
        right: option('不承诺收编，照案追查', { gold: 2, court: 3, people: -2, army: -2 }, '求归名册与旧案文书分别退回地方。官府继续寻找证人，愿归者因无明确接纳办法而迟疑。'),
      }),
      card('c-recruit-no-post', '名册断在半路',
        '驿路裁撤后，李鸿基与逃散降众的去向难以核实，旧案证人与求归名册迟迟不到。地方请雇脚夫沿路寻访，并接济流民；守将则想把钱粮留在现营，暂停远处的招募。',
        option('雇脚夫寻人，沿路给难民口粮', { gold: -4, people: 3, army: -2 }, '脚夫沿旧驿路继续寻访，流落途中的饥民得到口粮。李鸿基的去向仍待回报，收编暂未落实。'),
        option('守住现营，暂停远地招募', { gold: 3, army: 2, people: -3 }, '钱粮集中供给现营，守军少了远行招募的负担。散众仍流落各地，更难找到投营的门路。')),
    ],
  ]),
  chapter('workshop', '精密工坊攻关', 53, [
    [
      source('g-fuel', ['gewu-credit']),
      source('g-fuel', ['gewu-waterworks'], {
        id: 'c-fuel-waterworks', excludes: ['gewu-credit'],
        text: '多年水坊试验留下炉温与耗料记录，长期借款却没有谈成。工师请从水坊维修款中限拨一笔，把几种煤隔绝空气焙烧，比较所得焦料的脆裂与杂质；先用小炉试，并留钱赔偿烟水扰民的损失。',
      }),
      card('c-workshop-fuel-unfunded', '试炉还缺记录和本钱',
        '长期借款没有谈成，工师手中又缺连续试炉的记录，暂时拿不出可靠的焦料配方。木炭涨价，旧炉还要开工，是少接耗炭多的活、留钱发给工匠，还是高价买炭，先修军营急用的器物？',
        option('减少开炉，留足工钱与赔款', { gold: 2, army: -3, people: 2 }, '旧炉少量开工，省下的炭钱用来维持工钱和赔款。军营少收到一批器物，炼焦试验暂缓。'),
        option('购木炭赶急修，不开新炉', { gold: -4, army: 3, people: -2 }, '官库高价购炭，急用军器先得修理。附近用炭的人家更难买到便宜炭，工坊也仍受炭价牵制。')),
    ],
    [
      source('g-tools', ['gewu-fuel', 'gewu-measure'], {
        text: '多年试料、校尺之后，工师造出一架夹住工件的试镗床，先靠人力慢转，逐件量孔径、记刀具磨损。有水坊处还可试借水力。眼下只有少量试件，工师请留钱反复试做，营官却催着把材料拿去修炮。',
      }),
      card('c-workshop-tools-handfit', '刀具和孔径仍靠手配',
        '试镗床做出的零件大小不一，刀具耗损也不稳定，工师还在查材料和量规。军营催着要修件，是付工钱让熟手逐件修配，还是少接新单，把废件留下来查清缘由？',
        option('雇熟手慢修，先保可用件', { gold: -4, army: 3, people: 2 }, '熟手领钱逐件修配，军营得到一批能用的器物。每件尺寸仍需单独调整，修理离不开原来的师傅。'),
        option('减接急单，留下废件记录', { gold: 2, army: -3, law: 2 }, '工师留下废件，把材料、尺寸和刀痕逐一记下。查验有了凭据，军营却要更久才能领到修件。')),
    ],
    [
      card('g-tool-seals', '泄漏事故后的阀门规程',
        '试镗床做出的少量零件已有孔径记录，试筒接缝却在热水试验时泄漏，烫伤了工人。工师请先赔伤者，再逐件检查密封、加装泄压阀，定下停机规程；营官催着交货，不愿等整批返工。',
        option('先赔伤者，再查密封与泄压', { gold: -4, army: -2, law: 2, people: 2 }, '伤者领到抚恤，工师反复试验接缝与阀门，将停机条件写入操作簿，严禁关阀强行升压。', ['gewu-seals']),
        option('只换坏接头，先交合格旧件', { gold: 2, army: 2, law: -2 }, '合格旧件先送军营，新试筒只换了坏接头。工师仍拿不准何时该停机，蒸汽抽水试验只得缓办。'),
        ['gewu-tools', 'gewu-review']),
      card('c-workshop-seals-stop', '漏水试筒先停加热',
        '试筒接头漏水，有人仍催着加热试机。工师尚难查清是孔径不合还是用料有误，请先用冷水查漏，留住工人继续试验；营官则要拆下材料修补旧器，免得耽误交货。',
        option('冷水查漏，照付工钱并恤伤', { gold: -3, people: 3, army: -2 }, '试筒停止加热，工人照领工钱，伤者得到抚恤。冷水查漏的结果逐次留下，接头仍需重做。'),
        option('拆回修理料，停止加热试验', { gold: 2, army: 2, law: -2 }, '试筒拆下，材料转去修补旧器，军营先拿到可用修件。接缝漏水的原因未能继续追查。')),
    ],
    [
      source('g-pump', ['gewu-measure', 'gewu-waterworks', 'gewu-review', 'gewu-fuel', 'gewu-tools', 'gewu-seals'], {
        text: '多年水工与镗孔试验积累后，工师请在一处浅井试用抽水样机，借低压蒸汽冷凝后的压差提水，旁边仍备旧水车。耗煤和漏气都要逐次记下，超限便停；矿主担心试机费料，宁愿继续用水车。',
      }),
      card('c-workshop-pump-waterwheel', '矿井等不到合格新泵',
        '新泵的试验记录还不足以证明能安全排水，工师不肯把它送入矿井。浅井积水却在上涨，矿主急求处置：是添置旧水车，保住上层矿道，还是封掉低层，给矿工地面修器的活计和口粮？',
        option('添旧水车，限深排水', { gold: -4, army: 2, people: 2 }, '新添的旧式水车在浅处排水，上层矿道暂能开工。试泵留在地面，深处积水仍难排净。'),
        option('封低层，给转工口粮', { gold: -2, army: -2, people: 3 }, '低层矿道封闭，矿税和出料一同减少。矿工转到地面修器，暂领口粮，免于继续涉水下井。')),
    ],
    [
      source('g-schools', ['gewu-apprentices', 'gewu-manuals', 'gewu-exams'], {
        name: '地方工学班向京师要师傅',
        text: '多年来，工坊带出了一批学徒，工艺刊本与实学取士也积累了师资。地方请派人开班，教看图、量田、修器，并讲明试验中的失误；京师军营却急缺熟手，希望留下师傅，只向各地寄送刊本。',
        left: option('熟手集中京师，地方先用刊本', { gold: 4, court: 4, army: 2, people: -2 }, '师傅留京赶修军器，省下外派的开支。地方虽收到刊本，遇到难处仍无人示范，只能再请京师答疑。'),
      }),
      card('c-workshop-schools-visits', '巡回教修器，还是留京赶工',
        '地方请开工学班，师傅、教材和学徒却还未安排妥当。工部想先派熟手走几个县，当面示范量尺、修器；京师营官说急修活计已堆满作坊，请把人留在京中，只寄简明维修单过去。',
        option('付路费派师傅巡回示范', { gold: -3, people: 3, army: -2 }, '师傅到几县教基础修理，也讲明试验中遇到的难处。京师急修因此放慢，地方还得等下次来人。'),
        option('熟手留京，寄去简明维修单', { gold: 2, army: 3, people: -2 }, '熟手留京赶办急件，地方收到简明维修单。遇到图上看不明白的做法，县里仍只能寄信求教。')),
    ],
  ]),
  chapter('gucheng', '谷城安置', 60, [
    [source('s-xianzhong', [], {
      name: '谷城受抚者的口粮',
      text: '张献忠率部在谷城受抚，熊文灿报来领粮总数，却还缺每户去向。有人举报营中藏械，也有人诉说连种粮都拿不到。张献忠请照旧由头领分粮，地方官想逐户登记后直接发放，先准哪一项？',
      left: option('逐户登记，粮直接到人', { gold: -4, court: -2, law: 2, people: 3 }, '愿意登记的家庭先领到口粮，发放的数目逐户记下。冒领与藏械的举报另交官员查证。', ['gucheng-register']),
      right: option('仍交旧头领分粮，先稳营伍', { gold: 2, court: 2, army: 2, law: -3 }, '粮车按营交给旧头领，发放很快办完。官府手里只有总数，仍查不出哪些家庭没有领到粮。', ['gucheng-leaders']),
    })],
    [
      card('g-gucheng-households', '田地与藏械分别查问',
        '逐户粮册已经收来，清丈资料也能查田界。有人愿耕却无地，有人在空户名下藏兵械。熊文灿请分别查问地权、冒粮和藏械；张献忠愿出具全营担保，要求免去逐户查验。',
        option('逐户核对田地，藏械另案查', { gold: -3, army: -2, law: 2, people: 3 }, '官员逐户核对田地，另记兵械去向。愿耕者照领口粮，涉及藏械的人须各自接受查问。', ['gucheng-households']),
        option('让头领具结，先免逐户查验', { gold: 3, army: 2, law: -3 }, '各头领很快交来担保，省下查验钱和人手。冒用空户领粮的人仍难查出，兵械也留在原处。'),
        ['gucheng-register', 'gewu-taxroll']),
      card('c-gucheng-households-claims', '被漏下的家庭来告状',
        '谷城受抚者不断来告状，有人说口粮被冒领，有人说分得的田已有主人。熊文灿手中的册子还难核清，张献忠又要整营领粮。是另设申诉棚听各户陈情，还是先收缴营外兵械，田界留待后查？',
        option('开申诉棚，给愿登记者口粮', { gold: -3, people: 3, army: -2 }, '一些原先漏登的家庭领到口粮，申诉也有了去处。官员仍须核对旧册，查清田地和兵械归属。'),
        option('先查营外兵械，争田暂缓', { gold: 2, army: 2, people: -2, law: -2 }, '守兵先收缴营外兵械，公开持械的人少了。田界争议无人处理，准备耕种的家庭仍无着落。')),
    ],
    [
      source('g-gucheng', ['gewu-relief', 'gewu-taxroll', 'gucheng-households']),
      card('c-gucheng-settlement-incomplete', '降户想离营另谋生计',
        '谷城仍有人拿不到种粮，也有人听旧头领调动，田地与活计迟迟分配不妥。一批家庭请求离营谋生，地方官请续给临时口粮、分批护送；守将怕人员四散难查，主张缩小营区集中看管。',
        option('续临时粮，护送愿走的家庭', { gold: -4, people: 4, army: -2 }, '一批家庭领粮离营，由守兵分批护送。留下的人仍在争田求粮，旧头领也还掌握部分部众。'),
        option('收缩营区，集中守兵看管', { gold: 2, army: 2, people: -3, law: -2 }, '营区缩小，看管省下人手。普通降户也难以出营找活，田粮纠纷积着，营中怨声渐多。')),
    ],
  ]),
  chapter('jinzhou-supply', '锦州粮道', 63, [
    [
      source('g-command', ['gewu-payroll', 'gewu-audit', 'gewu-tenure']),
      card('c-command-provisional-orders', '这趟运粮由谁负责',
        '锦州方向又在催粮，各镇领兵、管钱粮的职责却还没分清。兵部请先把这趟护送的领兵人与领粮人分别写明，出了差错各自交代；主将嫌逐项交接太慢，愿一并包办，送到后再交粮单。',
        option('分列领兵领粮人，暂缓出营', { gold: -3, law: 2, army: -2 }, '领兵、领粮的职责各有署名，日后查问有了凭据。重新核对交接单耽误了时间，粮队晚些出营。'),
        option('主将包办，事后交粮单', { gold: 2, army: 3, law: -3 }, '粮队立即启程，主将仍兼管兵马与粮秣。朝廷只能等事后交单，途中耗损也由他自行报数。')),
    ],
    [
      source('g-guanning', ['gewu-payroll', 'gewu-command'], {
        name: '护粮与换防不能挤在一天',
        text: '领兵与查验军饷已有分工，锦州方向却要同时护粮、轮换守兵。吴三桂请领一段护送，兵部要求各镇按名册交接，分段留人守路；久戍的营兵急着撤换，若同日离防，粮车便无人护送。',
      }),
      card('c-guanning-escort-only', '欠饷未清，守军不愿交防',
        '吴三桂与各镇担心换防后旧欠无人认领，交接的名册与职责迟迟议不妥。粮队又等着出发，兵部请拿现粮招一小队先护送；也可暂缓换防，让原营继续守路，自行接运粮车。',
        option('付现粮雇护队，先通一段路', { gold: -4, army: 2, law: -2 }, '小队领到现粮，护送粮车走过一段险路。原营的欠饷与交防仍在争论，往后运粮还得另作安排。'),
        option('原营续守，暂缓换防', { gold: 2, army: -2, people: -2 }, '交接争端暂息，久戍军士不能休整，粮路仍靠各营临时接力。')),
    ],
    [
      source('g-jinzhou', ['gewu-depots', 'gewu-tools', 'gewu-denglai', 'gewu-command', 'gewu-guanning'], {
        text: '清军收紧锦州外围，祖大寿接连求援。粮站已交出存粮，登莱船队送来物料，工师也修好一批器具；各段守兵错开换防，路上仍有人接应。是继续分批送粮，还是趁道路尚通，先护送外围军民后撤？',
      }),
      card('c-jinzhou-supply-broken', '锦州收到的粮比发出时少',
        '锦州报来的收粮数少于后方发出的数目，沿途转运、修车与守路仍有耽搁。祖大寿催问下一批何时能到，外围伤兵和民户也求后撤。是再花钱组织小批转运，还是先腾出车船接人？',
        option('小批应急转运，损失如实记', { gold: -5, army: 2, people: 1 }, '一部分粮送入守军手中，沿途损耗另册登记。护路和修车仍常有耽误，下批粮何时到尚难保证。'),
        option('接出外围伤兵，缩短守线', { gold: 2, army: -3, people: 3 }, '车船接回一批伤兵与民户，外围守线缩短，供养压力稍减。锦州仍受围困，城中继续催粮。')),
    ],
  ]),
  chapter('epidemic', '大疫防治', 66, [
    [
      source('g-health', ['gewu-budget', 'gewu-relief'], {
        text: '崇祯十三年，山西等地传来病讯，邻县担心病势沿商路扩散。医者尚不明白病因，请每十日报送病人数目，将饮水与污水分开，并给隔离人家口粮；地方官怕一报病就要停市，军营也担心粮运受阻。',
      }),
      card('c-health-warning-local', '病讯来了，先别压下去',
        '外地已经报病，常年派医与接济病户的钱粮却还未安排妥当。医者请先去几处病村查看饮水、记下病人数目；县官担心人手分散后顾不过来，主张把药材集中到县城，等村里报信求助。',
        option('临时派医记病，送水送饭', { gold: -4, people: 3, army: -2 }, '几处病村得到医者照看，病户领到水和口粮。临时款只能支撑一段时日，后续供给还得另筹。'),
        option('集中药材，村里自报求助', { gold: 2, army: 2, people: -2 }, '县城药棚先备齐药材，也便于照看过境军士。远村须自行派人报信，不少病家仍等不到医者。')),
    ],
    [
      source('g-clinics', ['gewu-health', 'gewu-schools']),
      card('c-clinics-mobile-teams', '药棚的人手不够用',
        '各地请设医所，却凑不齐记病案、送水和维持道路的人手，现有药材也有限。医者愿带药巡回几个病村，县官则想扩大城内药棚，把急症接来集中照看；远村病家未必走得到县城。',
        option('巡回施治，沿途给清水口粮', { gold: -3, people: 3, army: -2 }, '巡回医者带着药、水和口粮到村，部分病家得到照看。他们离开后，新发的急症仍须等候。'),
        option('扩大县城药棚，限额接急症', { gold: 2, people: 1, army: 2 }, '县城腾出更多药棚，药材集中调配，接入一批急症。远处病家仍受路途阻隔，难以及时赶到。')),
    ],
    [
      source('g-epidemic', ['gewu-health', 'gewu-clinics', 'gewu-relief'], {
        text: '山西与邻近地区的疫报增多，北直隶也须防备。医者从病例册中查到几处往来密切的村市，请暂缓当地集市、接济隔离户。商人怕断了生计，军营怕误了供粮；医所虽能接诊，也未找到可靠的治法。',
      }),
      card('c-epidemic-triage', '病户与商路，两头都要粮',
        '报病的村镇越来越多，医者与口粮却难送到各处，官府也查不清漏报多少。地方请先接济已知病户、暂停附近集市；商人和营官怕运输断绝，请商路照行，只在沿途增设药棚。',
        option('先顾已知病户，暂停附近集市', { gold: -4, people: 3, army: -2 }, '已知病户领到口粮，少了外出求食的需要。附近集市暂歇，粮运放慢，偏远漏报处仍难照看。'),
        option('商路照行，沿途设药棚', { gold: -2, army: 2, people: -2 }, '商旅和军粮继续通行，药棚接诊沿途病人。人员往来未减，邻村仍担心病势顺路传来。')),
    ],
  ]),
  chapter('river', '开封河患', 69, [
    [
      source('g-maintenance', ['gewu-waterworks', 'gewu-audit', 'gewu-relief'], {
        text: '崇祯十三年，开封河臣请把堤闸、沟渠和水轮一起纳入逐季养护。已有水工记录、工赈队与独立验账，问题在于地方只爱报新工，不愿留清淤换轴的钱。来年水势难料，先怎样定维修预算？',
      }),
      card('c-river-maintenance-patches', '堤上缺口先补哪处',
        '开封几处旧堤已经松动，历年的修堤账、工料和人手却还未核清，河臣拿不准全年要花多少钱。眼前是先雇工补最险的堤脚、逐笔记下用料，还是派兵巡看，等旧账查清后再开工？',
        option('先雇工补险段，逐笔留收条', { gold: -4, people: 3, army: -2 }, '雇工领钱夯实了几段险堤，用料收条交回官府。其余河段还得逐处查看，往后维修钱仍要另筹。'),
        option('派兵巡堤，核料后再开工', { gold: 2, army: -3, law: 2 }, '守兵调来巡堤，官员继续核对旧料账。修补暂未开工，松动的堤脚只能先靠巡兵盯守。')),
    ],
    [
      card('g-river-survey', '低地居民该往哪里撤',
        '入崇祯十四年，维修记录和统一量尺已有依据。测量队发现几处低地遇泄洪便会淹田，河臣请公布水位警戒、接应船路和逐户补偿；地方官怕迁户赔田开支过大，只愿先交守堤图。',
        option('实测水位，登记撤离与补偿户', { gold: -3, court: -2, law: 2, people: 3 }, '低地各户领到撤离安排，知道何时走、到哪里等船。可能受淹的田地也登记下来，备作补偿依据。', ['river-surveyed']),
        option('只画守堤线，暂不谈泄洪补偿', { gold: 3, court: 2, people: -3 }, '守堤图先交上来，地方暂缓筹措迁户赔田的钱。低地居民仍不知涨水时往哪撤，也不愿先离田地。'),
        ['gewu-maintenance', 'gewu-measure']),
      card('c-river-survey-landmarks', '旧河图认不清撤离路',
        '开封河臣手中的旧图与眼前河道难以核对，养护和水位记录也不足以定下泄洪安排。船户愿带人沿河踏看退路，但要工钱；守城官想把这笔钱用于备料，让低地各村自行寻找高处。',
        option('雇船户踏路，临时插桩示警', { gold: -3, people: 3, army: -2 }, '船户带几个村认清了通往高处的路，沿途插桩示警。准确水位和可能淹到哪些田地仍须再查。'),
        option('物料先上城堤，各村自行避水', { gold: 2, army: 2, people: -3 }, '城堤备下更多木石，守城人手得以集中。低地各村只得自行找船寻路，接应先后无人协调。')),
    ],
    [
      source('g-kaifeng', ['gewu-relief', 'gewu-waterworks', 'gewu-maintenance', 'river-surveyed'], {
        name: '水位已到撤离警戒处',
        text: '崇祯十四年，开封堤外涨水，几个险段渗漏，水位已逼近预定的撤离界限。河臣请修补险段，并按名册先撤低地居民、赔付受损田地；守城官怕钱粮分散，要求先加固城堤，低地暂缓搬迁。',
        left: option('修险段，按册赔田并预先疏散', { gold: -4, court: 2, law: -2, army: -2, people: 5 }, '险段开始修补，低地居民按名册撤到接应处，领到口粮与赔款。守堤人仍逐日查看水位和渗漏。', ['gewu-river']),
        right: option('集中守城堤，暂缓低地撤离', { gold: 4, court: 2, army: 2, people: -3 }, '物料与人手先集中到城堤，迁户赔田的钱暂时省下。低地居民仍留原处，担心夜里来水无船可走。'),
      }),
      card('c-kaifeng-emergency-plan', '旧堤渗漏，村民等船',
        '开封旧堤渗漏，低地村民已来求船，官府却还没安排妥当撤离路线与接济。河臣请临时雇船先迁走最险处的人；守城官坚持把工料集中到城堤，城外乡村先各寻高地避水。',
        option('临时雇船，先迁最险几村', { gold: -4, people: 4, army: -2 }, '临时雇来的船接走最险处一批居民。远村的道路和人数还没查清，官府仍难安排接应。'),
        option('集中守城，村外就地避险', { gold: 3, army: 2, people: -4 }, '工匠与物料先用来加固城堤，城外接应只得搁下。低地村民扶老携幼自行避水，粮食难以带走。')),
    ],
  ]),
  chapter('songjin', '松锦军议', 72, [
    [source('s-jinzhou', [], {
      name: '松锦军前请定方略',
      text: '崇祯十四年，清军在锦州、松山方向加紧围逼，祖大寿催援，洪承畴奉命筹集援军。兵部要先定解围日期，催诸镇会师；前线请先查各营存粮能吃几日、后路如何接应，再定进兵方略。',
      left: option('先定解围期限，再查粮数', { gold: -4, court: 4, army: 2, law: -3 }, '各营奉限期集结，兵粮清单随后补交。将领忙着赶路，担心稍有延误就被追究逗留之罪。', ['songjin-deadline']),
      right: option('先核粮与退路，不先限日', { gold: -3, court: -3, law: 2, army: 2 }, '各营先报实存粮数和退路，洪承畴据此筹画接应。朝中催战的奏疏更多，指责前线迟迟不进。', ['songjin-stocktake']),
    })],
    [
      source('s-yuan-songjin', ['yuan-alive'], {
        text: '袁崇焕仍在辽东，参与松锦军议。他请留一支预备营，分段护送粮队，与洪承畴、城内祖大寿约定接应；主战将领担心围势愈久愈紧，要求集中诸镇兵马，立即向围军进攻。',
        left: option('集中诸镇，马上压向围军', { gold: -4, court: 4, army: 2, law: -3 }, '袁崇焕与诸营奉令前移，准备集中出击。后方留下的兵少了，护送粮队与接应退兵更加吃紧。', ['songjin-assault']),
        right: option('分段接济，给主将缓守余地', { gold: -4, court: -3, law: 2, army: 2 }, '预备营留在后方，各段分别安排接济。袁崇焕与洪承畴得以从容调度，城内仍催问援兵何时到达。', ['songjin-paced']),
      }),
      source('s-songjin', [], {
        name: '诸镇是急攻还是留后手',
        text: '洪承畴汇总各镇兵粮，祖大寿仍在锦州等待接应。军议有人请集中精锐一次解围，也有人请留预备营、分段接济。前者担心迟则围势更紧，后者怕精兵尽出，后方粮队无人护送、败退时无人接应。',
        left: option('集中精锐急攻，先求破围', { gold: -4, court: 4, army: 2, law: -3 }, '诸镇精锐向前集结，准备攻打围军。后方可用的兵力减少，运粮人要求增派护兵的文书接连送来。', ['songjin-assault']),
        right: option('留预备营，分段接济缓守', { gold: -4, court: -3, law: 2, army: 2 }, '洪承畴留下预备营，分段布置接应与粮运。祖大寿仍在城中待援，缓守也须不断补入钱粮。', ['songjin-paced']),
      }),
    ],
    [
      source('g-songjin', ['gewu-frontier', 'gewu-depots', 'songjin-stocktake', 'songjin-paced'], {
        text: '各营查过存粮，后方又留了预备兵，沿途粮站与护送队终于能按约接应。松锦围困未解，但守军尚有补给，外围也留有退路。是继续轮换驻军、分批运粮，还是趁道路可通，有序收缩外围防线？',
        left: { ...source('g-songjin').left, sets: ['gewu-songjin'] },
      }),
      card('c-songjin-withdrawal', '前营缺粮，伤兵难撤',
        '前进各营缺粮，围内也催不到足数，护粮与接应始终未能衔接。将领请求放弃部分外围据点，集中车船撤回援军和伤兵；主战官员不甘退兵，要求把余粮再押上去，抢救一处受困据点。',
        option('承认失地，掩护援军撤整', { gold: -3, court: -3, army: -3, people: 3 }, '外围据点放弃，部分援军与伤兵撤回整顿。城内仍受围困，退回的将领要交代丢失的阵地与军械。', ['songjin-retreated']),
        option('再投余粮救一处据点', { gold: -5, army: -5, court: 2, people: -2 }, '余粮用于突援，只接出部分守兵。各镇伤亡加重，军械散失，后方可再调动的钱粮更少了。', ['songjin-defeated'])),
    ],
  ]),
  chapter('peace', '公开议和', 75, [
    [
      source('g-peace', ['gewu-charter'], {
        text: '崇祯十五年，皇太极一方提出停战条件，仍索取岁币。陈新甲请按章程先查守备所需、划定付费上限，再授权使者商谈。主战诸臣反对让步，要求拨款、撤防逐项过审；陈新甲则请暂不外泄谈判细节。',
        left: option('照章授权，划定付费上限', { gold: 4, army: 2, court: -6, law: -2 }, '陈新甲奉准派使接触，岁币上限与守备开支先列明。急攻筹款暂缓，边营仍驻原防线，主战诸臣争议不休。', ['peace-talks']),
      }),
      source('s-mihe', [], {
        text: '皇太极一方愿谈停战，却要岁币与边界承诺。朝中尚无共同审议密旨的章程，陈新甲请你亲自担下议和授权。是先秘密接触、探明条件，还是明示拒谈，把钱粮继续用于现有防线？',
        left: option('承担密谈授权，暂不撤防', { gold: -2, army: 2, court: -4, law: -2 }, '陈新甲奉密旨派人接触，边营继续守防。议和由你授意，往来文书一旦传开，主战诸臣势必追问。', ['peace-talks']),
        right: option('拒绝密谈，筹足防费', { gold: -4, court: 4, army: 2 }, '拒谈之意传达清方，兵部照现有防线筹饷。主战诸臣稍安，户部却须继续负担驻军和运输开支。'),
      }),
    ],
    [
      source('g-peace-ratify', ['gewu-charter', 'peace-talks'], {
        text: '陈新甲呈来与皇太极一方议定的停战条款，岁币、边界和留守军费都已列明，等候朝廷核准。主战诸臣仍指责让步过多，要求说明是谁准许使臣开价；陈新甲请依原授权审议，免得两边都不认账。',
        left: option('承担授权责任，按章核准条约', { gold: 6, army: 4, court: -6, law: -2 }, '朝廷承担已授权的让步，使臣不背密旨之罪。条约生效，守备按批准数保留。', ['peace-kept']),
      }),
      source('s-mihe-leak', ['peace-talks'], {
        excludes: ['gewu-charter'],
        text: '陈新甲与皇太极一方谈得条款，往来文书却被误抄入邸报。主战朝臣指责擅议和款，追问谁曾授权。陈新甲所奉密旨出自你手，是承认授权、公布条款，还是将议和罪责推给他，下令处死？',
        left: option('承认密旨，保使臣并公布条款', { gold: 4, army: 3, court: -6, law: -3 }, '你承认授权，陈新甲得以保全，停战条款获准执行。主战诸臣仍不满密议让步，要求日后先交朝议。', ['peace-kept']),
      }),
      card('c-peace-withdraw-talks', '拒谈之后，使者如何安置',
        '朝廷未准议和，陈新甲手中只有往来试探的文书。边将问是否撤回等候消息的使者，户部也催定守备开支。是公开列明防费、撤使备战，还是留人联络，暂缓不急的军需采办？',
        option('撤回使者，公开列守备预算', { gold: -3, law: 2, court: -2, army: 2 }, '使者奉令撤回，边营所需的钱粮逐项列明。陈新甲按原命办事，未因谈判未开而获罪。'),
        option('留下联络人，暂缩非急军费', { gold: 2, court: 2, army: -3 }, '联络人留下等候消息，非急军需暂缓采办。清军与边营仍各自设防，联络往来尚未换来停战。')),
    ],
    [
      source('g-peace-dividend', ['gewu-charter', 'gewu-market', 'peace-kept', 'gewu-river'], {
        text: '崇祯十五年大汛，开封部分田地受淹，先前巡堤、撤离和口粮接应减轻了灾损。停战条约已经核准，民间商税也可查用；户部请留足守备后，拿节余帮助灾户复业，兵部则想趁机补充军器兵额。',
        right: option('留足守备，节余先用于复业', { gold: 6, court: 2, law: 2, army: -3, people: 4 }, '边营保留必要军费，节余转去补偿灾田、帮助复业。地方逐户登记支用，商税和库款也有了周转余地。', ['gewu-peace-dividend']),
      }),
      source('g-peace-dividend', ['gewu-charter', 'gewu-market', 'peace-kept'], {
        id: 'c-peace-dividend-flood', excludes: ['gewu-river'],
        text: '本年黄河大汛，开封低地多处受淹，撤离与赈粮接应不及，灾民急需船粮。停战省下部分支出，民间商税也有进项。户部请留足守备后拨款救灾复业，兵部却要求先补军器和兵额。',
        left: option('节余先补军费，赈济缩额', { gold: -4, court: 3, army: 4, people: -4 }, '边军多得一笔钱，军器与粮饷先获补充。赈济数额缩减，低地灾户仍等船粮，返乡复耕更迟。'),
        right: option('留足守备钱粮，其余救灾复业', { gold: 2, army: -3, law: 2, people: 3 }, '守备钱粮留足，其余节余用于雇船送粮、修复灾田。救灾花费很大，户部能留存的银钱有限。', ['gewu-peace-dividend']),
      }),
      card('c-peace-close-river', '人已撤出，灾田还待补偿',
        '本年开封大汛，先前巡堤、撤离和口粮接应减少了伤亡，受淹田地仍须补偿。户部尚无法确认能挪出多少守备节余，现有税入又有限。是另拨灾田补偿，还是分季支付，先留急用军费？',
        option('守备照实支，另拨灾田补偿', { gold: -4, people: 4, army: -2 }, '受淹农户领到补偿，得以购种修田。守备仍照实际需要支出，另拨赈款使官库周转更加吃紧。'),
        option('补偿分季付，先留急用军费', { gold: 2, army: 2, people: -2 }, '急用军费暂有着落，灾田补偿改为分季支付。农户等钱买种修田，有些人不得不先向乡里举债。'),
        ['gewu-river']),
      card('c-peace-close-deficit', '军费与赈粮都等拨款',
        '本年开封遭大汛，低地居民撤离不及，赈粮也未及时送到，灾情仍陆续报来。户部拿不出稳定余款，军营和灾区都在催钱。是裁减不急的采办、先雇船送粮，还是先足守备，赈款分批拨付？',
        option('裁非急采办，先救灾户', { gold: -4, people: 4, army: -3 }, '船粮先发往灾区，部分灾户得到接济。不急的军器采办延后，军营只能继续修用现有器物。'),
        option('先足守备，赈款分批拨付', { gold: 2, army: 2, people: -4 }, '守备钱粮先行拨足，军营能维持驻防。赈款分批送出，灾户等候更久，修屋复耕都被耽误。')),
    ],
  ]),
  chapter('chuanting', '孙传庭整军', 78, [
    [source('s-chuanti', [], {
      text: '崇祯十五年，孙传庭仍在狱中，朝臣请重查旧案，让他赴陕整军。关中募兵、军粮和农户复业都缺人统筹，地方官频繁催问主事者；反对者则坚持旧处分，主张继续由地方官暂管军务。',
      left: option('重新核案，释出赴陕整军', { gold: -6, army: 6, court: -2, law: 4, people: 2 }, '孙传庭获释领职，赴陕清点现兵与存粮。各县开始交报人数，他还须筹饷、整顿营伍，才能展开训练。', ['chuanting-released']),
      right: option('继续羁押，地方暂署军务', { gold: 2, army: -4, court: 3, law: -4 }, '孙传庭继续被羁押，地方官暂管关中军务。募兵与筹粮仍由各县分头办理，遇事层层请示。', ['exec']),
    })],
    [
      source('g-guanzhong', ['chuanting-released', 'lz-absorbed', 'gewu-settlement'], {
        name: '募兵与春耕争人手',
        text: '孙传庭到陕，李鸿基已受约束入军籍，按户安置也让不少流民有了去处。返乡农户却缺耕牛、欠旧税，强催募兵又会误农时。孙传庭请分别拨款供现役训练、助农户复业，地方官则催着先补税欠。',
        left: option('补牛缓旧欠，按册募兵给饷', { gold: -4, army: 2, court: -2, people: 4 }, '返乡农户得到耕牛接济，旧欠暂缓追催。愿入营者逐人领饷，孙传庭按到营人数编队训练。', ['gewu-guanzhong', 'guanzhong-recovery']),
      }),
      card('c-guanzhong-recruit', '新募秦兵不能靠空名册',
        '孙传庭已出狱到任，关中仍有流民四处找活，返乡农户又被催缴旧欠。他请少催农户、逐人点验募兵，备好实饷再收人；兵部要尽快补足秦兵，各县因而请求先按限额报送名册。',
        option('逐人点兵发饷，给农户留农时', { gold: -4, army: 2, people: 3, court: -2 }, '到营者逐一点验领饷，孙传庭据此编训。返乡户少受催逼，能赶上耕种，扩募人数也相应放缓。', ['guanzhong-recovery']),
        option('限时报满兵额，旧欠照催', { gold: 3, court: 2, army: -3, people: -3 }, '册上兵额很快齐了，到营人数与粮饷却对不上，孙传庭仍得逐营核验。'),
        ['chuanting-released']),
      card('c-guanzhong-without-general', '孙传庭在狱，地方催兵催粮',
        '孙传庭没有获释，关中军务由地方官暂管。县里同时催募兵和旧欠，农户眼看要误播种，现营也缺口粮。是先拨粮给驻军、缓催农户，还是先收旧欠充实官库，把募兵延后？',
        option('先给现营实粮，暂缓农户旧欠', { gold: -4, army: 2, people: 3 }, '现营领到口粮，农户少一轮催缴，得以赶种。地方官继续维持驻军，孙传庭仍被羁押。'),
        option('先收旧欠，暂停扩募', { gold: 4, army: -2, people: -3 }, '官库收进一笔旧欠，农户手里的种粮钱更少。地方暂缓扩募，只能靠现有守军应付各处防务。')),
    ],
    [
      source('s-chuanti-ready', ['chuanting-released', 'peace-kept', 'guanzhong-recovery'], {
        text: '跨入崇祯十六年，孙传庭送来到营兵册与农户复业安排，停战也使部分军费得以转用。秦兵尚在训练，朝中却催他限日出师。孙传庭请继续留营操练，每年核查粮饷与成效，免得新兵仓促上阵。',
        right: option('留守训练，按粮饷逐年考成', { army: 6, gold: -4, court: -4, law: 4, people: 3 }, '秦兵留营操练，粮饷按期供应。孙传庭得以逐步练成骨干，也须逐年呈报训练成效和开支。', ['chuanting-wait']),
      }),
      card('c-chuanting-short-pay', '孙传庭为现兵催粮',
        '孙传庭已在关中，筹得的钱粮却不足以支撑大举出师，新募人数也还未核清。他请先缩小募额，守住要地、查清现饷；朝中催战者要求照已报兵额出发，欠缺的钱粮沿途再筹。',
        option('缩募额守要地，核清现饷', { gold: -3, court: -3, army: 2, people: 2 }, '孙传庭把钱粮集中到现营，留住一部分骨干，暂守要地。扩募与长期训练仍受经费限制。'),
        option('按报额催出，缺饷路上筹', { gold: 2, court: 3, army: -5, people: -3 }, '出师令催各营上路，点到的兵却少于名册。军士缺饷，沿途地方又被催粮，操练也被打断。'),
        ['chuanting-released']),
      card('c-chuanting-still-imprisoned', '临时官署的兵册对不上粮单',
        '孙传庭仍未获释，临时官署报来的守军缺额表却与领饷名册不符。兵部请另派人点兵查粮，地方则想按眼前能用的守军安排防务，少花查验费用。是追查虚额，还是先确认缺额、照现营守备？',
        option('退回虚报，派员查实兵粮', { gold: -3, court: -2, law: 3, army: 1 }, '查验官重新点兵核粮，临时官署须说明多报的饷额。可用守军逐步查明，孙传庭仍未获释。'),
        option('承认缺额，按现营安排守防', { gold: 2, army: -2, law: 1 }, '兵部按实际缺额缩减守备安排，省下查验费用。现营仍由地方官指挥，扩编新军暂时搁置。')),
    ],
  ]),
  chapter('succession', '新政查验与储君承诺', 81, [
    [
      source('s-htj', ['peace-kept'], {
        name: '皇太极病亡，旧约如何续行',
        text: '崇祯十六年，皇太极病亡。清廷议立年幼的福临，由多尔衮、济尔哈朗辅政。先前签下的停战条约尚在，新主是否照旧履行，边将急等答复。是派使带旧约前往确认，还是趁权力交接试探边堡？',
        left: option('确认旧约，守备不因丧讯撤空', { gold: -3, army: 2, court: -2, law: 2 }, '使者带去旧约副本，清廷确认照旧履行。边营继续留兵守备，使节与商旅得以按原约往来。', ['peace-renewed']),
        right: option('试探边堡，暂缓续约确认', { gold: -3, army: 3, court: 4, law: -3 }, '边堡交锋增多，清廷要求解释出兵用意。新主尚未正式确认旧约，边将只得加紧戒备。', ['peace-border-probe']),
      }),
      card('c-htj-no-treaty', '清廷易主，先守还是试探',
        '崇祯十六年，皇太极病亡，清廷议立年幼的福临，多尔衮与济尔哈朗辅政。双方此前未定停战条约，边地仍各自戒备。有将领请先稳住关口、查探新令，也有人想趁清廷交接出兵试探。',
        option('守边核军情，不趁丧讯轻进', { gold: -3, army: 2, law: 2, court: -2 }, '各营照旧守关，斥候查探清廷新令和调兵动向。边将暂不轻进，粮饷仍按原有守备拨给。'),
        option('拨粮试探边堡，防其增援', { gold: -4, army: 3, court: 3, law: -2 }, '小队领粮出关试探，清廷也向边堡增兵。各营戒备加紧，后方须预留更多接应的钱粮。')),
    ],
    [
      source('g-inspection', ['gewu-audit', 'gewu-charter', 'gewu-peace-dividend', 'peace-renewed', 'gewu-songjin']),
      card('c-inspection-open-ledger', '新政账册之外，还有欠粮欠薪',
        '地方呈来新政功绩册，民间却仍有赈粮短发、工钱拖欠的申诉，官册还不足以说明实情。核查官请抽查几个普通县，直接问领粮者和工匠；地方官嫌往来耗费，请先核现有官册，暂缓下县。',
        option('抽查普通县，公布拖欠与短发', { gold: -3, court: -2, law: 2, people: 3 }, '查验官问到领粮者与工匠，追补部分短粮欠薪。尚未查清的县列出待办清单，地方须继续交代。'),
        option('只核官册，推迟实地查访', { gold: 3, court: 3, people: -2 }, '地方少了一轮接待，核查只在官册间进行。账上数目容易对齐，未入账的欠粮欠薪仍难发现。')),
    ],
    [
      source('g-capital', ['gewu-charter', 'gewu-inspection', 'gewu-depots', 'gewu-settlement'], {
        name: '一笔急调赈粮，也要两京留账',
        text: '核查已查到普通县，内廷忽请凭中旨调走备用赈粮，改账先留北京，日后再补南京副本。辅臣请照应急条款共同签署、限期复查，将公账、图册和粮册同步分存两京；内廷嫌手续拖慢军中急用。',
        left: option('准这次中旨，副本以后再补', { gold: 4, court: 5, law: -4, army: 2 }, '粮食先调作急用，内廷办事快了。南京仍存旧数，复核官要查这批粮的去向，只能再向北京追索改账。'),
        right: option('按应急条款复核，两京同步留本', { gold: -3, court: -3, law: 3, army: -2, people: 2 }, '辅臣共同签署，定下复查期限，两京各存同样的账粮图册。调拨稍慢，赈粮改拨多少、由谁接手都可追查。', ['south-prep', 'charter-copies']),
      }),
      card('c-capital-partial-backup', '调粮之前，先留一份账',
        '内廷请凭中旨调粮，辅臣却查不齐各处钱粮和安置记录，两京也难及时核对。是只准限额应急，抄出已有账册送南京备查，还是把钱粮与原册都留在北京，先满足眼前军需？',
        option('限额救急，抄现有底册南送', { gold: -3, court: -2, law: 2, people: 2 }, '急调粮数受到限制，现有账册另抄一份送南京。两京有了部分可核对的凭据，其余缺账还须追补。', ['south-prep']),
        option('钱粮账册留京，先足眼前急用', { gold: 3, court: 3, army: 2, law: -2 }, '钱粮和原册集中京师，内廷调拨更快。南京难以核实最新收支，遇到疑账只能往返请查。')),
    ],
    [
      source('g-succession', ['gewu-inspection', 'gewu-charter', 'charter-copies'], {
        name: '储君承诺，继位后也守章程',
        text: '新政查验和两京副本已办，太子朱慈烺开始学习钱粮与政务。辅臣请把查账、任期、议事、救济及应急限权列入常年讲习，并让储君承诺日后继位也照章办理；东宫官属则想给未来君主留下临机裁断的余地。',
      }),
      card('c-succession-unfinished', '把未做完的事也教给东宫',
        '东宫准备政务讲习，太子朱慈烺将读到各地新政账册，其中仍有未查清的欠款与工程。辅臣请连这些难题一起讲明，保存原册供查问；东宫官属怕议论牵涉太多人，只想先讲已办妥的事。',
        option('进展欠账一起讲，保留原册', { gold: -2, court: -2, law: 2, people: 2 }, '储君读到已办政务，也看见欠款与未完工程。原册留下供讲习查问，尚未议定的规矩仍须朝臣续议。'),
        option('先讲已办项目，未决事暂封存', { gold: 2, court: 3, law: -2 }, '东宫先讲办妥的政务，争议账册封存。官员免了当面解释旧欠，储君也少了追问钱粮去向的机会。')),
    ],
  ]),
]

// 独立长期改革缺前提时允许引擎用随机卡补位；八个 R 槽不写入本表。
const standalone: [number, GameEvent[]][] = [
  [0, [source('s-tuogu')]],
  [1, [source('s-dianjianglu')]],
  [2, [source('s-wei')]],
  [7, [source('s-ych-huajian')]],
  [8, [source('s-hanzai')]],
  [9, [source('g-seeds', ['gewu-institute'])]],
  [10, [source('s-yizhan', [], {
    right: option('裁官俸保驿站', { gold: 4, court: 2, law: -4, people: 6, army: -2 }, '官俸削薄，部分驿路和驿卒生计得保。饥荒仍会逼人流亡，但朝廷留下了传信、核籍和招抚的通路。', ['post-kept']),
  })]],
  [11, [source('g-payroll', ['gewu-budget', 'gewu-measure'])]],
  [16, [source('g-waterworks', ['gewu-measure', 'gewu-seeds'])]],
  [17, [source('g-review', ['gewu-waterworks'])]],
  [22, [source('s-suncheng')]],
  [31, [source('g-apprentices', ['gewu-artisans', 'gewu-audit'])]],
  [32, [source('s-dadian')]],
  [33, [source('g-manuals', ['gewu-apprentices', 'gewu-measure'])]],
  [34, [source('g-exams', ['gewu-manuals'])]],
  [35, [source('g-tenure', ['gewu-exams'])]],
  [36, [source('g-council', ['gewu-budget', 'gewu-audit', 'gewu-tenure'])]],
  [37, [source('g-revenue', ['gewu-customs', 'gewu-audit']), source('s-yingdi')]],
  [39, [source('g-charter', ['gewu-budget', 'gewu-audit', 'gewu-tenure', 'gewu-council'])]],
  [42, [source('g-market', ['gewu-shipping', 'gewu-customs', 'gewu-audit', 'gewu-apprentices', 'gewu-manuals', 'gewu-charter', 'shipping-arbitrated'], {
    name: '民坊不只给军营做东西',
    text: '学徒已能凭契约受雇，基础图册也送进民坊。作坊依靠人力和水力生产，海商愿承接布匹、农具与船具外销；军营却想包下熟手与材料。地方请照公开税约保留民用订单，让百姓有活做，官府有税收。',
  })]],
  [47, [source('s-daiching')]],
  [48, [source('s-fuwang')]],
  [49, [
    source('s-chaoxian', ['gewu-denglai'], {
      text: '皇太极称帝后，清方准备进攻朝鲜。登莱此前保住的船队与工师可供接应，但远航仍要另备粮饷。朝廷是派船牵制、接难民，还是先留运力守住自己的海路？',
    }),
    card('c-chaoxian-limited-fleet', '登莱船少，朝鲜仍来求援',
      '清方准备进攻朝鲜，明廷接到求援，登莱却凑不出足够的船只、人手和军器。兵部请租民船送一批粮药，尽力接应；沿海守将担心近海失去运力，要求把现有船只留给本地防务。',
      option('租船送粮药，量力接应', { gold: -5, army: -2, people: 3, court: 2 }, '租来的民船载粮药出海，送出少量接济。本地运力因而减少，远援所需的护航与后续粮饷仍难筹足。'),
      option('留船守近海，说明无力远援', { gold: 3, army: 2, court: -3 }, '现有船只留在近海，守军保住运输接应。朝鲜使者带着无力远援的答复离去，求援未获满足。')),
  ]],
  [50, [source('g-grain-tax', ['gewu-taxroll', 'gewu-budget'])]],
  [51, [source('g-credit', ['gewu-grain-tax', 'gewu-customs', 'gewu-audit', 'gewu-charter'])]],
  [52, [source('s-liangyu', [], {
    name: '围剿方略与左良玉的军粮',
    text: '各地流营仍多，兵部提出分区围剿、增饷练兵，左良玉又要求楚军就地筹粮。两道奏疏争的是同一笔钱：户部请连地方能负担多少一起核算，前线却催准主将先向民间取粮，战后再报开支。',
    left: option('核实兵粮，再定分区进退', { gold: -4, court: -2, law: 3, people: 3, army: 2 }, '左良玉须交出实际兵粮数目，朝廷据此安排分区进退。军费由官库筹拨，地方少受临时征取。'),
    right: option('准就地筹粮，战后再追报', { gold: 4, army: 3, law: -4, people: -5 }, '国库暂缓支出，楚军直接向地方征粮。农户负担加重，征了多少、送到哪营，朝廷只能等事后追问。'),
  })]],
  [58, [source('s-annei', [], {
    text: '杨嗣昌主张先平内地兵患，再顾边防，要求加征钱粮、扩兵围剿。各地流营与饥民尚多，安置也要花钱，边将又不断催饷。是准他加征扩剿，还是限制扩兵，把财力留给边防与现有安置？',
  })]],
  [59, [source('g-depots', ['gewu-payroll', 'gewu-audit', 'gewu-grain-tax', 'gewu-relief'], {
    left: option('加固大仓，集中看守', { gold: 6, law: 2, army: 2, people: -2 }, '粮食集中进大仓，看守省人，耗损也少。各处守军和赈户却更依赖同一条运粮路，一旦受阻便难接济。'),
  })]],
]

export const STANDALONE_EVENTS: GameEvent[] = standalone.flatMap(([slot, candidates]) => candidates.map(event => at(slot, event)))

/** 人物事件元数据只取实际排程候选，不混入随机卡、弃用旧剧本或甲申终章。 */
export const STORY_EVENTS: GameEvent[] = [
  ...STORY_CHAPTERS.flatMap(item => item.steps.flat()),
  ...STANDALONE_EVENTS,
].sort((a, b) => (a.year ?? 0) * 5 + (a.order ?? 1) - ((b.year ?? 0) * 5 + (b.order ?? 1)))
