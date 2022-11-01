<template>
  <div class="mx-auto max-w-screen-md w-full flex flex-col space-y-8 px-4 md:px-0">
    <section>
      <h2 class="font-black text-3xl tracking-tight mb-4">Who am I?</h2>
      <div v-html="about.replace(/\n/g, '<br>')" class="prose prose-invert"/>
    </section>
    <section>
      <h2 class="font-black text-3xl tracking-tight mb-4">Skills</h2>
      <p class="text-xs mb-2">
        The score's scale is 1 to 5. 1 been almost no experience and 5 been a lot of experience
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
import data from '~/data.js'
export default {
  data() {
    return data
  }
}
</script>
