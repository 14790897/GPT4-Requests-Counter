<script setup lang="ts"></script>

<template>
  <!-- <header
    aria-label="Site Header"
    class="bg-gray-50"
  >
    Popup Header
  </header> -->

  <RouterView></RouterView>

  <footer aria-label="Site Footer">
    <div class="bg-gray-50 text-gray-700 px-4">
      <div class="flex justify-between items-center">
        <div>
          <a href="https://github.com/14790897/GPT4-Requests-Counter/issues" class="mr-2" target="_blank">Help</a>
        </div>
        <div>
          <a href="https://github.com/14790897/GPT4-Requests-Counter" class="mr-2" target="_blank"> give me a star</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped></style>
