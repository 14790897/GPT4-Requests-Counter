<template>
  <div id="app" class="p-4 bg-gray-100 ">
    <h1 class="text-4xl font-bold mb-4">{{ message }}</h1>
    <p class="text-lg bg-white p-4 rounded shadow mb-2">
      Count: <span class="font-semibold">{{ count }}</span>
    </p>
    <p v-if="timeRemaining > 0" class="text-lg bg-white p-4 rounded shadow">
      Time Remaining: <span class="font-semibold">{{ formattedTime }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">

const message = 'GPT4-Requests-Counter';
const count = ref(0);
const timeRemaining = ref(0);
let timer; 

// 在组件挂载后设置 Chrome 运行时消息监听器
onMounted(() => {
  chrome.storage.local.get('count', (result) => {
    count.value = result.count || 0;
  });

  chrome.runtime.sendMessage({ request: 'getTimeRemaining' }, (response) => {
    timeRemaining.value = response.timeRemaining;
  });

  // 设置一个定时器来每秒更新 timeRemaining
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

const formattedTime = computed(() => {
  const hours = Math.floor(timeRemaining.value / 3600);
  const minutes = Math.floor((timeRemaining.value % 3600) / 60);
  const seconds = timeRemaining.value % 60;
  return `${hours} hours ${minutes} minutes ${seconds} seconds`;
})
</script>
