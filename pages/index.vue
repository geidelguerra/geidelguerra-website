<template>
  <div class="mx-auto max-w-screen-md w-full flex flex-col space-y-8 px-4 md:px-0">
    <section>
      <h2 class="font-black text-3xl tracking-tight mb-4">Who am I?</h2>
      <div v-html="about.replace(/\n/g, '<br>')" class="prose prose-invert" />
    </section>
    <section>
      <h2 class="font-black text-3xl tracking-tight mb-4">Skills</h2>
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
      <h2 class="font-black text-3xl tracking-tight mb-4">Experience ({{ totalYearsOfExperience }})</h2>
      <div class="flex flex-col space-y-4">
        <template v-for="item in experience">
          <div :key="item.name">
            <h3 class="font-bold">
              <a v-if="item.url" class="text-blue-300 hover:underline" :href="item.url" target="_blank"
                rel="noopener noreferrer">{{ item.name }}</a>
              <span v-else>{{ item.name }}</span>
            </h3>
            <div class="text-sm">{{ item.company }}</div>
            <div class="text-sm text-slate-400 mb-1 flex items-end space-x-1">
              <span>{{ item.startDate }}</span> <span class="mb-0.5">&rarr;</span> <span>{{ item.endDate }}</span>
              <span>({{ dateDiff(item.startDate, item.endDate) }})</span>
            </div>
            <div v-if="item.skills" class="text-sm text-slate-400">
              Skills: {{ item.skills.join(', ') }}
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
              <span>({{ dateDiff(project.startDate, project.endDate) }})</span>
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
import { dateDiff } from '~/lib/utils.js'

export default {
  data() {
    return data
  },
  computed: {
    totalYearsOfExperience() {
      return dateDiff('2013-10', new Date())
    }
  },
  methods: {
    dateDiff(dateA, dateB) {
      return dateDiff(dateA, dateB)
    }
  }
}
</script>
