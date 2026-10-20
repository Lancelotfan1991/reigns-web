import { readonly, ref } from 'vue'

/**
 * 极简 hash 路由。
 *
 * 本项目只有「游戏」与「皇舆图」两页，引入 vue-router 反而要为一次跳转多背一个依赖；
 * 静态托管（Cloudflare Pages）下 hash 路由也不需要服务端 rewrite。
 */

const DEFAULT_PATH = '/'

function readPath(): string {
  if (typeof window === 'undefined') return DEFAULT_PATH
  const raw = window.location.hash.replace(/^#/, '').split('?')[0]
  if (!raw || raw === DEFAULT_PATH) return DEFAULT_PATH
  const path = raw.replace(/\/+$/, '')
  return path.startsWith('/') ? path : `/${path}`
}

const path = ref(readPath())

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    path.value = readPath()
    window.scrollTo(0, 0)
  })
}

/** 当前路由路径，如 `/`、`/map` */
export function useRoute() {
  return readonly(path)
}

/** 切换路由；`#/map` 可直接分享、刷新后仍停留原页 */
export function navigate(to: string) {
  if (typeof window === 'undefined') return
  const next = (to.startsWith('/') ? to : `/${to}`).replace(/\/+$/, '') || DEFAULT_PATH
  if (readPath() === next) return
  window.location.hash = next
}
