// main.js -- Karasunpo Online (Japanese)
// Copyright (C) 2021 Katayama Hirofumi MZ. All Rights Reserved.
// License: MIT

var KARASUNPO_VERSION = "0.7"; // カラスンポのバージョン番号。

var pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.js';

(function($){
	// 厳密に。
	'use strict';

	var VK_LBUTTON = 0; // マウスの左ボタン。
	var VK_MBUTTON = 1; // マウスの中央ボタン。
	var VK_RBUTTON = 2; // マウスの右ボタン。

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

	// We use module-pattern.
	var Karasunpo = {
		theImage: null, // 画像。
		cxImage: 0, // 画像の幅（ピクセル単位）。
		cyImage: 0, // 画像の高さ（ピクセル単位）。
		cxCanvas: 0, // キャンバスの幅（ピクセル単位）。
		cyCanvas: 0, // キャンバスの高さ（ピクセル単位）。
		theMeasureType: "length", // 測定タイプ。
		theMode: 1, // モード。
		theFitMode: 0, // 画面モード（0：自動、1：横方向に合わせる、2：縦方向に合わせる）。
		theZoom: 100.0, // ズーム率（百分率）。
		theCanDraw: false, // 描画できるか？
		theCanMove: true, // 画像を動かせるか？
		theIsDrawing: false, // 描画中か？
		thePenOn: false, // ペンはキャンバス上にあるか？
		theLineOn: false, // 線分をキャンバスに表示するか？
		theMoveOn: false, // 画像を動かしているか？
		theHandleOn: -1, // ハンドルを動かしているか？
		thePDFIsDrawing: false, // PDF描画中？
		backgroundImage: null, // 背景イメージ。
		backgroundMode: -2, // 背景モード（-2：市松模様、0：黒、1：白、2：緑、3：青、4：マゼンタ、5：赤）。
		theIsRadian: false, // ラジアンか？
		theDeltaX: 0, // 画面中央からのずれ（ピクセル単位）。
		theDeltaY: 0, // 画面中央からのずれ（ピクセル単位）。
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
		theLineColor: 'red', // 線分の色。
		theDrawCircle: false, // 補助円を描くか？
		theIsPDF: false, // PDFファイルか？
		thePDF: null, // PDFオブジェクト。
		thePDFPageNumber: 1, // PDFのページ番号。
		theStdNominalLength: 0, // 基準線分の長さ（名目）。
		theLengthUnit: "", // 長さの単位。
		theFileName: "", // ファイル名。
		// HTMLの特殊文字を変換。
		htmlspecialchars: function(str){
			return (str + '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#039;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
		},
		// タップ位置を取得する為の関数群
		touchGetPos: function(e) {
			var rect = $("#image-screen")[0].getBoundingClientRect();
			var touch = e.touches[0] || e.changedTouches[0];
			return {
				x : touch.clientX - rect.left,
				y : touch.clientY - rect.top
			};
		},
		// スマートフォンか？
		isSmartPhone: function(){
			return (window.innerWidth < 750); // この値はCSSのmain.cssと合わせる必要がある。
		},
		// ハンドルのサイズを取得する。
		getHandleSize: function() {
			if (this.isSmartPhone())
				return 10;
			return 5;
		},
		// 画像の中央座標を取得する。
		getImageCenter: function(){
			if (this.theIsPDF) {
				if (this.thePDF == null)
					return [0, 0];
			} else {
				if (this.theImage == null)
					return [0, 0];
			}
			return [this.cxImage / 2, this.cyImage / 2];
		},
		// キャンバスの中央座標を取得する。
		getCanvasCenter: function(){
			if (this.theIsPDF) {
				if (this.thePDF == null)
					return [0, 0];
			} else {
				if (this.theImage == null)
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
			x *= this.theZoom / 100.0;
			y *= this.theZoom / 100.0;
			var CC = this.getCanvasCenter();
			x += CC[0];
			y += CC[1];
			x += this.theDeltaX;
			y += this.theDeltaY;
			return [x, y];
		},
		// 物理座標から論理座標へ。
		DPtoLP: function(x, y) {
			x -= this.theDeltaX;
			y -= this.theDeltaY;
			var CC = this.getCanvasCenter();
			x -= CC[0];
			y -= CC[1];
			x /= this.theZoom / 100.0;
			y /= this.theZoom / 100.0;
			var IC = this.getImageCenter();
			x -= IC[0];
			y -= IC[1];
			return [x, y];
		},
		// 背景を描画する。
		drawBackground: function(ctx, cx, cy) {
			switch (this.backgroundMode) {
			case -2: // 市松模様。
				var i = 0, j = 0, size = 16;
				for (var y = 0; y < cy + size; y += size) {
					i = (j % 2 == 0) ? 1 : 0;
					for (var x = 0; x < cx + size; x += size) {
						if (i % 2 == 0)
							ctx.fillStyle = "rgb(90, 90, 90)";
						else
							ctx.fillStyle = "rgb(191, 191, 191)";
						ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(cx), Math.floor(cy));
						++i;
					}
					++j;
				}
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
			// 高速化のためにイメージデータを保存する。
			this.backgroundImage = ctx.getImageData(0, 0, this.cxCanvas, this.cyCanvas);
		},
		// レンダリング完了。
		gotRendered: function(ctx){
			this.thePDFIsDrawing = false;
			this.doRedrawFinish(ctx, true);
		},
		// レンダリング失敗。
		failedToRender: function(ctx){
			this.thePDFIsDrawing = false;
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
			var zoomedWidth = this.cxImage * this.theZoom / 100.0;
			var zoomedHeight = this.cyImage * this.theZoom / 100.0;
			// 描画位置（物理座標）。
			var px = (this.cxCanvas - zoomedWidth) / 2;
			var py = (this.cyCanvas - zoomedHeight) / 2;
			// PDFのレンダリングで余白が描画されないことがあるのでここで白く塗りつぶす。
			ctx.fillStyle = "rgb(255, 255, 255)";
			ctx.fillRect(px + this.theDeltaX, py + this.theDeltaY, zoomedWidth, zoomedHeight);
			// ビューポートを取得。
			var viewport = page.getViewport({
				scale: this.theZoom / 100.0,
				offsetX: px + this.theDeltaX,
				offsetY: py + this.theDeltaY
			});
			// PDFレンダリング開始。
			var renderContext = {
				canvasContext: ctx,
				viewport: viewport,
				background: "rgba(255, 255, 255, 0)"
			};
			this.thePDFIsDrawing = true;
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
			if (!this.theIsPDF || !this.thePDF) {
				this.doRedrawFinish(ctx, false);
				return;
			}
			var Karasunpo = this;
			this.thePDF.getPage(this.thePDFPageNumber).then(function(page){
				Karasunpo.gotPage.call(Karasunpo, page, canvas, ctx);
			}, function(reason) {
				Karasunpo.failedToRender.call(Karasunpo, ctx);
				alert("ページ取得に失敗しました。");
			});
		},
		// 画像を表示する。
		putImage: function(canvas, ctx) {
			if (this.theIsPDF || !this.theImage) {
				this.doRedrawFinish(ctx, false);
				return;
			}
			var zoomedWidth = cxImage * this.theZoom / 100.0;
			var zoomedHeight = cyImage * this.theZoom / 100.0;
			var px = (this.cxCanvas - zoomedWidth) / 2;
			var py = (this.cyCanvas - zoomedHeight) / 2;
			// アンチエイジングを無効にする。
			ctx.mozImageSmoothingEnabled = false;
			ctx.webkitImageSmoothingEnabled = false;
			ctx.msImageSmoothingEnabled = false;
			ctx.imageSmoothingEnabled = false;
			// 画像を描画。
			ctx.drawImage(this.theImage, px + this.theDeltaX, py + this.theDeltaY, zoomedWidth, zoomedHeight);
			this.doRedrawFinish(ctx, true);
		},
		// ズーム率を設定する。
		doSetZoom: function(percents) {
			if (this.theIsPDF) {
				if (this.thePDF == null)
					return;
			} else {
				if (this.theImage == null)
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

			this.theZoom = percents;
		},
		// 画像を画面のサイズに合わせる。
		doFit0: function(width, height) {
			this.cxImage = width;
			this.cyImage = height;
			switch (this.theFitMode) {
			case 0: // 自動
				if (this.cxCanvas / this.cyCanvas > width / height) {
					this.doSetZoom(this.cyCanvas / height * 100);
				} else {
					this.doSetZoom(this.cxCanvas / width * 100);
				}
				break;
			case 1: // 横方向に合わせる。
				this.doSetZoom(this.cxCanvas / width * 100);
				break;
			case 2: // 縦方向に合わせる。
				this.doSetZoom(this.cyCanvas / height * 100);
				break;
			}
		},
		// 画像を画面のサイズに合わせる。
		doFitImage: function() {
			this.theDeltaX = this.theDeltaY = 0;
			if (this.theIsPDF) {
				if (this.thePDF) {
					var Karasunpo = this;
					this.thePDF.getPage(this.thePDFPageNumber).then(
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
			} else if (this.theImage) {
				this.doFit0(this.cxImage, this.cyImage);
			}
		},
		// ハンドル上にあるか？
		isOnHandle: function(x, y){
			var xy0 = this.LPtoDP(this.px0, this.py0);
			var xy1 = this.LPtoDP(this.px1, this.py1);
			var handleSize = this.getHandleSize();
			if (this.isSmartPhone())
				handleSize *= 3;
			if (xy0[0] - handleSize <= x && x <= xy0[0] + handleSize &&
				xy0[1] - handleSize <= y && y <= xy0[1] + handleSize)
			{
				return 0;
			}
			if (xy1[0] - handleSize <= x && x <= xy1[0] + handleSize &&
				xy1[1] - handleSize <= y && y <= xy1[1] + handleSize)
			{
				return 1;
			}
			return -1;
		},
		// 線を描く。
		doDrawLine: function(ctx, x0, y0, x1, y1, flag = true){
			ctx.save();
			ctx.lineCap = 'round';
			if (flag) {
				ctx.lineWidth = 2;
			} else {
				ctx.lineWidth = 1;
			}
			ctx.strokeStyle = this.theLineColor;
			ctx.beginPath();
			var xy0 = this.LPtoDP(x0, y0);
			var xy1 = this.LPtoDP(x1, y1);
			ctx.moveTo(xy0[0], xy0[1]);
			ctx.lineTo(xy1[0], xy1[1]);
			ctx.stroke();
			ctx.fillStyle = this.theLineColor;
			ctx.beginPath();
			var handleSize = this.getHandleSize();
			if (flag) {
				ctx.arc(xy0[0], xy0[1], handleSize, 0, 2 * Math.PI, false);
				ctx.arc(xy1[0], xy1[1], handleSize, 0, 2 * Math.PI, false);
			} else {
				ctx.arc(xy0[0], xy0[1], handleSize / 2, 0, 2 * Math.PI, false);
				ctx.arc(xy1[0], xy1[1], handleSize / 2, 0, 2 * Math.PI, false);
			}
			ctx.fill();
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
			ctx.strokeStyle = this.theLineColor;
			var xy0 = this.LPtoDP(cx, cy);
			var r0 = r * this.theZoom / 100.0;
			ctx.beginPath();
			ctx.arc(xy0[0], xy0[1], r0, 0, 2 * Math.PI, false);
			ctx.stroke();
			ctx.restore();
		},
		// 画面を再描画する。
		doRedraw: function(){
			var Karasunpo = this;
			if (this.thePDFIsDrawing || this.theIsDrawing) {
				setTimeout(function(){
					Karasunpo.doRedraw.call(Karasunpo);
				}, 2000);
				return;
			}
			this.theIsDrawing = true;
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
			if (this.theIsPDF) {
				this.putPDF(canvas, ctx);
			} else {
				this.putImage(canvas, ctx);
			}
		},
		// 画面のサイズが変わった。
		onWindowResize: function(){
			var canvas = $("#image-screen");
			if (this.isSmartPhone()) {
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
			this.doRedraw();
		},
		// モードを設定する。
		setMode: function(mode) {
			$(".mode").hide();
			$("#mode" + mode).show();

			switch (mode) {
			case 1: // モード１：初期画面。
				this.theLineOn = false;
				this.theCanDraw = false;
				this.theCanMove = false;
				// 画面サイズに関する初期化。
				this.onWindowResize();
				break;
			case 2: // モード２：ファイルを開く。
				this.theLineOn = false;
				this.theCanDraw = false;
				this.theCanMove = true;
				break;
			case 3: // モード３：測定タイプ。
				this.theLineOn = true;
				this.theCanDraw = false;
				this.theCanMove = true;
				break;
			case 4: // モード４：基準線分。
				this.theLineOn = true;
				this.theCanDraw = true;
				this.theCanMove = true;
				break;
			case 5: // モード５：基準線分の長さ。
				this.theLineOn = true;
				this.theCanDraw = false;
				this.theCanMove = true;
				break;
			case 6: // モード６：測定。
				this.theLineOn = true;
				this.theCanDraw = true;
				this.theCanMove = true;
				break;
			}
			this.theMode = mode;
			this.doRedraw();
		},
		// ファイルを処理する。
		doFile: function(file){
			this.theIsPDF = (file.name.indexOf(".pdf") != -1 || file.name.indexOf(".PDF") != -1);
			var reader = new FileReader();
			var Karasunpo = this;
			if (this.theIsPDF) {
				reader.onload = function(e){
					Karasunpo.onWindowResize.call(Karasunpo);
					$(".mode2-filename").text("読み込み中...");
					var ary = new Uint8Array(e.target.result);
					var loadingTask = pdfjsLib.getDocument({
						data: ary,
						cMapUrl: 'https://mozilla.github.io/pdf.js/web/cmaps/',
						cMapPacked: true,
					});
					loadingTask.promise.then(function(pdf){
						var text = file.name;
						if (text.length > 16)
							text = text.slice(0, 16) + "...";
						Karasunpo.theFileName = text;
						Karasunpo.thePDF = pdf;
						Karasunpo.thePDFPageNumber = 1;
						Karasunpo.doFitImage.call(Karasunpo);
						Karasunpo.doRedraw.call(Karasunpo);
					});
				};
			} else {
				reader.onload = function(e){
					Karasunpo.onWindowResize.call(Karasunpo);
					$(".mode2-filename").text("読み込み中...");
					var img1 = new Image();
					img1.src = e.target.result;
					img1.onload = function(){
						var text = file.name;
						if (text.length > 16)
							text = text.slice(0, 16) + "...";
						Karasunpo.theFileName = text;
						Karasunpo.theImage = img1;
						Karasunpo.cxImage = parseInt(Karasunpo.theImage.width);
						Karasunpo.cyImage = parseInt(Karasunpo.theImage.height);
						Karasunpo.doFitImage.call(Karasunpo);
						Karasunpo.doRedraw.call(Karasunpo);
					};
				};
			}
			if (this.theIsPDF)
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
			switch (this.theMeasureType) {
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
				var value = parseFloat(this.theStdNominalLength) * parseFloat(pixelLength) / parseFloat(stdPixelLength);
				// 四捨五入。
				value *= 10000.0;
				value = Math.round(value);
				value /= 10000.0;
				// テキストボックスに格納。
				var text = value.toString() + this.theLengthUnit;
				$(".mode6-measure-results").val(this.htmlspecialchars(text));
				break;
			case 'inclination':
				console.log("doMeasure.inclination");
				// 線分の傾きを求める。
				var dx = this.px1 - this.px0, dy = this.py1 - this.py0;
				var value = Math.atan2(-dy, dx);
				// 必要なら度に直す。
				if (!this.theIsRadian)
					value = value * 180.0 / Math.PI;
				// 四捨五入。
				value *= 10000.0;
				value = Math.round(value);
				value /= 10000.0;
				// テキストボックスに格納。
				var text;
				if (this.theIsRadian)
					text = value.toString() + "rad";
				else
					text = value.toString() + "度";
				$(".mode6-measure-results").val(this.htmlspecialchars(text));
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
				if (!this.theIsRadian)
					value = value * 180.0 / Math.PI;
				// 四捨五入。
				value *= 10000.0;
				value = Math.round(value);
				value /= 10000.0;
				// テキストボックスに格納。
				var text;
				if (this.theIsRadian)
					text = value.toString() + "rad";
				else
					text = value.toString() + "度";
				$(".mode6-measure-results").val(this.htmlspecialchars(text));
				break;
			}
		},
		// フルスクリーンでマウスホイール操作があった。
		onWheel: function(e){
			e.preventDefault();
			var delta;
			var oe = e; //var oe = e.originalEvent;
			if (oe.wheelDelta !== undefined) {
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
					this.doSetZoom(this.theZoom * 1.25);
				} else {
					this.doSetZoom(this.theZoom / 1.25);
				}
				var DP1 = this.LPtoDP(LP[0], LP[1]);
				this.theDeltaX -= DP1[0] - DP0[0];
				this.theDeltaY -= DP1[1] - DP0[1];
			} else {
				// ずらす。
				if (oe.shiftKey) { // Shiftキーが押されている？
					// 横にずらす。
					if (delta > 0) {
						this.theDeltaX -= 50;
					} else {
						this.theDeltaX += 50;
					}
				} else {
					// 縦にずらす。
					if (delta > 0) {
						this.theDeltaY += 50;
					} else {
						this.theDeltaY -= 50;
					}
				}
			}
			// 再描画。
			this.doRedraw();
		},
		// 描画の終わり。
		doRedrawFinish: function(ctx, succeeded){
			if (this.theLineOn) { // 線分を描画するか？
				if (this.px0 != this.px1 || this.py0 != this.py1) {
					this.doDrawLine(ctx, this.px0, this.py0, this.px1, this.py1, true);
					if (this.theDrawCircle) {
						this.doDrawCircle(ctx, this.px0, this.py0, this.px1, this.py1);
					}
				}
				if (this.theMode == 6) {
					if (this.theMeasureType == 'length' ||
						this.theMeasureType == 'angle')
					{
						if (this.sx0 != this.sx1 || this.sy0 != this.sy1) {
							this.doDrawLine(ctx, this.sx0, this.sy0, this.sx1, this.sy1, false);
						}
					}
				}
			}
			var canvas = $("#image-screen");
			var data = ctx.getImageData(0, 0, this.cxCanvas, this.cyCanvas);
			canvas[0].getContext('2d').putImageData(data, 0, 0);
			if (succeeded) {
				if (this.theImage || this.thePDF) {
					$(".mode2-filename").text(this.htmlspecialchars(this.theFileName));
					$(".mode2-filename").removeClass("error");
					$(".mode2-next").prop('disabled', false);
				}
			}
			this.theIsDrawing = false;
		},
		// マウスの左ボタンが押された。
		onLButtonDown: function(e){
			console.log("mousedown.VK_LBUTTON");
			e.preventDefault();
			if (!this.theCanDraw)
				return;
			var x = e.offsetX, y = e.offsetY;
			this.theHandleOn = this.isOnHandle(x, y);
			var LP = this.DPtoLP(x, y);
			if (this.theHandleOn == -1) {
				this.px0 = this.px1 = LP[0];
				this.py0 = this.py1 = LP[1];
				this.thePenOn = true;
			}
			if (this.theMode == 6) {
				$(".mode6-measure-results").val("");
			}
			this.doRedraw();
		},
		// マウスの中央ボタンが押された。
		onMButtonDown: function(e){
			console.log("mousedown.VK_MBUTTON");
			e.preventDefault();
			if (!this.theCanMove) {
				return;
			}
			this.mx0 = e.offsetX;
			this.my0 = e.offsetY;
			this.theMoveOn = true;
			this.doRedraw();
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
		// タッチデバイスでタッチが始まった。
		onTouchStart: function(e){
			console.log("touchstart");
			e.preventDefault();
			if (!this.theCanDraw)
				return;
			var pos = this.touchGetPos(e);
			var x = pos.x, y = pos.y;
			this.theHandleOn = this.isOnHandle(x, y);
			var LP = this.DPtoLP(x, y);
			if (this.theHandleOn == -1) {
				this.px0 = this.px1 = LP[0];
				this.py0 = this.py1 = LP[1];
				this.thePenOn = true;
			}
			if (this.theMode == 6) {
				$(".mode6-measure-results").val("");
			}
			this.doRedraw();
		},
		// タッチデバイスでタッチ移動した。
		onTouchMove: function(e){
			console.log("touchmove");
			e.preventDefault();
			if (this.theHandleOn == -1) {
				if (!this.theCanDraw || !this.thePenOn || !this.theLineOn)
					return;
			}
			var pos = this.touchGetPos(e);
			var x = pos.x, y = pos.y;
			var LP = this.DPtoLP(x, y);
			if (this.theHandleOn != -1) {
				if (this.theHandleOn == 0) {
					this.px0 = LP[0];
					this.py0 = LP[1];
				} else {
					this.px1 = LP[0];
					this.py1 = LP[1];
				}
			} else {
				var LP = this.DPtoLP(x, y);
				this.px1 = LP[0];
				this.py1 = LP[1];
			}
			if (this.theMode == 6) {
				this.doMeasure();
			}
			this.doRedraw();
		},
		// マウスが移動した。
		onMouseMove: function(e){
			console.log("mousemove");
			e.preventDefault();
			if (this.theHandleOn == -1) {
				if (this.thePenOn) {
					if (!this.theCanDraw || !this.theLineOn)
						return;
				} else if (this.theCanMove) {
					if (!this.theMoveOn)
						return;
				} else {
					return;
				}
			}
			var x = e.offsetX, y = e.offsetY;
			var LP = this.DPtoLP(x, y);
			if (this.theHandleOn != -1) {
				if (this.theHandleOn == 0) {
					this.px0 = LP[0];
					this.py0 = LP[1];
				} else {
					this.px1 = LP[0];
					this.py1 = LP[1];
				}
				if (this.theMode == 6) {
					this.doMeasure();
				}
			} else if (this.thePenOn) {
				var LP = this.DPtoLP(x, y);
				this.px1 = LP[0];
				this.py1 = LP[1];
				if (this.theMode == 6) {
					this.doMeasure();
				}
			} else if (this.theMoveOn) {
				this.theDeltaX += x - this.mx0;
				this.theDeltaY += y - this.my0;
				this.mx0 = x;
				this.my0 = y;
			}
			this.doRedraw();
		},
		// タッチデバイスでタッチが終了した。
		onTouchEnd: function(e){
			console.log("touchend");
			e.preventDefault();
			if (this.theHandleOn == -1) {
				if (!this.theCanDraw)
					return;
			}
			var pos = this.touchGetPos(e);
			var x = pos.x, y = pos.y;
			var LP = this.DPtoLP(x, y);
			if (this.theHandleOn != -1) {
				if (this.theHandleOn == 0) {
					this.px0 = LP[0];
					this.py0 = LP[1];
				} else {
					this.px1 = LP[0];
					this.py1 = LP[1];
				}
				this.theHandleOn = -1;
			} else {
				this.px1 = LP[0];
				this.py1 = LP[1];
				this.thePenOn = false;
			}
			if (this.theMode == 4) {
				if (this.px0 != this.px1 || this.py0 != this.py1) {
					$(".mode4-next").prop('disabled', false);
				} else {
					$(".mode4-next").prop('disabled', true);
				}
			}
			if (this.theMode == 6) {
				this.doMeasure();
			}
			this.doRedraw();
		},
		// マウスの左ボタンが解放された。
		onLButtonUp: function(e){
			console.log("mouseup.VK_LBUTTON");
			e.preventDefault();
			if (this.theHandleOn == -1) {
				if (!this.theCanDraw)
					return;
			}
			var x = e.offsetX, y = e.offsetY;
			var LP = this.DPtoLP(x, y);
			if (this.theHandleOn != -1) {
				if (this.theHandleOn == 0) {
					this.px0 = LP[0];
					this.py0 = LP[1];
				} else {
					this.px1 = LP[0];
					this.py1 = LP[1];
				}
				this.theHandleOn = -1;
			} else {
				this.px1 = LP[0];
				this.py1 = LP[1];
				this.thePenOn = false;
			}
			if (this.theMode == 4) {
				if (this.px0 != this.px1 || this.py0 != this.py1) {
					$(".mode4-next").prop('disabled', false);
				} else {
					$(".mode4-next").prop('disabled', true);
				}
			}
			if (this.theMode == 6) {
				this.doMeasure();
			}
			this.doRedraw();
		},
		// マウスの中央ボタンが解放された。
		onMButtonUp: function(e){
			console.log("mouseup.VK_MBUTTON");
			e.preventDefault();
			if (!this.theCanMove || !this.theMoveOn)
				return;
			this.theDeltaX += e.offsetX - this.mx0;
			this.theDeltaY += e.offsetY - this.my0;
			this.mx0 = e.offsetX;
			this.my0 = e.offsetY;
			this.theMoveOn = false;
			this.theHandleOn = -1;
			this.doRedraw();
		},
		// マウスのボタンが解放された。
		onMouseUp: function(e){
			switch (e.button) {
			case VK_LBUTTON:
				this.onLButtonUp(e);
				break;
			case VK_MBUTTON:
				this.onMButtonUp(e);
				break;
			}
		},
		// 設定OK。
		configOK: function(){
			// ズーム。
			var zoom = $("#config-dialog-zoom").val();
			switch (zoom) {
			case "-1":
				break;
			case "0": case "1": case "2":
				this.theFitMode = parseInt(zoom);
				this.doFitImage();
				break;
			default:
				zoom = parseInt(zoom);
				if (!isNaN(zoom)) {
					this.doSetZoom(zoom);
				}
				break;
			}
			// 線分の色。
			var color = $("#config-dialog-line-color").val();
			switch (color) {
			case 'red': case 'blue': case 'green': case 'yellow':
				this.theLineColor = color;
				break;
			}
			// 背景。
			var back = $("#config-dialog-background").val();
			switch (back) {
			case "-2": case "0": case "1": case "2": case "3": case "4": case "5":
				this.backgroundMode = parseInt(back);
				this.backgroundImage = null;
				break;
			default:
				break;
			}
			// ページ番号
			var page_no = parseInt($(".config-dialog-page-number").val());
			if (!isNaN(page_no)) {
				this.thePDFPageNumber = page_no;
			}
			// 再描画。
			if (isNaN(this.theZoom)) {
				alert("OK");
			}
			this.doRedraw();
			// ダイアログを閉じる。
			$("#config-dialog").dialog("close");
		},
		// 設定。
		config: function(){
			var Karasunpo = this;
			// 「設定」ダイアログを初期化。
			$("#config-dialog-zoom").val("-1");
			$("#config-dialog-line-color").val(this.theLineColor);
			switch (this.backgroundMode) {
			case -2: case 0: case 1: case 2: case 3: case 4: case 5:
				$("#config-dialog-background").val(this.backgroundMode);
				break;
			}
			$(".config-dialog-page-number").val('' + this.thePDFPageNumber);
			// 「設定」ダイアログを開く。
			$("#config-dialog").dialog({
				modal: true,
				title: "設定ダイアログ",
				width: "300px",
				buttons: {
					"OK": Karasunpo.configOK.bind(Karasunpo),
					"キャンセル": function(){
						// ダイアログを閉じる。
						$(this).dialog("close");
					}
				}
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
			Karasunpo.doFile(file);
		});
		$(".mode2-next").prop('disabled', true);

		// モード３：測定タイプ。
		$(".mode3-back").on('click', function(){
			Karasunpo.setMode(2);
		});
		$(".mode3-next").on('click', function(){
			if (Karasunpo.theMeasureType == 'inclination') {
				$(".mode6-measure-results").val("");
				Karasunpo.setMode(6);
			} else {
				Karasunpo.sx0 = Karasunpo.sy0 = Karasunpo.sx1 = Karasunpo.sy1 = 0;
				Karasunpo.px0 = Karasunpo.py0 = Karasunpo.px1 = Karasunpo.py1 = 0;
				$(".mode4-next").prop('disabled', true);
				Karasunpo.setMode(4);
			}
		});
		$(".mode3-measure-type-length").on('click', function(){
			$(".mode6-measure-type-text").text("長さ：");
			Karasunpo.theMeasureType = "length";
			$("#mode3-measure-type-length-1").prop('checked', true);
			$("#mode3-measure-type-length-2").prop('checked', true);
		});
		$(".mode3-measure-type-inclination").on('click', function(){
			$(".mode6-measure-type-text").text("傾き：");
			Karasunpo.theMeasureType = "inclination";
			$("#mode3-measure-type-inclination-1").prop('checked', true);
			$("#mode3-measure-type-inclination-2").prop('checked', true);
		});
		$(".mode3-measure-type-angle").on('click', function(){
			$(".mode6-measure-type-text").text("角度：");
			Karasunpo.theMeasureType = "angle";
			$("#mode3-measure-type-angle-1").prop('checked', true);
			$("#mode3-measure-type-angle-2").prop('checked', true);
		});
		$(".mode3-is-radian").on('click', function(){
			if ($(".mode3-is-radian").prop('checked')) {
				Karasunpo.theIsRadian = true;
			} else {
				Karasunpo.theIsRadian = false;
			}
		});
		// モード４：基準線分。
		$(".mode4-back").on('click', function(){
			Karasunpo.setMode(3);
		});
		$(".mode4-next").on('click', function(){
			if (Karasunpo.theMeasureType == 'angle') {
				Karasunpo.sx0 = Karasunpo.px0;
				Karasunpo.sy0 = Karasunpo.py0;
				Karasunpo.sx1 = Karasunpo.px1;
				Karasunpo.sy1 = Karasunpo.py1;
				Karasunpo.px0 = Karasunpo.py0 = Karasunpo.px1 = Karasunpo.py1 = 0;
				$(".mode6-measure-results").val("");
				Karasunpo.setMode(6);
			} else {
				Karasunpo.sx0 = Karasunpo.px0;
				Karasunpo.sy0 = Karasunpo.py0;
				Karasunpo.sx1 = Karasunpo.px1;
				Karasunpo.sy1 = Karasunpo.py1;
				Karasunpo.px0 = Karasunpo.py0 = Karasunpo.px1 = Karasunpo.py1 = 0;
				$(".mode5-numeric-text").text("");
				$(".mode5-unit-text").text("");
				Karasunpo.setMode(5);
			}
		});
		$(".mode4-draw-circle").on('click', function(){
			Karasunpo.theDrawCircle = $(".mode4-draw-circle").prop('checked');
			$(".mode6-draw-circle").prop('checked', Karasunpo.theDrawCircle);
			Karasunpo.doRedraw();
		});

		// モード５：基準線分の長さ。
		$(".mode5-back").on('click', function(){
			Karasunpo.px0 = Karasunpo.sx0;
			Karasunpo.py0 = Karasunpo.sy0;
			Karasunpo.px1 = Karasunpo.sx1;
			Karasunpo.py1 = Karasunpo.sy1;
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
			Karasunpo.theStdNominalLength = $(this).val();
			if (!isNaN(Karasunpo.theStdNominalLength) &&
				isFinite(Karasunpo.theStdNominalLength) &&
				Karasunpo.theStdNominalLength > 0)
			{
				$(".mode5-next").prop('disabled', false);
			} else {
				$(".mode5-next").prop('disabled', true);
			}
		});
		$(".mode5-unit-text").on('change input', function(){
			// 長さの単位。
			Karasunpo.theLengthUnit = $(this).val();
		});

		// モード６：測定。
		$(".mode6-back").on('click', function(){
			if (Karasunpo.theMeasureType == 'inclination') {
				Karasunpo.setMode(3);
			} else if (Karasunpo.theMeasureType == 'angle') {
				Karasunpo.setMode(4);
			} else {
				Karasunpo.px0 = Karasunpo.sx0;
				Karasunpo.py0 = Karasunpo.sy0;
				Karasunpo.px1 = Karasunpo.sx1;
				Karasunpo.py1 = Karasunpo.sy1;
				Karasunpo.setMode(5);
			}
		});
		$(".mode6-finish").on('click', function(){
			location.reload();
		});
		$(".mode6-draw-circle").on('click', function(){
			Karasunpo.theDrawCircle = $(".mode6-draw-circle").prop('checked');
			$(".mode4-draw-circle").prop('checked', this.theDrawCircle);
			Karasunpo.doRedraw();
		});
		$(".mode6-copy-text").on('click', function(){
			var text = $(".mode6-measure-results").val();
			if (Karasunpo.doCopyText(text)) {
				alert('コピーしました！');
			} else {
				alert('残念、コピーに失敗しました。');
			}
		});

		// ドロップ領域。
		$(".drop-area").on('dragenter dragover', function(e){
			e.stopPropagation();
			e.preventDefault();
			if (Karasunpo.theMode != 1 && Karasunpo.theMode != 2)
				return;
			$('.drop-area-navi').addClass('dragging-over');
		});
		$('.drop-area').on('dragleave', function(e){
			e.preventDefault();
			if (Karasunpo.theMode != 1 && Karasunpo.theMode != 2)
				return;
			$('.drop-area-navi').removeClass('dragging-over');
		});
		$('.drop-area').on('drop', function(e){
			e.preventDefault();
			if (Karasunpo.theMode != 1 && Karasunpo.theMode != 2)
				return;
			var file = e.originalEvent.dataTransfer.files[0];
			$('.drop-area-navi').removeClass('dragging-over');
			Karasunpo.doFile(file);
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
			if (Karasunpo.isSmartPhone()) {
				width = "250px";
			} else {
				width = "500px";
			}
			$("#history-dialog").dialog({
				modal: true,
				title: "更新履歴",
				width: width,
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
			var width;
			if (Karasunpo.isSmartPhone()) {
				width = "250px";
			} else {
				width = "500px";
			}
			$("#about-dialog").dialog({
				modal: true,
				title: "バージョン情報",
				width: width,
				buttons: {
					"OK": function() {
						// ダイアログを閉じる。
						$(this).dialog("close");
					},
				}
			});
		});

		// モードを初期化。
		Karasunpo.setMode(1);
	});
})(jQuery);
