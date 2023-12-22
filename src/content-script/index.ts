// content.js
export {}

let lastOutput = '1111111111111111111111111111111111111111111111111111111111...'
const recordedIncrements = new Set() // 用于存储已经记录过的增量输出
const nodeTimers = new Map() // 用于存储每个节点的定时器
let isLocked = false // 锁标志

class MessageLimiter {
  private limit: number
  private windowSize: number
  private timestamps: number[]

  constructor(limit: number, windowSize: number) {
    this.limit = limit
    this.windowSize = windowSize
    this.timestamps = []
  }

  async loadTimestamps(): Promise<void> {
    const data = await chrome.storage.local.get(['timestamps'])
    this.timestamps = data.timestamps || []
  }

  async trySendMessage(): Promise<boolean> {
    const now = Date.now()
    await this.loadTimestamps()
    this.cleanOldTimestamps(now)

    if (this.timestamps.length < this.limit) {
      this.timestamps.push(now)
      await chrome.storage.local.set({ timestamps: this.timestamps })
      console.log('消息发送成功')
      return true
    } else {
      console.log('消息发送失败：超过了限制')
      return false
    }
  }

  async getCurrentMessageCount(): Promise<number> {
    const now = Date.now()
    await this.loadTimestamps()
    this.cleanOldTimestamps(now)
    return this.timestamps.length
  }

  private async cleanOldTimestamps(currentTime: number) {
    const windowStart = currentTime - this.windowSize
    let isChanged = false

    while (this.timestamps.length > 0 && this.timestamps[0] < windowStart) {
      this.timestamps.shift()
      isChanged = true
    }

    // 如果发生了更改，更新存储
    if (isChanged) {
      await chrome.storage.local.set({ timestamps: this.timestamps })
    }
  }
}

// 使用方法
const limit: number = 40 // 三小时内最多40条消息
const threeHours: number = 3 * 60 * 60 * 1000 // 三小时的毫秒数
const messageLimiter = new MessageLimiter(limit, threeHours)

