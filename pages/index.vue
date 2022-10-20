<template>
  <div class="mx-auto max-w-screen-md w-full flex flex-col space-y-8">
    <section>
      <h2 class="font-black text-3xl tracking-tight mb-4">Who am I?</h2>
      <div class="prose prose-invert">
        <p>
          I'm a self taught “Fullstack Developer” specialized in Laravel, Vuejs and TailwindCSS. Hoping to make some
          games in the future.
        </p>
        <p>
          I've been learning to code for myself since I was 16. I started with Macromedia Flash 8 offline help. Then I
          jumped to C++, C#, Java, Python and eventually landed with PHP and JavaScript.
        </p>
        <p>

          I have experience developing SaaS applications, REST APIs, Third-Party integrations (Facebook, Twitter,
          Google,
          LinkedIn, YouTube) and basic websites using NuxtJs and Vue.
        </p>
        <p>
          I have some experience with AWS and DevOps. I use Digital Ocean for my personal stuff.
        </p>
        <p>
          I have basic knowledge of Git. I use GitHub for all my personal and company projects.
        </p>
        <p>
          I've been using Ubuntu Desktop for about 6 years. I use ZSH, Kitty and VSCode.
        </p>
        <p>
          I know about Jira, Trello, ClickUp and other project management tools. Also know a little about SCRUM
          methodology and have been using it for a while.
        </p>
        <p>
          Proficient in English, native Spanish speaker.
        </p>
        <p>
          EOF
        </p>
      </div>
    </section>
    <section>
      <h2 class="font-black text-3xl tracking-tight mb-4">Skills</h2>
      <div>
        <template v-for="skill in skills">
          <div :key="skill.label" class="flex space-x-2 items-center">
            <h3 class="w-16">{{ skill.label }}</h3>
            <div class="relative overflow-hidden bg-slate-600 rounded-lg h-3 flex-1">
              <div :style="{width: `${Math.ceil(skill.score * 100 / 5)}%`}"
                class="absolute left-0 top-0 h-3 bg-lime-600 rounded-lg"></div>
            </div>
          </div>
        </template>
      </div>
    </section>
    <section>
      <h2 class="font-black text-3xl tracking-tight mb-4">Languages</h2>
      <div>
        <template v-for="lang in languages">
          <div :key="lang.label" class="flex space-x-2 items-center">
            <h3 class="w-16">{{ lang.label }}</h3>
            <div class="flex-1 h-px bg-slate-600"></div>
            <div>
              <a v-if="lang.url" class="text-blue-300 hover:underline" :href="lang.url" target="_blank"
                rel="noopener noreferrer">{{ lang.score }}</a>
              <span v-else>{{ lang.score }}</span>
            </div>
          </div>
        </template>
      </div>
    </section>
    <section>
      <h2 class="font-black text-3xl tracking-tight mb-4">Toolkit</h2>
      <div>
        <template v-for="tool in toolkit">
          <div :key="tool.category" class="flex space-x-2 items-center">
            <h3 class="w-16">{{ tool.category }}</h3>
            <div class="flex-1 h-px bg-slate-600"></div>
            <div>
              <a v-if="tool.url" class="text-blue-300 hover:underline" :href="tool.url" target="_blank"
                rel="noopener noreferrer">{{ tool.name }}</a>
              <span v-else>{{ tool.name }}</span>
            </div>
          </div>
        </template>
      </div>
    </section>
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
  </div>
</template>

<script>
export default {
  data() {
    return {
      networks: [
        { label: 'LinkedIn', url: 'https://linkedin.com/in/geidelguerra' },
        { label: 'GitHub', url: 'https://github.com/geidelguerra' },
        { label: 'Twitter', url: 'https://twitter.com/geidelguerra' }
      ],
      skills: [
        { label: 'Laravel', score: 5 },
        { label: 'VueJs', score: 4 },
        { label: 'Git', score: 3.5 },
        { label: 'Ansible', score: 2.5 },
      ],
      toolkit: [
        { category: 'OS', name: 'Ubuntu 22.04' },
        { category: 'Editor', name: 'VSCode' },
        { category: 'Terminal', name: 'Kitty, Tmux' },
        { category: 'Shell', name: 'ZSH' },
      ],
      languages: [
        { label: 'Spanish', score: 'Native' },
        { label: 'English', score: 'Proficient (C2)', url: 'https://www.efset.org/cert/TNPV3e' },
      ]
    }
  }
}
</script>
