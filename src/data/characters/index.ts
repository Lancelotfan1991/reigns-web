import { Camp, CharStatus, RelationType } from '../../types'
import type { Character, CharacterAttributeKey } from '../../types'
import { INNER_CHARACTERS } from './inner'
import { CIVIL_CHARACTERS } from './civil'
import { LIAODONG_CHARACTERS } from './liaodong'
import { QING_CHARACTERS } from './qing'
import { REBEL_CHARACTERS } from './rebel'
import { OTHER_CHARACTERS } from './other'
import { MILITARY_CHARACTERS } from './military'

export const CHARACTERS: Character[] = [
  ...INNER_CHARACTERS,
  ...CIVIL_CHARACTERS,
  ...LIAODONG_CHARACTERS,
  ...QING_CHARACTERS,
  ...REBEL_CHARACTERS,
  ...OTHER_CHARACTERS,
  ...MILITARY_CHARACTERS,
]

export const CHAR_MAP: Record<string, Character> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c])
)

/** 按人物正名索引：关系等以中文引用人物时由此解析 */
export const CHAR_BY_NAME: Record<string, Character> = Object.fromEntries(
  CHARACTERS.map((c) => [c.name, c])
)

export const STATUS_META: Record<CharStatus, { label: string; color: string }> = {
  [CharStatus.Hidden]: { label: '尚未登场', color: '#a3937b' },
  [CharStatus.Alive]: { label: '生', color: '#4b7a5c' },
  [CharStatus.Ill]: { label: '病', color: '#ab8430' },
  [CharStatus.Dead]: { label: '死', color: '#7b4b3a' },
}

export const RELATION_META: Record<RelationType, { label: string; inverse: string; color: string }> = {
  [RelationType.Enemy]: { label: '敌对', inverse: '敌对', color: '#a8322a' },
  [RelationType.Friend]: { label: '友善', inverse: '友善', color: '#4b7a5c' },
  [RelationType.Neutral]: { label: '中立', inverse: '中立', color: '#7a6a55' },
  [RelationType.Loyal]: { label: '效忠于', inverse: '得其死力', color: '#3a5f83' },
  [RelationType.Kin]: { label: '宗亲', inverse: '宗亲', color: '#ab8430' },
  [RelationType.Rival]: { label: '政争', inverse: '政争', color: '#9a6b1f' },
  [RelationType.Suspicion]: { label: '猜忌', inverse: '见疑于上', color: '#6b4f86' },
}

/** 五维才具的题头；顺序即卡面与详情的行序 */
export const ATTRIBUTE_META: { key: CharacterAttributeKey; label: string; hint: string }[] = [
  { key: 'military', label: '军事', hint: '统兵、练兵、攻守' },
  { key: 'strategy', label: '谋略', hint: '战略、用间、机变' },
  { key: 'politics', label: '政治', hint: '用人、行政、朝堂' },
  { key: 'economy', label: '经济', hint: '钱粮、理财、农工' },
  { key: 'culture', label: '文教', hint: '学问、著述、西学' },
]

export const CAMP_ORDER: Camp[] = [
  Camp.InnerCourt,
  Camp.Civil,
  Camp.Liaodong,
  Camp.Maritime,
  Camp.Rebels,
  Camp.Qing,
  Camp.Steppe,
  Camp.ImperialClan,
  Camp.Western,
  Camp.Southwest,
  Camp.Border,
]
