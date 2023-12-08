//我觉得可以在这里主动向popup和content script发送信息而不是被动地向他们发送，实际上这样也可以,因为这样的话，service worker可以停止工作
//计时器主要在这里执行
import {
  resetDailyCountAndUpdate,
  startTimer,getTimeRemaining,
  updateCountsAndChartData,
} from './utils.js'

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  try {
    const { lastUpdatedDate } =
      await chrome.storage.local.get('lastUpdatedDate')

    //然后根据信息中的timerStarted判断是否开始计时，如果是的话，设置开始时间和持续时间
    if (message.timerStarted) {
      await startTimer(message.duration)
    } //如果是获取剩余时间的话，就执行下面的操作
    else if (message.request === 'getTimeRemaining') {
      const result = await chrome.storage.local.get([
        'timerStarted',
        'startTime',
        'duration',
      ])
      //timerStarted是从storage中取出的
      if (!result.timerStarted) {
        console.log('Timer not started. Time remaining is 0.')
        sendResponse({ timeRemaining: 0 })
        return // 结束函数执行
      }
      const roundedTimeRemaining = await getTimeRemaining(
        result.startTime,
        result.duration
      )
      if (roundedTimeRemaining <= 0) {
        console.log('Timer expired. Updating counts and chart data.')
        await updateCountsAndChartData(lastUpdatedDate)
        const currentDate = new Date().toDateString() // 获取当前日期(几号)字符串
        //一天结束后会运行下面的函数
        if (currentDate !== lastUpdatedDate) {
          resetDailyCountAndUpdate(lastUpdatedDate, currentDate)
        }
      }
      // console.log('Time remaining:', roundedTimeRemaining)
      sendResponse({ timeRemaining: roundedTimeRemaining })
    }
  } catch (error) {
    console.error('Failed to get time remaining:', error)
    sendResponse({ error: 'Failed to get time remaining.', timeRemaining: 0 })
  }
})

// 第一个监听器，立即返回 true 以保持消息端口开启（因为await异步，遇到这个会暂时跳过，以为已经完成了）
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
        todayChat: '',
        dateAndCount: {},
        todayFirstChatTime: 'sorry, no time'
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
