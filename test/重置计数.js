//下列代码需要在service worker的控制台执行
chrome.storage.local.set(
  { startTime: Date.now() - 3 * 60 * 60 * 1000 * 2 },
  function () {
    console.log('startTime 设置为三小时前: ' + Date.now())
  }
)
