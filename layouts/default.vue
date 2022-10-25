<template>
  <div class="flex flex-col min-h-screen font-sans text-white bg-gray-800">
    <header class="h-16 flex items-center px-4 bg-gray-700 z-50 sticky top-0 shadow-sm">
      <nuxt-link to="/" class="flex items-center space-x-4">
        <img src="/images/geidel_profile.jpg" alt="Geidel Guerra Picture"
          class="overflow-hidden rounded-full w-10 h-10 border-white border-2">
        <span class="hidden sm:block">Geidel Guerra's website</span>
      </nuxt-link>
      <div class="flex-1"></div>
      <div class="mr-4">
        <ul class="flex space-x-2">
          <template v-for="navItem in navMenu">
            <li :key="navItem.url">
              <nuxt-link :to="navItem.url" exact-active-class="underline text-blue-300" class="hover:underline text-blue-300">{{ navItem.text }}</nuxt-link>
            </li>
          </template>
        </ul>
      </div>
    </header>

    <main class="flex-1 flex py-4">
      <nuxt />
    </main>

    <footer class="flex flex-col items-center space-y-4 p-4 mx-auto max-w-3xl sm:flex-row sm:justify-between sm:space-y-0 sm:w-full">
      <div class="flex flex-col">
        <h3 class="text-xs text-green-300 mb-1 text-center sm:text-left">Where to find me?</h3>
        <ul class="flex space-x-2">
          <template v-for="link in networks">
            <li :key="link.url">
              <a class="hover:underline text-blue-300" :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.text }}</a>
            </li>
          </template>
        </ul>
      </div>
      <div class="flex flex-col">
        <h3 class="text-xs mb-1 text-center sm:text-right"><span class="text-green-300">Deployed using</span> <a class="hover:underline text-blue-300" target="_blank" rel="noopener noreferrer" href="https://netlify.com/">Netlify</a></h3>
        <div class="text-sm text-white">
          Copyright {{ new Date().getFullYear() }} &copy; Geidel Guerra
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  setup() {
    const navMenu = [
      {
        text: 'About me',
        url: '/'
      },
      {
        text: 'Blog',
        url: '/blog'
      }
    ]

    const networks = [
      { text: 'LinkedIn', url: 'https://linkedin.com/in/geidelguerra' },
      { text: 'GitHub', url: 'https://github.com/geidelguerra' },
      { text: 'Twitter', url: 'https://twitter.com/geidelguerra' }
    ]

    return {
      navMenu,
      networks
    }
  }
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
