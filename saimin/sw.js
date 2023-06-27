importScripts(['service-worker.js']);

let sw = new ServiceWorkerJS();

sw.precache('precached', [
	'./',
	'./complex.min.js',
	'./favicon.ico',
	'./jquery-3.6.0.min.js',
	'./jquery-ui.css',
	'./jquery-ui.min.js',
	'./main.js',
	'./manifest.webmanifest',
	'./mic.js',
	'./style.css',
	'./images/text_en.png',
	'./images/text_ja.png',
	'./images/text_zh-CN.png',
	'./images/gear.png',
	'./images/logo_en.png',
	'./images/logo_ja.png',
	'./images/logo_zh-CN.svg',
	'./images/mic.png',
	'./images/question.png',
	'./images/sound.png',
	'./images/speak.png',
	'./images/please-tap-here_en.svg',
	'./images/please-tap-here_ja.svg',
	'./images/please-tap-here_zh-CN.svg',
	'./images/hypnosis-released_en.svg',
	'./images/hypnosis-released_ja.svg',
	'./images/hypnosis-released_zh-CN.svg',
	'./images/killing-hypnosis_en.svg',
	'./images/killing-hypnosis_ja.svg',
	'./images/killing-hypnosis_zh-CN.svg',
	'.images/all-released_en.svg',
	'.images/all-released_ja.svg',
	'.images/all-released_zh-CN.svg',
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
