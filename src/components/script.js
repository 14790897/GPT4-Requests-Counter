import * as echarts from 'echarts';
import axios from 'axios';


const generateWordcloud = async() => {
  const { todayChat } = await chrome.storage.local.get('todayChat');
  const words = await axios.post('https://nwkazoq0sc.execute-api.ap-southeast-2.amazonaws.com/production/', { text: todayChat });

  // 创建一个新的 DOM 元素来承载图表
  const chartDiv = document.createElement('div');
  chartDiv.style.width = '600px';
  chartDiv.style.height = '400px';
  document.getElementById('app').appendChild(chartDiv);

  // 初始化 ECharts 实例
  const chart = echarts.init(chartDiv);

  // 配置图表选项
  const option = {
    series: [{
      type: 'wordCloud',
      data: words.body.keywords.map(word => {
        return {
          name: word,
          value: 1,  // 假设所有的词有相同的权重
        };
      }),
      // ... 其他词云图选项
    }],
  };

  // 设置图表选项
  chart.setOption(option);
};

// 在页面加载完成后调用 generateWordcloud 函数
window.onload = generateWordcloud;
