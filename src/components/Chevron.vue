<script setup lang="ts">
defineProps<{
  direction: 'left' | 'right'
}>()
</script>

<template>
  <svg class="chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      :d="direction === 'left' ? 'M14.5 5.5L8 12l6.5 6.5' : 'M9.5 5.5L16 12l-6.5 6.5'"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<style scoped>
.chevron {
  display: block;
  width: 24px;
  height: 24px;
}
</style>
