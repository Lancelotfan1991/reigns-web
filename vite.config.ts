import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    // 人像不内联：单张虽只有几 KB，但塞进 JS 主包会让每次改代码都得重下一遍全部画像
    assetsInlineLimit: (url) => (url.includes('/portraits/') ? false : undefined),
  },
})
