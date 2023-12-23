<template>
  <div id="app" class="p-4 bg-gray-100 ">
    <div class="max-w-xl mx-auto">
      <p class="text-lg text-gray-700 bg-white p-4 rounded-lg shadow mb-4">
        Count: <span class="font-semibold text-blue-600">{{ count }}</span>
      </p>
      <p class="text-lg text-gray-700 bg-white p-4 rounded-lg shadow mb-4">
        Today All Counts: <span class="font-semibold text-blue-600">{{ todayAllCount }}</span>
      </p>
      <!-- <p v-if="timeRemaining > 0" class="text-lg text-gray-700 bg-white p-4 rounded-lg shadow mb-4">
        Time Remaining: <span class="font-semibold text-blue-600">{{ formattedTime }}</span>
      </p> -->
      <div class="flex justify-center space-x-4 mb-4">
        <button
          class="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow hover:bg-blue-600 transition duration-300"
          @click="openChart">History Chart</button>
        <button
          class="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow hover:bg-green-600 transition duration-300"
          @click="generateWordcloud">Today Wordcloud</button>
      </div>

      <div class="flex justify-center mb-4">
        <label class="flex items-center space-x-3">
          <input type="checkbox" v-model="applyNewStyle">
          <span>{{ label }}</span>
        </label>
      </div>
      <div class="flex justify-center space-x-4">
        <!-- <button
            class="px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg shadow hover:bg-purple-600 transition duration-300"
            @click="exportHTML">Export as HTML</button> -->
        <button
          class="px-4 py-2 bg-pink-500 text-white font-semibold rounded-lg shadow hover:bg-pink-600 transition duration-300"
          @click="exportMarkdown">Export as Markdown</button>
      </div>
      <!-- 生成今日报告 -->
      <h2
        class="text-lg text-center text-gray-700 bg-white p-4 rounded-lg shadow mt-6 cursor-pointer hover:bg-gray-200 transition duration-300"
        @click="genTodayReport">Today Report</h2>
      <!-- 条件渲染 WordCloud 组件 -->
      <!-- <WordCloud v-if="showWordCloud" /> -->
    </div>
  </div>
</template>

<script setup lang="ts">
const count = ref(0);
const todayAllCount = ref(0);
// const timeRemaining = ref(0);
let timer: number;
const applyNewStyle = ref(true);
const label = ref("Apply New Style");

// 在组件挂载后设置 Chrome 运行时消息监听器
onMounted(() => {
  chrome.storage.sync.get('count', (result) => {
    count.value = result.count || 0;
  });

  chrome.storage.sync.get('todayAllCount', (result) => {
    todayAllCount.value = result.todayAllCount || 0;
  });

  chrome.storage.sync.get('interfaceStyle', (result) => {
    if (result.interfaceStyle) {
      applyNewStyle.value = result.interfaceStyle == 'precise';
    }
  });
  // chrome.runtime.sendMessage({ request: 'getTimeRemaining' }, (response) => {
  //   timeRemaining.value = response.timeRemaining;
  // });

  // 设置一个定时器来每秒更新 timeRemaining， 通过向service worker发送信息获取
  //   timer = setInterval(() => {
  //     if (timeRemaining.value > 0) {
  //       timeRemaining.value--;
  //     } else {
  //       clearInterval(timer);  // 如果时间到了，清除定时器
  //     }
  //   }, 1000);
});

//watch监听interfaceStyle的变化
watch(applyNewStyle, (newVal) => {
  if (newVal) {
    label.value = "Please refresh the page to apply new styles.";
    chrome.storage.sync.set({ interfaceStyle: 'precise' });
    chrome.runtime.sendMessage({
      interfaceStyle: 'precise'
    }, (response) => {
      console.log('response', response)
    });
    console.log('applyNewStyle', newVal)
  } else {
    label.value = "Apply New Style";
    chrome.storage.sync.set({ interfaceStyle: 'normal' });
    chrome.runtime.sendMessage({
      interfaceStyle: 'simple'
    }, (response) => {
      console.log('response', response)
    });
    console.log('applyNewStyle', newVal)
  }
});

// 在组件卸载时清除定时器
onUnmounted(() => {
  clearInterval(timer);
});

// 打开图表页面
const openChart = () => {
  // chrome.runtime.openOptionsPage()
  chrome.tabs.create({ url: chrome.runtime.getURL('src/options/index.html') });
};

//使用echarts生成词云
const generateWordcloud = async () => {
  // showWordCloud.value = true;  // 点击按钮时显示 WordCloud 组件
  chrome.tabs.create({ url: chrome.runtime.getURL('src/options/index.html') + '#/wordcloud' });
}

// const formattedTime = computed(() => {
//   const hours = Math.floor(timeRemaining.value / 3600);
//   const minutes = Math.floor((timeRemaining.value % 3600) / 60);
//   const seconds = timeRemaining.value % 60;
//   return `${hours} hours ${minutes} minutes ${seconds} seconds`;
// })

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
  download(blob, 'md')
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

  download(blob, 'html')
}

const genTodayReport = async () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/options/index.html') + '#/dailyreport' });
}

const download = async (blob, fileType: string) => {
  // 创建一个用于下载的 URL
  const downloadUrl = window.URL.createObjectURL(blob);

  // 创建一个临时的 a 元素用于触发下载
  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  const date = new Date().toString();
  downloadLink.download = `chat-${date}.${fileType}`; // 设置下载的文件名

  // 将链接添加到 DOM 中（不可见），触发点击事件，然后移除
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  // 清理创建的 URL
  window.URL.revokeObjectURL(downloadUrl);
}
</script>
