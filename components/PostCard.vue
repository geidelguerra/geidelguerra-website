<template>
  <div>
    <div class="mb-2">
      <h2 class="text-2xl font-extrabold">
        <nuxt-link class="hover:underline text-blue-300" :to="post.path">{{ post.title }}</nuxt-link>
      </h2>
      <div class="text-gray-500 text-sm">{{ new Date(post.createdAt).toLocaleDateString() }}</div>
    </div>
    <nuxt-content class="prose prose-invert" :document="{ body: post.excerpt }"/>
  </div>
</template>

<script>
export default {
  props: {
    post: { type: Object, required: true }
  }
}
</script>