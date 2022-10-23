<template>
  <ul class="flex space-x-1">
    <template v-for="target in targets">
      <li :key="target.url">
        <a :href="target.url" target="_blank" rel="noopener noreferrer" class="block p-1 text-xs text-blue-300 hover:underline">
          {{ target.label }}
        </a>
      </li>
    </template>
  </ul>
</template>

<script>
export default {
  props: {
    url: { type: String, required: true },
    text: { type: String, required: true },
  },
  computed: {
    targets() {
      return [
        {
          label: 'Share on Twitter',
          url: `https://twitter.com/intent/tweet?text=${encodeURI(this.text)}&url=${encodeURI(this.url)}`
        },
        {
          label: 'Share on LinkedIn',
          url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURI(this.url)}`
        }
      ]
    }
  }
}
</script>