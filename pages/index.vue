<template>
  <div class="mx-auto max-w-screen-md w-full flex flex-col space-y-8 px-4 md:px-0">
    <section>
      <h2 class="font-black text-3xl tracking-tight mb-4">Who am I?</h2>
      <div class="prose prose-invert">
        <p>
          I'm a self taught "Fullstack Developer" specialized in Laravel, VueJs and TailwindCSS. Hoping to make some
          games in the future.
        </p>
        <p>
          I've been learning to code for myself since I was 16. I started with Macromedia Flash 8 offline help. Then I
          jumped to C++, C#, Java, Python and eventually landed with PHP and JavaScript.
        </p>
        <p>
          I have experience developing SaaS applications, REST APIs, Third-Party integrations (Facebook, Twitter,
          Google, LinkedIn, YouTube, Stripe) and basic websites using NuxtJs and Vue.
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
      </div>
    </section>
    <section>
      <h2 class="font-black text-3xl tracking-tight mb-4">Skills</h2>
      <p class="text-xs mb-2">The score's scale is 1 to 5. 1 been almost no experience and 5 been a lot of experience
      </p>
      <div>
        <template v-for="skill in skills">
          <div :key="skill.label" class="flex space-x-2 items-center">
            <h3 class="w-32 whitespace-nowrap">
              <a v-if="skill.url" class="text-blue-300 hover:underline" :href="skill.url" target="_blank"
                rel="noopener noreferrer">
                {{ skill.label }}
              </a>
              <span v-else>{{ skill.label }}</span>
            </h3>
            <div class="relative overflow-hidden bg-slate-600 rounded-lg h-3 flex-1">
              <div :style="{ width: `${Math.ceil(skill.score * 100 / 5)}%` }"
                class="absolute left-0 top-0 h-3 bg-lime-600 rounded-lg"></div>
            </div>
            <div class="font-bold text-xs w-5">{{ skill.score }}</div>
          </div>
        </template>
      </div>
    </section>
    <section>
      <h2 class="font-black text-3xl tracking-tight mb-4">Languages</h2>
      <div>
        <template v-for="lang in languages">
          <div :key="lang.label" class="flex space-x-2 items-center">
            <h3>{{ lang.label }}</h3>
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
            <h3>{{ tool.category }}</h3>
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
    <section>
      <h2 class="font-black text-3xl tracking-tight mb-4">Projects</h2>
      <div class="flex flex-col space-y-4">
        <template v-for="project in projects">
          <div :key="project.name">
            <h3 class="font-bold">
              <a v-if="project.url" class="text-blue-300 hover:underline" :href="project.url" target="_blank"
                rel="noopener noreferrer">{{ project.name }}</a>
              <span v-else>{{ project.name }}</span>
            </h3>
            <div class="text-sm text-slate-400 mb-1 flex items-end space-x-1">
              <span>{{ project.startDate }}</span> <span class="mb-0.5">&rarr;</span> <span>{{ project.endDate }}</span>
            </div>
            <div>
              {{ project.description }}
            </div>
          </div>
        </template>
      </div>
    </section>
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
        { label: 'Laravel', score: 5, url: 'https://laravel.com' },
        { label: 'VueJs', score: 4, url: 'https://vuejs.org' },
        { label: 'InertiaJs', score: 4, url: 'https://inertiajs.com' },
        { label: 'DevOps', score: 4, url: 'https://www.martinfowler.com/bliki/DevOpsCulture.html' },
        { label: 'Ansible', score: 2.5, url: 'https://www.ansible.com' },
        { label: 'Git', score: 3.5, url: 'https://git-scm.com' },
        { label: 'MySQL', score: 2.5, url: 'https://www.mysql.com' },
        { label: 'NodeJs', score: 3, url: 'https://nodejs.org' },
        { label: 'AWS', score: 3, url: 'https://console.aws.amazon.com/' },
        { label: 'Laravel Vapor', score: 3.5, url: 'https://vapor.laravel.com' },
        { label: 'Laravel Forge', score: 3.5, url: 'https://forge.laravel.com' },
        { label: 'Laravel Envoyer', score: 3.5, url: 'https://envoyer.io' },
      ].sort((a, b) => {
        if (a.score > b.score) {
          return -1
        }

        if (a.score < b.score) {
          return 1
        }

        return 0
      }),
      toolkit: [
        { category: 'OS', name: 'Ubuntu 22.04' },
        { category: 'Editor', name: 'VSCode' },
        { category: 'Terminal', name: 'Kitty, Tmux' },
        { category: 'Shell', name: 'ZSH' },
      ],
      languages: [
        { label: 'Spanish', score: 'Native' },
        { label: 'English', score: 'Proficient (C2)', url: 'https://www.efset.org/cert/TNPV3e' },
      ],
      projects: [
        {
          name: 'Tenza Website',
          url: 'https://tenza.us',
          startDate: '2021-11',
          endDate: 'Present',
          description: 'Official website for Tenza Studio. Tech used: NuxtJs + TailwindCSS + ThreeJs + AnimeJs and Lottie. Hosted on Netlify'
        },
        {
          name: 'Alberto Hernandez Reyes Personal Website',
          url: 'https://albertohreyes.com/',
          startDate: '2018-06',
          endDate: '2021-12',
          description: 'Official website of the Cuban artist Alberto Hernandez. Tech used: NuxtJs + TailwindCSS. Hosted on Netlify'
        },
        {
          name: 'La Tinta Magazine Website',
          url: 'https://web.archive.org/web/20210119105411/https://www.latintamagazine.com/',
          startDate: '2018-03',
          endDate: '2021-01',
          description: 'Official website for the first Cuban magazine about body art. Tech used: NuxtJs + TailwindCSS. Hosted on Netlify'
        },
        {
          name: 'PlaceArt Website',
          url: 'https://www.placeart.app/',
          startDate: '2019-02',
          endDate: '2020-12',
          description: '"PlaceArt aims to lower Art access barriers through Augmented and Virtual Reality experiences that allow to visualize and customize fine art prints from the best of Public Domain Museum Art pieces around the world". Tech used: NuxtJs + Laravel + ThreeJs + AFrame'
        },
        {
          name: 'Fábrica de Arte Cubano Website',
          url: 'https://web.archive.org/web/20180618093513/https://fac.cu/',
          startDate: '2015-01',
          endDate: '2018-06',
          description: 'Official website for the multicultural site Fábrica de Arte Cubano. Tech used: Laravel 5 + Bootstrap + jQuery'
        },
        {
          name: 'Gráfica Interactiva II (with Serones Art Group)',
          url: 'https://www.youtube.com/watch?v=4kQNjOp4UJ8',
          startDate: '2017-01',
          endDate: '2017-03',
          description: 'This was a collaboration with a cuban art group called Serones. I was tasked with the coding of the 3D navigation system, event triggers and illumination. Tech used: Unity3D'
        },
      ]
    }
  }
}
</script>
