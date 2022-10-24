<template>
  <article class="mx-auto max-w-3xl">
    <header class="mb-4">
      <h1 class="text-3xl text-blue-300 font-extrabold">{{ post.title }}</h1>
      <div class="text-gray-500 text-sm mb-4">{{ new Date(post.createdAt).toLocaleDateString() }}</div>
      <ShareMenu :text="post.title" :url="permalink" />
    </header>
    <nuxt-content class="prose prose-invert" :document="post" />
    <p>EOF</p>
  </article>
</template>

<script>
import ShareMenu from '~/components/ShareMenu.vue'

export default {
  head() {
    return {
      title: this.post.title,
      meta: [
        { hid: 'description', name: 'description', content: this.post.title },
        // Open graph
        { hid: 'og:title', property: 'og:title', content: this.post.title },
        { hid: 'og:description', property: 'og:description', content: this.post.description },
        { hid: 'og:url', property: 'og:url', content: this.permalink },
        // Twitter
        { hid: 'twitter:title', name: 'twitter:title', content: this.post.title },
        { hid: 'twitter:description', name: 'twitter:description', content: this.post.description }
      ]
    }
  },
  components: { ShareMenu },
  async asyncData({ $content, params }) {
    const post = await $content('blog', params.slug).fetch()

    return { post }
  },
  data() {
    return {
      post: null,
      originUrl: 'https://geidelguerra.com',
    }
  },
  computed: {
    permalink() {
      return `${this.originUrl}${this.post.path}`
    }
  }
}
</script>