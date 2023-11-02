<template>
  <div>
    <title>Word Cloud</title>
    <div id="app">
      <!-- 创建一个新的div来显示收到的数据 -->
      <div>{{ responseContent }}</div>
      <div ref="chartContainer" style="width: 600px; height: 400px;"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as echarts from 'echarts';
import axios from 'axios';

const chartContainer = ref(null);
const responseContent = ref('');  // 新创建的ref用于存储收到的数据

const generateWordcloud = async () => {
  const { todayChat } = await chrome.storage.local.get('todayChat');
  if (!todayChat) {
    console.error('Error: Failed to retrieve todayChat from chrome.storage.local');
    return;
  }
  try {
    const words = await axios.post(
      'https://nwkazoq0sc.execute-api.ap-southeast-2.amazonaws.com/production/',
      { text: todayChat }
    );
    responseContent.value = JSON.stringify(words.data, null, 2);  // 更新 responseContent 的值


    // 检查 chartContainer ref 是否已经设置
    if (chartContainer.value) {
      // 初始化 ECharts 实例
      const chart = echarts.init(chartContainer.value);
      console.log(chart);  // 查看ECharts实例
      console.log(words.data.keywords)
      // 配置图表选项
      const option = {
        series: [
          {
            type: 'wordCloud',
            data: words.data.keywords.map((word: string) => {
              return {
                name: word,
                value: 1, // 假设所有的词有相同的权重
              };
            }),
            // ... 其他词云图选项
          },
        ],
      };

      // 设置图表选项
      chart.setOption(option);
    }
  } catch (error) {
    console.error('Error: Failed to fetch word cloud data from the API', error);
  }
};

// 在组件挂载完成后调用 generateWordcloud 函数
onMounted(generateWordcloud);

</script>
