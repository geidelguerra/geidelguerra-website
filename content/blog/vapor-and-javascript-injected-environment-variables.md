---
title: Laravel Vapor and injected javascript environment variables
description: If you are using Laravel Vapor and need to inject some environment variables to javascript keep reading.
---

If you are using Laravel Vapor and need to inject some environment variables to
javascript keep reading.
<!--more-->

Recently we start using Laravel Echo in a project to receive server side events and update the frontend using `Inertia.reload()` (see [Inertia](https://inertiajs.com/), I highly recommend it)

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      ...other stuff

      - name: Deploy Environment
        run: vapor deploy production
        env:
          VAPOR_API_TOKEN: ${{ secrets.VAPOR_API_TOKEN }}
          VITE_PUSHER_APP_KEY: Q-AVxQ.K6E89Q
          VITE_PUSHER_HOST: realtime-pusher.ably.io
```
