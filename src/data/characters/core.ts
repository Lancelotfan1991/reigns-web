/**
 * 核心人物速查表。
 *
 * 这里只放 id 与一句“为什么值得先看”，人物本体仍留在各自的分类文件里，
 * 避免为了“核心”再复制一份完整人物数据。
 */
export interface CoreCharacterRef {
  id: string
  why: string
}

export const CORE_ROSTER: CoreCharacterRef[] = [
  { id: 'emperor', why: '玩家本人。所有抉择最后都落到他身上。' },
  { id: 'wei', why: '天启末到崇祯初的内廷权力中心，开局第一道坎。' },
  { id: 'licheng', why: '从驿卒到闯王，最终攻破北京。' },
  { id: 'zhangxianzhong', why: '流寇另一主线，谷城受抚与再反是关键分叉。' },
  { id: 'sunchengzong', why: '关宁防线的老臣，己巳、大凌河都绕不开他。' },
  { id: 'yuanchonghuan', why: '宁锦、己巳、平台召对与袁崇焕之狱。' },
  { id: 'luxiangsheng', why: '明末主战派的代表，巨鹿之战是武将命运的缩影。' },
  { id: 'yangsichang', why: '十面张网、剿饷与杨嗣昌督师。' },
  { id: 'sunchuanting', why: '秦兵最后的战略机动力量，潼关之战决定关中。' },
  { id: 'hongchou', why: '松锦之战的主帅，降清后成为清初重臣。' },
  { id: 'xuguangqi', why: '历局、火器、农政，明末少数真正懂技术的大臣。' },
  { id: 'wentiren', why: '崇祯朝首辅，党争与猜忌政治的代表。' },
  { id: 'huangtaiji', why: '后金到清的关键君主，松锦与入塞的对手。' },
  { id: 'duoerhun', why: '1644年入关的决策者，甲申之变的外部变量。' },
  { id: 'wusanggui', why: '山海关的向背，直接改变明清鼎革的走向。' },
  { id: 'shikefa', why: '南明士大夫殉节的代表，扬州是最后的道德底线。' },
  { id: 'niyuanlu', why: '北京陷落时殉节的户部尚书，士大夫气节的样本。' },
  { id: 'libanghua', why: '左都御史，曾请太子南迁；北京陷落时自缢。' },
]
