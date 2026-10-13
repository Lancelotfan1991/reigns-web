/** 每年抉择次数；修改此值即可调整全年节奏，源码与测试均自动适配 */
export const CARDS_PER_YEAR = 5

const LAST_SCRIPT_YEAR = 16

/** 锁年剧本与史实卡的槽位总数；此后的第一张即甲申终章 */
export const SCRIPT_SLOTS = (LAST_SCRIPT_YEAR + 1) * CARDS_PER_YEAR

/** 槽位 → 年内第几议（1-based）；超出脚本范围返回 null */
export function turnOf(index: number): number | null {
  return index < SCRIPT_SLOTS ? (index % CARDS_PER_YEAR) + 1 : null
}

/** 槽位 → 年份编号（0 = 天启七年，N = 崇祯N年） */
export function yearOf(index: number): number {
  return Math.floor(index / CARDS_PER_YEAR)
}

/** 年份 + 年内序号 → 槽位 */
export function slotOfPosition(year: number, order: number): number {
  return year * CARDS_PER_YEAR + (order - 1)
}
