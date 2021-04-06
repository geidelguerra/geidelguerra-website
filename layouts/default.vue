<template>
  <div class="font-sans flex flex-col text-white bg-gray-800 min-h-screen">
    <nuxt class="flex-1" />

    <footer>
      <div class="text-center text-xs py-2 uppercase font-bold text-green-500">
        Copyright {{ new Date().getFullYear() }} &copy; Geidel Guerra
      </div>
    </footer>
  </div>
</template>

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
