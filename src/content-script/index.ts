// content.js

let lastOutput = '1111111111111111111111111111111111111111111111111111111111...'
const recordedIncrements = new Set() // 用于存储已经记录过的增量输出
const nodeTimers = new Map() // 用于存储每个节点的定时器
let isLocked = false // 锁标志

const callback = async function (mutationsList, observer) {
  // 检查锁是否已经被设置
  if (isLocked) {
    console.log('锁已经被设置')
    return // 如果锁已经被设置，则直接返回，不执行后续代码
  }

  isLocked = true // 设置锁
  try {
    const mutation = mutationsList[0]
    // for (const mutation of mutationsList) {
    if (mutation.type === 'characterData') {
      let parentNode = mutation.target.parentNode.parentNode // 获取父节点  && parentNode.classList.contains('markdown')
      // 循环遍历所有父节点，直到找到一个包含特定data-testid属性或到达根节点
      while (parentNode) {
        if (parentNode.getAttribute) {
          const testId = parentNode.getAttribute('data-testid')
          // console.log('testId', testId)
          if (testId && /^conversation-turn-\d+$/.test(testId)) {
            // 找到了，现在parentNode就是要找的节点
            break
          }
        }
        parentNode = parentNode.parentNode
      }
      //睡眠等待一秒钟
      await new Promise((resolve) => setTimeout(resolve, 1000))
      if (parentNode) {
        let increment
        const currentOutput = parentNode.textContent // 获取当前文本节点内的所有文本
        if (currentOutput.includes(lastOutput)) {
          increment = currentOutput.replace(lastOutput, '') // 计算增量输出
        } //这里可不能随便在else的时候加break,一旦break之后整个循环都会停止,不会检测到新的变化
        lastOutput = currentOutput // 更新上一次的输出
        // console.log('增量输出：', increment)

        const now = Date.now()
        let { lastIncrementTime } =
          await chrome.storage.local.get('lastIncrementTime') // 用于存储上一次增量输出的时间
        if (increment && now - lastIncrementTime >= 300) {
          //只有间隔0.3秒钟以上才能再增加
          lastIncrementTime = now // 更新上次增加的时间
          await chrome.storage.local.set({ lastIncrementTime })

          if (!recordedIncrements.has(parentNode)) {
            console.log('已经进入count增加')
            // 如果有增量输出，并且这个增量是新的
            try {
              const result = await chrome.storage.local.get('count')
              let count = result.count || 0
              count++
              // recordedIncrements = new set()
              // 如果这是第一次计时，开始计时
              const { timerStarted } =
                await chrome.storage.local.get('timerStarted')
              if (!timerStarted) {
                // await chrome.storage.local.set({ timerStarted: true })
                chrome.runtime.sendMessage({
                  timerStarted: true,
                  duration: 3 * 60 * 60 * 1000,
                }) // 发送倒计时开始的消息，同时在背景脚本中记录当前的时间，这个应该在count设置之前执行
              }
              console.log('count====================================', count)
              await chrome.storage.local.set({ count })

              const { countOutput } = await chrome.storage.local.get('count')
              console.log(
                'countOutput====================================',
                countOutput
              )
              lastOutput =
                '1111111111111111111111111111111111111111111111111111111111...'
            } catch (error) {
              console.error('获取count失败', error)
            }
            recordedIncrements.add(parentNode) // 将这个增量添加到已记录的集合中
          }
          //只要有这样输出,就执行下面的代码,清除节点主要是防止为了这个列表过大，浪费资源
          // 清除旧的定时器（如果存在）
          if (nodeTimers.has(parentNode)) {
            clearTimeout(nodeTimers.get(parentNode))
          }

          // 设置新的定时器
          const timer = setTimeout(async () => {
            let { todayChat } = await chrome.storage.local.get('todayChat')
            todayChat += parentNode.textContent
            console.log('todayChat已增加', todayChat)
            await chrome.storage.local.set({ todayChat })
            recordedIncrements.delete(parentNode)
            nodeTimers.delete(parentNode)
          }, 10000) // 10秒后清除

          // 存储新的定时器
          nodeTimers.set(parentNode, timer)
        }
      }
    }
    // }
  } catch (error) {
    console.error('Failed to process mutations:', error)
  } finally {
    console.log('上锁后进入函数主体执行后解锁')
    isLocked = false // 释放锁
  }
}

