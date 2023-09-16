// content.js
const config = { subtree: true, characterData: true }

let count = 0
let lastOutput = ''
let timer = null // 用于存储计时器
const recordedIncrements = new Set() // 用于存储已经记录过的增量输出

const startTimer = () => {
  timer = setTimeout(
    () => {
      chrome.storage.local.set({ count: 0, timerStarted: false })
      timer = null
    },
    3 * 60 * 60 * 1000
  )
}

const callback = async function (mutationsList, observer) {
  for (const mutation of mutationsList) {
    if (mutation.type === 'characterData') {
      const parentNode = mutation.target.parentNode.parentNode // 获取父节点
      console.log('parentNode', parentNode)
      if (parentNode && parentNode.classList.contains('markdown')) {
        // 如果是markdown元素
        const currentOutput = parentNode.textContent // 获取当前文本节点内的所有文本
        const increment = currentOutput.replace(lastOutput, '') // 计算增量输出
        lastOutput = currentOutput // 更新上一次的输出
        console.log('增量输出：', increment)
        if (increment && !recordedIncrements.has(parentNode)) {
          // 如果有增量输出，并且这个增量是新的
          try {
            const result = await chrome.storage.local.get('count')
            count = result.count || 0
            count++
            await chrome.storage.local.set({ count })
          } catch (error) {
            console.error('获取count失败', error)
          }
          recordedIncrements.add(parentNode) // 将这个增量添加到已记录的集合中

          // 如果这是第一次计时，开始计时
          chrome.storage.local.get('timerStarted', (result) => {
            if (!result.timerStarted) {
              chrome.storage.local.set({ timerStarted: true })
              startTimer()
              chrome.runtime.sendMessage({
                timerStarted: true,
                duration: 3 * 60 * 60 * 1000,
              }) // 发送倒计时开始的消息
            }
          })
        }
      }
    }
  }
}

const observer = new MutationObserver(callback)

observer.observe(document.body, config)


// 找到目标<textarea>元素
const textarea = document.getElementById('prompt-textarea');

// 创建一个新的元素用于显示计数
const countText = document.createElement('p');

// 将图标元素插入到<textarea>元素的后面
if (textarea) {
  textarea.parentNode.insertBefore(countText, textarea.nextSibling);
}else {
  console.log('textarea not found.')
}

// 监听计数的变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.count) {
    // 更新计数显示
    countText.textContent = `Count: ${changes.count.newValue}`;
  }
});