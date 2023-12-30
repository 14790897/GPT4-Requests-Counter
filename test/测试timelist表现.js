const mockTimeList = [
  '2023-12-30T09:00:00.000Z',
  '2023-12-30T10:00:00.000Z',
  '2023-12-31T11:00:00.000Z',
  '2023-12-31T12:00:00.000Z',
  // 添加更多测试日期和时间
]

// 设置测试数据到本地存储
await chrome.storage.local.set({ timeList: mockTimeList })
