const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  /*
  ** Modules
  */
  modules: [
    ['@nuxtjs/google-analytics', {
      id: 'UA-124043337-1',
      debug: {
        sendHitTask: isProduction
      }
    }]
  ],
  /*
  ** Headers of the page
  */
  head: {
    title: 'Geidel Guerra',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'My personal web site' },
      { hid: 'keywords', name: 'keywords', content: 'software developer code vuejs nuxt' },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },
  /*
  ** Customize the progress bar color
  */
  loading: { color: '#3B8070' },
  /*
  ** Global CSS
  */
  css: [
    '~/assets/css/tailwind.css'
  ],
  /*
  ** Build configuration
  */
  build: {
    /*
    ** Run ESLint on save
    */
    extend (config, { isDev, isClient }) {
      if (isDev && isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
    }
  }
}
