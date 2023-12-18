// utils.js

export async function resetDailyCountAndUpdate(
  lastUpdatedDate: string,
) {
  try {
    //如果是新的一天, 将昨日的键更新到同步存储中
    const { todayAllCount } = await chrome.storage.sync.get('todayAllCount')
    let { dateAndCount } = await chrome.storage.sync.get('dateAndCount')
    if (!dateAndCount) {
      dateAndCount = {} // 初始化 dateAndCount 对象，如果它是 undefined
    }
    //如果是新的一天，刷新为新的一天的第一次聊天时间
    const now = new Date()
    const hours = now.getHours() // 获取小时
    const minutes = now.getMinutes() // 获取分钟

    // 格式化为 hh:mm 格式
    const formattedTime =
      hours.toString().padStart(2, '0') +
      ':' +
      minutes.toString().padStart(2, '0')
    const todayFirstChatTime = formattedTime
    await chrome.storage.sync.set({todayFirstChatTime})
 
    dateAndCount[lastUpdatedDate] = todayAllCount
    await chrome.storage.sync.set({ dateAndCount })

    // 如果是新的一天，重置今日计数，清空todaychat
    await chrome.storage.sync.set({
      todayAllCount: 0,
      todayChat: '',
    })
  } catch (error) {
    console.error('Error in resetDailyCountAndUpdate:', error)
    console.error('Stack trace:', error.stack)
  }
}

export async function startTimer(duration: number, currentDate:string) {
  try {
    //目前应该只有这里也更新了时间，但是这里的时间应该是在上面的函数之后触发
    const startTime = Date.now()
    await chrome.storage.sync.set({
      startTime,
      duration,
      timerStarted: true,
      lastUpdatedDate: currentDate,
    })
  } catch (error) {
    console.error('Error in startTimer:', error)
    console.error('Stack trace:', error.stack)
  }
}

export async function getTimeRemaining(startTime: number, duration: number) {
  try {
    const currentTime = Date.now()
    const elapsedTime = currentTime - startTime
    const timeRemaining = Math.max(0, (duration - elapsedTime) / 1000)
    const roundedTimeRemaining = Math.round(timeRemaining) // 四舍五入到最接近的整数
    return roundedTimeRemaining
  } catch (error) {
    console.error('Error in getTimeRemaining:', error)
    console.error('Stack trace:', error.stack)
    return 0
  }
}

export async function updateCountsAndChartData(lastUpdatedDate: string) {
  try {
    const { todayAllCount, count } = await chrome.storage.sync.get([
      'todayAllCount',
      'count',
    ])
    const newCount = Number(todayAllCount) + Number(count)
    await chrome.storage.sync.set({
      count: 0,
      timerStarted: false,
      todayAllCount: newCount,
    })

    const { dateAndCount } = await chrome.storage.sync.get('dateAndCount')
    dateAndCount[lastUpdatedDate] = newCount
    await chrome.storage.sync.set({ dateAndCount })
  } catch (error) {
    console.error('Error in updateCountsAndChartData:', error)
    console.error('Stack trace:', error.stack)
  }
}
