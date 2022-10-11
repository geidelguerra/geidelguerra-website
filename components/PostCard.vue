<template>
  <div>
    <h2>
      <nuxt-link class="hover:underline text-blue-300" :to="post.path">{{ post.title }}</nuxt-link>
    </h2>
    <div>{{ post.createdAt }}</div>
    <nuxt-content :document="{ body: post.excerpt }"/>
  </div>
</template>

<script>
export default {
  props: {
    post: { type: Object, required: true }
  }
}
</script>