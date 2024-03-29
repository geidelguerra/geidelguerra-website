module.exports = {
  target: 'static',
  /*
  ** Headers of the page
  */
  head: {
    title: 'Geidel Guerra',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Software Developer - Laravel, Vuejs, Ansible. Hoping to make some games in the future :)' },
      { hid: 'keywords', name: 'keywords', content: 'software,fullstack,web,vuejs,laravel,node,mysql,nuxt,threejs,ansible' },
      // Open graph
      { hid: 'og:title', property: 'og:title', content: 'Geidel Guerra' },
      { hid: 'og:type', property: 'og:type', content: 'website' },
      { hid: 'og:url', property: 'og:url', content: 'https://geidelguerra.com' },
      { hid: 'og:image', property: 'og:image', content: 'https://geidelguerra.com/og-image.png' },
      { hid: 'og:description', property: 'og:description', content: 'Software Developer - Laravel, Vuejs, Ansible. Hoping to make some games in the future :)' },
      // Twitter
      { hid: 'twitter:card', name: 'twitter:card', content: 'summary' },
      { hid: 'twitter:site', name: 'twitter:site', content: '@geidelguerra' },
      { hid: 'twitter:title', name: 'twitter:title', content: 'Geidel Guerra' },
      { hid: 'twitter:image', name: 'twitter:image', content: 'https://geidelguerra.com/og-image.png' },
      { hid: 'twitter:description', name: 'twitter:description', content: 'Software Developer - Laravel, Vuejs, Ansible. Hoping to make some games in the future :)' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: "preconnect", href: "https://fonts.bunny.net" },
      { rel: "stylesheet", href: "https://fonts.bunny.net/css?family=fira-code:400|fira-sans:100,300,400,700" }
    ]
  },

  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#fff' },

  /*
  ** Global CSS
  */
  css: [
    '~/assets/css/tailwind.css'
  ],

  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
    //
  ],

  /*
  ** Nuxt.js modules
  */
  modules: [
    '@nuxt/content'
  ],

  content: {
    liveEdit: false,
    markdown: {
      prism: {
        theme: 'prism-themes/themes/prism-material-oceanic.css'
      }
    }
  },

  buildModules: [
    '@nuxt/postcss8',
    ['nuxt-rfg-icon', { masterPicture: 'static/favicon.png' }],
  ],

  /*
  ** Build configuration
  */
  build: {
    postcss: {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    }
  }
}
