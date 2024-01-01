<template>
    <div>
    <div class="container mx-auto p-4">
        <h2 class="text-2xl font-bold text-gray-800 mb-4 text-center">talk time</h2>
        <div class="flex flex-wrap">
            <div v-for="(times, date) in groupedTimeList" :key="date" class="date-container mb-6 mr-4">
                <h3 class="text-xl font-semibold text-gray-700">{{ date }}</h3>

                <div v-if="isDetail">
                    <!-- 详细视图：显示所有时间 -->
                    <ul :class="{ 'max-h-20 overflow-hidden': !expanded[date] }" class="list-disc pl-5 mt-2">
                        <li v-for="(time, index) in times.detail" :key="index" class="text-gray-600">
                            {{ time }}
                        </li>
                    </ul>
                </div>
                <div v-else>
                    <!-- 简略视图：显示每小时统计 -->
                    <ul class="list-disc pl-5 mt-2">
                        <li v-for="(count, hour) in sortObjectByKeys(times.summary)" :key="hour" class="text-gray-600">
                            {{ hour }}: {{ count }} times
                        </li>
                    </ul>
                </div>

                <button class="text-blue-500 text-sm" @click="toggle(date)">{{ expanded[date] ? 'less' : 'more' }}</button>
            </div>
        </div>
    </div>
    </div>
    <!-- 添加切换视图的按钮 -->
    <div class="button-container mb-4">
        <button class="mb-4 bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400" @click="toggleDetailView">
            {{ isDetail ? 'Switch to Summary View' : 'Switch to Detail View' }}
        </button>
    </div>
</template>


<script>
import { ref, onMounted } from 'vue';

export default {
    name: 'TimeList',

    setup() {
        const timeList = ref([]);
        const groupedTimeList = ref({});
        const expanded = ref({});
        const isDetail = ref(true);

        const toggle = (date) => {
            expanded.value[date] = !expanded.value[date];
        };
        // 切换视图的方法
        const toggleDetailView = () => {
            isDetail.value = !isDetail.value;
        };

        const fetchTimeList = async () => {
            const result = await chrome.storage.local.get(['timeList']);
            timeList.value = result.timeList || [];
            groupTimesByDate();
        };

        const groupTimesByDate = () => {
            const grouped = timeList.value.reduce((acc, timeStr) => {
                const date = new Date(timeStr).toLocaleDateString();
                const hour = new Date(timeStr).getHours();
                const time = new Date(timeStr).toLocaleTimeString();

                const hourKey = ` ${hour}:00 - ${hour + 1}:00`;

                if (!acc[date]) {
                    acc[date] = { detail: [], summary: {} };
                }

                acc[date].detail.push(time);

                // 统计小时段次数
                acc[date].summary[hourKey] = (acc[date].summary[hourKey] || 0) + 1;

                return acc;
            }, {});

            groupedTimeList.value = grouped;
        };

        const sortObjectByKeys = (obj) => {
            return Object.keys(obj).sort().reduce((result, key) => {
                result[key] = obj[key];
                return result;
            }, {});
        };
        onMounted(() => {
            fetchTimeList();
        });

        return { groupedTimeList, expanded, toggle, isDetail, toggleDetailView, sortObjectByKeys };
    },
};
</script>


<style>
.date-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    /* 中心对齐每个日期的内容 */
}

.button-container {
    display: flex;
    justify-content: center;
    /* 水平居中 */
    margin-top: auto; /* 将按钮推到底部 */

}
</style>
