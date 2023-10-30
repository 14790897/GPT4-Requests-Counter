// utils.js

export async function resetDailyCountAndUpdate(lastUpdatedDate: string, currentDate: string) {
    if (currentDate !== lastUpdatedDate) {
        //如果是新的一天, 将昨日的键更新到同步存储中
        const { todayAllCount } = await chrome.storage.local.get('todayAllCount')
        let { dateAndCount } = await chrome.storage.sync.get('dateAndCount')
        if (!dateAndCount) {
            dateAndCount = {} // 初始化 dateAndCount 对象，如果它是 undefined
        }
        dateAndCount[lastUpdatedDate] = todayAllCount
        await chrome.storage.sync.set({ dateAndCount })

        // 如果是新的一天，重置今日计数
        await chrome.storage.local.set({
            todayAllCount: 0,
            lastUpdatedDate: currentDate,
        })
    }
}

export async function startTimer(duration: number) {
    //目前应该只有这里也更新了时间，但是这里的时间应该是在上面的函数之后触发
  const startTime = Date.now()
  await chrome.storage.local.set({
    startTime,
    duration,
    timerStarted: true,
    lastUpdatedDate: new Date().toDateString(),
  })
}

export async function getTimeRemaining(startTime: number, duration: number) {
  const currentTime = Date.now()
  const elapsedTime = currentTime - startTime
  const timeRemaining = Math.max(0, (duration - elapsedTime) / 1000)
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
