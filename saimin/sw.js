importScripts(['service-worker.js']);

let sw = new ServiceWorkerJS();

sw.precache('precached', [
	'./',
	'./index.html',
	'./complex.min.js',
	'./copyright.js',
	'./favicon.ico',
	'./icons/icon-192.png',
	'./jquery-3.6.0.min.js',
	'./jquery-ui.css',
	'./jquery-ui.min.js',
	'./main.js',
	'./manifest.json',
	'./mic.js',
	'./style.css',
]);

sw.addRoute(/\.mp3$/, { method: 'get' }, sw.networkOnly({ timeout: 3000 }));
