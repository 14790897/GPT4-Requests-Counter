//测试主要是将count和时间变量设置特定值，然后发送伪装的信息
const { updateCountsAndChartData } = require('./path-to-your-functions-file');

jest.useFakeTimers();

describe('Update counts and chart data', () => {
  it('should update data correctly after a week', () => {
    const mockDate = new Date(2023, 9, 1);  // Set a mock start date
    global.Date = jest.fn(() => mockDate);

    // Assume the function schedules an update every day at midnight
    updateCountsAndChartData();

    // Simulate the passage of 7 days
    for (let i = 0; i < 7; i++) {
      mockDate.setDate(mockDate.getDate() + 1);
      jest.advanceTimersByTime(24 * 60 * 60 * 1000);  // Advance timers by one day
    }

    // Now, we can check whether the function updated the data correctly
    // Replace the following line with your actual checks
    expect(yourCheckFunction()).toBe(true);
  });
});
