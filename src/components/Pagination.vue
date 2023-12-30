<template>
  <div class="flex justify-center space-x-2 my-4">
    <button
class="px-4 py-2 bg-blue-500 text-white rounded" :class="{ 'bg-gray-300': currentPage === 1 }"
      :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
      previous
    </button>
    <button
class="px-4 py-2 bg-blue-500 text-white rounded" :class="{ 'bg-gray-300': currentPage === totalPages }"
      :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
      next
    </button>
  </div>
</template>

<script setup lang="ts">

// 定义 Props
const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  }
});

// 定义 Emits
const emit = defineEmits(['update:currentPage']);

// 方法
const changePage = (page: number) => {
  emit('update:currentPage', page);
};
</script>
