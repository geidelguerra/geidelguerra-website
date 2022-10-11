<template>
  <div class="flex flex-col min-h-screen font-sans text-white bg-gray-700">
    <nuxt class="flex-1" />

    <footer class="flex flex-col items-center justify-center ">
      <div class="py-2 text-xs font-bold text-center text-green-500 uppercase">
        Copyright {{ new Date().getFullYear() }} &copy; Geidel Guerra
      </div>
    </footer>
  </div>
</template>

<script>
export default {
//
}
</script>

<style>
html {
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}

*,
*:before,
*:after {
  box-sizing: border-box;
  margin: 0;
}

.__layout {
  height: 100%;
}
</style>
