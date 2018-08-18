<template>
  <div class="font-sans text-base leading-tight tracking-normal flex flex-col min-h-screen">
    <header class="border-b bg-white" ref="header" :class="{'fixed pin-t w-full z-10': headerFixed}">
      <div class="flex max-w-md mx-auto">
        <div class="p-4 flex-1 flex overflow-hidden">
          <div class="overflow-hidden">
            <div class="text-xl truncate">
              <a href="/" class="block no-underline text-black">Geidel Guerra</a>
            </div>
            <div class="text-xs text-green-dark text-right truncate">
              Software Developer
            </div>

          </div>
        </div>

        <div v-if="menu.length > 0" class="flex items-center">
          <button
            type="button"
            class="flex flex-col justify-between items-stretch m-4"
            style="width: 1.75rem; height: 1.5rem"
            @click="menuOpen = !menuOpen"
          >
            <div class="border border-black"></div>
            <div class="border border-black"></div>
            <div class="border border-black"></div>
          </button>
        </div>
      </div>

      <div v-if="menuOpen" class="fixed pin bg-black" :style="{marginTop: `${headerHeight}px`}">
        <ul class="list-reset flex flex-col max-w-md mx-auto">
          <template v-for="(item, i) in menu">
            <li :key="i">
              <nuxt-link
                class="block text-white no-underline p-4 text-center text-xl uppercase font-bold"
                :to="item.route"
                @click.native="menuOpen = false"
                >
                {{ item.text }}
              </nuxt-link>
            </li>
          </template>
        </ul>
      </div>
    </header>

    <nuxt  class="flex-1" :style="{paddingTop: headerFixed ? `${headerHeight}px` : 0}"/>

    <footer>
      <ul class="list-reset flex flex-wrap justify-center pl-2 pr-2 max-w-md mx-auto">
        <template v-for="(link, i) in links">
          <li :key="i">
            <a class="block font-bold text-blue-dark pt-4 pb-4 pl-2 pr-2" :href="link.url" target="_blank">{{ link.title }}</a>
          </li>
        </template>
      </ul>

      <div class="bg-green-dark">
        <div class="text-xs text-center pl-4 pr-4 pt-2 pb-2 text-white max-w-md mx-auto">
          Source code of this site <a href="https://github.com/geidelguerra/geidelguerra-website.git" target="_blank">here</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  data () {
    return {
      headerHeight: 0,
      menu: [],
      links: [
        {
          title: 'GitHub',
          url: 'https://github.com/geidelguerra'
        },
        {
          title: 'LinkedIn',
          url: 'https://linkedin.com/geidelguerra'
        },
      ]
    };
  },

  computed: {
    menuOpen: {
      get () { return this.$store.state.menuOpen; },
      set (value) { this.$store.commit('setMenuOpen', value); }
    },
    headerFixed () {
      return this.$store.state.headerFixed;
    },
  },

  watch: {
    'menuOpen': function (value) {
      if (value) {
        document.querySelector('body').classList.add('overflow-hidden');
      } else {
        document.querySelector('body').classList.remove('overflow-hidden');
      }
    }
  },

  mounted () {
    this.headerHeight = this.$refs.header.clientHeight;
  }
}
</script>

<style>
html {
  font-size: 16px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}

a {
  color: inherit;
}

.fade-in-top-enter-active, .fade-in-top-leave-active {
  transition: all .5s ease-out;
}

.fade-in-top-enter, .fade-in-top-leave-active {
  opacity: 0;

}

.fade-in-top-enter {
  transform: translate(0, -100%);
}

.fade-in-top-leave-active {
  transform: translate(0, 100%);
}

</style>
