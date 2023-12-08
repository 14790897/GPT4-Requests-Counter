<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold text-center mb-6">今日报告</h1>

    <div v-if="currentPage === 1">
      <FirstPage />
    </div>

    <div v-if="currentPage === 2">
      <SecondPage />
    </div>

    <div v-if="currentPage === 3">
      <WordCloud />
    </div>

    <Pagination :currentPage="currentPage" :totalPages="totalPages" @update:currentPage="updatePage" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Pagination from '../components/Pagination.vue';
import FirstPage from "../components/FirstPage.vue";
import SecondPage from "../components/SecondPage.vue";
import WordCloud from "../components/WordCloud.vue";

const currentPage = ref(1);
const totalPages = 3; // 总页数

function updatePage(page: number) {
  currentPage.value = page;
}
</script>
