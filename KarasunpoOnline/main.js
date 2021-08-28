// main.js -- Karasunpo Online (Japanese)
// Copyright (C) 2021 Katayama Hirofumi MZ. All Rights Reserved.
// License: MIT

$(function(){
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

	// HTMLの特殊文字を変換。
	var htmlspecialchars = function(str){
		return (str + '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#039;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
	};

	var theImage = null; // 画像。
	var theImageWidth = 0, theImageHeight = 0; // 画像のピクセルサイズ。
	var theCanvasWidth = 0, theCanvasHeight = 0; // キャンバスのピクセルサイズ。
	var theMeasureType = "length"; // 測定タイプ。
	var theMode = 1; // モード。
	var theFitMode = 0; // 画面モード。
	var theZoom = 100.0; // ズーム率（百分率）。
	var theCanDraw = false; // 描画できるか？
	var theCanMove = true; // 画像を動かせるか？
	var thePenOn = false; // ペンはキャンバス上にあるか？
	var theLineOn = false; // 線分をキャンバスに表示するか？
	var theMoveOn = false; // 画像を動かしているか？
	var theHandleOn = -1; // ハンドルを動かしているか？
	var theBackground = null; // 背景イメージ。
	var theIsRadian = false; // ラジアンか？
	var deltax = 0, deltay = 0; // 画面中央からのずれ（ピクセル単位）。
	var px0 = 0, py0 = 0, px1 = 0, py1 = 0; // 線分の位置。
	var sx0 = 0, sy0 = 0, sx1 = 0, sy1 = 0; // 基準線分の位置。
	var mx0 = 0, my0 = 0; // 中央ボタンでドラッグしている位置。
	var theLineStyle = 'rgb(255, 0, 0)'; // 線分の色。
	var theDrawCircle = false; // 補助円を描くか？
	var theIsPDF = false; // PDFファイルか？
	var thePDF = null; // PDFオブジェクト。
	var thePDFPageNumber = 1; // PDFのページ番号。
	var thePDFViewport = null; // PDFビューポート。
	var theStdNominalLength = 0; // 基準線分の長さ（名目）。
	var theLengthUnit = ""; // 長さの単位。

	// スマートフォンか？
	var isSmartPhone = function(){
		return (window.innerWidth < 750); // この値はCSSのmain.cssと合わせる必要がある。
	}

	// ハンドルのサイズを取得する。
	var getHandleSize = function() {
		if (isSmartPhone)
			return 10;
		return 5;
	}

	// 画像の中央座標を取得する。
	var getImageCenter = function(){
		if (theIsPDF) {
			if (thePDF == null)
				return [0, 0];
		} else {
			if (theImage == null)
				return [0, 0];
		}
		return [theImageWidth / 2, theImageHeight / 2];
	};

	// キャンバスの中央座標を取得する。
	var getCanvasCenter = function(){
		if (theIsPDF) {
			if (thePDF == null)
				return [0, 0];
		} else {
			if (theImage == null)
				return [0, 0];
		}
		return [theCanvasWidth / 2, theCanvasHeight / 2];
	};

	// 論理座標は、画像上の座標で、画像の中心を原点とする。
	// 物理座標は、キャンバス上の実際の座標とする。

	// 論理座標から物理座標へ。
	var LPtoDP = function(x, y) {
		var IC = getImageCenter();
		x += IC[0];
		y += IC[1];
		x *= theZoom / 100.0;
		y *= theZoom / 100.0;
		var CC = getCanvasCenter();
		x += CC[0];
		y += CC[1];
		x += deltax;
		y += deltay;
		return [x, y];
	};

	// 物理座標から論理座標へ。
	var DPtoLP = function(x, y) {
		x -= deltax;
		y -= deltay;
		var CC = getCanvasCenter();
		x -= CC[0];
		y -= CC[1];
		x /= theZoom / 100.0;
		y /= theZoom / 100.0;
		var IC = getImageCenter();
		x -= IC[0];
		y -= IC[1];
		return [x, y];
	};

	// 背景を描画する。
	var drawBackground = function(ctx, cx, cy) {
		// 市松模様。
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
		// 高速化のためにイメージデータを保存する。
		theBackground = ctx.getImageData(0, 0, theCanvasWidth, theCanvasHeight);
	};

	// PDFを表示する。
	var thePDFIsDrawing = false;
	var putPDF = function(canvas, ctx, finish) {
		if (!theIsPDF || !thePDF) {
			finish(ctx);
			return;
		}
		thePDF.getPage(thePDFPageNumber).then(function(page){
			if (theImageWidth == 0 && theImageHeight) {
				var viewport = page.getViewport({
					scale: 1.0,
				});
				theImageWidth = viewport.width;
				theImageHeight = viewport.height;
			}
			var zoomedWidth = theImageWidth * theZoom / 100.0;
			var zoomedHeight = theImageHeight * theZoom / 100.0;
			var px = (theCanvasWidth - zoomedWidth) / 2;
			var py = (theCanvasHeight - zoomedHeight) / 2;
			thePDFViewport = page.getViewport({
				scale: theZoom / 100.0,
				offsetX: px + deltax,
				offsetY: py + deltay
			});
			var renderContext = {
				canvasContext: ctx,
				viewport: thePDFViewport,
				background: "rgba(255, 255, 255, 0)"
			};
			thePDFIsDrawing = true;
			var renderTask = page.render(renderContext);
			renderTask.promise.then(function(){
				thePDFIsDrawing = false;
				finish(ctx);
			});
		});
	};

	// 画像を表示する。
	var putImage = function(canvas, ctx, finish) {
		if (theIsPDF || !theImage) {
			finish(ctx);
			return;
		}
		var zoomedWidth = theImageWidth * theZoom / 100.0;
		var zoomedHeight = theImageHeight * theZoom / 100.0;
		var px = (theCanvasWidth - zoomedWidth) / 2;
		var py = (theCanvasHeight - zoomedHeight) / 2;
		// 小さい画像のときは、アンチエイジングを無効にする。
		if (theImageWidth < 100 && theImageHeight < 100) {
			ctx.mozImageSmoothingEnabled = false;
			ctx.webkitImageSmoothingEnabled = false;
			ctx.msImageSmoothingEnabled = false;
			ctx.imageSmoothingEnabled = false;
		} else {
			ctx.mozImageSmoothingEnabled = true;
			ctx.webkitImageSmoothingEnabled = true;
			ctx.msImageSmoothingEnabled = true;
			ctx.imageSmoothingEnabled = true;
		}
		// 画像を描画。
		ctx.drawImage(theImage, px + deltax, py + deltay, zoomedWidth, zoomedHeight);
		finish(ctx);
	};

	// ズームするときのサイズの制限。
	var minWidth = 50, minHeight = 50;
	var maxWidth = 10000, maxHeight = 10000;

	// ズーム率を設定する。
	var doSetZoom = function(percents) {
		if (theIsPDF) {
			if (thePDF == null)
				return;
		} else {
			if (theImage == null)
				return;
		}

		// ズーム率を制限する。
		if (percents * theImageWidth / 100.0 < minWidth) {
			percents = minWidth * 100.0 / theImageWidth;
		}
		if (percents * theImageHeight / 100.0 < minHeight) {
			percents = minHeight * 100.0 / theImageHeight;
		}
		if (percents * theImageWidth / 100.0 > maxWidth) {
			percents = maxWidth * 100.0 / theImageWidth;
		}
		if (percents * theImageHeight / 100.0 > maxHeight) {
			percents = maxHeight * 100.0 / theImageHeight;
		}

		theZoom = percents;
	}

	// 画像を画面のサイズに合わせる。
	var doFit0 = function(width, height) {
		switch (theFitMode) {
		case 0: // 自動
			if (theCanvasWidth / theCanvasHeight > width / height) {
				doSetZoom(theCanvasHeight / height * 100);
			} else {
				doSetZoom(theCanvasWidth / width * 100);
			}
			break;
		case 1: // 横方向に合わせる
			doSetZoom(theCanvasWidth / width * 100);
			break;
		case 2: // 縦方向に合わせる。
			doSetZoom(theCanvasHeight / height * 100);
			break;
		}
	};

	// 画像を画面のサイズに合わせる。
	var doFitImage = function() {
		deltax = deltay = 0;
		if (theIsPDF) {
			if (thePDF) {
				thePDF.getPage(thePDFPageNumber).then(function(page){
					var viewport = page.getViewport({
						scale: 1.0,
					});
					theImageWidth = viewport.width;
					theImageHeight = viewport.height;
					doFit0(theImageWidth, theImageHeight);
				});
			}
		} else if (theImage) {
			doFit0(theImageWidth, theImageHeight);
		}
	};

	// ハンドル上にあるか？
	var isOnHandle = function(x, y){
		var xy0 = LPtoDP(px0, py0);
		var xy1 = LPtoDP(px1, py1);
		var handleSize = getHandleSize();
		if (isSmartPhone())
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
	};

	// 線を描く。
	var doDrawLine = function(ctx, x0, y0, x1, y1, flag = true){
		ctx.save();
		ctx.lineCap = 'round';
		if (flag) {
			ctx.lineWidth = 2;
		} else {
			ctx.lineWidth = 1;
		}
		ctx.strokeStyle = theLineStyle;
		ctx.beginPath();
		var xy0 = LPtoDP(x0, y0);
		var xy1 = LPtoDP(x1, y1);
		ctx.moveTo(xy0[0], xy0[1]);
		ctx.lineTo(xy1[0], xy1[1]);
		ctx.stroke();
		ctx.fillStyle = theLineStyle;
		ctx.beginPath();
		var handleSize = getHandleSize();
		if (flag) {
			ctx.arc(xy0[0], xy0[1], handleSize, 0, 2 * Math.PI, false);
			ctx.arc(xy1[0], xy1[1], handleSize, 0, 2 * Math.PI, false);
		} else {
			ctx.arc(xy0[0], xy0[1], handleSize / 2, 0, 2 * Math.PI, false);
			ctx.arc(xy1[0], xy1[1], handleSize / 2, 0, 2 * Math.PI, false);
		}
		ctx.fill();
		ctx.restore();
	};

	// 補助円を描画する。
	var doDrawCircle = function(ctx, x0, y0, x1, y1){
		var dx = (x1 - x0), dy = y1 - y0;
		var r = Math.sqrt(dx * dx + dy * dy) / 2;
		var cx = (x0 + x1) / 2;
		var cy = (y0 + y1) / 2;
		ctx.save();
		ctx.lineCap = 'round';
		ctx.lineWidth = 2;
		ctx.strokeStyle = theLineStyle;
		var xy0 = LPtoDP(cx, cy);
		var r0 = r * theZoom / 100.0;
		ctx.beginPath();
		ctx.arc(xy0[0], xy0[1], r0, 0, 2 * Math.PI, false);
		ctx.stroke();
		ctx.restore();
	};

	// 描画の終わり。
	var doRefreshFinish = function(ctx){
		if (theLineOn) { // 線分を描画するか？
			if (px0 != px1 || py0 != py1) {
				doDrawLine(ctx, px0, py0, px1, py1, true);
				if (theDrawCircle) {
					doDrawCircle(ctx, px0, py0, px1, py1);
				}
			}
			if (theMode == 6) {
				if (theMeasureType == 'length' || theMeasureType == 'angle') {
					if (sx0 != sx1 || sy0 != sy1) {
						doDrawLine(ctx, sx0, sy0, sx1, sy1, false);
					}
				}
			}
		}
		var canvas = $("#image-screen");
		var data = ctx.getImageData(0, 0, theCanvasWidth, theCanvasHeight);
		canvas[0].getContext('2d').putImageData(data, 0, 0);
	};

	// 画面を再描画する。
	var doRefresh = function(){
		var canvas = $("#offscreen");
		var ctx = canvas[0].getContext('2d');
		if (!thePDFIsDrawing) {
			// 背景を描画する。
			if (theBackground) {
				// 以前保存したものを使用する。
				ctx.putImageData(theBackground, 0, 0);
			} else {
				var cxCanvas = parseInt(canvas.attr('width'));
				var cyCanvas = parseInt(canvas.attr('height'));
				drawBackground(ctx, cxCanvas, cyCanvas);
			}
		} else {
			setTimeout(function(){
				doRefresh();
			}, 2000);
			return;
		}
		if (theIsPDF) {
			putPDF(canvas, ctx, doRefreshFinish);
		} else {
			putImage(canvas, ctx, doRefreshFinish);
		}
	};

	// 画面のサイズが変わった。
	var onWindowResize = function(){
		var canvas = $("#image-screen");
		if (isSmartPhone()) {
			theCanvasWidth = parseInt(window.innerWidth);
			theCanvasHeight = parseInt(window.innerHeight * 0.74);
		} else {
			theCanvasWidth = parseInt(window.innerWidth * 0.69);
			theCanvasHeight = parseInt(window.innerHeight);
		}
		canvas.attr('width', theCanvasWidth + "px");
		canvas.attr('height', theCanvasHeight + "px");
		$("#offscreen").attr('width', theCanvasWidth + "px");
		$("#offscreen").attr('height', theCanvasHeight + "px");
		theBackground = null;
		doFitImage();
		doRefresh();
	};
	$(window).on('resize', onWindowResize);

	// モードを設定する。
	var setMode = function(mode) {
		$(".mode").hide();
		$("#mode" + mode).show();

		switch (mode) {
		case 1: // モード１：初期画面。
			theLineOn = theCanDraw = false;
			// 画面サイズに関する初期化。
			onWindowResize();
			break;
		case 2: // モード２：ファイルを開く。
			theLineOn = theCanDraw = false;
			break;
		case 3: // モード３：測定タイプ。
			theLineOn = theCanDraw = false;
			break;
		case 4: // モード４：基準線分。
			theLineOn = theCanDraw = true;
			break;
		case 5: // モード５：基準線分の長さ。
			theLineOn = true;
			theCanDraw = false;
			break;
		case 6: // モード６：測定。
			theLineOn = theCanDraw = true;
			break;
		}
		theMode = mode;

		doRefresh();
	};

	// ファイルを処理する。
	var doFile = function(file){
		theIsPDF = (file.name.indexOf(".pdf") != -1 || file.name.indexOf(".PDF") != -1);
		var reader = new FileReader();
		reader.onload = function(e){
			onWindowResize();
			if (theIsPDF) {
				var ary = new Uint8Array(e.target.result);
				var loadingTask = pdfjsLib.getDocument(ary);
				loadingTask.promise.then(function(pdf){
					var text = file.name;
					if (text.length > 16)
						text = text.slice(0, 16) + "...";
					$(".filename").text(htmlspecialchars(text));
					$(".filename").removeClass("error");
					$(".mode2-next").prop('disabled', false);

					thePDF = pdf;
					thePDFPageNumber = 1;
					doFitImage();
					doRefresh();
				});
			} else {
				var img1 = new Image();
				img1.src = e.target.result;
				img1.onload = function(){
					var text = file.name;
					if (text.length > 16)
						text = text.slice(0, 16) + "...";
					$(".filename").text(htmlspecialchars(text));
					$(".filename").removeClass("error");
					$(".mode2-next").prop('disabled', false);

					theImage = img1;
					theImageWidth = parseInt(theImage.width);
					theImageHeight = parseInt(theImage.height);
					doFitImage();
					doRefresh();
				};
			}
		};
		if (theIsPDF)
			reader.readAsArrayBuffer(file);
		else
			reader.readAsDataURL(file);
		$(".mode").hide();
		$("#mode2").show();
	};

	// モード１：初期画面。
	$(".mode1-next").on('click', function(){
		setMode(2);
	});

	// モード２：ファイルを開く。
	$(".mode2-back").on('click', function(){
		setMode(1);
	});
	$(".mode2-next").on('click', function(){
		setMode(3);
	});
	$(".mode2-choose-image").on('click', function(){
		$(".mode2-upload-file").first().click();
	});
	$(".mode2-upload-file").change(function(){
		var file = $(this).prop('files')[0];
		doFile(file);
	});
	$(".mode2-next").prop('disabled', true);

	// モード３：測定タイプ。
	$(".mode3-back").on('click', function(){
		setMode(2);
	});
	$(".mode3-next").on('click', function(){
		if (theMeasureType == 'inclination') {
			$(".mode6-measure-results").val("");
			setMode(6);
		} else {
			sx0 = sy0 = sx1 = sy1 = 0;
			px0 = py0 = px1 = py1 = 0;
			$(".mode4-next").prop('disabled', true);
			setMode(4);
		}
	});
	$(".mode3-measure-type-length").on('click', function(){
		$(".mode6-measure-type-text").text("長さ：");
		theMeasureType = "length";
		$("#mode3-measure-type-length-1").prop('checked', true);
		$("#mode3-measure-type-length-2").prop('checked', true);
	});
	$(".mode3-measure-type-inclination").on('click', function(){
		$(".mode6-measure-type-text").text("傾き：");
		theMeasureType = "inclination";
		$("#mode3-measure-type-inclination-1").prop('checked', true);
		$("#mode3-measure-type-inclination-2").prop('checked', true);
	});
	$(".mode3-measure-type-angle").on('click', function(){
		$(".mode6-measure-type-text").text("角度：");
		theMeasureType = "angle";
		$("#mode3-measure-type-angle-1").prop('checked', true);
		$("#mode3-measure-type-angle-2").prop('checked', true);
	});
	$(".mode3-is-radian").on('click', function(){
		if ($(".mode3-is-radian").prop('checked')) {
			theIsRadian = true;
		} else {
			theIsRadian = false;
		}
	});
	// モード４：基準線分。
	$(".mode4-back").on('click', function(){
		setMode(3);
	});
	$(".mode4-next").on('click', function(){
		if (theMeasureType == 'angle') {
			sx0 = px0;
			sy0 = py0;
			sx1 = px1;
			sy1 = py1;
			px0 = py0 = px1 = py1 = 0;
			$(".mode6-measure-results").val("");
			setMode(6);
		} else {
			sx0 = px0;
			sy0 = py0;
			sx1 = px1;
			sy1 = py1;
			px0 = py0 = px1 = py1 = 0;
			$(".mode5-numeric-text").text("");
			$(".mode5-unit-text").text("");
			setMode(5);
		}
	});
	$(".mode4-draw-circle").on('click', function(){
		theDrawCircle = $(".mode4-draw-circle").prop('checked');
		$(".mode6-draw-circle").prop('checked', theDrawCircle);
		doRefresh();
	});

	// モード５：基準線分の長さ。
	$(".mode5-back").on('click', function(){
		px0 = sx0;
		py0 = sy0;
		px1 = sx1;
		py1 = sy1;
		if (px0 != px1 || py0 != py1) {
			$(".mode4-next").prop('disabled', false);
		} else {
			$(".mode4-next").prop('disabled', true);
		}
		setMode(4);
	});
	$(".mode5-next").on('click', function(){
		$(".mode6-measure-results").val("");
		setMode(6);
	});
	$(".mode5-next").prop('disabled', true);
	$(".mode5-numeric-text").on('change input', function(){
		// 基準線分の長さ（名目）。
		theStdNominalLength = $(this).val();
		if (!isNaN(theStdNominalLength) && isFinite(theStdNominalLength) && theStdNominalLength > 0) {
			$(".mode5-next").prop('disabled', false);
		} else {
			$(".mode5-next").prop('disabled', true);
		}
	});
	$(".mode5-unit-text").on('change input', function(){
		// 長さの単位。
		theLengthUnit = $(this).val();
	});

	// モード６：測定。
	$(".mode6-back").on('click', function(){
		if (theMeasureType == 'inclination') {
			setMode(3);
		} else if (theMeasureType == 'angle') {
			setMode(4);
		} else {
			px0 = sx0;
			py0 = sy0;
			px1 = sx1;
			py1 = sy1;
			setMode(5);
		}
	});
	$(".mode6-finish").on('click', function(){
		location.reload();
	});
	$(".mode6-draw-circle").on('click', function(){
		theDrawCircle = $(".mode6-draw-circle").prop('checked');
		$(".mode4-draw-circle").prop('checked', theDrawCircle);
		doRefresh();
	});
	function doCopyText(text) {
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
	}
	$(".mode6-copy-text").on('click', function(){
		var text = $(".mode6-measure-results").val();
		if (doCopyText(text)) {
			alert('コピーしました！');
		} else {
			alert('残念、コピーに失敗しました。');
		}
	});

	// ドロップ領域。
	$(".drop-area").on('dragenter dragover', function(e){
		e.stopPropagation();
		e.preventDefault();
		if (theMode != 1 && theMode != 2)
			return;
		$('.drop-area-navi').addClass('dragging-over');
	});
	$('.drop-area').on('dragleave', function(e){
		e.preventDefault();
		if (theMode != 1 && theMode != 2)
			return;
		$('.drop-area-navi').removeClass('dragging-over');
	});
	$('.drop-area').on('drop', function(e){
		e.preventDefault();
		if (theMode != 1 && theMode != 2)
			return;
		var file = e.originalEvent.dataTransfer.files[0];
		$('.drop-area-navi').removeClass('dragging-over');
		doFile(file);
	});

	var VK_LBUTTON = 0; // マウスの左ボタン。
	var VK_MBUTTON = 1; // マウスの中央ボタン。
	var VK_RBUTTON = 2; // マウスの右ボタン。

	// イメージスクリーン。

	// タップ位置を取得する為の関数群
	var toucnScrollX = function(){
		return document.documentElement.scrollLeft || document.body.scrollLeft;
	};
	var toucnScrollY = function(){
		return document.documentElement.scrollTop || document.body.scrollTop;
	};
	var touchGetPos = function(e) {
		var rect = $("#image-screen")[0].getBoundingClientRect();
		var touch = e.touches[0] || e.changedTouches[0];
		return {
			x : touch.clientX - rect.left,
			y : touch.clientY - rect.top
		};
	};

	var touchMoved = false;
	var pinchDistance = 0;

	$('#image-screen').on('mousedown', function(e){
		touchMoved = false;
		pinchDistance = 0;
		switch (e.button) {
		case VK_LBUTTON:
			console.log("mousedown.VK_LBUTTON");
			e.preventDefault();
			if (!theCanDraw)
				return;
			var x = e.offsetX, y = e.offsetY;
			theHandleOn = isOnHandle(x, y);
			var LP = DPtoLP(x, y);
			if (theHandleOn == -1) {
				px0 = px1 = LP[0];
				py0 = py1 = LP[1];
				thePenOn = true;
			}
			if (theMode == 6) {
				$(".mode6-measure-results").val("");
			}
			doRefresh();
			break;
		case VK_MBUTTON:
			console.log("mousedown.VK_MBUTTON");
			e.preventDefault();
			if (!theCanMove)
				return;
			mx0 = e.offsetX;
			my0 = e.offsetY;
			theMoveOn = true;
			doRefresh();
			break;
		}
	});

	// タッチデバイスでタッチした。
	$('#image-screen').on('touchstart', function(e){
		console.log("touchstart");
		touchMoved = false;
		pinchDistance = 0;
		e.preventDefault();
		if (!theCanDraw)
			return;
		var pos = touchGetPos(e);
		var x = pos.x, y = pos.y;
		theHandleOn = isOnHandle(x, y);
		var LP = DPtoLP(x, y);
		if (theHandleOn == -1) {
			px0 = px1 = LP[0];
			py0 = py1 = LP[1];
			thePenOn = true;
		}
		if (theMode == 6) {
			$(".mode6-measure-results").val("");
		}
		doRefresh();
	});

	// 測定。
	var doMeasure = function(){
		switch (theMeasureType) {
		case "length":
			console.log("doMeasure.length");
			// 基準線分のベクトル。
			var sdx = sx1 - sx0, sdy = sy1 - sy0;
			// 基準線分の長さ（ピクセル単位）。
			var stdPixelLength = Math.sqrt(sdx * sdx + sdy * sdy);
			// 線分の長さを求める。
			var dx = px1 - px0, dy = py1 - py0;
			var pixelLength = Math.sqrt(dx * dx + dy * dy);
			// 名目上の長さを求める。
			var value = parseFloat(theStdNominalLength) * parseFloat(pixelLength) / parseFloat(stdPixelLength);
			// 四捨五入。
			value *= 10000.0;
			value = Math.round(value);
			value /= 10000.0;
			// テキストボックスに格納。
			var text = value.toString() + theLengthUnit;
			$(".mode6-measure-results").val(htmlspecialchars(text));
			break;
		case 'inclination':
			console.log("doMeasure.inclination");
			// 線分の傾きを求める。
			var dx = px1 - px0, dy = py1 - py0;
			var value = Math.atan2(-dy, dx);
			// 必要なら度に直す。
			if (!theIsRadian)
				value = value * 180.0 / Math.PI;
			// 四捨五入。
			value *= 10000.0;
			value = Math.round(value);
			value /= 10000.0;
			// テキストボックスに格納。
			var text;
			if (theIsRadian)
				text = value.toString() + "rad";
			else
				text = value.toString() + "度";
			$(".mode6-measure-results").val(htmlspecialchars(text));
			break;
		case 'angle':
			console.log("doMeasure.angle");
			// ２線分のベクトル。
			var dx0 = sx1 - sx0, dy0 = sy1 - sy0;
			var dx1 = px1 - px0, dy1 = py1 - py0;
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
			if (!theIsRadian)
				value = value * 180.0 / Math.PI;
			// 四捨五入。
			value *= 10000.0;
			value = Math.round(value);
			value /= 10000.0;
			// テキストボックスに格納。
			var text;
			if (theIsRadian)
				text = value.toString() + "rad";
			else
				text = value.toString() + "度";
			$(".mode6-measure-results").val(htmlspecialchars(text));
			break;
		}
	};

	// タッチデバイスでタッチ移動した。
	$('#image-screen').on('touchmove', function(e){
		console.log("touchmove");
		e.preventDefault();
		var touch = event.changedTouches;
		if (touch.length > 1) {
			touchMoved = true;
			var x0 = touch[0].pageX;
			var y0 = touch[0].pageY;
			var x1 = touch[1].pageX;
			var y1 = touch[1].pageY;
			var distance = Math.sqrt(Math.pow(x1 - x0) + Math.pow(y1 - y0));
			if (pinchDistance != 0) {
				var scale = distance / pinchDistance;
				pinchDistance = distance;
				doSetZoom(theZoom * scale);
				doRefresh();
			}
			return;
		}
		if (theHandleOn == -1) {
			if (!theCanDraw || !thePenOn || !theLineOn)
				return;
		}
		var pos = touchGetPos(e);
		var x = pos.x, y = pos.y;
		var LP = DPtoLP(x, y);
		if (theHandleOn != -1) {
			if (theHandleOn == 0) {
				px0 = LP[0];
				py0 = LP[1];
			} else {
				px1 = LP[0];
				py1 = LP[1];
			}
		} else {
			var LP = DPtoLP(x, y);
			px1 = LP[0];
			py1 = LP[1];
		}
		if (theMode == 6) {
			doMeasure();
		}
		doRefresh();
	});

	$('#image-screen').on('mousemove', function(e){
		switch (e.button) {
		case VK_LBUTTON:
			console.log("mousemove.VK_LBUTTON");
			e.preventDefault();
			if (theHandleOn == -1) {
				if (!theCanDraw || !thePenOn || !theLineOn)
					return;
			}
			var x = e.offsetX, y = e.offsetY;
			var LP = DPtoLP(x, y);
			if (theHandleOn != -1) {
				if (theHandleOn == 0) {
					px0 = LP[0];
					py0 = LP[1];
				} else {
					px1 = LP[0];
					py1 = LP[1];
				}
			} else {
				var LP = DPtoLP(x, y);
				px1 = LP[0];
				py1 = LP[1];
			}
			if (theMode == 6) {
				doMeasure();
			}
			doRefresh();
			break;
		case VK_MBUTTON:
			console.log("mousemove.VK_MBUTTON");
			e.preventDefault();
			if (!theCanMove || !theMoveOn)
				return;
			deltax += e.offsetX - mx0;
			deltay += e.offsetY - my0;
			mx0 = e.offsetX;
			my0 = e.offsetY;
			doRefresh();
			break;
		}
	});

	$('#image-screen').on('touchend', function(e){
		console.log("touchend");
		e.preventDefault();
		if (touchMoved)
			return;
		if (theHandleOn == -1) {
			if (!theCanDraw)
				return;
		}
		var pos = touchGetPos(e);
		var x = pos.x, y = pos.y;
		var LP = DPtoLP(x, y);
		if (theHandleOn != -1) {
			if (theHandleOn == 0) {
				px0 = LP[0];
				py0 = LP[1];
			} else {
				px1 = LP[0];
				py1 = LP[1];
			}
			theHandleOn = -1;
		} else {
			px1 = LP[0];
			py1 = LP[1];
			thePenOn = false;
		}
		if (theMode == 4) {
			if (px0 != px1 || py0 != py1) {
				$(".mode4-next").prop('disabled', false);
			} else {
				$(".mode4-next").prop('disabled', true);
			}
		}
		if (theMode == 6) {
			doMeasure();
		}
		doRefresh();
	});

	$('#image-screen').on('mouseup', function(e){
		switch (e.button) {
		case VK_LBUTTON:
			console.log("mouseup.VK_LBUTTON");
			e.preventDefault();
			if (theHandleOn == -1) {
				if (!theCanDraw)
					return;
			}
			var x = e.offsetX, y = e.offsetY;
			var LP = DPtoLP(x, y);
			if (theHandleOn != -1) {
				if (theHandleOn == 0) {
					px0 = LP[0];
					py0 = LP[1];
				} else {
					px1 = LP[0];
					py1 = LP[1];
				}
				theHandleOn = -1;
			} else {
				px1 = LP[0];
				py1 = LP[1];
				thePenOn = false;
			}
			if (theMode == 4) {
				if (px0 != px1 || py0 != py1) {
					$(".mode4-next").prop('disabled', false);
				} else {
					$(".mode4-next").prop('disabled', true);
				}
			}
			if (theMode == 6) {
				doMeasure();
			}
			doRefresh();
			break;
		case VK_MBUTTON:
			console.log("mouseup.VK_MBUTTON");
			e.preventDefault();
			if (!theCanMove || !theMoveOn)
				return;
			deltax += e.offsetX - mx0;
			deltay += e.offsetY - my0;
			mx0 = e.offsetX;
			my0 = e.offsetY;
			theMoveOn = false;
			theHandleOn = -1;
			doRefresh();
			break;
		}
	});

	// フルスクリーンでマウスホイール操作があった。
	var onWheel = function(e){
		e.preventDefault();
		var delta;
		var oe = e; //var oe = e.originalEvent;
		if (oe.wheelDelta !== undefined) {
			delta = oe.wheelDelta;
		} else {
			delta = oe.deltaY * -1;
		}
		if (oe.ctrlKey) {
			var CC = getCanvasCenter();
			var LP = DPtoLP(CC[0], CC[1]);
			var DP0 = LPtoDP(LP[0], LP[1]);
			if (delta > 0) {
				doSetZoom(theZoom * 1.25);
			} else {
				doSetZoom(theZoom / 1.25);
			}
			var DP1 = LPtoDP(LP[0], LP[1]);
			deltax -= DP1[0] - DP0[0];
			deltay -= DP1[1] - DP0[1];
		} else {
			if (oe.shiftKey) {
				if (delta > 0) {
					deltax -= 50;
				} else {
					deltax += 50;
				}
			} else {
				if (delta > 0) {
					deltay += 50;
				} else {
					deltay -= 50;
				}
			}
		}
		doRefresh();
	};
	document.getElementById("fullscreen").addEventListener('wheel', onWheel, {passive: false});
	document.getElementById("fullscreen").addEventListener('mousewheel', onWheel, {passive: false});

	// 設定ボタン。
	$("#config-button").click(function(){
		$("#config-dialog").dialog({
			modal: true,
			title: "設定ダイアログ",
			width: "300px",
			buttons: {
				"OK": function() {
					var zoom = $("#config-dialog-zoom").val();
					switch (zoom) {
					case "-1":
						break;
					case "0":
						theFitMode = 0;
						doFitImage();
						break;
					case "1":
						theFitMode = 1;
						doFitImage();
						break;
					case "2":
						theFitMode = 2;
						doFitImage();
						break;
					default:
						zoom = parseInt(zoom);
						doSetZoom(zoom);
						break;
					}
					var color = $("#config-dialog-line-color").val();
					switch (color) {
					case "red":
						theLineStyle = 'rgb(255, 0, 0)';
						break;
					case "blue":
						theLineStyle = 'rgb(0, 0, 255)';
						break;
					case "green":
						theLineStyle = 'rgb(0, 255, 0)';
						break;
					}
					doRefresh();
					// ダイアログを閉じる。
					$(this).dialog("close");
				},
				"キャンセル": function() {
					// ダイアログを閉じる。
					$(this).dialog("close");
				}
			}
		});
	});

	// 更新履歴ボタン。
	$("#history-button").click(function(){
		$("#history-dialog").dialog({
			modal: true,
			title: "更新履歴",
			width: (isSmartPhone() ? "250px" : "500px"),
			buttons: {
				"OK": function() {
					// ダイアログを閉じる。
					$(this).dialog("close");
				},
			}
		});
	});

	// 設定ボタン。
	$("#about-button").click(function(){
		$("#about-dialog").dialog({
			modal: true,
			title: "バージョン情報",
			width: (isSmartPhone() ? "250px" : "500px"),
			buttons: {
				"OK": function() {
					// ダイアログを閉じる。
					$(this).dialog("close");
				},
			}
		});
	});

	// モードを初期化。
	setMode(1);
});