const callback = async function (mutationsList, observer) {
  // 检查锁是否已经被设置
  if (isLocked) {
    console.log('锁已经被设置')
    return // 如果锁已经被设置，则直接返回，不执行后续代码
  }

  isLocked = true // 设置锁
  try {
    const mutation = mutationsList[0]
    // for (const mutation of mutationsList) { 减少执行次数
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
      //这里是不是少了如果上面循环没找到应该直接退出的
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
          await chrome.storage.sync.get('lastIncrementTime') // 用于存储上一次增量输出的时间
        if (increment && now - lastIncrementTime >= 300) {
          //只有间隔0.3秒钟以上才能再增加
          lastIncrementTime = now // 更新上次增加的时间
          await chrome.storage.sync.set({ lastIncrementTime })

          if (!recordedIncrements.has(parentNode)) {
            // 如果有增量输出，并且这个增量是新的
            try {
              const result = await chrome.storage.sync.get('count')
              let count = result.count || 0
              count++
              // recordedIncrements = new set()
              // 如果这是第一次计时，开始计时
              const { timerStarted } =
                await chrome.storage.sync.get('timerStarted')
              if (!timerStarted) {
                // await chrome.storage.sync.set({ timerStarted: true })
                chrome.runtime.sendMessage({
                  timerStarted: true,
                  duration: 3 * 60 * 60 * 1000,
                }) // 发送倒计时开始的消息，同时在背景脚本中记录当前的时间，这个应该在count设置之前执行
              }
              console.log('count====================================', count)
              await chrome.storage.sync.set({ count })
              //这个是用于正确的计时方式
              messageLimiter.trySendMessage()
              const { countOutput } = await chrome.storage.sync.get('count')
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
          //nodeTimers，recordedIncrements只要每天清除就行了，或者不清除，因为我现在发现用户离开网页之后会导致网页出现停止运行的情况，这样这些节点可能突然清除了而计数又会重新触发，进一步导致计数错误
          // 清除旧的定时器（如果存在）
          if (nodeTimers.has(parentNode)) {
            clearTimeout(nodeTimers.get(parentNode))
          }

          // 设置新的定时器
          const timer = setTimeout(async () => {
            let { todayChat } = await chrome.storage.local.get('todayChat')
            const previousNode = parentNode.previousElementSibling // 获取上一个兄弟节点
            todayChat += `You:${previousNode.textContent.replace(/You/g, '')}` // 获取用户输入的文本内容
            todayChat += '\n\n' // 换行
            todayChat += `ChatGPT:${parentNode.textContent.replace(
              /ChatGPT/g,
              ''
            )}`
            todayChat += '\n\n' // 换行
            // console.log('todayChat已增加', todayChat)
            await chrome.storage.local.set({ todayChat })
            // recordedIncrements.delete(parentNode)
            //下面的我也先注释了
            // nodeTimers.delete(parentNode)
          }, 10000) // 10秒后将todayChat的内容更新

          // 存储新的定时器,用于再次循环的时候遇到同样的节点可以清除计时，这是为了在对话全部输出之后才删除节点
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

// // 防抖函数
// function debounce(func, wait) {
//   let timeout
//   return function (...args) {
//     // 使用...args收集所有传递给函数的参数
//     clearTimeout(timeout)
//     timeout = setTimeout(() => {
//       // 使用箭头函数简化代码
//       func.apply(this, args)
//     }, wait)
//   }
// }

function throttle(func, limit) {
  let lastFunc
  let lastRan
  return function (...args) {
    if (!lastRan) {
      func.apply(this, args)
      lastRan = Date.now()
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(
        () => {
          if (Date.now() - lastRan >= limit) {
            func.apply(this, args)
            lastRan = Date.now()
          }
        },
        limit - (Date.now() - lastRan)
      )
    }
  }
}

// 使用防抖的 MutationObserver 回调
const debouncedCallback = throttle(callback, 2000) // 2秒内的变化只会触发一次

const observer = new MutationObserver(debouncedCallback)

const config = { subtree: true, characterData: true }
observer.observe(document.body, config)

// 更新输入栏的样式的代码
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.interfaceStyle) {
    if (message.interfaceStyle == 'precise') {
      const interfaceStyle = 'precise'
      updateTextareaAndTime(interfaceStyle)
    } else {
      const interfaceStyle = 'simple'
      updateTextareaAndTime(interfaceStyle)
    }
  }
})

async function updateTextareaAndTime(interfaceStyle:string) {
  const textarea = getTextArea()
  if (!textarea) return

  try {
    console.log('interfaceStyle', interfaceStyle)
    if (interfaceStyle == 'precise') {
      const count = await messageLimiter.getCurrentMessageCount()
      // Provide different messages based on the message count
      let message = ''
      if (count < 10) {
        message =
          'Keep it up! You need to be more active during this period. Try to send more messages!'
      } else if (count >= 10 && count < 30) {
        message = 'Good job! You are quite active. Keep it going!'
      } else if (count >= 30) {
        message =
          "Congratulations! You have been working very hard, you're almost at the limit!"
      }

      // Update the placeholder of the textarea
      textarea.placeholder = `Count: ${count}. ${message}`
    } else {
      const count = await getCountFromStorage()
      const timeRemaining = await getTimeRemaining()
      const formattedTime = formatTime(timeRemaining)
      textarea.placeholder = `Count: ${count}   Time Remaining: ${formattedTime}`
    }
  } catch (error) {
    console.error('Failed to update textarea:', error)
  }
}

function getTextArea(): HTMLTextAreaElement | null {
  return document.getElementById('prompt-textarea') as HTMLTextAreaElement
}

async function getCountFromStorage(): Promise<number> {
  try {
    const result = await chrome.storage.sync.get('count')
    return result.count || 0
  } catch (error) {
    console.error('Failed to get count from storage:', error)
    return 0
  }
}

function getTimeRemaining(): Promise<number> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ request: 'getTimeRemaining' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to get time remaining:', chrome.runtime.lastError)
        reject(chrome.runtime.lastError)
        return
      }
      resolve(response.timeRemaining || 0)
    })
  })
}

function formatTime(timeInSeconds: number) {
  const hours = Math.floor(timeInSeconds / 3600)
  const minutes = Math.floor((timeInSeconds % 3600) / 60)
  // const seconds = timeInSeconds % 60
  return `${hours} hours ${minutes} minutes`
}

const { interfaceStyle } = await chrome.storage.sync.get('interfaceStyle')

// 立即更新一次数据
updateTextareaAndTime(interfaceStyle)

// 每隔1秒更新一次数据
setInterval(updateTextareaAndTime(interfaceStyle), 1000)

// 监听计数的变化（考虑到有多个网页的关系，所以说这里是要监听存储变化）
chrome.storage.onChanged.addListener((changes) => {
  if (changes.count) {
    updateTextareaAndTime(interfaceStyle)
    console.log('count变化了   in chrome.storage.onChanged.addListener')
  }
})

// let timer = null // 用于存储计时器
// const startTimer = () => {
//   timer = setTimeout(
//     () => {
//       chrome.storage.sync.set({ count: 0, timerStarted: false })
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
//       const result = await chrome.storage.sync.get('count')
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
