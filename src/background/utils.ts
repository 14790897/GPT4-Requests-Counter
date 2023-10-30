// utils.js

export async function resetDailyCountAndUpdate(previousDate: string) {
          //如果是新的一天, 将昨日的键更新到同步存储中
  const { todayAllCount } = await chrome.storage.local.get('todayAllCount')
  let { dateAndCount } = await chrome.storage.sync.get('dateAndCount')
  if (!dateAndCount) {
    dateAndCount = {} // 初始化 dateAndCount 对象，如果它是 undefined
  }
  dateAndCount[previousDate] = todayAllCount
  await chrome.storage.sync.set({ dateAndCount })

      // 如果是新的一天，重置今日计数
      const currentDate = new Date().toDateString()
  await chrome.storage.local.set({
    todayAllCount: 0,
    lastUpdatedDate: currentDate,
  })
}

export async function startTimer(duration: number) {
  const startTime = Date.now()
  await chrome.storage.local.set({
    startTime,
    duration,
    timerStarted: true,
    lastUpdatedDate: new Date().toDateString(),
  })
}

export async function getTimeRemaining() {
  const result = await chrome.storage.local.get([
    'timerStarted',
    'startTime',
    'duration',
  ])
  if (!result.timerStarted) {
    return 0 // 结束函数执行
  }
  const currentTime = Date.now()
  const elapsedTime = currentTime - result.startTime
  const timeRemaining = Math.max(0, (result.duration - elapsedTime) / 1000)
  const roundedTimeRemaining = Math.round(timeRemaining) // 四舍五入到最接近的整数
  return roundedTimeRemaining
}

export async function updateCountsAndChartData(previousDate: string) {
  const { todayAllCount, count } = await chrome.storage.local.get([
    'todayAllCount',
    'count',
  ])
  await chrome.storage.local.set({
    count: 0,
    timerStarted: false,
    todayAllCount: Number(todayAllCount) + Number(count),
  })

  const { dateAndCount } = await chrome.storage.sync.get('dateAndCount')
  dateAndCount[previousDate] = todayAllCount
  await chrome.storage.sync.set({ dateAndCount })
}
