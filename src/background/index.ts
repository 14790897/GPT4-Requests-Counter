//我觉得可以在这里主动向popup和content script发送信息而不是被动地向他们发送，实际上这样也可以因为这样的话，service worker可以停止工作
//计时器主要在这里执行
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.timerStarted) {
    const startTime = Date.now()
    const duration = message.duration
    chrome.storage.local.set({ startTime, duration, timerStarted: true })
  }

  if (message.request === 'getTimeRemaining') {
    chrome.storage.local.get(['startTime', 'duration'], function (result) {
      if (chrome.runtime.lastError) {
        console.log('Error: ', chrome.runtime.lastError)
        sendResponse({ error: chrome.runtime.lastError })
      } else {
        const currentTime = Date.now()
        const elapsedTime = currentTime - result.startTime
        const timeRemaining = Math.max(
          0,
          (result.duration - elapsedTime) / 1000
        )
        const roundedTimeRemaining = Math.round(timeRemaining) // 四舍五入到最接近的整数

        if (roundedTimeRemaining <= 0) {
          chrome.storage.local.set({ count: 0, timerStarted: false })
        }
        console.log('Time remaining:', roundedTimeRemaining)
        sendResponse({ timeRemaining: roundedTimeRemaining })
      }
    })
    return true // Indicate that response will be sent asynchronously
  }
})

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'update') {
    clearState()
  }
})

function clearState() {
  // Clear count, timer status, startTime, and duration
  chrome.storage.local.set(
    { count: 0, timerStarted: false, startTime: 0, duration: 0 },
    function () {
      console.log('State cleared.')
    }
  )
}
