<template>
  <div>
    <div id="chart2" ref="chartContainer" class="w-full h-96 mb-4"></div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import 'echarts-wordcloud';
// import axios from 'axios';
type KeywordWithWeight = [string, number];

const chartContainer = ref(null);
// const responseContent = ref('');  // 新创建的ref用于存储收到的数据

// 使用 props 接收来自父组件的数据
const props = defineProps({
  response: Object
});

const generateWordcloud = async () => {
  try {
    let words;
    if (props.response) {
      // 检查 response 是否是字符串，如果是，解析为 JSON
      words = typeof props.response === 'string' ? JSON.parse(props.response) : props.response;
    } else {
      let { todayChat } = await chrome.storage.local.get('todayChat');
      //之前放入数据的时候修改了格式
      todayChat = todayChat.replace(/You:|ChatGPT:/g, '');

      if (!todayChat) {
        console.error('Error: Failed to retrieve todayChat from chrome.storage.local');
        return;
      }
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
      words = await response.json();
    }
    // const words = await axios.post(
    //   'https://nwkazoq0sc.execute-api.ap-southeast-2.amazonaws.com/production/',
    //   { text: todayChat }
    // );
    // responseContent.value = JSON.stringify(words.keywords, null, 2);  // 更新 responseContent 的值

    // 检查 chartContainer ref 是否已经设置
    console.log('words', words)
    if (chartContainer.value) {
      // 初始化 ECharts 实例
      const chart = echarts.init(chartContainer.value);
      console.log(chart);  // 查看ECharts实例
      // 配置图表选项
      const option = {
        toolbox: {
          feature: {
            saveAsImage: {
              show: true,  // 显示下载按钮
              title: '下载图表',  // 下载按钮的提示文字
              pixelRatio: 2,  // 下载的图像分辨率
            }
          }
        },
        series: [
          {
            type: 'wordCloud',


            shape: 'circle',


            keepAspect: false,


            left: 'center',
            top: 'center',
            width: '70%',
            height: '80%',
            right: null,
            bottom: null,

            sizeRange: [12, 60],

            rotationRange: [-90, 90],
            rotationStep: 45,

            gridSize: 8,

            drawOutOfBound: false,
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

            data: words.keywords.map((item: KeywordWithWeight) => {
              return {
                name: item[0],  // 词
                value: item[1],  // 权重
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
