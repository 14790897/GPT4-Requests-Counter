//计时器主要在这里执行

let timer: any = null;
let timeRemaining = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.timerStarted) {
    timeRemaining = message.duration / 1000; // 转换为秒

    // 开始倒计时
    timer = setInterval(() => {
      timeRemaining -= 1;
      if (timeRemaining <= 0) {
        chrome.storage.local.set({ count: 0, timerStarted: false })
        clearInterval(timer);
        timer = null;
      }
    }, 1000);
  }

  if (message.timerEnded) {
    clearInterval(timer);
    timer = null;
    timeRemaining = 0;
  }

  if (message.request === 'getTimeRemaining') {
    sendResponse({ timeRemaining });
  }
});


//关闭浏览器之前要把数据都清空
chrome.runtime.onStartup.addListener(function() {
  // 清除 count 和设置计时为 false
  chrome.storage.local.set({ count: 0, timerStarted: false }, function() {
    console.log("Count and timer status cleared.");
  });
});
