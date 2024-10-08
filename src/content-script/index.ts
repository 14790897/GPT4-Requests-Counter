// content.js
export {}
;setTimeout(() => {
(function () {
  const promptTextarea = document.getElementById('prompt-textarea')
  if (!promptTextarea) {
    return // 如果不存在，则不执行后续操作
  }

  let lastOutput =
    '1111111111111111111111111111111111111111111111111111111111...'
  const recordedIncrements = new Set() // 用于存储已经记录过的增量输出
  const nodeTimers = new Map() // 用于存储每个节点的定时器
  let isLocked = false // 锁标志

  // 更新输入栏的样式的代码
  // chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  //   console.log('message.interfaceStyle', message.interfaceStyle)
  //   try {
  //     if (message.interfaceStyle) {
  //       if (message.interfaceStyle == 'precise') {
  //         const interfaceStyle = 'precise'
  //         await updateTextareaAndTime(interfaceStyle)
  //         console.log('interfaceStyle', interfaceStyle)
  //         sendResponse({ reply: 'Response from listener' })
  //       } else {
  //         const interfaceStyle = 'simple'
  //         await updateTextareaAndTime(interfaceStyle)
  //         console.log('interfaceStyle', interfaceStyle)
  //         sendResponse({ reply: 'Response from listener' })
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Failed to update interfaceStyle:', error)
  //     sendResponse({
  //       error: 'Failed to update interfaceStyle.',
  //       timeRemaining: 0,
  //     })
  //   }
  // })

  // chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  //   return true // Indicate that response will be sent asynchronously
  // })
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
  const limit: number = 200 // 三小时内最多200条消息
  const threeHours: number = 3 * 60 * 60 * 1000 // 三小时的毫秒数
  const messageLimiter = new MessageLimiter(limit, threeHours)

  const callback = async function (mutationsList, observer) {
    // console.log('mutation已被触发')
    // 检查锁是否已经被设置
    if (isLocked) {
      // console.log('锁已经被设置')
      return // 如果锁已经被设置，则直接返回，不执行后续代码
    }

    isLocked = true // 设置锁
    try {
      const mutation = mutationsList[0]
      // for (const mutation of mutationsList) { 减少执行次数
      if (mutation.type === 'characterData') {
        let parentNode = mutation.target // 获取父节点  && parentNode.classList.contains('markdown')
        // 循环遍历所有父节点，直到找到一个包含特定data-testid属性或到达根节点
        parentNode = findParentNode(parentNode)
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
          // increment = '123455'
          if (increment && now - lastIncrementTime >= 100) {
            //只有间隔0.3秒钟以上才能再增加
            lastIncrementTime = now // 更新上次增加的时间
            await chrome.storage.sync.set({ lastIncrementTime })

            if (!recordedIncrements.has(parentNode)) {
              // 如果有增量输出，并且这个增量是新的
              try {
                await updateTimerCountData(parentNode)
                const { countOutput } = await chrome.storage.sync.get('count')
                // console.log(
                //   'countOutput====================================',
                //   countOutput
                // )
                lastOutput =
                  '1111111111111111111111111111111111111111111111111111111111...'
              } catch (error) {
                console.error('获取count失败', error)
              }
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
              todayChat += `You\n:${previousNode.textContent.replace(
                /You/g,
                ''
              )}` // 获取用户输入的文本内容
              todayChat += '\n\n' // 换行
              todayChat += `ChatGPT\n:${parentNode.textContent.replace(
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
      // console.log('上锁后进入函数主体执行后解锁')
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

  // 使用防抖的 MutationObserver 回调  重点是只能同时有一个线程在执行
  const debouncedCallback = throttle(callback, 200) // 0.5秒内的变化只会触发一次

  const observer = new MutationObserver(debouncedCallback)

  const config = { subtree: true, characterData: true }
  observer.observe(document.body, config)

  async function updateTextareaAndTime(interfaceStyle: string) {
    const textarea = getTextAreaParagraph()
    if (!textarea) return

    try {
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
        textarea.innerHTML = `Count: ${count}. ${message}`
      } else {
        // console.log('设置text')
        const count = await getCountFromStorage()
        const timeRemaining = await getTimeRemaining()
        const formattedTime = formatTime(timeRemaining)
        textarea.innerHTML = `Count: ${count}   Time Remaining: ${formattedTime}`
      }
    } catch (error) {
      console.error('Failed to update textarea:', error)
    }
  }

  function getTextAreaParagraph(): HTMLElement | null {
    const textarea = document.querySelector(
      '[class*="relative"][class*="w-full"][class*="text-center"][class*="text-xs"][class*="text-token-text-secondary"][class*="empty\\:hidden"][class*="md\\:px-\\[60px\\]"]'
    ) as HTMLElement

    return textarea
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
      chrome.runtime.sendMessage(
        { request: 'getTimeRemaining' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              'Failed to get time remaining:',
              chrome.runtime.lastError
            )
            reject(chrome.runtime.lastError)
            return
          }
          resolve(response.timeRemaining || 0)
        }
      )
    })
  }

  function formatTime(timeInSeconds: number) {
    const hours = Math.floor(timeInSeconds / 3600)
    const minutes = Math.floor((timeInSeconds % 3600) / 60)
    // const seconds = timeInSeconds % 60
    return `${hours} hours ${minutes} minutes`
  }

  // const { interfaceStyle } = await chrome.storage.sync.get('interfaceStyle')
  let interfaceStyle: string = 'normal'
  chrome.storage.sync.get('interfaceStyle', (result) => {
    interfaceStyle = result.interfaceStyle || 'normal'
    updateTextareaAndTime(interfaceStyle)
  })

  // 立即更新一次数据
  updateTextareaAndTime(interfaceStyle)

  // 每隔1秒更新一次数据
  setInterval(() => {
    updateTextareaAndTime(interfaceStyle)
  }, 1000)
  // 监听计数的变化（考虑到有多个网页的关系，所以说这里是要监听存储变化）
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.count) {
      updateTextareaAndTime(interfaceStyle)
      // console.log('count变化了   in chrome.storage.onChanged.addListener')
    }
  })

  // 创建一个回调函数，该函数将在DOM变化时被调用
  const callbackForImage = (mutationsList, observer) => {
    // console.log('图片监视的回调函数被触发')
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        // 检查新添加的节点
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.nodeName === 'DIV' &&
            (node.textContent === 'Creating image' ||
              node.textContent.includes('Doing research'))
          ) {
            // console.log('检测到内容为 "creating image" 的 div 节点')
            const parentNode = findParentNode(node)
            if (!recordedIncrements.has(parentNode)) {
              updateTimerCountData(parentNode)
            }
          }
        })
      } else if (mutation.type === 'characterData') {
        // 检查文本内容的变化
        const parent = mutation.target.parentNode
        if (
          parent &&
          parent.nodeName === 'DIV' &&
          (mutation.target.textContent === 'Creating image' ||
            mutation.target.textContent.includes('Doing research'))
        ) {
          console.log('div 节点的内容变为 "creating image"')
          // 在这里执行你需要的操作
          const parentNode = findParentNode(parent)
          if (!recordedIncrements.has(parentNode)) {
            updateTimerCountData(parentNode)
          }
        }
      }
    }
  }

  // 创建一个 Mutation Observer 实例并传入回调函数
  const observer2 = new MutationObserver(callbackForImage)

  // 配置观察选项
  const config2 = {
    childList: true, // 观察直接子节点的添加或删除
    subtree: true, // 观察所有后代节点
    characterData: true, // 观察节点内容或节点文本的变化
  }

  // 开始观察 document.body 的变化
  observer2.observe(document.body, config2)

  async function updateTimerCountData(node) {
    // 获取计数和时间列表
    let { count } = await chrome.storage.sync.get('count')
    let { timeList } = await chrome.storage.local.get('timeList')

    // 如果 timeList 未定义或不是数组，则初始化为空数组
    if (!Array.isArray(timeList)) {
      timeList = []
    }

    // 更新计数和时间列表
    count++
    timeList.push(new Date().toISOString())

    // 检查是否是第一次计时
    const { timerStarted } = await chrome.storage.sync.get('timerStarted')
    if (!timerStarted) {
      // 发送倒计时开始的消息
      chrome.runtime.sendMessage({
        timerStarted: true,
        duration: 3 * 60 * 60 * 1000,
      })
    }

    // 保存更新后的计数和时间列表
    await chrome.storage.sync.set({ count })
    await chrome.storage.local.set({ timeList })

    // 尝试发送消息
    messageLimiter.trySendMessage()

    recordedIncrements.add(node) // 将这个增量添加到已记录的集合中
  }

  function findParentNode(parentNode) {
    try {
      while (parentNode) {
        if (parentNode.getAttribute) {
          const testId = parentNode.getAttribute('data-testid')
          // console.log('testId', testId)
          if (testId && /^conversation-turn-\d+$/.test(testId)) {
            // 找到了，现在parentNode就是要找的节点
            // console.log('parentNode找到了', parentNode)
            break
          }
        }
        parentNode = parentNode.parentNode
      }
    } catch (error) {
      console.log('error in findParentNode', error)
    }
    return parentNode
  }

  // 监听来自扩展其他部分的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 检查消息是否为导出Markdown的请求
    if (message.action === 'exportMarkdown') {
      exportMarkdown(message.data)
        .then(() => {
          sendResponse({ status: 'success' })
        })
        .catch((error) => {
          console.error('导出失败:', error)
          sendResponse({ status: 'error', message: error.toString() })
        })
      return true // 保持消息通道开放，以便异步发送响应
    }
  })
  const exportMarkdown = async (todayChat) => {
    console.log('todayChat', todayChat)
    if (!todayChat) {
      todayChat = 'sorry, no chat'
      console.log('todayChat导出失败：', todayChat)
      return
    }
    // 创建一个 Blob 对象，其内容为 todayChat 字符串，类型为 text/markdown
    const blob = new Blob([todayChat], { type: 'text/markdown' })
    download(blob, 'md')
  }
  const download = async (blob, fileType: string) => {
    // 创建一个用于下载的 URL
    const downloadUrl = window.URL.createObjectURL(blob)

    // 创建一个临时的 a 元素用于触发下载
    const downloadLink = document.createElement('a')
    downloadLink.href = downloadUrl
    const date = new Date().toString()
    downloadLink.download = `chat-${date}.${fileType}` // 设置下载的文件名

    // 将链接添加到 DOM 中（不可见），触发点击事件，然后移除
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)

    // 清理创建的 URL
    window.URL.revokeObjectURL(downloadUrl)
  }
})()
}, 1000) // 延迟 执行