module.exports = {
  about: `I'm a self taught "Software Developer" specialized in PHP, JavaScript and Python. Hoping to make at least 1 minigame in the future.

  I've been learning to code for myself since I was 16. I started with Macromedia Flash 8 offline help. Then I jumped to C++, C#, Java, Python and eventually landed with PHP and JavaScript where I spent most of my time until recently when I started to work with Python (for real) to create tools and web applications and I love it.
  
  I have experience developing SaaS applications, REST APIs, Third-Party integrations (Facebook, Twitter, Google, LinkedIn, YouTube, Stripe) and basic websites using NuxtJs and Vue.
  
  I have some experience with AWS and DevOps. I use Digital Ocean for my personal stuff.
  
  I have basic knowledge of Git. I use GitHub for all my personal and company projects.
  
  I've been using Ubuntu Desktop for about 6 years. I use ZSH, Kitty and VSCode.
  
  I know about Jira, Trello, ClickUp and other project management tools. Also know a little about SCRUM methodology and have been using it for a while.
  
  Proficient in English, native Spanish speaker.
  `,
  networks: [
    { label: 'LinkedIn', url: 'https://linkedin.com/in/geidelguerra' },
    { label: 'GitHub', url: 'https://github.com/geidelguerra' },
    { label: 'Twitter', url: 'https://twitter.com/geidelguerra' }
  ],
  skills: [
    { label: 'ChatGPT', score: 3, url: 'https://platform.openai.com/' },
    { label: 'Docker', score: 3, url: 'https://www.docker.com/' },
    { label: 'MongoDB', score: 3, url: 'https://www.mongodb.com/' },
    { label: 'Python', score: 3, url: 'https://www.python.org/' },
    { label: 'PHP', score: 4, url: 'https://php.net' },
    { label: 'JavaScript', score: 4, url: 'https://php.net' },
    { label: 'Laravel', score: 4, url: 'https://laravel.com' },
    { label: 'VueJs', score: 4, url: 'https://vuejs.org' },
    { label: 'DevOps', score: 4, url: 'https://www.martinfowler.com/bliki/DevOpsCulture.html' },
    { label: 'Ansible', score: 2.5, url: 'https://www.ansible.com' },
    { label: 'Git', score: 3.5, url: 'https://git-scm.com' },
    { label: 'MySQL', score: 3, url: 'https://www.mysql.com' },
    { label: 'AWS', score: 2.5, url: 'https://console.aws.amazon.com/' },
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
    { label: 'English', score: 'Proficient (C2)', url: 'https://www.efset.org/cert/2j6mot' },
  ],
  experience: [
    {
      name: 'Fullstack Developer',
      company: 'Cerberu',
      startDate: '2023-02',
      endDate: 'Present'
    },
    {
      name: 'CTO / Fullstack Developer',
      company: 'La Caja Company',
      startDate: '2020-08',
      endDate: '2023-02'
    },
    {
      name: 'Content Manager / Maintainer',
      company: 'Artcrónica',
      startDate: '2018-06',
      endDate: '2022-04'
    },
    {
      name: 'Fullstack Developer',
      company: 'NextReality Digital',
      startDate: '2019-02',
      endDate: '2020-12'
    },
    {
      name: 'Fullstack Developer',
      company: 'Fábrica de Arte Cubano',
      startDate: '2014-12',
      endDate: '2018-05'
    },
    {
      name: 'Videogame Developer',
      company: 'Joven Club de Computación y Electrónica',
      startDate: '2013-10',
      endDate: '2014-12'
    }
  ],
  projects: [
    {
      name: 'Klipers Saas',
      url: 'https://klipers.com',
      startDate: '2022-02',
      endDate: '2023-02',
      description: '"Dashboards for Ecommerce made easy". Tech used: Laravel + InertiaJs + TailwindCSS. Hosted on AWS with Laravel Vapor'
    },
    {
      name: 'Contegy Saas',
      url: 'https://contegy.io',
      startDate: '2020-08',
      endDate: '2023-02',
      description: '"The Content Operations Platform for Agencies and Brands". Tech used: Laravel + InertiaJs + TailwindCSS. Hosted on AWS with Laravel Forge and Envoyer'
    },
    {
      name: 'Tenza Website',
      url: 'https://tenza.us',
      startDate: '2021-11',
      endDate: 'Present',
      description: 'Official website for Tenza Studio. Tech used: NuxtJs + TailwindCSS + ThreeJs + AnimeJs and Lottie. Hosted on Netlify'
    },
    {
      name: 'Alberto Hernandez Reyes Personal Website',
      url: 'https://web.archive.org/web/20220613222648/https://albertohreyes.com/',
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
    }
  ]
}
