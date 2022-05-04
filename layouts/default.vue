<template>
  <div class="flex flex-col min-h-screen font-sans text-white bg-black">
    <nuxt class="flex-1" />

    <footer class="flex flex-col items-center justify-center mb-4">
      <div class="py-2 text-xs font-bold text-center text-green-500 uppercase">
        Copyright {{ new Date().getFullYear() }} &copy; Geidel Guerra
      </div>
      <a
        href="https://www.netlify.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src="https://www.netlify.com/v3/img/components/netlify-color-accent.svg"
          alt="Deploys by Netlify"
        />
      </a>
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
