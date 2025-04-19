importScripts(['service-worker.js']);

let sw = new ServiceWorkerJS();
sw.precache('precached', [
	'./',
	'./audio/alert.mp3',
	'./audio/icons/icon-48.png',
	'./audio/icons/icon-96.png',
	'./audio/icons/icon-192.png',
	'./audio/icons/icon-256.png',
	'./audio/icons/icon-maskable-256.png.png',
	'./audio/img/back.svg',
	'./audio/img/bg.png',
	'./audio/img/gear.svg',
	'./audio/img/question.svg',
	'./audio/img/red-light.png',
	'./audio/img/screw.png',
	'./index.html',
	'./main.js',
	'./manifest.json',
	'./service-worker.js',
	'./style.css',
	'./sw.js',
]);
