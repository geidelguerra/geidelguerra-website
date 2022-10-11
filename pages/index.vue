<template>
  <section class="relative">
    <!-- <div
      class="container absolute top-0 bottom-0 left-0 right-0 z-10 flex flex-col items-center justify-center h-full mx-auto">
      <div class="flex flex-col items-center justify-center p-6 mx-2">
        <img src="/images/geidel_profile.jpg" alt="Geidel Guerra Picture"
          class="mb-6 overflow-hidden rounded-full w-28 h-28 ring-white ring-2">
        <h1 class="mb-4 text-4xl font-thin text-center">
          Geidel Guerra
        </h1>
        <h2 class="font-mono text-sm tracking-tighter text-center mb-4">
          Software Developer - Laravel, Vuejs, Ansible.<br>Hoping to make some games in the future :)
        </h2>
        <div>
          <p class="text-center text-lg">Where to find me?</p>
          <ul class="space-x-2 text-center flex">
            <template v-for="network in networks">
              <li :key="network.url">
                <a :href="network.url" target="_blank" rel="noopener noreferrer"
                  class="text-green-500 hover:text-green-300 block">
                  {{ network.label }}
                </a>
              </li>
            </template>
          </ul>
        </div>
      </div>
    </div> -->
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
