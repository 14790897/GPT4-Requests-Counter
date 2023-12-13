<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold text-center mb-6">Today Report</h1>

    <div v-if="currentPage === 1">
      <FirstPage :hotTopics="hotTopics" :todayParagraph="todayParagraph" />
    </div>

    <!-- <div v-if="currentPage === 2">
      <SecondPage />
    </div> -->

    <div v-if="currentPage === 2">
      <WordCloud :response="words"/>
    </div>

    <Pagination :currentPage="currentPage" :totalPages="totalPages" @update:currentPage="updatePage" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

type KeywordWithWeight = [string, number];
interface WordsData {
  keywords: KeywordWithWeight[];
  paragraph: string
}

const words = ref<WordsData>({ keywords: [], paragraph: '' }); 
interface Topic {
  name: string;
  value: number;
}

const hotTopics = ref<Topic[]>([]); 
const todayParagraph = ref<string>('');
const currentPage = ref(1);
const totalPages = 2; // 总页数

onMounted(() => {
  getWordData();
});

function updatePage(page: number) {
  currentPage.value = page;
}

const getHotTopics = () => {
  hotTopics.value = words.value.keywords//keywords是键名
    .map((item: KeywordWithWeight) => ({ name: item[0], value: item[1] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
};

const getTodayParagraph = () => {
  todayParagraph.value = words.value.paragraph
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
    getTodayParagraph(); // 更新 todayParagraph
  } catch (error) {
    console.error('Error: Failed to fetch word cloud data from the API', error);
  }
}

</script>
