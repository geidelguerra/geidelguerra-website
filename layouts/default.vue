<template>
  <div class="flex flex-col min-h-screen font-sans text-white bg-gray-800">
    <header class="h-16 flex items-center px-4 bg-gray-700 z-50 sticky top-0 shadow-sm">
      <nuxt-link to="/" class="flex items-center space-x-4">
        <img src="/images/geidel_profile.jpg" alt="Geidel Guerra Picture"
          class="overflow-hidden rounded-full w-10 h-10 min-h-10 shrink-0 border-white border-2">
        <div class="text-sm sm:text-base">Geidel Guerra's website</div>
      </nuxt-link>
      <div class="flex-1"></div>
      <div class="mr-4">
        <ul class="flex space-x-2">
          <template v-for="navItem in navMenu">
            <li :key="navItem.url">
              <nuxt-link :to="navItem.url" exact-active-class="bg-slate-600"
                class="text-blue-300 px-2 py-1 hover:bg-slate-600 rounded transition-all whitespace-nowrap">{{
                    navItem.text
                }}</nuxt-link>
            </li>
          </template>
        </ul>
      </div>
    </header>

    <main class="flex-1 flex py-4">
      <nuxt />
    </main>

    <footer class="p-4 mx-auto max-w-3xl md:px-0 w-full flex flex-col space-y-4">
      <div class="flex flex-col items-center space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:w-full">
        <div>
          <a target="_blank" class="text-blue-300 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-all"
            href="/files/geidelguerra_cv_en.pdf">Download CV</a>
        </div>
        <div class="flex flex-col">
          <h3 class="text-xs text-green-300 mb-1 text-center sm:text-left">Where to find me?</h3>
          <ul class="flex space-x-2">
            <template v-for="link in networks">
              <li :key="link.url">
                <a class="hover:underline text-blue-300" :href="link.url" target="_blank" rel="noopener noreferrer">{{
                    link.label
                }}</a>
              </li>
            </template>
          </ul>
        </div>
        <div class="flex flex-col">
          <h3 class="text-xs mb-1 text-center sm:text-right"><span class="text-green-300">Deployed using</span> <a
              class="hover:underline text-blue-300" target="_blank" rel="noopener noreferrer"
              href="https://netlify.com/">Netlify</a></h3>
          <div class="text-sm text-white">
            Copyright {{ new Date().getFullYear() }} &copy; Geidel Guerra
          </div>
        </div>
      </div>
      <div class="text-center">
        <a class="text-sm text-slate-600 hover:underline font-mono" href="https://github.com/geidelguerra/geidelguerra-website" target="_blank" rel="noopener noreferrer">The source code</a>
      </div>
    </footer>
  </div>
</template>

<script>
import data from '../data'
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

    return {
      navMenu,
      networks: data.networks
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
