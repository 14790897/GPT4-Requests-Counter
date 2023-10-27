//我觉得可以在这里主动向popup和content script发送信息而不是被动地向他们发送，实际上这样也可以,因为这样的话，service worker可以停止工作
//计时器主要在这里执行
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  try {
    const currentDate = new Date().toDateString() // 获取当前日期(几号)字符串
    const { lastUpdatedDate } =
      await chrome.storage.local.get('lastUpdatedDate')

    if (currentDate !== lastUpdatedDate) {
      const todayAllCount = 0 // 如果是新的一天，重置今日计数
      await chrome.storage.local.set({
        todayAllCount,
        lastUpdatedDate: currentDate,
      })
    }

    if (message.timerStarted) {
      const startTime = Date.now()
      const duration = message.duration
      await chrome.storage.local.set({
        startTime,
        duration,
        timerStarted: true,
        lastUpdatedDate: currentDate,
        // count: 1,
      })
    } else if (message.request === 'getTimeRemaining') {
      const result = await chrome.storage.local.get([
        'timerStarted',
        'startTime',
        'duration',
      ])
      if (!result.timerStarted) {
        sendResponse({ timeRemaining: 0 })
        return // 结束函数执行
      }
      const currentTime = Date.now()
      const elapsedTime = currentTime - result.startTime
      const timeRemaining = Math.max(0, (result.duration - elapsedTime) / 1000)
      const roundedTimeRemaining = Math.round(timeRemaining) // 四舍五入到最接近的整数

      if (roundedTimeRemaining <= 0) {
        const { todayAllCount, count } = await chrome.storage.local.get([
          'todayAllCount',
          'count',
        ])
        await chrome.storage.local.set({
          count: 0,
          timerStarted: false,
          todayAllCount: Number(todayAllCount) + Number(count),
        })
      }
      console.log('Time remaining:', roundedTimeRemaining)
      sendResponse({ timeRemaining: roundedTimeRemaining })
    }
  } catch (error) {
    console.error('Failed to get time remaining:', error)
    sendResponse({ error: 'Failed to get time remaining.', timeRemaining: 0 })
  }
})

// 第一个监听器，立即返回 true 以保持消息端口开启
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  return true // Indicate that response will be sent asynchronously
})

chrome.runtime.onInstalled.addListener(function (details) {
  // if (details.reason === 'update') {
  //   clearState()
  // }
  if (details.reason === 'install') {
    chrome.storage.local.set(
      {
        count: 0,
        timerStarted: false,
        startTime: 0,
        duration: 0,
        todayAllCount: 0,
        lastUpdatedDate: new Date().toDateString(),
        lastIncrementTime: 0,
      },
      function () {
        console.log('Default values set.')
      }
    )
  }
})

function clearState() {
  // Clear count, timer status, startTime, and duration
  chrome.storage.local.set(
    {
      count: 0,
      timerStarted: false,
      startTime: 0,
      duration: 0,
      todayAllCount: 0,
      lastUpdatedDate: new Date().toDateString(),
    },
    function () {
      console.log('Default values set.')
    }
  )
}
