//下列代码需要在service worker的控制台执行
//要模拟第二天，先执行下面第二段代码,再执行下面的一段代码
//下面是模拟开始时间在三小时之前的代码
chrome.storage.sync.set(
  { startTime: Date.now() - 3 * 60 * 60 * 1000 * 2 },
  function () {
    console.log('startTime 设置为三小时前: ' + Date.now())
  }
)
//---------------------------------------
//下面是模拟新的一天开始的代码

// 创建当前日期的对象
const currentDate = new Date()

// 减去一天
currentDate.setDate(currentDate.getDate() - 1)

// 将日期转换为date.toDateString(); 格式的字符串
const lastUpdatedDate = currentDate.toDateString()

// 保存到 chrome.storage.sync
chrome.storage.sync.set({ lastUpdatedDate: lastUpdatedDate }, function () {
  console.log('lastUpdatedDate 设置为前一天: ' + lastUpdatedDate)
})
//---------------------------------------
//查看时间
chrome.storage.sync.get({ lastUpdatedDate: '默认日期' }, function (result) {
  // 使用存储中的值或默认值
  var lastUpdatedDate = result.lastUpdatedDate // 现在它在这个作用域内被正确定义了
  console.log('lastUpdatedDate 的值是: ' + lastUpdatedDate)
})
