---
title: How to setup Laravel Echo with InertiaJs
description: Learn in a few minutes how to setup Laravel Echo when using InertiaJs.
---

If you are working with InertiaJs and are having trouble making Laravel Echo to work properly, keep reading.
<!--more-->

It is stated in the Laravel [documentation](https://laravel.com/docs/9.x/broadcasting#only-to-others-configuration) the following:

> If you are not using a global Axios instance, you will need to manually configure your JavaScript application to send the X-Socket-ID header with all outgoing requests. You may retrieve the socket ID using the Echo.socketId method:

The code below is an example of how to do exactly that with InertiaJs.

```javascript
import { Inertia } from '@inertiajs/inertia'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js';

window.Pusher = Pusher;

// Basic Echo configuration that comes with Laravel
window.Echo = new Echo({
  broadcaster: 'pusher',
  key: import.meta.env.VITE_PUSHER_APP_KEY,
  wsHost: import.meta.env.VITE_PUSHER_HOST ?? `ws-${import.meta.env.VITE_PUSHER_CLUSTER}.pusher.com`,
  wsPort: import.meta.env.VITE_PUSHER_PORT ?? 80,
  wssPort: import.meta.env.VITE_PUSHER_PORT ?? 443,
  forceTLS: (import.meta.env.VITE_PUSHER_SCHEME ?? 'https') === 'https',
  enabledTransports: ['ws', 'wss'],
  encrypted: true,
  disableStats: true
});

// This is required for Laravel Echo to work with Inertia
Inertia.on('before', (event) => {
  event.detail.visit.headers['X-Socket-ID'] = window.Echo.socketId()
})
```

Basically we are sending the Laravel Echo socket Id with each InertiaJs request. That's it!
You don't need to do anything else on the client side.

Of course, for Laravel Echo to work, you need to have a Websocket server running on your backend.. but that is a topic for another post.