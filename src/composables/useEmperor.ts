import { reactive, readonly } from 'vue'
import { EMPEROR_INITIAL } from '../data/emperor'
import type { EmperorResourceKey } from '../data/emperor'

/**
 * 君主资源状态。
 *
 * 目前只给面板展示；后续卡牌效果、改革解锁和结局判定应统一从这里读写。
 */
const resources = reactive<Record<EmperorResourceKey, number>>({ ...EMPEROR_INITIAL })

export function useEmperor() {
  return {
    resources: readonly(resources),
  }
}
