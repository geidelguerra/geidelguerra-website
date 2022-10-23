<template>
  <div class="mx-auto max-w-3xl">
    <div class="mb-4">
      <h1 class="text-3xl text-blue-300 font-extrabold">{{ post.title }}</h1>
      <div class="text-gray-500 text-sm mb-4">{{ new Date(post.createdAt).toLocaleDateString() }}</div>
      <ShareMenu :text="post.title" :url="permalink" />
    </div>
    <nuxt-content class="prose prose-invert" :document="post" />
  </div>
</template>

<script>
import ShareMenu from '~/components/ShareMenu.vue'

export default {
  components: { ShareMenu },
  async asyncData({ $content, params }) {
    const post = await $content('blog', params.slug).fetch()

    return { post }
  },
  data() {
    return {
      post: null,
      originUrl: null,
    }
  },
  mounted() {
    this.originUrl = window.location.origin
  },
  computed: {
    permalink() {
      return `${this.originUrl}${this.post.path}`
    }
  }
}
</script>