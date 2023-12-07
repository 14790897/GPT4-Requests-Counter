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
      <!-- <button class="p-2 bg-white rounded shadow" @click="generateWordcloud2">today wordcloud2
    </button> -->
    </div>
    <div class="flex justify-center items-center mt-4">
      <button class="p-2 bg-white rounded shadow mr-2" @click="exportHTML">Export as HTML</button>
      <button class="p-2 bg-white rounded shadow" @click="exportMarkdown">Export as Markdown</button>
    </div>
    <!-- 生成今日报告 -->
    <div>
      <h2 class="text-lg bg-white p-4 rounded shadow mb-2 mt-4 justify-center items-center" @click="genTodayReport">Today Report</h2>
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
const generateWordcloud = async () => {
  showWordCloud.value = true;  // 点击按钮时显示 WordCloud 组件
}

const formattedTime = computed(() => {
  const hours = Math.floor(timeRemaining.value / 3600);
  const minutes = Math.floor((timeRemaining.value % 3600) / 60);
  const seconds = timeRemaining.value % 60;
  return `${hours} hours ${minutes} minutes ${seconds} seconds`;
})

const exportMarkdown = async () => {
  let { todayChat } = await chrome.storage.local.get('todayChat')
  console.log('todayChat', todayChat)
  if (!todayChat) {
    todayChat = 'sorry, no chat';
    console.log('todayChat导出失败：', todayChat)
    return;
  }
  // 创建一个 Blob 对象，其内容为 todayChat 字符串，类型为 text/markdown
  const blob = new Blob([todayChat], { type: 'text/markdown' });
  download(blob)
}
const exportHTML = async () => {
  let { todayChat } = await chrome.storage.local.get('todayChat')
  if (!todayChat) {
    todayChat = 'sorry, no chat';
    console.log('todayChat导出失败：', todayChat)
    return;
  }
  // 创建一个 Blob 对象，其内容为 todayChat 字符串，类型为 text/html
  const blob = new Blob([todayChat], { type: 'text/html' });

  download(blob)
}

const genTodayReport = async () => {
  let { todayChat } = await chrome.storage.local.get('todayChat')
  if (!todayChat) {
    todayChat = 'sorry, no chat';
    console.log('todayChat导出失败：', todayChat)
    return;
  }
  // 请求后端生成今日报告https://report.liuweiqing.top/
  const res = await fetch('https://report.liuweiqing.top/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ todayChat })
  })
}

const download = async (blob) => {
  // 创建一个用于下载的 URL
  const downloadUrl = window.URL.createObjectURL(blob);

  // 创建一个临时的 a 元素用于触发下载
  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  const date = new Date().toString();
  downloadLink.download = `chat-${date}.md`; // 设置下载的文件名

  // 将链接添加到 DOM 中（不可见），触发点击事件，然后移除
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  // 清理创建的 URL
  window.URL.revokeObjectURL(downloadUrl);
}

const generateWordcloud2 = async () => {
  const url = chrome.runtime.getURL('./wordcloud.html');
  console.log('URL:', url);
  chrome.tabs.create({ url: url }, (tab) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    } else {
      console.log('Tab created:', tab);
    }
  });
}
</script>
