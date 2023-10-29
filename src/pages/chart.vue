<template>
  <div class="m-4">
    <h1>chart</h1>
    <div id="chart" ref="chartRef" style="width: 600px; height: 400px;"></div>
    <button @click="$router.back">Go Back</button>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
const chartRef = ref(null);

onMounted(async () => {
  //绘制echarts图表
  // 获取 dateAndCount 数据
  const { dateAndCount } = await chrome.storage.sync.get('dateAndCount');

  // 准备图表数据
  // const dates = Object.keys(dateAndCount || {});
  // const counts = Object.values(dateAndCount || {});
  const dates = [1, 2, 3, 4, 5, 6]
  const counts = [1, 2, 3, 4, 5, 6]
  // 初始化图表
  const chart = echarts.init(chartRef.value);

  // 设置图表选项
  const option = {
    xAxis: {
      type: 'category',
      data: dates,
    },
    yAxis: {
      type: 'value',
    },
    series: [{
      data: counts,
      type: 'line',
    }],
  };

  // 绘制图表
  chart.setOption(option);
});

</script>

<style scoped></style>
