<template>
  <div class="m-4 p-4 bg-white rounded shadow-lg">
    <div id="chart" ref="chartRef" class="w-full h-96 mb-4"></div>
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
  const dates = Object.keys(dateAndCount || {});
  const counts = Object.values(dateAndCount || {});
  // const dates = [1, 2, 3, 4, 5, 6]
  // const counts = [1, 2, 3, 4, 5, 6]
  // 初始化图表
  const chart = echarts.init(chartRef.value);

  // 设置图表选项
  const option = {
    title: {
      text: 'daily counts',
      left: 'center',
      top: 20,
      textStyle: {
        color: '#333',
        fontSize: 24,
        fontWeight: 'bold',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985',
        },
      },
    },
    // 图例名字和颜色
    legend: {
      data: ['counts'],
      top: 50,
    },
    toolbox: {
      feature: {
        saveAsImage: {},
        dataView: {
            show: true,
            title: 'origin data'
        },
        magicType: {
            show: true,
            title: {
                line: 'line',
                bar: 'bar(default)',
                stack: 'stack'
            },
            type: ['line', 'bar', 'stack']
        },
        restore: {
            show: true,
            title: '还原'
        }
      },
      right: 20,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: dates,
      },
    ],
    yAxis: [
      {
        type: 'value',
      },
    ],
    series: [
      {
        name: 'counts',
        type: 'bar',
        stack: '总量',
        // 配置柱子的样式，包括悬停时的样式
        itemStyle: {
          // Normal state styles (optional)
          color: '#ab68ff',
        },
        emphasis: {
          itemStyle: {
            // Styles when hovered
            color: '#19c37d'  // Change color on hover
          },
          focus: 'series',
        },
        data: counts,
      },
    ],
  };

  // 绘制图表
  chart.setOption(option);
});

</script>