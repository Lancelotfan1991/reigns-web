<script setup lang="ts">
const emit = defineEmits<{ (e: 'enter'): void }>()
</script>

<template>
  <div class="awakening" @click="emit('enter')">
    <div class="narrative">
      <p>一切都结束了吗……</p>
      <p>漫长的黑暗。</p>
      <p>
        你睁开眼，眼前是似曾相识的场景。雕花床、旧木案、窗纸上压着沉沉的天光——房间里的装饰如此熟悉，连空气里的沉香味都像在哪里闻过。
      </p>
      <p>你低头，身上穿的并非明黄龙袍，而是一袭沉青色的藩王常服，腰间玉带微凉。</p>
      <p>就在你困惑时，门外忽然响起急促的敲门声……</p>
    </div>
    <button class="enter" aria-label="推门" @click.stop="emit('enter')">推门</button>
  </div>
</template>

<style scoped>
.awakening {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 34px;
  padding: 32px 24px calc(32px + env(safe-area-inset-bottom));
  background:
    var(--grain),
    radial-gradient(ellipse at 50% 42%, rgba(255, 252, 242, 0.95), rgba(237, 224, 200, 0.88) 58%, rgba(213, 191, 155, 0.62) 100%);
  cursor: pointer;
}

.narrative {
  width: min(620px, 100%);
}

.narrative p {
  font-family: var(--font-kai);
  font-size: clamp(16px, 2.1vw, 20px);
  line-height: 2.15;
  letter-spacing: 0.04em;
  text-align: justify;
  color: var(--ink);
  opacity: 0;
  animation: line-in 0.9s ease forwards;
}

.narrative p:nth-child(1) {
  animation-delay: 0.1s;
}

.narrative p:nth-child(2) {
  animation-delay: 0.55s;
}

.narrative p:nth-child(3) {
  animation-delay: 1.05s;
}

.narrative p:nth-child(4) {
  animation-delay: 1.65s;
}

.narrative p:nth-child(5) {
  animation-delay: 2.25s;
}

.narrative p + p {
  margin-top: 10px;
}

.enter {
  padding: 7px 24px;
  font-family: var(--font-kai);
  font-size: 13px;
  letter-spacing: 5px;
  text-indent: 5px;
  color: var(--cinnabar);
  background: rgba(255, 253, 248, 0.5);
  border: 1px solid rgba(168, 50, 42, 0.55);
  border-radius: 3px;
  cursor: pointer;
}

.enter:hover,
.enter:focus-visible {
  color: var(--paper-hi);
  background: var(--cinnabar);
  outline: none;
}

@keyframes line-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 560px) {
  .awakening {
    justify-content: flex-start;
    gap: 28px;
    padding: 60px 20px 28px;
  }

  .narrative p {
    font-size: 16px;
    line-height: 2.05;
  }

  .narrative p + p {
    margin-top: 12px;
  }

  .enter {
    margin-top: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .narrative p {
    opacity: 1;
    animation: none;
  }
}
</style>