const observer = new MutationObserver(callback)

const config = { subtree: true, characterData: true }
observer.observe(document.body, config)

async function updateTextareaAndTime() {
  const textarea = document.getElementById('prompt-textarea')
  if (!textarea) {
    console.log('textarea not found.')
    return
  }

  let count: number
  try {
    const result = await chrome.storage.local.get('count')
    count = result.count || 0
  } catch (error) {
    console.error('Failed to get count from storage:', error)
  }

  try {
    chrome.runtime.sendMessage({ request: 'getTimeRemaining' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to get time remaining:', chrome.runtime.lastError)
        return
      }
      const timeRemaining = response.timeRemaining || 0
      const formattedTime = formatTime(timeRemaining)
      textarea.placeholder = `Count: ${count}   Time Remaining: ${formattedTime}`
    })
  } catch (error) {
    console.error('Failed to get time remaining:', error)
  }
}

function formatTime(timeInSeconds: number) {
  const hours = Math.floor(timeInSeconds / 3600)
  const minutes = Math.floor((timeInSeconds % 3600) / 60)
  // const seconds = timeInSeconds % 60
  return `${hours} hours ${minutes} minutes`
}

// 立即更新一次数据
updateTextareaAndTime()

// 每隔1秒更新一次数据
setInterval(updateTextareaAndTime, 1000)

// 监听计数的变化
chrome.storage.onChanged.addListener((changes) => {
  if (changes.count) {
    updateTextareaAndTime()
    console.log('count变化了   in chrome.storage.onChanged.addListener')
  }
})

// let timer = null // 用于存储计时器
// const startTimer = () => {
//   timer = setTimeout(
//     () => {
//       chrome.storage.local.set({ count: 0, timerStarted: false })
//       timer = null
//     },
//     3 * 60 * 60 * 1000
//   )
// }

// async function updateTextarea() {
//   // 每次都重新获取 textarea，以防它被动态添加或删除
//   const textarea = document.getElementById('prompt-textarea')

//   if (textarea) {
//     try {
//       // 获取存储的计数
//       const result = await chrome.storage.local.get('count')
//       const count = result.count || 0
//       // 假设 timeRemaining 是在这个作用域内可用的
//       // 更新 textarea 的 placeholder
//       textarea.placeholder = `Count: ${count} Time Remaining: ${timeRemaining}`
//     } catch (error) {
//       console.error('Failed to get count from storage:', error)
//     }
//   } else {
//     console.log('textarea not found.')
//   }
// }

// // 调用这个函数以更新 textarea
// updateTextarea()

// const updateTime = async () => {
//   if (textarea) {
//     chrome.runtime.sendMessage({ request: 'getTimeRemaining' }, (response) => {
//       timeRemaining = response.timeRemaining
//       timeRemaining = formattime(timeRemaining)
//       textarea.placeholder = `Count: ${count}   Time Remaining: ${timeRemaining}`
//     })
//   } else {
//     console.log('textarea not found.')
//   }
// }

// function formattime(timeRemaining) {
//   const hours = Math.floor(timeRemaining / 3600)
//   const minutes = Math.floor((timeRemaining % 3600) / 60)
//   const seconds = timeRemaining % 60
//   return `${hours} hours ${minutes} minutes ${seconds} seconds`
// }

// // 立即更新一次数据
// updateTime()

// // 每隔10秒更新一次剩余时间数据
// setInterval(updateTime, 10000)

// // 监听计数的变化
// chrome.storage.onChanged.addListener((changes, namespace) => {
//   if (changes.count) {
//     // 更新计数显示
//     updateTextarea() // 调用函数以更新 textarea
//   }
// })
