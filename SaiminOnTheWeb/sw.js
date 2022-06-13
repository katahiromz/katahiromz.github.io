// service worker
const
  version = '3.1.3',
  CACHE = version + '::PWAsite',
  offlineURL = 'index.html',
  installFilesEssential = [
    'index.html',
    'main.js',
    'manifest.json',
    'style.css',
    'complex.min.js',
    'jquery.js',
    'jquery-ui.min.css',
    'jquery-ui.min.js',
    'jquery-ui.theme.min.css',
    'mic.js',
    'sw.js',
    'copyright.js'
  ],
  installFilesDesirable = [
    'favicon.ico',
    'icons/icon-48.png',
    'icons/icon-96.png',
    'icons/icon-192.png',
    'icons/icon-256.png',
    'icons/icon-512.png',
    'icons/icon-maskable-256.png',
    'icons/apple-touch-icon.png',
    'images/ui-icons_444444_256x240.png',
    'images/ui-icons_555555_256x240.png',
    'images/ui-icons_777620_256x240.png',
    'images/ui-icons_777777_256x240.png',
    'images/ui-icons_cc0000_256x240.png',
    'images/ui-icons_ffffff_256x240.png'
  ];
// TODO: Add large files
const largeFiles = [
  'sn/Horror.mp3',
  'sn/kirakira.mp3',
  'sn/Magic.mp3',
  'sn/Weird.mp3',
];

// install static assets
function installStaticFiles() {
  return caches.open(CACHE)
    .then(cache => {
      // cache desirable files
      cache.addAll(installFilesDesirable);

      // cache essential files
      return cache.addAll(installFilesEssential);
    });
}

// application installation
self.addEventListener('install', event => {
  console.log('service worker: install');

  // cache core files
  event.waitUntil(
    installStaticFiles()
    .then(() => self.skipWaiting())
  );
});

// clear old caches
function clearOldCaches() {
  return caches.keys()
    .then(keylist => {
      return Promise.all(
        keylist
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      );
    });
}

// application activated
self.addEventListener('activate', event => {
  console.log('service worker: activate');

  // delete old caches
  event.waitUntil(
    clearOldCaches()
    .then(() => self.clients.claim())
  );
});

// application fetch network data
self.addEventListener('fetch', event => {
  // abandon non-GET requests
  if (event.request.method !== 'GET') return;

  let url = event.request.url;
  if (url.endsWith('/')) {
    return;
  }

  for (file in largeFiles) {
    if (url.endsWith(file)) {
      return;
    }
  }

  event.respondWith(
    caches.open(CACHE)
      .then(cache => {
        return cache.match(event.request)
          .then(response => {
            if (response) {
              // return cached file
              console.log('cache fetch: ' + url);
              return response;
            }
            // make network request
            return fetch(event.request)
              .then(newreq => {
                console.log('network fetch: ' + url);
                console.log(destination);
                if (newreq.ok) cache.put(event.request, newreq.clone());
                return newreq;
              })
              // app is offline
              .catch(() => offlineAsset(url));
          });
      })
  );
});

// is image URL?
let iExt = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].map(f => '.' + f);
function isImage(url) {
  return iExt.reduce((ret, ext) => ret || url.endsWith(ext), false);
}

// return offline asset
function offlineAsset(url) {
  if (isImage(url)) {
    // return image
    return new Response(
      '<svg role="img" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><title>offline</title><path d="M0 0h400v300H0z" fill="#eee" /><text x="200" y="150" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="50" fill="#ccc">offline</text></svg>',
      { headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-store'
      }}
    );
  }
  else {
    // return page
    return caches.match(offlineURL);
  }
}
