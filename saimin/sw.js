importScripts(['service-worker.js']);

let sw = new ServiceWorkerJS();

sw.precache('precached', [
	'./',
	'./complex.min.js',
	'./favicon.ico',
	'./icons/icon-192.png',
	'./jquery-3.6.0.min.js',
	'./jquery-ui.css',
	'./jquery-ui.min.js',
	'./main.js',
	'./manifest.json',
	'./mic.js',
	'./style.css',
	'./images/char.png',
	'./images/gear.png',
	'./images/heart.png',
	'./images/mic.png',
	'./images/question.png',
	'./images/sound.png',
	'./images/speak.png',
]);

sw.addRoute(/.*\.mp3$/, { method: 'get' }, sw.networkOnly({ timeout: 3000 }));

sw.addRoute('./images/ui-bg_glass_40_ffc73d_1x400.png', { method: 'get' }, sw.cacheFirst({ cache: 'postcached' }));
sw.addRoute('./images/ui-bg_highlight-hard_20_0972a5_1x100.png', { method: 'get' }, sw.cacheFirst({ cache: 'postcached' }));
sw.addRoute('./images/ui-bg_highlight-soft_33_003147_1x100.png', { method: 'get' }, sw.cacheFirst({ cache: 'postcached' }));
sw.addRoute('./images/ui-bg_highlight-soft_35_222222_1x100.png', { method: 'get' }, sw.cacheFirst({ cache: 'postcached' }));
sw.addRoute('./images/ui-bg_highlight-soft_44_444444_1x100.png', { method: 'get' }, sw.cacheFirst({ cache: 'postcached' }));
sw.addRoute('./images/ui-bg_highlight-soft_80_eeeeee_1x100.png', { method: 'get' }, sw.cacheFirst({ cache: 'postcached' }));
sw.addRoute('./images/ui-bg_loop_25_000000_21x21.png', { method: 'get' }, sw.cacheFirst({ cache: 'postcached' }));
sw.addRoute('./images/ui-icons_222222_256x240.png', { method: 'get' }, sw.cacheFirst({ cache: 'postcached' }));
sw.addRoute('./images/ui-icons_4b8e0b_256x240.png', { method: 'get' }, sw.cacheFirst({ cache: 'postcached' }));
sw.addRoute('./images/ui-icons_a83300_256x240.png', { method: 'get' }, sw.cacheFirst({ cache: 'postcached' }));
sw.addRoute('./images/ui-icons_cccccc_256x240.png', { method: 'get' }, sw.cacheFirst({ cache: 'postcached' }));
sw.addRoute('./images/ui-icons_ffffff_256x240.png', { method: 'get' }, sw.cacheFirst({ cache: 'postcached' }));
