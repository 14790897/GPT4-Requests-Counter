//下列代码需要在service worker的控制台执行
//下面是模拟开始时间在三小时之前的代码
chrome.storage.sync.set(
  { startTime: Date.now() - 3 * 60 * 60 * 1000 * 2 },
  function () {
    console.log('startTime 设置为三小时前: ' + Date.now())
  }
)

//下面是模拟新的一天开始的代码

// 创建当前日期的对象
const currentDate = new Date();

// 减去一天
currentDate.setDate(currentDate.getDate() - 1);

// 将日期转换为 YYYY-MM-DD 格式的字符串
const lastUpdatedDate = currentDate.toISOString().split('T')[0];

// 保存到 chrome.storage.sync
chrome.storage.sync.set({ lastUpdatedDate: lastUpdatedDate }, function() {
  console.log('lastUpdatedDate 设置为前一天: ' + lastUpdatedDate);
});