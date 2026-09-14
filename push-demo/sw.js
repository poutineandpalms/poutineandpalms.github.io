self.addEventListener('push', event => {
  let data = { title: 'Maple 🍁', body: 'Hello from your PWA!' };
  try {
    if (event.data) data = Object.assign(data, event.data.json());
  } catch (e) { /* fall back to defaults */ }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: 'maple-push'
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/push-demo/'));
});
