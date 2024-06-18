// utils.js

export async function resetDailyCountAndUpdate(lastUpdatedDate: string) {
  try {
    //要先更新dateAndCount，然后count不能清零，因为这会导致刚刚增加的设置为零这个只能在三小时之后再清0
    const { todayAllCount, count } = await chrome.storage.sync.get([
      'todayAllCount',
      'count',
    ])
    const newCount = Number(todayAllCount) + Number(count)
    const { dateAndCount } = await chrome.storage.sync.get('dateAndCount')
    dateAndCount[lastUpdatedDate] = newCount
    await chrome.storage.sync.set({ dateAndCount })

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
    await chrome.storage.sync.set({ todayFirstChatTime })
    // 从背景脚本发送导出请求
    const { isExportDaily } = await chrome.storage.sync.get('isExportDaily')
    if (isExportDaily) {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
      const { todayChat } = await chrome.storage.local.get('todayChat')
      const copy = JSON.parse(JSON.stringify(todayChat))
      await sendDownload(tabs, copy)
    }
    // 如果是新的一天，重置今日计数，清空todaychat
    await chrome.storage.sync.set({
      todayAllCount: 0,
    })
    await chrome.storage.local.set({
      todayChat: '',
    })
  } catch (error) {
    console.error('Error in resetDailyCountAndUpdate:', error)
  }
}

async function sendDownload(tabs, copy) {
  const activeTab = tabs[0]
  if (activeTab && activeTab.id !== undefined) {
    // 确保activeTab存在且activeTab.id不是undefined
    await chrome.tabs.sendMessage(
      activeTab.id,
      { action: 'exportMarkdown', data: copy },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message)
          return
        }
        // 现在可以安全地读取response.status
        if (response && response.status === 'success') {
          console.log('导出成功')
        } else {
          console.error(
            '导出失败:',
            response ? response.message : 'No response'
          )
        }
      }
    )
  } else {
    console.error('无法发送消息，未找到活动标签页或标签页ID未定义。')
  }
}
// const exportMarkdown = async () => {
//   let { todayChat } = await chrome.storage.local.get('todayChat')
//   console.log('todayChat', todayChat)
//   if (!todayChat) {
//     todayChat = 'sorry, no chat'
//     console.log('todayChat导出失败：', todayChat)
//     return
//   }
//   // 创建一个 Blob 对象，其内容为 todayChat 字符串，类型为 text/markdown
//   const blob = new Blob([todayChat], { type: 'text/markdown' })
//   const url = URL.createObjectURL(blob)

//   // 使用 chrome.downloads.download API 触发下载
//   chrome.downloads.download(
//     {
//       url: url,
//       filename: 'todayChat.md', // 可以指定下载的文件名
//     },
//     (downloadId) => {
//       if (chrome.runtime.lastError) {
//         console.log('下载失败:', chrome.runtime.lastError)
//       } else {
//         console.log('下载成功, ID:', downloadId)
//       }
//       // 释放 URL 对象
//       URL.revokeObjectURL(url)
//     }
//   )
// }

export async function startTimer(duration: number, currentDate: string) {
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

    // 获取并打印最新的值
    // const { dateAndCount: updatedDateAndCount } = await chrome.storage.sync.get('dateAndCount')
    // console.log('Updated dateAndCount:', updatedDateAndCount)
  } catch (error) {
    console.error('Error in updateCountsAndChartData:', error)
  }
}
