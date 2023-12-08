<template>
  <div class="page-content">
    <h2 class="text-xl font-semibold mb-4">今日概览</h2>
    <div class="stats-grid">
      <div class="stat">
        <h3 class="stat-title">活跃度</h3>
        <p class="stat-value">{{ todayAllCount }} 次互动</p>
      </div>
      <div class="stat">
        <h3 class="stat-title">热门话题</h3>
        <ul class="list-disc list-inside">
          <li v-for="(topic, index) in hotTopics" :key="index">
            {{ topic.name }}
          </li>
        </ul>
      </div>
      <!-- <div class="stat">
        <h3 class="stat-title">用户反馈</h3>
        <p class="stat-value">85% 正面评价</p>
      </div> -->
      <div class="stat">
        <h3 class="stat-title">高光互动</h3>
        <p class="stat-text">{{ todayParagraph }}</p>
      </div>
      <div class="stat">
        <h3 class="stat-title">今日首次对话时间</h3>
        <p class="stat-value">{{ todayFirstChatTime }} </p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
interface Topic {
  name: string;
  value: number;
}
const todayAllCount = ref(0);
const todayFirstChatTime = ref('sorry, no data');

// 定义 Props
const props = defineProps({
  // words: {
  //   type: Array,
  //   default: () => { }
  // },
  hotTopics: {
    type: Array as PropType<Topic[]>,
    default: () => []
  },
  todayParagraph: {
    type: String,
    default: ''
  }
});

chrome.storage.local.get('todayAllCount', (result) => {
  todayAllCount.value = result.todayAllCount || 0;
});
chrome.storage.local.get('todayFirstChatTime', (result) => {
  todayFirstChatTime.value = result.todayFirstChatTime || 'sorry, no data';
});
</script>

<style>
.page-content {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.stat-title {
  font-size: 18px;
  margin-bottom: 10px;
  color: #333;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #4caf50;
}

.stat-text {
  font-size: 16px;
  color: #555;
}

.list-disc {
  padding-left: 20px;
}
</style>
