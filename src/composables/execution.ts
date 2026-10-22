import { CHAR_MAP } from '../data/characters'
import type {
  Choice,
  Effects,
  ExecutionCheck,
  ExecutionKind,
  ExecutionPreview,
  ExecutionResult,
  ExecutionTier,
  Flag,
  ResourceKey,
} from '../types'

/** 2d6 加修正后，达到此值即完全办成；每级阻力把门槛抬高 1 */
export const FULL_TARGET_BASE = 6
/** 达到此值即部分办成，否则失败 */
export const PARTIAL_TARGET_BASE = 4

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** 资源每偏离中位 25 点，修正一档，最多 ±2 */
function resourceMod(value: number): number {
  return clamp(Math.round((value - 50) / 25), -2, 2)
}

/** 承办官才具每偏离中位 20 点，修正一档，最多 ±2 */
function executorMod(check: ExecutionCheck): number {
  if (!check.executor) return 0
  const char = CHAR_MAP[check.executor]
  if (!char) return 0
  const key = check.kind === '军令' ? 'military' : check.kind === '加征' ? 'economy' : 'politics'
  return clamp(Math.round((char.attributes[key] - 50) / 20), -2, 2)
}

/** 政令类型对应的额外局势修正：加征看百姓承受力，赈济看国库，军令看军心 */
function kindMod(kind: ExecutionKind, resources: Record<ResourceKey, number>): number {
  if (kind === '加征') return resourceMod(resources.people)
  if (kind === '赈济') return resourceMod(resources.gold)
  if (kind === '军令') return resourceMod(resources.army)
  return 0
}

export function executionModifier(check: ExecutionCheck, resources: Record<ResourceKey, number>): number {
  return resourceMod(resources.court) + resourceMod(resources.law) + kindMod(check.kind, resources) + executorMod(check)
}

/** 2d6 顺利办成的概率（0-100），掷前展示给玩家 */
export function executionChance(check: ExecutionCheck, resources: Record<ResourceKey, number>): number {
  const modifier = executionModifier(check, resources)
  const target = FULL_TARGET_BASE + check.difficulty
  let hits = 0
  for (let a = 1; a <= 6; a++) {
    for (let b = 1; b <= 6; b++) {
      if (a + b + modifier >= target) hits++
    }
  }
  return Math.round((hits / 36) * 100)
}

export function previewExecution(check: ExecutionCheck, resources: Record<ResourceKey, number>): ExecutionPreview {
  return {
    kind: check.kind,
    obstacle: check.obstacle,
    difficulty: check.difficulty,
    chance: executionChance(check, resources),
  }
}

export interface ExecutionResolution {
  result: ExecutionResult
  effects: Effects
  extraSets: Flag[]
}

/** 掷 2d6 并结算：只决定政令能办到什么程度，不改变抉择本意 */
export function resolveExecution(
  check: ExecutionCheck,
  choice: Choice,
  resources: Record<ResourceKey, number>,
): ExecutionResolution {
  const modifier = executionModifier(check, resources)
  const dice: [number, number] = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]
  const diceTotal = dice[0] + dice[1]
  const total = diceTotal + modifier
  const tier: ExecutionTier =
    total >= FULL_TARGET_BASE + check.difficulty
      ? 'success'
      : total >= PARTIAL_TARGET_BASE + check.difficulty
        ? 'partial'
        : 'fail'
  const outcome = check[tier]
  return {
    result: {
      kind: check.kind,
      obstacle: check.obstacle,
      difficulty: check.difficulty,
      dice,
      diceTotal,
      modifier,
      total,
      tier,
      label: outcome.label,
      report: outcome.report,
      chance: executionChance(check, resources),
    },
    effects: outcome.effects ?? choice.effects,
    extraSets: outcome.sets ?? [],
  }
}
