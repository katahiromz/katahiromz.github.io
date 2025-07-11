importScripts(['service-worker.js']);

let sw = new ServiceWorkerJS();

sw.precache('precached', [
	'./',
	'./camvas.js',
	'./complex.min.js',
	'./css/black.css',
	'./css/blue.css',
	'./css/common.css',
	'./css/darkgreen.css',
	'./css/golden.css',
	'./css/pink.css',
	'./css/purple.css',
	'./css/red.css',
	'./css/white.css',
	'./facelocker.js',
	'./favicon.ico',
	'./img/aim.svg',
	'./img/all-released_de.svg',
	'./img/all-released_en.svg',
	'./img/all-released_es.svg',
	'./img/all-released_it.svg',
	'./img/all-released_ja.svg',
	'./img/all-released_ko-KR.svg',
	'./img/all-released_ru.svg',
	'./img/all-released_zh-CN.svg',
	'./img/all-released_zh-TW.svg',
	'./img/arrow_left.svg',
	'./img/arrow_right.svg',
	'./img/back.svg',
	'./img/coin5yen.png',
	'./img/eye-left.png',
	'./img/eye-right.png',
	'./img/gear.svg',
	'./img/hypnosis-released_de.svg',
	'./img/hypnosis-released_en.svg',
	'./img/hypnosis-released_es.svg',
	'./img/hypnosis-released_it.svg',
	'./img/hypnosis-released_ja.svg',
	'./img/hypnosis-released_ko-KR.svg',
	'./img/hypnosis-released_ru.svg',
	'./img/hypnosis-released_zh-CN.svg',
	'./img/hypnosis-released_zh-TW.svg',
	'./img/killing-hypnosis_de.svg',
	'./img/killing-hypnosis_en.svg',
	'./img/killing-hypnosis_es.svg',
	'./img/killing-hypnosis_it.svg',
	'./img/killing-hypnosis_ja.svg',
	'./img/killing-hypnosis_ko-KR.svg',
	'./img/killing-hypnosis_ru.svg',
	'./img/killing-hypnosis_zh-CN.svg',
	'./img/killing-hypnosis_zh-TW.svg',
	'./img/logo_de.svg',
	'./img/logo_en.svg',
	'./img/logo_es.svg',
	'./img/logo_it.svg',
	'./img/logo_ja.svg',
	'./img/logo_ko-KR.svg',
	'./img/logo_ru.svg',
	'./img/logo_zh-CN.svg',
	'./img/logo_zh-TW.svg',
	'./img/mic.svg',
	'./img/play.svg',
	'./img/please-tap-here_de.svg',
	'./img/please-tap-here_en.svg',
	'./img/please-tap-here_es.svg',
	'./img/please-tap-here_it.svg',
	'./img/please-tap-here_ja.svg',
	'./img/please-tap-here_ko-KR.svg',
	'./img/please-tap-here_ru.svg',
	'./img/please-tap-here_zh-CN.svg',
	'./img/please-tap-here_zh-TW.svg',
	'./img/question.svg',
	'./img/side.svg',
	'./img/sound.svg',
	'./img/speak.svg',
	'./img/spiral.svg',
	'./img/spiral2.svg',
	'./img/stop.svg',
	'./kaleido.js',
	'./main.js',
	'./manifest.json',
	'./mic.js',
	'./pico.js',
	'./translation.js',
]);

sw.addRoute(/.*\.mp3$/, { method: 'get' }, sw.networkOnly({ timeout: 3000 }));
