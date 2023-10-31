<template>
  <div id="app" class="p-4 bg-gray-100 ">
    <p class="text-lg bg-white p-4 rounded shadow mb-2">
      Count: <span class="font-semibold">{{ count }}</span>
    </p>
    <p class="text-lg bg-white p-4 rounded shadow mb-2">
      Today All Counts: <span class="font-semibold">{{ todayAllCount }}</span>
    </p>
    <p v-if="timeRemaining > 0" class="text-lg bg-white p-4 rounded shadow mb-2">
      Time Remaining: <span class="font-semibold">{{ formattedTime }}</span>
    </p>
    <div class="flex justify-center items-center">
    <button class="p-2 bg-white rounded shadow" @click="openChart">history chart</button>
    <button class="p-2 bg-white rounded shadow" @click="generateWordcloud">today wordcloud</button>
    </div>
      <!-- 条件渲染 WordCloud 组件 -->
      <WordCloud v-if="showWordCloud" />
  </div>
</template>

<script setup lang="ts">
const count = ref(0);
const todayAllCount = ref(0);
const timeRemaining = ref(0);
let timer: number;
const showWordCloud = ref(false);  // 定义一个新的响应式属性


// 在组件挂载后设置 Chrome 运行时消息监听器
onMounted(() => {
  chrome.storage.local.get('count', (result) => {
    count.value = result.count || 0;
  });

  chrome.storage.local.get('todayAllCount', (result) => {
    todayAllCount.value = result.todayAllCount || 0;
  });

  chrome.runtime.sendMessage({ request: 'getTimeRemaining' }, (response) => {
    timeRemaining.value = response.timeRemaining;
  });

  // 设置一个定时器来每秒更新 timeRemaining， 通过向service worker发送信息获取
  timer = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--;
    } else {
      clearInterval(timer);  // 如果时间到了，清除定时器
    }
  }, 1000);
});

// 在组件卸载时清除定时器
onUnmounted(() => {
  clearInterval(timer);
});

// 打开图表页面
const openChart = () => {
  chrome.runtime.openOptionsPage()
};

//使用echarts生成词云
const generateWordcloud = async() => {
  showWordCloud.value = true;  // 点击按钮时显示 WordCloud 组件
}

const formattedTime = computed(() => {
  const hours = Math.floor(timeRemaining.value / 3600);
  const minutes = Math.floor((timeRemaining.value % 3600) / 60);
  const seconds = timeRemaining.value % 60;
  return `${hours} hours ${minutes} minutes ${seconds} seconds`;
})
</script>
