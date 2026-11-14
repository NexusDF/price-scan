<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  grade: 'a' | 'b' | 'c' | 'd' | 'e'
}>()

const grades = [
  { id: 'a', color: '#038141' },
  { id: 'b', color: '#85bb2f' },
  { id: 'c', color: '#fecb02' },
  { id: 'd', color: '#ee8100' },
  { id: 'e', color: '#e63e11' },
] as const

const active = computed(() => grades.find((item) => item.id === props.grade) ?? grades[0])

const markLeft = computed(() => {
  const index = grades.findIndex((item) => item.id === props.grade)
  return `calc(${index} * 20% + 10% - 24px)`
})
</script>

<template>
  <div class="nutri">
    <div class="nutri-bar">
      <span
        v-for="item in grades"
        :key="item.id"
        class="nutri-band"
        :style="{ background: item.color }"
      />
    </div>
    <span class="nutri-mark" :style="{ background: active.color, left: markLeft }">
      {{ active.id.toUpperCase() }}
    </span>
  </div>
</template>

<style scoped>
.nutri {
  position: relative;
  width: 120px;
  height: 52px;
  flex: 0 0 auto;
}

.nutri-bar {
  position: absolute;
  top: 10px;
  right: 0;
  left: 0;
  display: flex;
  height: 32px;
  overflow: hidden;
  border-radius: 8px;
}

.nutri-band {
  flex: 1;
}

.nutri-mark {
  position: absolute;
  top: 0;
  display: grid;
  width: 48px;
  height: 52px;
  place-items: center;
  border-radius: 12px;
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1;
}
</style>
