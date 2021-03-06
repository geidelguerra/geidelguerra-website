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
      { hid: 'description', name: 'description', content: 'Software Developer - Laravel, Vuejs, Unity, Ansible.' },
      { hid: 'keywords', name: 'keywords', content: 'software,fullstack,web,vuejs,laravel,node,mysql,nuxt,threejs,ansible' },
      // Open graph
      { hid: 'og:title', property: 'og:title', content: 'Geidel Guerra' },
      { hid: 'og:type', property: 'og:type', content: 'website' },
      { hid: 'og:url', property: 'og:url', content: 'https://geidelguerra.com' },
      { hid: 'og:description', property: 'og:description', content: 'Software Developer - Laravel, Vuejs, Unity, Ansible.' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
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
  ],

  /*
  ** Nuxt.js modules
  */
  modules: [],

  buildModules: ['@nuxtjs/tailwindcss'],

  /*
  ** Build configuration
  */
  build: {
    /*
    ** You can extend webpack config here
    */
    extend(config, ctx) {

    }
  }
}
