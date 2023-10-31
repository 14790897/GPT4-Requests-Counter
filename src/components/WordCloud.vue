<template>
  <div>
    <title>Word Cloud</title>
    <div id="app">
      <div ref="chartContainer" style="width: 600px; height: 400px;"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as echarts from 'echarts';
import axios from 'axios';

const chartContainer = ref(null);

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

    // 检查 chartContainer ref 是否已经设置
    if (chartContainer.value) {
      // 初始化 ECharts 实例
      const chart = echarts.init(chartContainer.value);

      // 配置图表选项
      const option = {
        series: [
          {
            type: 'wordCloud',
            data: words.keywords.map((word) => {
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
