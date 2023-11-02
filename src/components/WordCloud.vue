<template>
  <div>
    <!-- 创建一个新的div来显示收到的数据 -->
    <!-- <div>{{ responseContent }}</div> -->
    <div id="chart2" ref="chartContainer" class="w-full h-96 mb-4"></div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import 'echarts-wordcloud';
// import axios from 'axios';

const chartContainer = ref(null);
// const responseContent = ref('');  // 新创建的ref用于存储收到的数据

const generateWordcloud = async () => {
  const { todayChat } = await chrome.storage.local.get('todayChat');
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

    const words = await response.json();
    // const words = await axios.post(
    //   'https://nwkazoq0sc.execute-api.ap-southeast-2.amazonaws.com/production/',
    //   { text: todayChat }
    // );
    // responseContent.value = JSON.stringify(words.keywords, null, 2);  // 更新 responseContent 的值

    // 检查 chartContainer ref 是否已经设置
    console.log('chartContainer.value', chartContainer.value)
    if (chartContainer.value) {
      // 初始化 ECharts 实例
      const chart = echarts.init(chartContainer.value);
      console.log(chart);  // 查看ECharts实例
      // console.log(words.data.keywords)
      // 配置图表选项
      const option = {
        series: [
          {
            type: 'wordCloud',
            // The shape of the "cloud" to draw. Can be any polar equation represented as a
            // callback function, or a keyword present. Available presents are circle (default),
            // cardioid (apple or heart shape curve, the most known polar equation), diamond (
            // alias of square), triangle-forward, triangle, (alias of triangle-upright, pentagon, and star.

            shape: 'circle',

            // Keep aspect ratio of maskImage or 1:1 for shapes
            // This option is supported from echarts-wordcloud@2.1.0
            keepAspect: false,

            // Folllowing left/top/width/height/right/bottom are used for positioning the word cloud
            // Default to be put in the center and has 75% x 80% size.

            left: 'center',
            top: 'center',
            width: '70%',
            height: '80%',
            right: null,
            bottom: null,

            // Text size range which the value in data will be mapped to.
            // Default to have minimum 12px and maximum 60px size.

            sizeRange: [12, 60],

            // Text rotation range and step in degree. Text will be rotated randomly in range [-90, 90] by rotationStep 45

            rotationRange: [-90, 90],
            rotationStep: 45,

            // size of the grid in pixels for marking the availability of the canvas
            // the larger the grid size, the bigger the gap between words.

            gridSize: 8,

            // set to true to allow word being draw partly outside of the canvas.
            // Allow word bigger than the size of the canvas to be drawn
            drawOutOfBound: false,

            // If perform layout animation.
            // NOTE disable it will lead to UI blocking when there is lots of words.
            layoutAnimation: true,

            // Global text style
            textStyle: {
              fontFamily: 'sans-serif',
              fontWeight: 'bold',
              // Color can be a callback function or a color string
              color: function () {
                // Random color
                return 'rgb(' + [
                  Math.round(Math.random() * 160),
                  Math.round(Math.random() * 160),
                  Math.round(Math.random() * 160)
                ].join(',') + ')';
              }
            },
            emphasis: {
              focus: 'self',

              textStyle: {
                textShadowBlur: 10,
                textShadowColor: '#333'
              }
            },
            // data: [{
            //   name: 'Farrah Abraham',
            //   value: 366,
            //   // ...
            // }]
            data: words.keywords.map((word: string) => {
              return {
                name: word,
                value: 2, // 假设所有的词有相同的权重
              };
            }),
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
