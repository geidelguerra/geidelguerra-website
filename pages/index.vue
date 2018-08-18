<template>
  <main class="flex flex-col">
    <section class="pt-20 pb-20 flex-1 flex justify-center items-center">
      <div class="max-w-md mx-auto">
        <transition name="fade-in-top" mode="out-in" appear>
          <h1 class="text-center pl-4 pr-4 font-thin" :key="message">{{ message }}</h1>
        </transition>
      </div>
    </section>

    <section class="pt-20 pb-20" :class="{'bg-blue-dark': availableForHire, 'bg-orange-dark': !availableForHire}">
      <div class="max-w-md mx-auto">
        <h2 class="text-center pl-4 pr-4 text-white">{{ availableForHire ? 'I\'m available for hire! ;)' : 'Sorry. I\'m not taking projects at the moment :(' }}</h2>
        <div v-if="availableForHire" class="text-center text-grey-light pl-4 pr-4">
          just drop me an <a :href="`mailto:${contactEmail}`">email</a>
        </div>
      </div>
    </section>
  </main>
</template>

<script>
export default {
  mounted () {
    if (this.messages.length > 1) {
      this.messageIntervalId = setInterval(this.nextMessage.bind(this), this.messageDelay);
    }
  },

  beforeDestroyed () {
    clearInterval(this.messageIntervalId);
    this.messageIntervalId = null;
  },

  data () {
    return {
      messageIndex: 0,
      messages: [
        'Building it brick by brick',
        'by a team of one person',
        'Comming soon!',
      ],
      messageIntervalId: null,
      messageDelay: 6000, // 6s
      availableForHire: true,
      contactEmail: 'me@geidelguerra.com',
    }
  },

  computed: {
    message () {
      return this.messages[this.messageIndex];
    }
  },

  methods: {
    nextMessage () {
      let nextIndex = this.messageIndex + 1;

      if (nextIndex >= this.messages.length) {
        nextIndex = 0;
      }

      this.messageIndex = nextIndex;
    }
  },
}
</script>
