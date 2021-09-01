<template>
  <section class="container flex items-center justify-center h-full mx-auto">
    <div class="flex flex-col items-center justify-center p-6 mx-2 bg-gray-900 rounded-lg">
      <img src="/images/geidel_profile.jpg" alt="Geidel Guerra Picture" class="mb-6 overflow-hidden rounded-full w-28 h-28">
      <h1 class="mb-4 text-4xl font-thin text-center">
        Geidel Guerra
      </h1>
      <h2 class="font-mono text-sm font-bold text-center uppercase">
        Software Developer - Laravel, Vuejs, Ansible.
      </h2>
      <div class="p-2 space-x-1 text-center">
        <template v-for="network in networks">
          <a
            :key="network.url"
            :href="network.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-green-500 hover:text-green-300"
          >
            {{ network.label }}
          </a>
        </template>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  data() {
    return {
      networks: [
        { label: 'LinkedIn', url: 'https://linkedin.com/in/geidelguerra' },
        { label: 'GitHub', url: 'https://github.com/geidelguerra' },
        { label: 'Twitter', url: 'https://twitter.com/geidelguerra' }
      ]
    }
  }
}
</script>
