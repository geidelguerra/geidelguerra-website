<template>
  <div class="mx-auto max-w-3xl">
    <div class="mb-2">
      <h1 class="text-3xl text-blue-300 font-extrabold">{{ post.title }}</h1>
      <div class="text-gray-500 text-sm">{{ new Date(post.createdAt).toLocaleDateString() }}</div>
    </div>
    <nuxt-content class="prose prose-invert" :document="post"/>
  </div>
</template>

<script>
export default {
  async asyncData({ $content, params }) {
    const post = await $content('blog', params.slug).fetch()

    return { post }
  },
  data () {
    return {
      post: null
    }
  }
}
</script>