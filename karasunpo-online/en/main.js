// main.js -- Karasunpo Online (English)
// Copyright (C) 2021-2024 Katayama Hirofumi MZ. All Rights Reserved.
// License: MIT

const KARASUNPO_VERSION = "0.9.6"; // カラスンポのバージョン番号。

import * as pdfjsLib from 'pdfjs-dist'
var { pdfjsLib } = globalThis;
pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.mjs';

(function($){
	// 厳密に。
	'use strict';

	const DEBUGGING = false; // デバッグ中か？
	const TOUCH_TIMEOUT = 200; // タッチのタイムアウト（ミリ秒）。

	const ERROR_ENTER_PASSWORD = "Please enter a password:";
	const ERROR_REENTER_PASSWORD = "Invalid password. Please enter another password:";

	const MESSAGE_LOADING = "Loading...";
	const MESSAGE_CONFIG_DIALOG = "Configuration";
	const MESSAGE_ABOUT = "About this Web app";
	const MESSAGE_HISTORY = "History";
	const MESSAGE_LENGTH = "Length:";
	const MESSAGE_INCLINATION = "Inclination:";
	const MESSAGE_ANGLE = "Angle:";
	const MESSAGE_DEGREE = "deg";
	const MESSAGE_COPYED = 'Copyed!';
	const MESSAGE_FAILED_TO_COPY = 'Sorry, failed to copy.';
	const MESSAGE_WANNA_INIT_APP = 'Do you want to initialize the application?';

	const VK_LBUTTON = 0; // マウスの左ボタン。
	const VK_MBUTTON = 1; // マウスの中央ボタン。
	const VK_RBUTTON = 2; // マウスの右ボタン。

	// ダイアログでEnterキーを有効にする。
	// See https://stackoverflow.com/questions/868889/submit-jquery-ui-dialog-on-enter
	$.extend($.ui.dialog.prototype.options, {
		create: function() {
			var $this = $(this);
			// focus first button and bind enter to it
			$this.parent().find('.ui-dialog-buttonpane button:first').focus();
			$this.keypress(function(e) {
				if( e.keyCode == $.ui.keyCode.ENTER ) {
					$this.parent().find('.ui-dialog-buttonpane button:first').click();
					return false;
				}
			});
		}
	});

	// 全角→半角（英数字）。
	var zenkakuToHankaku = function(str){
		return str.replace(/[！-～]/g, function(s){
			return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
		});
	};

	// HTMLの特殊文字を変換。
	var htmlspecialchars = function(str){
		return (str + '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#039;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
	};

	// 縦長のデバイスか？
	var isPortraitDevice = function(){
		return (window.innerWidth <= window.innerHeight);
	};

	// スマートフォンか？
	var isSmartPhone = function(){
		return navigator.userAgent.match(/iPhone|Android.+Mobile/);
	};

	// タブレットか？
	var isTablet = function(){
		var ua = navigator.userAgent;
		if (ua.indexOf("iPad") != -1)
			return true;
		if (ua.indexOf("Android") != -1 && ua.indexOf("Mobile") == -1)
			return true;
		return false;
	};

	// デバッグトレース情報を取得する。
	var getStackTrace = function(){
		var obj = {};
		Error.captureStackTrace(obj, getStackTrace);
		return obj.stack;
	};

	// draw an arrow
	var drawArrow = function(ctx, fromx, fromy, tox, toy, headlen = 20) {
		var dx = tox - fromx;
		var dy = toy - fromy;
		var angle = Math.atan2(dy, dx);
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		ctx.moveTo(tox, toy);
		ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
		ctx.moveTo(tox, toy);
		ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(fromx + headlen * Math.cos(angle - Math.PI / 6), fromy + headlen * Math.sin(angle - Math.PI / 6));
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(fromx + headlen * Math.cos(angle + Math.PI / 6), fromy + headlen * Math.sin(angle + Math.PI / 6));
	}

	// We use module-pattern.
	var Karasunpo = {
		image: null, // 画像。
		cxImage: 0, // 画像の幅（ピクセル単位）。
		cyImage: 0, // 画像の高さ（ピクセル単位）。
		cxCanvas: 0, // キャンバスの幅（ピクセル単位）。
		cyCanvas: 0, // キャンバスの高さ（ピクセル単位）。
		measureType: "length", // 測定タイプ。
		taskMode: 1, // モード。
		fitMode: "Fit", // 画面モード（""：何もしない、"Fit"：全体に合わせる、"hFit"：横方向に合わせる、"vFit"：縦方向に合わせる）。
		zoomRate: 100.0, // ズーム率（百分率）。
		canDraw: false, // 描画できるか？
		isDrawing: false, // 描画中か？
		penOn: false, // ペンはキャンバス上にあるか？
		lineOn: false, // 線分をキャンバスに表示するか？
		movingOn: false, // 画像を動かしているか？
		handlingOn: -1, // ハンドルを動かしているか？
		backgroundImage: null, // 背景イメージ。
		backgroundMode: -2, // 背景モード（-2：市松模様、0：黒、1：白、2：緑、3：青、4：マゼンタ、5：赤）。
		isRadian: false, // ラジアンか？
		deltaX: 0, // 画面中央からのずれ（ピクセル単位）。
		deltaY: 0, // 画面中央からのずれ（ピクセル単位）。
		px0: 0, // 線分の位置。
		py0: 0, // 線分の位置。
		px1: 0, // 線分の位置。
		py1: 0, // 線分の位置。
		sx0: 0, // 基準線分の位置。
		sy0: 0, // 基準線分の位置。
		sx1: 0, // 基準線分の位置。
		sy1: 0, // 基準線分の位置。
		mx0: 0, // 中央ボタンでドラッグしている位置。
		my0: 0, // 中央ボタンでドラッグしている位置。
		hotspotx: null, // マウスまたはタッチの場所。
		hotspoty: null, // マウスまたはタッチの場所。
		savepx0: null, // 保存用。
		savepy0: null, // 保存用。
		savepx1: null, // 保存用。
		savepy1: null, // 保存用。
		lineColor: 'red', // 線分の色。
		shouldDrawCircle: false, // 補助円を描くか？
		isPDF: false, // PDFファイルか？
		isPdfDrawing: false, // PDF描画中？
		pdf: null, // PDFオブジェクト。
		pdfPageNumber: 1, // PDFのページ番号。
		stdNominalLength: 0, // 基準線分の長さ（名目）。
		lengthUnit: "", // 長さの単位。
		filename: "", // ファイル名。
		isTouchPinching: false, // ピンチング中か？
		touchX: null, // タッチ位置の平均。
		touchY: null, // タッチ位置の平均。
		touchDistance: null, // 二本指のタッチ距離。
		touchTimer: null, // タッチ用のタイマー。
		info: [], // デバッグ用情報。
		// ハンドルのサイズを取得する。
		getHandleSize: function() {
			return 10;
		},
		// 感知半径を取得する。
		getSensitiveRadius: function() {
			if (isSmartPhone() || isTablet())
				return 55;
			return 30;
		},
		// 画面の大きさを表す指標を取得する。
		getScreenSizeIndex: function() {
			if (window.innerWidth < window.innerHeight) {
				return window.innerWidth / 100;
			} else {
				return window.innerHeight / 100;
			}
		},
		// 線分を変更する。
		setSegment: function(x0, y0, x1, y1) {
			if (x0 == this.px0 && y0 == this.py0 && x1 == this.px1 && y1 == this.py1)
				return;
			this.px0 = x0;
			this.py0 = y0;
			this.px1 = x1;
			this.py1 = y1;
			if (x0 === null || (x0 == x1 && y0 == y1)) {
				//alert(getStackTrace());
			}
		},
		// タップ位置を取得する為の関数。
		touchGetPos: function(e, i = 0) {
			var rect = $("#image-screen")[0].getBoundingClientRect();
			var touch = e.touches[i] || e.changedTouches[i];
			return {
				x : touch.clientX - rect.left,
				y : touch.clientY - rect.top
			};
		},
		// 画像の中央座標を取得する。
		getImageCenter: function(){
			if (this.isPDF) {
				if (this.pdf == null)
					return [0, 0];
			} else {
				if (this.image == null)
					return [0, 0];
			}
			return [this.cxImage / 2, this.cyImage / 2];
		},
		// キャンバスの中央座標を取得する。
		getCanvasCenter: function(){
			if (this.isPDF) {
				if (this.pdf == null)
					return [0, 0];
			} else {
				if (this.image == null)
					return [0, 0];
			}
			return [this.cxCanvas / 2, this.cyCanvas / 2];
		},
		// 論理座標は、画像上の座標で、画像の中心を原点とする。
		// 物理座標は、キャンバス上の実際の座標とする。
		// 論理座標から物理座標へ。
		LPtoDP: function(x, y) {
			var IC = this.getImageCenter();
			x += IC[0];
			y += IC[1];
			x *= this.zoomRate / 100.0;
			y *= this.zoomRate / 100.0;
			var CC = this.getCanvasCenter();
			x += CC[0];
			y += CC[1];
			x += this.deltaX;
			y += this.deltaY;
			return [x, y];
		},
		// 物理座標から論理座標へ。
		DPtoLP: function(x, y) {
			x -= this.deltaX;
			y -= this.deltaY;
			var CC = this.getCanvasCenter();
			x -= CC[0];
			y -= CC[1];
			x /= this.zoomRate / 100.0;
			y /= this.zoomRate / 100.0;
			var IC = this.getImageCenter();
			x -= IC[0];
			y -= IC[1];
			return [x, y];
		},
		// 市松模様を描画する。
		drawChecker: function(ctx, cx, cy) {
			ctx.save();
			// 背景をライトグレーで塗りつぶす。
			ctx.fillStyle = "rgb(191, 191, 191)";
			ctx.fillRect(0, 0, Math.floor(cx), Math.floor(cy));
			// ダークグレーで正方形を連続で描く。
			ctx.fillStyle = "rgb(90, 90, 90)";
			var i, j, size = 16;
			j = 0;
			for (var y = 0; y < cy + size; (y += size), ++j) {
				i = (j % 2 == 0) ? 1 : 0;
				for (var x = 0; x < cx + size; (x += size), ++i) {
					if (i % 2 == 0) {
						ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(size), Math.floor(size));
					}
				}
			}
			ctx.restore();
		},
		// 背景を描画する。
		drawBackground: function(ctx, cx, cy) {
			ctx.save();
			switch (this.backgroundMode) {
			case -2: // 市松模様。
				this.drawChecker(ctx, cx, cy);
				break;
			case 0: // 黒。
				ctx.fillStyle = "rgb(0, 0, 0)";
				ctx.fillRect(0, 0, cx, cy);
				break;
			case 1: // 白。
				ctx.fillStyle = "rgb(255, 255, 255)";
				ctx.fillRect(0, 0, cx, cy);
				break;
			case 2: // 緑。
				ctx.fillStyle = "rgb(0, 192, 0)";
				ctx.fillRect(0, 0, cx, cy);
				break;
			case 3: // 青。
				ctx.fillStyle = "rgb(0, 0, 255)";
				ctx.fillRect(0, 0, cx, cy);
				break;
			case 4: // マゼンタ。
				ctx.fillStyle = "rgb(255, 0, 255)";
				ctx.fillRect(0, 0, cx, cy);
				break;
			case 5: // 赤。
				ctx.fillStyle = "rgb(255, 0, 0)";
				ctx.fillRect(0, 0, cx, cy);
				break;
			}
			ctx.restore();
			// 高速化のためにイメージデータを保存する。
			this.backgroundImage = ctx.getImageData(0, 0, this.cxCanvas, this.cyCanvas);
		},
		// レンダリング完了。
		gotRendered: function(ctx){
			this.isPdfDrawing = false;
			this.doRedrawFinish(ctx, true);
		},
		// レンダリング失敗。
		failedToRender: function(ctx){
			this.isPdfDrawing = false;
			this.doRedrawFinish(ctx, false);
		},
		// PDFページを取得した。
		gotPage: function(page, canvas, ctx){
			if (!this.cxImage || !this.cyImage) {
				var viewport = page.getViewport({
					scale: 1.0
				});
				if (viewport.width && viewport.height) {
					this.cxImage = viewport.width;
					this.cyImage = viewport.height;
				} else {
					this.doRedrawFinish(ctx, false);
				}
			}
			// ズームしたサイズ。
			var zoomedWidth = this.cxImage * this.zoomRate / 100.0;
			var zoomedHeight = this.cyImage * this.zoomRate / 100.0;
			// 描画位置（物理座標）。
			var px = (this.cxCanvas - zoomedWidth) / 2;
			var py = (this.cyCanvas - zoomedHeight) / 2;
			// PDFのレンダリングで余白が描画されないことがあるのでここで白く塗りつぶす。
			ctx.save();
			ctx.fillStyle = "rgb(255, 255, 255)";
			ctx.fillRect(px + this.deltaX, py + this.deltaY, zoomedWidth, zoomedHeight);
			ctx.restore();
			// ビューポートを取得。
			var viewport = page.getViewport({
				scale: this.zoomRate / 100.0,
				offsetX: px + this.deltaX,
				offsetY: py + this.deltaY
			});
			// PDFレンダリング開始。
			var renderContext = {
				canvasContext: ctx,
				viewport: viewport,
				background: "rgba(255, 255, 255, 0)"
			};
			this.isPdfDrawing = true;
			var renderTask = page.render(renderContext);
			renderTask.promise.then(function(){
				// PDFレンダリング完了。
				Karasunpo.gotRendered.call(Karasunpo, ctx);
			}, function(reason){
				// PDFレンダリング失敗。
				Karasunpo.failedToRender.call(Karasunpo, ctx);
			});
		},
		// PDFを表示する。
		putPDF: function(canvas, ctx) {
			if (!this.isPDF || !this.pdf) {
				this.doRedrawFinish(ctx, false);
				return;
			}
			var Karasunpo = this;
			this.pdf.getPage(this.pdfPageNumber).then(function(page){
				Karasunpo.gotPage.call(Karasunpo, page, canvas, ctx);
			}, function(reason) {
				Karasunpo.failedToRender.call(Karasunpo, ctx);
			});
		},
		// 画像を表示する。
		putImage: function(canvas, ctx) {
			if (this.isPDF || !this.image) {
				this.doRedrawFinish(ctx, false);
				return;
			}
			var zoomedWidth = this.cxImage * this.zoomRate / 100.0;
			var zoomedHeight = this.cyImage * this.zoomRate / 100.0;
			var px = (this.cxCanvas - zoomedWidth) / 2;
			var py = (this.cyCanvas - zoomedHeight) / 2;
			// アンチエイジングを無効にする。
			ctx.mozImageSmoothingEnabled = false;
			ctx.webkitImageSmoothingEnabled = false;
			ctx.msImageSmoothingEnabled = false;
			ctx.imageSmoothingEnabled = false;
			// 画像を描画。
			ctx.drawImage(this.image, px + this.deltaX, py + this.deltaY, zoomedWidth, zoomedHeight);
			this.doRedrawFinish(ctx, true);
		},
		// ズーム率を設定する。
		setZoom: function(percents) {
			if (this.isPDF) {
				if (this.pdf == null)
					return;
			} else {
				if (this.image == null)
					return;
			}

			if (!this.cxImage || !this.cyImage)
				return;

			// ズームするときのサイズの制限。
			var minWidth = 50, minHeight = 50;
			var maxWidth = 10000, maxHeight = 10000;

			// ズーム率を制限する。
			if (percents * this.cxImage / 100.0 < minWidth) {
				percents = minWidth * 100.0 / this.cxImage;
			}
			if (percents * this.cyImage / 100.0 < minHeight) {
				percents = minHeight * 100.0 / this.cyImage;
			}
			if (percents * this.cxImage / 100.0 > maxWidth) {
				percents = maxWidth * 100.0 / this.cxImage;
			}
			if (percents * this.cyImage / 100.0 > maxHeight) {
				percents = maxHeight * 100.0 / this.cyImage;
			}

			this.zoomRate = percents;
		},
		// 画像を画面のサイズに合わせる。
		doFit0: function(width, height) {
			this.cxImage = width;
			this.cyImage = height;
			switch (this.fitMode) {
			case "Fit": // 自動
				if (this.cxCanvas / this.cyCanvas > width / height) {
					this.setZoom(this.cyCanvas / height * 100);
				} else {
					this.setZoom(this.cxCanvas / width * 100);
				}
				break;
			case "hFit": // 横方向に合わせる。
				this.setZoom(this.cxCanvas / width * 100);
				break;
			case "vFit": // 縦方向に合わせる。
				this.setZoom(this.cyCanvas / height * 100);
				break;
			}
		},
		// 画像を画面のサイズに合わせる。
		doFitImage: function() {
			this.deltaX = this.deltaY = 0;
			if (this.isPDF) {
				if (this.pdf) {
					var Karasunpo = this;
					this.pdf.getPage(this.pdfPageNumber).then(
						function(page){
							var viewport = page.getViewport({
								scale: 1.0
							});
							if (viewport.width && viewport.height) {
								Karasunpo.doFit0.call(Karasunpo, viewport.width, viewport.height);
							}
						}
					);
				}
			} else if (this.image) {
				this.doFit0(this.cxImage, this.cyImage);
			}
		},
		// ハンドル上にあるか？
		isOnHandle: function(x, y){
			var xy0 = this.LPtoDP(this.px0, this.py0);
			var xy1 = this.LPtoDP(this.px1, this.py1);
			var handleSize = this.getHandleSize();
			var sensitiveRadius = this.getSensitiveRadius();
			var dx, dy;
			dx = x - xy0[0];
			dy = y - xy0[1];
			if (Math.sqrt(dx * dx + dy * dy) <= sensitiveRadius)
				return 0;
			dx = x - xy1[0];
			dy = y - xy1[1];
			if (Math.sqrt(dx * dx + dy * dy) <= sensitiveRadius)
				return 1;
			return -1;
		},
		// 線を描く。
		doDrawArrow: function(ctx, x0, y0, x1, y1, flag = true){
			ctx.save();
			ctx.lineCap = 'round';
			if (flag) {
				ctx.lineWidth = 2;
			} else {
				ctx.lineWidth = 1;
			}
			ctx.strokeStyle = this.lineColor;
			ctx.beginPath();
			var xy0 = this.LPtoDP(x0, y0);
			var xy1 = this.LPtoDP(x1, y1);
			var handleSize = this.getHandleSize();
			if (flag) {
				drawArrow(ctx, xy0[0], xy0[1], xy1[0], xy1[1], handleSize);
			} else {
				drawArrow(ctx, xy0[0], xy0[1], xy1[0], xy1[1], handleSize / 2);
			}
			ctx.stroke();
			ctx.restore();
		},
		// 補助円を描画する。
		doDrawCircle: function(ctx, x0, y0, x1, y1){
			var dx = (x1 - x0), dy = y1 - y0;
			var r = Math.sqrt(dx * dx + dy * dy) / 2;
			var cx = (x0 + x1) / 2;
			var cy = (y0 + y1) / 2;
			ctx.save();
			ctx.lineCap = 'round';
			ctx.lineWidth = 2;
			ctx.strokeStyle = this.lineColor;
			var xy0 = this.LPtoDP(cx, cy);
			var r0 = r * this.zoomRate / 100.0;
			ctx.beginPath();
			ctx.arc(xy0[0], xy0[1], r0, 0, 2 * Math.PI, false);
			ctx.stroke();
			ctx.restore();
		},
		// 顕微鏡を描画する。
		drawMicroscope: function(canvas, ctx){
			if (!this.hotspotx || !this.hotspoty)
				return;

			canvas = canvas.get(0);

			let width = canvas.width, height = canvas.height;
			if (isPortraitDevice())
				height -= 85;

			const radius = 50; // 半径。
			const ratio = 1.3; // ズーム率。
			const margin = 10; // 余白。

			// 邪魔にならないように照準の座標を設定する。
			let centerx, centery;
			if (this.hotspotx < width / 2){
				centerx = width - radius - margin;
			}else{
				centerx = radius + margin;
			}
			if (this.hotspoty < height / 2){
				centery = height - radius - margin;
			}else{
				centery = radius + margin;
			}

			// 新たなメモリーキャンバスに描画する。
			var mem_canvas = document.createElement("canvas");
			mem_canvas.width = radius * 2 / ratio;
			mem_canvas.height = radius * 2 / ratio;
			var mem_ctx = mem_canvas.getContext('2d');
			mem_ctx.drawImage(canvas,
				this.hotspotx - radius / ratio, this.hotspoty - radius / ratio,
				radius * 2 / ratio, radius * 2 / ratio,
				0, 0, radius * 2 / ratio, radius * 2 / ratio);

			// 顕微鏡の枠として円を描画する。
			ctx.save();
			ctx.strokeStyle = this.lineColor;
			ctx.lineWidth = 5;
			ctx.beginPath();
			ctx.arc(centerx, centery, radius, 0, 2 * Math.PI, false);
			ctx.stroke();
			ctx.restore();

			// 顕微鏡の像を描画する。
			ctx.save();
			ctx.beginPath();
			ctx.arc(centerx, centery, radius, 0, 2 * Math.PI, false);
			ctx.clip();
			ctx.drawImage(mem_canvas, 0, 0, radius * 2 / ratio, radius * 2 / ratio,
				centerx - radius, centery - radius, radius * 2, radius * 2);
			ctx.restore();

			// 顕微鏡の十字を描画する。
			ctx.save();
			ctx.strokeStyle = this.lineColor;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(centerx - radius, centery);
			ctx.lineTo(centerx + radius, centery);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(centerx, centery - radius);
			ctx.lineTo(centerx, centery + radius);
			ctx.stroke();
			ctx.restore();
		},
		// 画面を再描画する。
		redraw: function(){
			var Karasunpo = this;
			if (this.isPdfDrawing || this.isDrawing) {
				setTimeout(function(){
					Karasunpo.redraw.call(Karasunpo);
				}, 1000);
				return;
			}
			this.isDrawing = true;
			var canvas = $("#offscreen");
			var ctx = canvas[0].getContext('2d');
			// 背景を描画する。
			if (this.backgroundImage) {
				// 以前保存したものを使用する。
				ctx.putImageData(this.backgroundImage, 0, 0);
			} else {
				this.cxCanvas = parseInt(canvas.attr('width'));
				this.cyCanvas = parseInt(canvas.attr('height'));
				this.drawBackground(ctx, this.cxCanvas, this.cyCanvas);
			}
			if (this.isPDF) {
				this.putPDF(canvas, ctx);
			} else {
				this.putImage(canvas, ctx);
			}
		},
		// 画面のサイズが変わった。
		onWindowResize: function(){
			var canvas = $("#image-screen");
			if (isPortraitDevice()) {
				this.cxCanvas = parseInt(window.innerWidth);
				this.cyCanvas = parseInt(window.innerHeight * 0.74); // これはCSSに合わせる必要がある。
			} else {
				this.cxCanvas = parseInt(window.innerWidth * 0.69); // これはCSSに合わせる必要がある。
				this.cyCanvas = parseInt(window.innerHeight);
			}
			// キャンバスのサイズを合わせる。
			canvas.attr('width', this.cxCanvas + "px")
			canvas.attr('height', this.cyCanvas + "px");
			$("#offscreen").attr('width', this.cxCanvas + "px");
			$("#offscreen").attr('height', this.cyCanvas + "px");
			// 背景をリセットする。
			this.backgroundImage = null;
			// 画像を画面に合わせる。
			this.doFitImage();
			// 再描画。
			this.redraw();
		},
		// モードを設定する。
		setMode: function(mode) {
			$(".mode").hide();
			$("#mode" + mode).show();

			// ページ番号の有効・無効を切り替える。
			if (mode == 1 || mode == 2) {
				$(".config-dialog-page-number").prop('disabled', false);
			}else{
				$(".config-dialog-page-number").prop('disabled', true);
			}

			switch (mode) {
			case 1: // モード１：初期画面。
				this.lineOn = false;
				this.canDraw = false;
				// 画面サイズに関する初期化。
				this.onWindowResize();
				break;
			case 2: // モード２：ファイルを開く。
				this.lineOn = false;
				this.canDraw = false;
				break;
			case 3: // モード３：測定タイプ。
				this.lineOn = false;
				this.canDraw = false;
				break;
			case 4: // モード４：基準線分。
				this.lineOn = true;
				this.canDraw = true;
				break;
			case 5: // モード５：基準線分の長さ。
				this.lineOn = true;
				this.canDraw = false;
				break;
			case 6: // モード６：測定。
				this.lineOn = true;
				this.canDraw = true;
				break;
			}
			this.taskMode = mode;
			this.redraw();
		},
		// ファイルを処理する。
		openFile: function(file){
			this.pdf = null;
			this.isPDF = (file.name.indexOf(".pdf") != -1 || file.name.indexOf(".PDF") != -1);
			var reader = new FileReader();
			var Karasunpo = this;
			if (this.isPDF) {
				reader.onload = function(e){
					$(".mode2-filename").text(MESSAGE_LOADING);
					var ary = new Uint8Array(e.target.result);
					var loadingTask = pdfjsLib.getDocument({
						data: ary,
						cMapUrl: 'https://mozilla.github.io/pdf.js/web/cmaps/',
						cMapPacked: true,
					});
					// パスワード処理。
					loadingTask.onPassword = function (updatePassword, reason) {
						if (reason === 1) { // need password
							var password = prompt(ERROR_ENTER_PASSWORD);
							if (password || password === '') {
								updatePassword(password);
							} else {
								throw new Error("");
							}
   						} else {
							var password = prompt(ERROR_REENTER_PASSWORD);
							if (password || password === '') {
								updatePassword(password);
							} else {
								throw new Error("");
							}
						}
					};
					// PDFを読み込む。
					loadingTask.promise.then(function(pdf){
						var text = file.name;
						if (text.length > 10)
							text = text.slice(0, 10) + "...";
						Karasunpo.filename = text;
						Karasunpo.pdf = pdf;
						Karasunpo.pdfPageNumber = 1;
						Karasunpo.doFitImage.call(Karasunpo);
						Karasunpo.redraw.call(Karasunpo);
					}, function(reason) {
						;
					});
				};
			} else {
				reader.onload = function(e){
					Karasunpo.onWindowResize.call(Karasunpo);
					$(".mode2-filename").text(MESSAGE_LOADING);
					var img1 = new Image();
					img1.src = e.target.result;
					img1.onload = function(){
						var text = file.name;
						if (text.length > 10)
							text = text.slice(0, 10) + "...";
						Karasunpo.filename = text;
						Karasunpo.image = img1;
						Karasunpo.cxImage = parseInt(Karasunpo.image.width);
						Karasunpo.cyImage = parseInt(Karasunpo.image.height);
						Karasunpo.doFitImage.call(Karasunpo);
						Karasunpo.redraw.call(Karasunpo);
					};
				};
			}
			if (this.isPDF)
				reader.readAsArrayBuffer(file);
			else
				reader.readAsDataURL(file);
			this.setMode(2);
		},
		// クリップボードにテキストをコピー。
		doCopyText: function(text) {
			try {
				var clipboard = $('<textarea></textarea>');
				clipboard.text(text);
				$('body').append(clipboard);
				clipboard.select();
				var ret = document.execCommand('copy');
				clipboard.remove();
				return ret;
			} catch (e) {
				return false;
			}
		},
		// 測定。
		doMeasure: function(){
			switch (this.measureType) {
			case "length":
				console.log("doMeasure.length");
				// 基準線分のベクトル。
				var sdx = this.sx1 - this.sx0, sdy = this.sy1 - this.sy0;
				// 基準線分の長さ（ピクセル単位）。
				var stdPixelLength = Math.sqrt(sdx * sdx + sdy * sdy);
				// 線分の長さを求める。
				var dx = this.px1 - this.px0, dy = this.py1 - this.py0;
				var pixelLength = Math.sqrt(dx * dx + dy * dy);
				// 名目上の長さを求める。
				var value = parseFloat(this.stdNominalLength) * parseFloat(pixelLength) / parseFloat(stdPixelLength);
				// 四捨五入。
				value *= 10000.0;
				value = Math.round(value);
				value /= 10000.0;
				// テキストボックスに格納。
				var text = value.toString() + this.lengthUnit;
				$(".mode6-measure-results").val(htmlspecialchars(text));
				break;
			case 'inclination':
				console.log("doMeasure.inclination");
				// 線分の傾きを求める。
				var dx = this.px1 - this.px0, dy = this.py1 - this.py0;
				var value = Math.atan2(-dy, dx);
				// 必要なら度に直す。
				if (!this.isRadian)
					value = value * 180.0 / Math.PI;
				// 四捨五入。
				value *= 10000.0;
				value = Math.round(value);
				value /= 10000.0;
				// テキストボックスに格納。
				var text;
				if (this.isRadian)
					text = value.toString() + "rad";
				else
					text = value.toString() + MESSAGE_DEGREE;
				$(".mode6-measure-results").val(htmlspecialchars(text));
				break;
			case 'angle':
				console.log("doMeasure.angle");
				// ２線分のベクトル。
				var dx0 = this.sx1 - this.sx0, dy0 = this.sy1 - this.sy0;
				var dx1 = this.px1 - this.px0, dy1 = this.py1 - this.py0;
				// ２線分の傾き。
				var value0 = Math.atan2(-dy0, dx0);
				var value1 = Math.atan2(-dy1, dx1);
				// 傾きの差。
				var value = value1 - value0;
				// 角度を標準化。
				while (value >= 2 * Math.PI)
					value -= 2 * Math.PI;
				while (value < -2 * Math.PI)
					value += 2 * Math.PI;
				if (value < -Math.PI)
					value += 2 * Math.PI;
				if (value > Math.PI)
					value -= 2 * Math.PI;
				// 必要なら度に直す。
				if (!this.isRadian)
					value = value * 180.0 / Math.PI;
				// 四捨五入。
				value *= 10000.0;
				value = Math.round(value);
				value /= 10000.0;
				// テキストボックスに格納。
				var text;
				if (this.isRadian)
					text = value.toString() + "rad";
				else
					text = value.toString() + MESSAGE_DEGREE;
				$(".mode6-measure-results").val(htmlspecialchars(text));
				break;
			}
		},
		// フルスクリーンでマウスホイール操作があった。
		onWheel: function(e){
			e.preventDefault(); // 既定の処理を妨害する。
			var delta;
			var oe = e; //var oe = e.originalEvent;
			if (oe.wheelDelta !== null) {
				delta = oe.wheelDelta;
			} else {
				delta = oe.deltaY * -1;
			}
			if (oe.ctrlKey) { // Ctrlキーが押されている？
				// ズームする。
				var CC = this.getCanvasCenter();
				var LP = this.DPtoLP(CC[0], CC[1]);
				var DP0 = this.LPtoDP(LP[0], LP[1]);
				if (delta > 0) {
					this.setZoom(this.zoomRate * 1.25);
				} else {
					this.setZoom(this.zoomRate / 1.25);
				}
				var DP1 = this.LPtoDP(LP[0], LP[1]);
				this.deltaX -= DP1[0] - DP0[0];
				this.deltaY -= DP1[1] - DP0[1];
			} else {
				// ずらす。
				if (oe.shiftKey) { // Shiftキーが押されている？
					// 横にずらす。
					if (delta > 0) {
						this.deltaX -= 50;
					} else {
						this.deltaX += 50;
					}
				} else {
					// 縦にずらす。
					if (delta > 0) {
						this.deltaY += 50;
					} else {
						this.deltaY -= 50;
					}
				}
			}
			// 再描画。
			this.redraw();
		},
		//// 感知領域を描画する。
		//drawSensitive : function(ctx){
		//	if (this.px0 == this.px1 && this.py0 == this.py1)
		//		return;
		//	var xy0 = this.LPtoDP(this.px0, this.py0);
		//	var xy1 = this.LPtoDP(this.px1, this.py1);
		//	var handleSize = this.getHandleSize();
		//	var sensitiveRadius = this.getSensitiveRadius();
		//	ctx.save();
		//	ctx.beginPath();
		//	ctx.fillStyle = "rgba(255, 255, 255, 0)";
		//	ctx.strokeStyle = "darkgreen";
		//	ctx.arc(xy0[0], xy0[1], sensitiveRadius, 0, 2 * Math.PI, false);
		//	ctx.stroke();
		//	ctx.restore();
		//	ctx.save();
		//	ctx.beginPath();
		//	ctx.fillStyle = "rgba(255, 255, 255, 0)";
		//	ctx.strokeStyle = "darkgreen";
		//	ctx.arc(xy1[0], xy1[1], sensitiveRadius, 0, 2 * Math.PI, false);
		//	ctx.stroke();
		//	ctx.restore();
		//},
		// 描画の終わり。
		doRedrawFinish: function(ctx, succeeded){
			if (this.lineOn) { // 線分を描画するか？
				if (this.px0 != this.px1 || this.py0 != this.py1) {
					this.doDrawArrow(ctx, this.px0, this.py0, this.px1, this.py1, true);
					if (this.shouldDrawCircle) {
						this.doDrawCircle(ctx, this.px0, this.py0, this.px1, this.py1);
					}
				}
				if (this.taskMode == 6) {
					if (this.measureType == 'length' ||
						this.measureType == 'angle')
					{
						if (this.sx0 != this.sx1 || this.sy0 != this.sy1) {
							this.doDrawArrow(ctx, this.sx0, this.sy0, this.sx1, this.sy1, false);
						}
					}
				}
			}
			//// 感知領域を描画する。
			//this.drawSensitive(ctx);
			// キャンバスに転送する。
			var canvas = $("#image-screen");
			// 顕微鏡を描画する。
			this.drawMicroscope(canvas, ctx);
			var data = ctx.getImageData(0, 0, this.cxCanvas, this.cyCanvas);
			canvas[0].getContext('2d').putImageData(data, 0, 0);
			if (succeeded) {
				if (this.image || this.pdf) {
					$(".mode2-filename").text(htmlspecialchars(this.filename));
					$(".mode2-filename").removeClass("error");
					$(".mode2-next").prop('disabled', false);
				}
			}
			// 描画完了。
			this.isDrawing = false;
		},
		// マウスの左ボタンが押された。
		onLButtonDown: function(e){
			console.log("mousedown.VK_LBUTTON");
			e.preventDefault(); // 既定の処理を妨害する。
			if (!this.canDraw)
				return;
			// カーソル位置を取得する。
			var x = e.offsetX, y = e.offsetY;
			this.hotspotx = x;
			this.hotspoty = y;
			var LP = this.DPtoLP(x, y);
			// ハンドル上か？
			this.handlingOn = this.isOnHandle(x, y);
			if (this.handlingOn == -1) {
				// 線分をセットする。
				this.setSegment(LP[0], LP[1], LP[0], LP[1]);
				// ペンをオンにする。
				this.penOn = true;
			}
			// 測定結果をクリアする。
			if (this.taskMode == 6) {
				$(".mode6-measure-results").val("");
			}
			// 再描画。
			this.redraw();
		},
		// マウスの中央ボタンが押された。
		onMButtonDown: function(e){
			console.log("mousedown.VK_MBUTTON");
			e.preventDefault(); // 既定の処理を妨害する。
			// 押された位置を記憶する。
			this.mx0 = e.offsetX;
			this.my0 = e.offsetY;
			// 移動フラグをオンにする。
			this.movingOn = true;
			// 再描画。
			this.redraw();
		},
		// マウスのボタンが押された。
		onMouseDown: function(e){
			switch (e.button) {
			case VK_LBUTTON:
				this.onLButtonDown(e);
				break;
			case VK_MBUTTON:
				this.onMButtonDown(e);
				break;
			}
		},
		// タッチデバイスでピンチングがあった。
		onTouchPinch: function(e, t){
			this.penOn = false; // ペンをオフにする。
			// ピンチング位置を取得する。
			var pos0 = this.touchGetPos(e, 0);
			var pos1 = this.touchGetPos(e, 1);
			var x0 = pos0.x, y0 = pos0.y;
			var x1 = pos1.x, y1 = pos1.y;
			var dx = x1 - x0, dy = y1 - y0;
			if (!this.isTouchPinching) {
				// ピンチングを開始した。
				this.isTouchPinching = true; // ピンチング開始。
				this.touchDistance = Math.sqrt(dx * dx + dy * dy);
				// 線分の位置を保存する。
				if (this.savepx0 === null) {
					this.savepx0 = this.px0;
					this.savepy0 = this.py0;
					this.savepx1 = this.px1;
					this.savepy1 = this.py1;
				}
			} else {
				// ピンチング操作の続き。
				var newTouchDistance = Math.sqrt(dx * dx + dy * dy); // 新しい距離。
				// 距離に応じてズームする。
				if (newTouchDistance > this.touchDistance + this.getScreenSizeIndex()) {
					this.setZoom(this.zoomRate * 1.1);
					this.fitMode = "";
				} else if (newTouchDistance + this.getScreenSizeIndex() < this.touchDistance) {
					this.setZoom(this.zoomRate * 0.9);
					this.fitMode = "";
				}
				// 距離を更新。
				this.touchDistance = newTouchDistance;
			}
			// タッチ位置の平均を取得。
			var newTouchX = (x0 + x1) / 2, newTouchY = (y0 + y1) / 2;
			if (this.touchX === null || this.touchY === null) {
				// タッチ位置を新しくセット。
				this.touchX = newTouchX;
				this.touchY = newTouchY;
			} else {
				// タッチ位置に違いに応じて画面を動かし、タッチ位置を更新。
				this.deltaX += newTouchX - this.touchX;
				this.deltaY += newTouchY - this.touchY;
				this.touchX = newTouchX;
				this.touchY = newTouchY;
			}
			// 線分を復元。
			if (this.savepx0 !== null) {
				this.setSegment(this.savepx0, this.savepy0, this.savepx1, this.savepy1);
			}
			// 測定結果をクリア。
			$(".mode6-measure-results").val('');
			// 再描画。
			this.redraw();
		},
		// タッチデバイスでタッチが始まった。
		onTouchStart: function(e){
			console.log("touchstart");
			e.preventDefault(); // 既定の処理を妨害する。
			// タッチタイマーをクリアする。
			if (this.touchTimer) {
				clearTimeout(this.touchTimer);
				this.touchTimer = null;
			}
			// 線分の位置を保存する。
			if (this.savepx0 === null) {
				this.savepx0 = this.px0;
				this.savepy0 = this.py0;
				this.savepx1 = this.px1;
				this.savepy1 = this.py1;
			}
			// タッチを取得する。
			var t = e.touches;
			if (t.length > 1) { // 複数の指で操作？
				this.onTouchPinch(e, t);
				return;
			}
			if (this.isTouchPinching) { // ピンチング中か？
				this.redraw(); // 再描画する。
				return;
			}
			// 線分を描画可能でなければ戻る。
			if (!this.canDraw)
				return;
			// タッチ位置を取得する。
			var pos = this.touchGetPos(e);
			var x = pos.x, y = pos.y;
			this.hotspotx = x;
			this.hotspoty = y;
			var LP = this.DPtoLP(x, y);
			// ハンドル上か？
			this.handlingOn = this.isOnHandle(x, y);
			if (this.handlingOn == -1) {
				// ハンドル上でなければ、線分を更新する。
				this.setSegment(LP[0], LP[1], LP[0], LP[1]);
				this.penOn = true;
			}
			// 測定結果をクリア。
			if (this.taskMode == 6) {
				$(".mode6-measure-results").val("");
			}
			// 再描画。
			this.redraw();
		},
		// タッチデバイスでタッチ移動した。
		onTouchMove: function(e){
			console.log("touchmove");
			e.preventDefault(); // 既定の処理を妨害する。
			// タッチタイマーをクリアする。
			if (this.touchTimer) {
				clearTimeout(this.touchTimer);
				this.touchTimer = null;
			}
			// タッチを取得する。
			var t = e.touches;
			if (t.length > 1) { // 複数の指で操作？
				this.onTouchPinch(e, t);
				return;
			} else {
				if (this.isTouchPinching) {
					this.redraw();
					return;
				}
				if (this.handlingOn == -1) {
					if (!this.canDraw || !this.penOn || !this.lineOn)
						return;
				}
			}
			var pos = this.touchGetPos(e);
			var x = pos.x, y = pos.y;
			this.hotspotx = x;
			this.hotspoty = y;
			var LP = this.DPtoLP(x, y);
			if (this.handlingOn != -1) {
				if (this.handlingOn == 0) {
					this.setSegment(LP[0], LP[1], this.px1, this.py1);
				} else {
					this.setSegment(this.px0, this.py0, LP[0], LP[1]);
				}
			} else {
				var LP = this.DPtoLP(x, y);
				this.px1 = LP[0];
				this.py1 = LP[1];
			}
			if (this.taskMode == 6) {
				// 再計測。
				this.doMeasure();
			}
			this.redraw();
		},
		// マウスが移動した。
		onMouseMove: function(e){
			console.log("mousemove");
			e.preventDefault(); // 既定の処理を妨害する。
			if (this.handlingOn == -1) {
				if (this.penOn) {
					if (!this.canDraw || !this.lineOn)
						return;
				}
			}
			var x = e.offsetX, y = e.offsetY;
			this.hotspotx = x;
			this.hotspoty = y;
			var LP = this.DPtoLP(x, y);
			if (this.handlingOn != -1) {
				if (this.handlingOn == 0) {
					this.setSegment(LP[0], LP[1], this.px1, this.py1);
				} else {
					this.setSegment(this.px0, this.py0, LP[0], LP[1]);
				}
				if (this.taskMode == 6) {
					// 再計測。
					this.doMeasure();
				}
			} else if (this.penOn) {
				var LP = this.DPtoLP(x, y);
				this.px1 = LP[0];
				this.py1 = LP[1];
				if (this.taskMode == 6) {
					// 再計測。
					this.doMeasure();
				}
			} else if (this.movingOn) {
				this.deltaX += x - this.mx0;
				this.deltaY += y - this.my0;
				this.mx0 = x;
				this.my0 = y;
			} else {
				this.hotspotx = this.hotspoty = null;
			}
			this.redraw();
		},
		// タッチ判定用のタイマー。
		onTouchTimer: function(){
			this.isTouchPinching = false; // ピンチングを完全に終了。
			// タッチ位置を復元。
			if (this.savepx0 !== null) {
				this.setSegment(this.savepx0, this.savepy0, this.savepx1, this.savepy1);
				if (this.taskMode == 6) {
					// 再計測。
					this.doMeasure();
				}
			}
			// タッチ位置を破棄。
			this.savepx0 = this.savepy0 = null;
			this.savepx1 = this.savepy1 = null;
			this.hotspotx = this.hotspoty = null;
			// 再描画。
			this.redraw();
		},
		// タッチデバイスでタッチが終了した。
		onTouchEnd: function(e){
			console.log("touchend");
			e.preventDefault(); // 既定の処理を妨害する。
			// タッチ位置をクリアする。
			this.touchX = this.touchY = null;
			// ピンチング中か？
			if (this.isTouchPinching) {
				// タッチタイマーをクリアする。
				if (this.touchTimer) {
					clearTimeout(this.touchTimer);
					this.touchTimer = null;
				}
				// タッチの解除を待つ。
				var Karasunpo = this;
				this.touchTimer = setTimeout(function(){
					Karasunpo.onTouchTimer.call(Karasunpo);
				}, TOUCH_TIMEOUT);
				return;
			}
			// ハンドル上をドラッグしてないか？
			if (this.handlingOn == -1) {
				if (!this.canDraw)
					return;
			}
			// タッチを取得。
			var pos = this.touchGetPos(e);
			var x = pos.x, y = pos.y;
			this.hotspotx = x;
			this.hotspoty = y;
			var LP = this.DPtoLP(x, y);
			// 線分をセット。
			if (this.handlingOn != -1) {
				if (this.handlingOn == 0) {
					// 始点をセット。
					this.setSegment(LP[0], LP[1], this.px1, this.py1);
				} else {
					// 終点をセット。
					this.setSegment(this.px0, this.py0, LP[0], LP[1]);
				}
				// ハンドルロックを解除。
				this.handlingOn = -1;
			} else {
				// 終点をセット。
				this.px1 = LP[0];
				this.py1 = LP[1];
				this.penOn = false;
			}
			// 「次へ」ボタンを有効／無効にする。
			if (this.taskMode == 4) {
				if (this.px0 != this.px1 || this.py0 != this.py1) {
					$(".mode4-next").prop('disabled', false);
				} else {
					$(".mode4-next").prop('disabled', true);
				}
			}
			if (this.taskMode == 6) {
				// 再計測。
				this.doMeasure();
			}
			// タッチ位置を破棄。
			this.savepx0 = this.savepy0 = null;
			this.savepx1 = this.savepy1 = null;
			this.hotspotx = this.hotspoty = null;
			// 再描画。
			this.redraw();
		},
		// マウスの左ボタンが解放された。
		onLButtonUp: function(e){
			console.log("mouseup.VK_LBUTTON");
			e.preventDefault(); // 既定の処理を妨害する。
			// ハンドル上でなく、線分を描画可能でなければ戻る。
			if (this.handlingOn == -1) {
				if (!this.canDraw)
					return;
			}
			// カーソル位置を取得する。
			var x = e.offsetX, y = e.offsetY;
			var LP = this.DPtoLP(x, y);
			if (this.handlingOn != -1) { // ハンドル上か？
				if (this.handlingOn == 0) {
					// 始点をセットする。
					this.setSegment(LP[0], LP[1], this.px1, this.py1);
				} else {
					// 終点をセットする。
					this.setSegment(this.px0, this.py0, LP[0], LP[1]);
				}
				// ハンドルロックを解除する。
				this.handlingOn = -1;
			} else {
				// 終点をセットする。
				this.px1 = LP[0];
				this.py1 = LP[1];
				// ペンをオフにする。
				this.penOn = false;
			}
			// 「次へ」ボタンを有効／無効にする。
			if (this.taskMode == 4) {
				if (this.px0 != this.px1 || this.py0 != this.py1) {
					$(".mode4-next").prop('disabled', false);
				} else {
					$(".mode4-next").prop('disabled', true);
				}
			}
			if (this.taskMode == 6) {
				// 再計測。
				this.doMeasure();
			}
			// 再描画。
			this.redraw();
		},
		// マウスの中央ボタンが解放された。
		onMButtonUp: function(e){
			console.log("mouseup.VK_MBUTTON");
			e.preventDefault(); // 既定の処理を妨害する。
			if (!this.movingOn)
				return;
			// イメージを移動する。
			this.deltaX += e.offsetX - this.mx0;
			this.deltaY += e.offsetY - this.my0;
			this.mx0 = e.offsetX;
			this.my0 = e.offsetY;
			// 移動フラグをクリアする。
			this.movingOn = false;
			// ハンドルロックを解除する。
			this.handlingOn = -1;
			// 再描画。
			this.redraw();
		},
		// マウスのボタンが解放された。
		onMouseUp: function(e){
			switch (e.button) {
			case VK_LBUTTON: // 左ボタン。
				this.onLButtonUp(e);
				break;
			case VK_MBUTTON: // 中央ボタン。
				this.onMButtonUp(e);
				break;
			}
		},
		setZoomValue: function(zoom){
			switch (zoom) {
			case "":
				break;
			case "Fit":
			case "hFit":
			case "vFit":
				this.fitMode = zoom;
				this.doFitImage();
				break;
			default:
				zoom = parseInt(zoom);
				if (!isNaN(zoom)) {
					this.fitMode = "";
					this.setZoom(zoom);
				}
				break;
			}
			// 再描画。
			this.redraw();
		},
		setLineColor: function(color){
			switch (color) {
			case 'red': case 'blue': case 'green': case 'yellow':
				this.lineColor = color;
				break;
			}
			// ローカルストレージに保存。
			localStorage.setItem('line-color', this.lineColor);
			// 再描画。
			this.redraw();
		},
		setBack: function(back){
			switch (back) {
			case "-2": case "0": case "1": case "2": case "3": case "4": case "5":
				this.backgroundMode = parseInt(back);
				this.backgroundImage = null;
				break;
			default:
				break;
			}
			// ローカルストレージに保存。
			localStorage.setItem('background-mode', this.backgroundMode);
			// 再描画。
			this.redraw();
		},
		setPageNo: function(page_no){
			var number = parseInt(page_no);
			if (!isNaN(number)) {
				this.pdfPageNumber = number;
			}
			// 再描画。
			this.redraw();
		},
		// 設定。
		config: function(){
			var Karasunpo = this;
			// 「設定」ダイアログを初期化。
			switch (this.fitMode) {
			case "":
				$("#config-dialog-zoom").val(parseInt(this.zoomRate) + "");
				break;
			default:
				$("#config-dialog-zoom").val(this.fitMode);
				break;
			}
			$("#config-dialog-line-color").val(this.lineColor);
			switch (this.backgroundMode) {
			case -2: case 0: case 1: case 2: case 3: case 4: case 5:
				$("#config-dialog-background").val(this.backgroundMode);
				break;
			}
			$(".config-dialog-page-number").val('' + this.pdfPageNumber);
			// 古い値を保存する。
			var old_zoom = $("#config-dialog-zoom").val();
			var old_color = $("#config-dialog-line-color").val();
			var old_back = $("#config-dialog-background").val();
			var old_page_no = $(".config-dialog-page-number").val();
			// 「設定」ダイアログを開く。
			$("#config-dialog").dialog({
				modal: true,
				title: MESSAGE_CONFIG_DIALOG,
				width: "300px",
				draggable: true,
				buttons: {
					"OK": function(){
						// ダイアログを閉じる。
						$(this).dialog("close");
					},
					"Cancel": function(){
						// 古い値を復元する。
						Karasunpo.setZoomValue(old_zoom);
						Karasunpo.setLineColor(old_color);
						Karasunpo.setBack(old_back);
						Karasunpo.setPageNo(old_page_no);
						// ダイアログを閉じる。
						$(this).dialog("close");
					},
				}
			});
			$('#config-dialog').on('dialogclose', function(e){
				;
			});
		},
	};

	// 初期化。
	$(function(){
		$(window).on('resize', function(){
			Karasunpo.onWindowResize();
		});

		// モード１：初期画面。
		$(".mode1-next").on('click', function(){
			Karasunpo.setMode(2);
		});
		// モード２：ファイルを開く。
		$(".mode2-back").on('click', function(){
			Karasunpo.setMode(1);
		});
		$(".mode2-next").on('click', function(){
			Karasunpo.setMode(3);
		});
		$(".mode2-choose-image").on('click', function(){
			$(".mode2-upload-file").first().click();
		});
		$(".mode2-upload-file").change(function(){
			var file = $(this).prop('files')[0];
			Karasunpo.openFile(file);
		});
		$(".mode2-next").prop('disabled', true);

		// モード３：測定タイプ。
		$(".mode3-back").on('click', function(){
			Karasunpo.setMode(2);
		});
		$(".mode3-next").on('click', function(){
			if (Karasunpo.measureType == 'inclination') {
				$(".mode6-measure-results").val("");
				Karasunpo.setMode(6);
			} else {
				Karasunpo.sx0 = Karasunpo.sy0 = Karasunpo.sx1 = Karasunpo.sy1 = 0;
				Karasunpo.setSegment(0, 0, 0, 0);
				$(".mode4-next").prop('disabled', true);
				Karasunpo.setMode(4);
			}
		});
		$(".mode3-measure-type-length").on('click', function(){
			$(".mode6-measure-type-text").text(MESSAGE_LENGTH);
			Karasunpo.measureType = "length";
			$("#mode3-measure-type-length-1").prop('checked', true);
			$("#mode3-measure-type-length-2").prop('checked', true);
		});
		$(".mode3-measure-type-inclination").on('click', function(){
			$(".mode6-measure-type-text").text(MESSAGE_INCLINATION);
			Karasunpo.measureType = "inclination";
			$("#mode3-measure-type-inclination-1").prop('checked', true);
			$("#mode3-measure-type-inclination-2").prop('checked', true);
		});
		$(".mode3-measure-type-angle").on('click', function(){
			$(".mode6-measure-type-text").text(MESSAGE_ANGLE);
			Karasunpo.measureType = "angle";
			$("#mode3-measure-type-angle-1").prop('checked', true);
			$("#mode3-measure-type-angle-2").prop('checked', true);
		});
		$(".mode3-is-radian").on('click', function(){
			if ($(this).prop('checked')) {
				Karasunpo.isRadian = true;
			} else {
				Karasunpo.isRadian = false;
			}
		});
		// モード４：基準線分。
		$(".mode4-back").on('click', function(){
			Karasunpo.setMode(3);
		});
		$(".mode4-next").on('click', function(){
			if (Karasunpo.measureType == 'angle') {
				Karasunpo.sx0 = Karasunpo.px0;
				Karasunpo.sy0 = Karasunpo.py0;
				Karasunpo.sx1 = Karasunpo.px1;
				Karasunpo.sy1 = Karasunpo.py1;
				Karasunpo.setSegment(0, 0, 0, 0);
				$(".mode6-measure-results").val("");
				Karasunpo.setMode(6);
			} else {
				Karasunpo.sx0 = Karasunpo.px0;
				Karasunpo.sy0 = Karasunpo.py0;
				Karasunpo.sx1 = Karasunpo.px1;
				Karasunpo.sy1 = Karasunpo.py1;
				$(".mode5-numeric-text").text("");
				$(".mode5-unit-text").text("");
				Karasunpo.setMode(5);
			}
		});
		$(".mode4-draw-circle").on('click', function(){
			Karasunpo.shouldDrawCircle = $(this).prop('checked');
			$(".mode4-draw-circle").prop('checked', Karasunpo.shouldDrawCircle);
			$(".mode6-draw-circle").prop('checked', Karasunpo.shouldDrawCircle);
			Karasunpo.redraw();
		});

		// モード５：基準線分の長さ。
		$(".mode5-back").on('click', function(){
			Karasunpo.setSegment(Karasunpo.sx0, Karasunpo.sy0, Karasunpo.sx1, Karasunpo.sy1);
			if (Karasunpo.px0 != Karasunpo.px1 || Karasunpo.py0 != Karasunpo.py1) {
				$(".mode4-next").prop('disabled', false);
			} else {
				$(".mode4-next").prop('disabled', true);
			}
			Karasunpo.setMode(4);
		});
		$(".mode5-next").on('click', function(){
			$(".mode6-measure-results").val("");
			Karasunpo.setMode(6);
		});
		$(".mode5-next").prop('disabled', true);
		$(".mode5-numeric-text").on('change input', function(){
			// 基準線分の長さ（名目）。
			var text = $(this).val();
			var text = zenkakuToHankaku(text);
			Karasunpo.stdNominalLength = parseFloat(text);
			if (!isNaN(Karasunpo.stdNominalLength) &&
				isFinite(Karasunpo.stdNominalLength) &&
				Karasunpo.stdNominalLength > 0)
			{
				$(".mode5-next").prop('disabled', false);
			} else {
				$(".mode5-next").prop('disabled', true);
			}
		});
		$(".mode5-unit-text").on('change input', function(){
			// 長さの単位。
			Karasunpo.lengthUnit = $(this).val();
		});

		// モード６：測定。
		$(".mode6-back").on('click', function(){
			if (Karasunpo.measureType == 'inclination') {
				Karasunpo.setMode(3);
			} else if (Karasunpo.measureType == 'angle') {
				Karasunpo.setMode(4);
			} else {
				Karasunpo.setSegment(Karasunpo.sx0, Karasunpo.sy0, Karasunpo.sx1, Karasunpo.sy1);
				Karasunpo.setMode(5);
			}
		});
		$(".mode6-finish").on('click', function(){
			location.reload();
		});
		$(".mode6-draw-circle").on('click', function(){
			Karasunpo.shouldDrawCircle = $(this).prop('checked');
			$(".mode4-draw-circle").prop('checked', this.shouldDrawCircle);
			$(".mode6-draw-circle").prop('checked', this.shouldDrawCircle);
			Karasunpo.redraw();
		});
		$(".mode6-copy-text").on('click', function(){
			var text = $(".mode6-measure-results").val();
			if (Karasunpo.doCopyText(text)) {
				alert(MESSAGE_COPYED);
			} else {
				alert(MESSAGE_FAILED_TO_COPY);
			}
		});

		// ドロップ領域。
		$(".drop-area").on('dragenter dragover', function(e){
			e.stopPropagation();
			e.preventDefault(); // 既定の処理を妨害する。
			if (Karasunpo.taskMode != 1 && Karasunpo.taskMode != 2)
				return;
			$('.drop-area-navi').addClass('dragging-over');
		});
		$('.drop-area').on('dragleave', function(e){
			e.preventDefault(); // 既定の処理を妨害する。
			if (Karasunpo.taskMode != 1 && Karasunpo.taskMode != 2)
				return;
			$('.drop-area-navi').removeClass('dragging-over');
		});
		$('.drop-area').on('drop', function(e){
			e.preventDefault(); // 既定の処理を妨害する。
			if (Karasunpo.taskMode != 1 && Karasunpo.taskMode != 2)
				return;
			var file = e.originalEvent.dataTransfer.files[0];
			$('.drop-area-navi').removeClass('dragging-over');
			Karasunpo.openFile(file);
		});

		$('#image-screen').on('mousedown', function(e){
			Karasunpo.onMouseDown(e);
		});

		// タッチデバイスでタッチした。
		document.getElementById("image-screen").addEventListener('touchstart', function(e){
			Karasunpo.onTouchStart(e);
		}, {passive: false});

		// タッチデバイスでタッチ移動した。
		document.getElementById("image-screen").addEventListener('touchmove', function(e){
			Karasunpo.onTouchMove(e);
		}, {passive: false});

		$('#image-screen').on('mousemove', function(e){
			Karasunpo.onMouseMove(e);
		});

		$('#image-screen').on('touchend', function(e){
			Karasunpo.onTouchEnd(e);
		});

		$('#image-screen').on('mouseup', function(e){
			Karasunpo.onMouseUp(e);
		});

		document.getElementById("fullscreen").addEventListener('wheel', function(e){
			Karasunpo.onWheel(e);
		}, {passive: false});
		document.getElementById("fullscreen").addEventListener('mousewheel', function(e){
			Karasunpo.onWheel(e);
		}, {passive: false});

		// 設定ボタン。
		$("#config-button").click(function(){
			Karasunpo.config();
		});

		// 更新履歴ボタン。
		$("#history-button").click(function(){
			var width;
			if (isPortraitDevice()) {
				width = "250px";
			} else {
				width = "500px";
			}
			$("#history-dialog").dialog({
				modal: true,
				title: MESSAGE_HISTORY,
				width: width,
				draggable: true,
				buttons: {
					"OK": function() {
						// ダイアログを閉じる。
						$(this).dialog("close");
					},
				}
			});
		});

		// バージョン情報ボタン。
		$("#about-button").click(function(){
			$("#about-dialog-version").text(KARASUNPO_VERSION);
			var width = Math.floor(window.innerWidth * 0.9);
			if (width > 600)
				width = 600;
			width += "px";
			$("#about-dialog").dialog({
				modal: true,
				title: MESSAGE_ABOUT,
				width: width,
				draggable: true,
				buttons: {
					"OK": function() {
						// ダイアログを閉じる。
						$(this).dialog("close");
					},
				}
			});
		});

		// 「最初に戻る」ボタン。
		$("#back-to-first-button").click(function(){
			location.reload();
		});
		// 「アプリの初期化」ボタン。
		$("#initialize-button").click(function(){
			if (confirm(MESSAGE_WANNA_INIT_APP)){
				localStorage.clear();
				location.reload();
			}
		});

		// ズーム率。
		$("#config-dialog-zoom").change(function(){
			Karasunpo.setZoomValue($("#config-dialog-zoom").val());
		});
		// 線分の色。
		$("#config-dialog-line-color").change(function(){
			Karasunpo.setLineColor($("#config-dialog-line-color").val());
		});
		// 背景。
		$("#config-dialog-background").change(function(){
			Karasunpo.setBack($("#config-dialog-background").val());
		});
		// PDFのページ番号。
		$(".config-dialog-page-number").change(function(){
			Karasunpo.setPageNo($(".config-dialog-page-number").val());
		});
		$(".config-dialog-page-number").keyup(function(){
			Karasunpo.setPageNo($(".config-dialog-page-number").val());
		});

		// ローカルストレージの設定を復元。
		var redrawFlag = false;
		if (localStorage.getItem('line-color') != null) {
			Karasunpo.lineColor = localStorage.getItem('line-color');
		}
		if (localStorage.getItem('background-mode') != null) {
			Karasunpo.backgroundMode = parseInt(localStorage.getItem('background-mode'));
			this.backgroundImage = null;
		}

		// モードを初期化。
		Karasunpo.setMode(1);
	});
})(jQuery);
