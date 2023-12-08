<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold text-center mb-6">今日报告</h1>

    <div v-if="currentPage === 1">
      <FirstPage :words="words" :hotTopics="hotTopics" />
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

type KeywordWithWeight = [string, number];
interface WordsData {
  keywords: KeywordWithWeight[];
}

const words = ref<WordsData>({ keywords: [] }); 
interface Topic {
  name: string;
  value: number;
}

const hotTopics = ref<Topic[]>([]); 
const currentPage = ref(1);
const totalPages = 3; // 总页数

onMounted(() => {
  getWordData();
});

function updatePage(page: number) {
  currentPage.value = page;
}

const getHotTopics = () => {
  hotTopics.value = words.value.keywords
    .map((item: KeywordWithWeight) => ({ name: item[0], value: item[1] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
};

const getWordData = async () => {
  let { todayChat } = await chrome.storage.local.get('todayChat');
  //之前放入数据的时候修改了格式
  todayChat = todayChat.replace(/You:|ChatGPT:/g, '');

  if (!todayChat) {
    console.error('Error: Failed to retrieve todayChat from chrome.storage.local');
    return;
  }
  try {
    const response = await fetch('https://nwkazoq0sc.execute-api.ap-southeast-2.amazonaws.com/production/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: todayChat })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }

    words.value = await response.json();
    getHotTopics(); // 更新 hotTopics

  } catch (error) {
    console.error('Error: Failed to fetch word cloud data from the API', error);
  }
}

</script>
