<template>
    <div class="container mx-auto p-4">
        <h2 class="text-2xl font-bold text-gray-800 mb-4 text-center">talk time</h2>
        <div v-for="(times, date) in groupedTimeList" :key="date" class="mb-6">
            <h3 class="text-xl font-semibold text-gray-700">{{ date }}</h3>
            <ul :class="{ 'max-h-20 overflow-hidden': !expanded[date] }" class="list-disc pl-5 mt-2">
                <li v-for="(time, index) in times" :key="index" class="text-gray-600">
                    {{ time }}
                </li>
            </ul>
            <button @click="toggle(date)" class="text-blue-500 text-sm">{{ expanded[date] ? 'less' : 'more' }}</button>
        </div>
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

        const toggle = (date) => {
            expanded.value[date] = !expanded.value[date];
        };

        const fetchTimeList = async () => {
            const result = await chrome.storage.sync.get(['timeList']);
            timeList.value = result.timeList || [];
            groupTimesByDate();
        };

        const groupTimesByDate = () => {
            const grouped = timeList.value.reduce((acc, timeStr) => {
                const date = new Date(timeStr).toLocaleDateString();
                const time = new Date(timeStr).toLocaleTimeString();
                if (!acc[date]) {
                    acc[date] = [];
                }
                acc[date].push(time);
                return acc;
            }, {});

            groupedTimeList.value = grouped;
        };

        onMounted(() => {
            fetchTimeList();
        });

        return { groupedTimeList, expanded, toggle };
    },
};
</script>

