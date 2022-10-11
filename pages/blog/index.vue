<template>
  <div class="mx-auto max-w-3xl">
    <div class="mb-8">
      <h1 class="text-2xl">Blog</h1>
      <p>My ramblings about things and stuff... mostly software</p>
    </div>
    <div>
      <template v-for="post in posts">
        <PostCard :post="post" :key="post.id"/>
      </template>
    </div>
  </div>
</template>

<script>
import PostCard from '@/components/PostCard.vue';
export default {
    async asyncData({ $content }) {
        const posts = await $content("blog").fetch();
        return { posts };
    },
    data() {
        return {
            posts: []
        };
    },
    components: { PostCard }
}
</script>