<template>
  <div class="mx-auto max-w-3xl px-4 md:px-0">
    <div class="mb-8">
      <h1 class="text-2xl">Blog</h1>
      <p class="text-green-300 italic">My ramblings about stuff... mostly software</p>
    </div>
    <div class="flex flex-col space-y-6">
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
        const posts = await $content("blog").sortBy('date', 'desc').fetch();
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