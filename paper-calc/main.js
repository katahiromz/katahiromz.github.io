// main.js --- 筆算計算
// Author: katahiromz
// License: MIT
"use strict";
const VERSION = '1.0.6'; // バージョン
const DEBUGGING = false; // デバッグ中か？
document.addEventListener('DOMContentLoaded', function () {
    Paper.g_minimal = true; // 紙の拡張を最小限にする
    let canvas = document.getElementById('my-canvas');
    let canvas_space = document.getElementById('my-canvas-space');
    let start_button = document.getElementById('my-start-button');
    let stop_button = document.getElementById('my-stop-button');
    let reset_button = document.getElementById('my-reset-button');
    let next_step_button = document.getElementById('my-next-step-button');
    let textarea = document.getElementById('my-textarea');
    let text_a = document.getElementById('my-text-a');
    let text_b = document.getElementById('my-text-b');
    let text_c = document.getElementById('my-text-c');
    let accuracy = document.getElementById('my-accuracy');
    let select = document.getElementById('my-select');
    let speedRange = document.getElementById('my-speed-range');
    let speedLabel = document.getElementById('speed-label');
    let errorDisplay = document.getElementById('input-error-message');
    let label_a = document.getElementById('label-a');
    let label_b = document.getElementById('label-b');
    let algorithm = null;
    let op = null;
    let speedInfo = {
        1: { text: '大変おそい', delay: 900 },
        2: { text: 'すごくおそい', delay: 800 },
        3: { text: '少しおそい', delay: 700 },
        4: { text: 'ふつう', delay: 500 },
        5: { text: '少しはやい', delay: 300 },
        6: { text: 'すごくはやい', delay: 200 },
        7: { text: '大変はやい', delay: 100 },
    };
    // Ctrl + マウスホイール回転でキャンバスをズーム
    // - Ctrl+Wheel はブラウザのページズームに奪われがちなので、passive:false で preventDefault する
    // - CSS transform で拡大縮小し、マウスポインタ位置を transform-origin にして直感的にズームする
    const zoomState = {
        scale: 1.0,
        minScale: 0.25,
        maxScale: 6.0,
        step: 1.2,
    };
    // 中ボタンドラッグでキャンバスをパン(移動)
    // transform を (translate + scale) に統一して、ズームとパンを共存させる
    const panState = {
        x: 0,
        y: 0,
        dragging: false,
        startClientX: 0,
        startClientY: 0,
        startX: 0,
        startY: 0,
        pointerId: null,
    };
    // 値を閉区間[min, max]の範囲内に制限する
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    // ビューポート VW×VH に対してキャンバス表示サイズが収まるよう
    // panState.x/y をクランプ（または中央寄せ）する。
    // 丸め規則: 浮動小数点の中間値はすべて Math.floor で整数に丸めて誤差を抑制する（切り捨て）。
    // 最終的に panState.x/y は整数となる。
    const clampPan = () => {
        // ビューポートサイズ（整数 px）
        const VW = canvas_space.clientWidth;
        const VH = canvas_space.clientHeight;
        if (VW <= 0 || VH <= 0)
            return;
        // canvas の CSS レイアウトサイズ（transform 前、整数 px）
        const CW_L = canvas.offsetWidth;
        const CH_L = canvas.offsetHeight;
        if (CW_L <= 0 || CH_L <= 0)
            return;
        const s = zoomState.scale;
        // 倍率適用後の表示サイズ（切り捨て: 保守的に小さく見積もる）
        const CW2 = Math.floor(CW_L * s);
        const CH2 = Math.floor(CH_L * s);
        // flex センタリングにより canvas 左端/上端が置かれるオフセット（切り捨て）
        // panState = (0, 0) のとき canvas 左端はビューポート内の flex_x 位置にある
        const flex_x = Math.floor((VW - CW_L) / 2);
        const flex_y = Math.floor((VH - CH_L) / 2);
        // X 軸
        if (CW2 >= VW) {
            // キャンバスがビューポートより大きい → 端に空白が出ないようクランプ
            // 上限: canvas 左端がビューポート左端に揃う（visual_left = 0）
            const maxX = -flex_x;
            // 下限: canvas 右端がビューポート右端に揃う（visual_right = VW）
            const minX = VW - flex_x - CW2;
            panState.x = Math.min(maxX, Math.max(minX, panState.x));
        }
        else {
            // キャンバスがビューポートより小さい → 中央寄せ固定（切り捨て）
            panState.x = Math.floor((VW - CW2) / 2) - flex_x;
        }
        // Y 軸
        if (CH2 >= VH) {
            const maxY = -flex_y;
            const minY = VH - flex_y - CH2;
            panState.y = Math.min(maxY, Math.max(minY, panState.y));
        }
        else {
            panState.y = Math.floor((VH - CH2) / 2) - flex_y;
        }
    };
    // transform-origin は常に 0 0 に固定し、translate+scale で変換を統一する
    const applyCanvasTransform = () => {
        clampPan();
        canvas.style.transformOrigin = '0 0';
        canvas.style.transform = `translate(${panState.x}px, ${panState.y}px) scale(${zoomState.scale})`;
    };
    // ズームとパンニングをリセット
    const resetZoomAndPan = () => {
        panState.x = panState.y = 0;
        zoomState.scale = 1.0;
        applyCanvasTransform();
    };
    // ズーム補正式のピボット点（translate 座標系、整数）を返す
    // canvas.getBoundingClientRect() を使うことで flex センタリング・スクロール・transform を自動的に考慮する
    const getZoomPivot = (clientX, clientY) => {
        const canvasRect = canvas.getBoundingClientRect();
        return {
            x: Math.round(clientX) - Math.round(canvasRect.left) + panState.x,
            y: Math.round(clientY) - Math.round(canvasRect.top) + panState.y,
        };
    };
    // ズーム中心 (pivotX, pivotY) を固定したまま panState を補正する
    const adjustPanForZoomAtSpacePoint = (pivotX, pivotY, prevScale, nextScale) => {
        panState.x = Math.round(pivotX + (panState.x - pivotX) * nextScale / prevScale);
        panState.y = Math.round(pivotY + (panState.y - pivotY) * nextScale / prevScale);
    };
    const getWheelScaleFactor = (deltaY) => {
        // deltaY: 下方向が正(通常)。下に回す=縮小, 上に回す=拡大
        if (deltaY < 0)
            return zoomState.step;
        if (deltaY > 0)
            return 1 / zoomState.step;
        return 1;
    };
    // マウスホイール回転時の処理
    const onCanvasWheel = (e) => {
        // Ctrl が押されていない通常スクロールは従来通り(何もしない)
        if (!e.ctrlKey)
            return;
        // ブラウザ(ページ)ズームを抑止
        e.preventDefault();
        if (canvas.width <= 1 && canvas.height <= 1)
            return;
        // translate 座標系でのズーム中心（flex センタリング・スクロールを自動考慮）
        // キャンバス外からのズームはキャンバス中央をピボットにする（自然な挙動）
        const canvasRect = canvas.getBoundingClientRect();
        const pivotClientX = (e.clientX >= canvasRect.left && e.clientX <= canvasRect.right)
            ? e.clientX : Math.round((canvasRect.left + canvasRect.right) / 2);
        const pivotClientY = (e.clientY >= canvasRect.top && e.clientY <= canvasRect.bottom)
            ? e.clientY : Math.round((canvasRect.top + canvasRect.bottom) / 2);
        const sp = getZoomPivot(pivotClientX, pivotClientY);
        // 次のスケールを計算
        const factor = getWheelScaleFactor(e.deltaY);
        const prevScale = zoomState.scale;
        const nextScale = clamp(prevScale * factor, zoomState.minScale, zoomState.maxScale);
        // スケールが変わらない場合は何もしない
        if (nextScale === prevScale) {
            applyCanvasTransform();
            return;
        }
        // ズーム中心を固定するよう panState を補正してからスケールを更新
        adjustPanForZoomAtSpacePoint(sp.x, sp.y, prevScale, nextScale);
        zoomState.scale = nextScale;
        applyCanvasTransform();
    };
    // タッチ（ピンチ）ズーム用のポインター追跡
    const touchPointers = new Map();
    // 中ボタン(ホイール押し込み)ドラッグでパン
    const onCanvasPointerDown = (e) => {
        // タッチポインターはピンチズーム用に追跡
        if (e.pointerType === 'touch') {
            // canvas_space 内のタッチのみ処理する。
            // input/button など他の要素へのタッチで preventDefault を呼ぶと
            // スマホでキーボードが開かなくなるため、必ずターゲットを確認する。
            if (!canvas_space.contains(e.target))
                return;
            // ブラウザのスクロール・ジェスチャーを最優先で止める
            e.preventDefault();
            touchPointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
            // setPointerCapture で指が要素外に出てもイベントを受け取り続ける
            // canvas_space ではなく window に登録しているため window でキャプチャする
            if (e.pointerId != null) {
                try {
                    e.target.setPointerCapture(e.pointerId);
                }
                catch (_) { }
            }
            return;
        }
        if (e.button !== 1)
            return;
        e.preventDefault();
        panState.dragging = true;
        panState.startClientX = e.clientX;
        panState.startClientY = e.clientY;
        panState.startX = panState.x;
        panState.startY = panState.y;
        if (e.pointerId != null && canvas.setPointerCapture) {
            panState.pointerId = e.pointerId;
            canvas.setPointerCapture(e.pointerId);
        }
        canvas.style.cursor = 'grabbing';
    };
    const onCanvasPointerMove = (e) => {
        // タッチポインター: 2本指ならピンチズーム、1本指ならパン
        if (e.pointerType === 'touch') {
            // 追跡中のポインターのみ処理する（canvas_space 外のタッチは追跡していない）。
            // Android Chrome はpointermoveの途中でジェスチャーを横取りすることがあるが、
            // canvas_space 内のタッチのみ preventDefault を呼ぶことでキーボード入力を妨げない。
            if (!touchPointers.has(e.pointerId)) {
                return;
            }
            e.preventDefault();
            if (touchPointers.size === 1) {
                // 1本指パン: 前回位置との差分を panState に加算
                const prev = touchPointers.get(e.pointerId);
                panState.x += Math.round(e.clientX - prev.clientX);
                panState.y += Math.round(e.clientY - prev.clientY);
                // 位置を更新してから transform を適用
                touchPointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
                applyCanvasTransform();
            }
            else if (touchPointers.size === 2) {
                const ids = Array.from(touchPointers.keys());
                const otherId = ids.find(id => id !== e.pointerId);
                // prev: 動いた指の前フレーム位置, other: もう一方の指の現在位置
                const prev = touchPointers.get(e.pointerId);
                const other = touchPointers.get(otherId);
                const prevDist = Math.hypot(prev.clientX - other.clientX, prev.clientY - other.clientY);
                const newDist = Math.hypot(e.clientX - other.clientX, e.clientY - other.clientY);
                // 位置を先に更新（ズーム計算後に古い値が残らないようにする）
                touchPointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
                if (prevDist > 1) { // 極端に近い場合はスキップして誤動作防止
                    const factor = newDist / prevDist;
                    const prevScale = zoomState.scale;
                    const nextScale = clamp(prevScale * factor, zoomState.minScale, zoomState.maxScale);
                    // ピンチ中心を canvas_space 座標系で取得（2本指の中点）
                    // other はすでに最新位置（pointerdown/前フレームのmove で更新済み）
                    const centerClientX = (e.clientX + other.clientX) / 2;
                    const centerClientY = (e.clientY + other.clientY) / 2;
                    const sp = getZoomPivot(centerClientX, centerClientY);
                    adjustPanForZoomAtSpacePoint(sp.x, sp.y, prevScale, nextScale);
                    zoomState.scale = nextScale;
                    applyCanvasTransform();
                }
            }
            else {
                // 3本指以上: 追跡位置だけ更新してズームはスキップ
                touchPointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
            }
            return;
        }
        if (!panState.dragging)
            return;
        e.preventDefault();
        const dx = e.clientX - panState.startClientX;
        const dy = e.clientY - panState.startClientY;
        panState.x = panState.startX + dx;
        panState.y = panState.startY + dy;
        applyCanvasTransform();
    };
    const endPanDrag = (e) => {
        // タッチポインターの追跡を終了
        if (e && e.pointerType === 'touch') {
            touchPointers.delete(e.pointerId);
            // pointercancelの場合(ブラウザにジェスチャーを奪われた等)は全ポインターをクリア
            if (e.type === 'pointercancel') {
                touchPointers.clear();
            }
            return;
        }
        if (!panState.dragging)
            return;
        panState.dragging = false;
        if (panState.pointerId != null && canvas.releasePointerCapture) {
            try {
                canvas.releasePointerCapture(panState.pointerId);
            }
            catch (err) {
                // ignore
            }
            panState.pointerId = null;
        }
        canvas.style.cursor = '';
        if (e)
            e.preventDefault();
    };
    // zoom/pan 用の初期スタイル
    canvas.style.transformOrigin = '0 0';
    canvas.style.transform = 'translate(0px, 0px) scale(1)';
    // ドラッグ中の右クリックメニュー抑止(環境によっては発生するため)
    canvas.addEventListener('contextmenu', (e) => {
        if (panState.dragging)
            e.preventDefault();
    });
    window.addEventListener('pointerdown', onCanvasPointerDown, { passive: false });
    window.addEventListener('pointermove', onCanvasPointerMove, { passive: false });
    window.addEventListener('pointerup', endPanDrag, { passive: false });
    window.addEventListener('pointercancel', endPanDrag, { passive: false });
    window.addEventListener('wheel', onCanvasWheel, { passive: false });
    // Android Chrome はtouchstartをpassive:trueで先取りしてピンチを横取りすることがある。
    // canvas_space に passive:false で登録してpreventDefaultを呼べるようにしておく。
    canvas_space.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });
    canvas_space.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });
    // ビューポートリサイズ時に中央寄せ/クランプを再計算する
    new ResizeObserver(() => applyCanvasTransform()).observe(canvas_space);
    // 設定を読み込む
    const loadSettings = () => {
        let PenCalc_textA = localStorage.getItem('PenCalc_textA');
        if (PenCalc_textA)
            text_a.value = PenCalc_textA;
        let PenCalc_textB = localStorage.getItem('PenCalc_textB');
        if (PenCalc_textB)
            text_b.value = PenCalc_textB;
        let PenCalc_textC = localStorage.getItem('PenCalc_textC');
        if (PenCalc_textC)
            text_c.value = PenCalc_textC;
        let PenCalc_select = localStorage.getItem('PenCalc_select');
        if (PenCalc_select)
            select.value = PenCalc_select;
        let PenCalc_speedRange = localStorage.getItem('PenCalc_speedRange');
        if (PenCalc_speedRange)
            speedRange.value = PenCalc_speedRange;
    };
    loadSettings();
    // 全ての画像を読み込む
    Promise.all(Object.keys(digitInfo).map(key => loadImage(key)))
        .then(() => {
        console.log('全ての画像の読み込みが完了しました');
    })
        .catch(error => {
        console.error('画像の読み込みに失敗しました:', error);
    });
    if (DEBUGGING) {
        (new AlgoBase(canvas, textarea)).unitTest();
        (new AlgoAdd(canvas, textarea)).unitTest();
        (new AlgoSub(canvas, textarea)).unitTest();
        (new AlgoMul(canvas, textarea)).unitTest();
        (new AlgoDiv(canvas, textarea)).unitTest();
        (new AlgoTest(canvas, textarea)).unitTest();
        textarea.innerText = '';
    }
    // スピード変更時の処理
    const speedChanged = () => {
        let val = speedRange.value;
        let info = speedInfo[parseInt(val)];
        speedLabel.innerText = info.text;
        if (algorithm) {
            algorithm.setDelay(speedInfo[parseInt(speedRange.value)].delay);
        }
        localStorage.setItem('PenCalc_speedRange', val.toString());
    };
    speedChanged();
    // スライダー変更時のイベント
    speedRange.addEventListener('input', (e) => {
        speedChanged();
    });
    // 入力内容を検証する
    const validateInput = () => {
        let message = "";
        const a = text_a.value, b = text_b.value, c = text_c.value;
        let isAValid = true, isBValid = true, isCValid = true;
        // 数Aのチェック (getNumberInfoを使用)
        if (a !== "" && !getNumberInfo(a)) {
            message = "正しく数を入力してください";
            isAValid = false;
        }
        // 数Bのチェック
        if (b !== "" && !getNumberInfo(b)) {
            message = "正しく数を入力してください";
            isBValid = false;
        }
        // 数Cのチェック
        if (c !== "" && !getNumberInfo(c)) {
            message = "正しく数を入力してください";
            isCValid = false;
        }
        else {
            if (parseInt(text_c.value) > 9) {
                text_c.value = '9';
            }
        }
        if (isAValid && isBValid) {
            // 引き算の制約チェック
            if (select.value === 'sub' && a !== "" && b !== "") {
                if (comparePositiveNumbers(a, b) < 0) {
                    message = "引き算では、引かれる数を引く数より大きくしてください。";
                    isAValid = isBValid = false;
                }
            }
            // 割り算の制約チェック
            if (select.value === 'div' && a !== "" && b !== "") {
                if (comparePositiveNumbers(b, '0') == 0) {
                    message = "ゼロで割ることはできません。";
                    isBValid = false;
                }
            }
        }
        // UIへの反映
        text_a.classList.toggle('input-error', !isAValid);
        text_b.classList.toggle('input-error', !isBValid);
        text_c.classList.toggle('input-error', !isCValid);
        errorDisplay.innerText = message;
        // エラーがある場合は開始ボタンなどを無効化
        let isValid = (message === "" && isAValid && isBValid && isCValid);
        start_button.disabled = !isValid;
        next_step_button.disabled = !isValid;
        return isValid;
    };
    // 再生ボタン
    start_button.addEventListener('click', (e) => {
        resetZoomAndPan();
        let a = text_a.value;
        let b = text_b.value;
        let c = text_c.value;
        console.log(a, b, c);
        if (!validateInput())
            return;
        if (algorithm) {
            algorithm.stop();
            algorithm = null;
        }
        switch (select.value) {
            case 'add':
                algorithm = new AlgoAdd(canvas, textarea, () => {
                    next_step_button.disabled = true;
                    stop_button.click();
                });
                break;
            case 'sub':
                algorithm = new AlgoSub(canvas, textarea, () => {
                    next_step_button.disabled = true;
                    stop_button.click();
                });
                break;
            case 'mul':
                algorithm = new AlgoMul(canvas, textarea, () => {
                    next_step_button.disabled = true;
                    stop_button.click();
                });
                break;
            case 'div':
                algorithm = new AlgoDiv(canvas, textarea, () => {
                    next_step_button.disabled = true;
                    stop_button.click();
                });
                break;
            case 'test':
                algorithm = new AlgoTest(canvas, textarea, () => {
                    next_step_button.disabled = true;
                    stop_button.click();
                });
                break;
            default:
                alert(select.value);
                return;
        }
        start_button.disabled = true;
        stop_button.disabled = false;
        text_a.disabled = true;
        text_b.disabled = true;
        text_c.disabled = true;
        next_step_button.disabled = true;
        reset_button.disabled = false;
        select.disabled = true;
        op = select.value;
        algorithm.autoPlay = true;
        textarea.innerText = '';
        algorithm.set(a, b, c);
        algorithm.setDelay(speedInfo[parseInt(speedRange.value)].delay);
        algorithm.start();
    });
    // 停止ボタン
    stop_button.addEventListener('click', (e) => {
        if (algorithm) {
            algorithm.stop();
        }
        start_button.disabled = false;
        stop_button.disabled = true;
        reset_button.disabled = false;
        select.disabled = false;
        text_a.disabled = false;
        text_b.disabled = false;
        text_c.disabled = false;
    });
    // 「1歩進む」ボタン
    next_step_button.addEventListener('click', (e) => {
        resetZoomAndPan();
        // アルゴリズムがまだ作成されていない、または停止している場合は初期化
        if (!algorithm || !algorithm.running) {
            let a = text_a.value;
            let b = text_b.value;
            let c = text_c.value;
            if (!validateInput())
                return;
            // 既存のインスタンスがあれば停止
            if (algorithm)
                algorithm.stop();
            // 選択された演算に応じてインスタンス化
            switch (select.value) {
                case 'add':
                    algorithm = new AlgoAdd(canvas, textarea);
                    break;
                case 'sub':
                    algorithm = new AlgoSub(canvas, textarea);
                    break;
                case 'mul':
                    algorithm = new AlgoMul(canvas, textarea);
                    break;
                case 'div':
                    algorithm = new AlgoDiv(canvas, textarea);
                    break;
                case 'test':
                    algorithm = new AlgoTest(canvas, textarea);
                    break;
                default: return;
            }
            // 終了時のコールバック設定
            algorithm.end_fn = () => {
                next_step_button.disabled = true;
                stop_button.click();
            };
            algorithm.set(a, b, c);
            algorithm.autoPlay = false; // 自動再生はOFF
            algorithm.start(); // 描画ループを開始
        }
        // UI状態の更新
        start_button.disabled = true;
        stop_button.disabled = true;
        text_a.disabled = true;
        text_b.disabled = true;
        text_c.disabled = true;
        select.disabled = true;
        reset_button.disabled = false;
        // 次の 'step' まで実行
        algorithm.nextStep();
    });
    // リセットボタン
    reset_button.addEventListener('click', (e) => {
        if (algorithm) {
            algorithm.stop();
            algorithm.clearPaper();
        }
        start_button.disabled = false;
        stop_button.disabled = true;
        next_step_button.disabled = false;
        text_a.disabled = false;
        text_b.disabled = false;
        text_c.disabled = false;
        reset_button.disabled = false;
        select.disabled = false;
        textarea.innerHTML = '';
        zoomState.scale = 1.0;
        panState.x = 0;
        panState.y = 0;
        applyCanvasTransform();
    });
    text_a.addEventListener('input', () => {
        if (!validateInput())
            return;
        localStorage.setItem('PenCalc_textA', text_a.value);
    });
    text_b.addEventListener('input', () => {
        if (!validateInput())
            return;
        localStorage.setItem('PenCalc_textB', text_b.value);
    });
    text_c.addEventListener('input', () => {
        if (!validateInput())
            return;
        localStorage.setItem('PenCalc_textC', text_c.value);
    });
    const updateLabels = () => {
        switch (select.value) {
            case 'add':
                label_a.innerText = "たされる数"; // 被加数
                label_b.innerText = "たす数"; // 加数
                accuracy.classList.add('hidden');
                text_c.value = '0';
                break;
            case 'sub':
                label_a.innerText = "ひかれる数"; // 被減数
                label_b.innerText = "ひく数"; // 減数
                accuracy.classList.add('hidden');
                text_c.value = '0';
                break;
            case 'mul':
                label_a.innerText = "かけられる数"; // 被乗数
                label_b.innerText = "かける数"; // 乗数
                accuracy.classList.add('hidden');
                text_c.value = '0';
                break;
            case 'div':
                label_a.innerText = "わられる数"; // 被除数
                label_b.innerText = "わる数"; // 除数
                accuracy.classList.remove('hidden');
                break;
            case 'test':
                label_a.innerText = "数A";
                label_b.innerText = "数B";
                accuracy.classList.remove('hidden');
                break;
            default:
                return false;
        }
        return true;
    };
    select.addEventListener('change', () => {
        if (!updateLabels())
            return;
        localStorage.setItem('PenCalc_select', select.value);
        validateInput();
    });
    const ready = () => {
        select.disabled = false;
        speedRange.disabled = false;
        text_a.disabled = false;
        text_b.disabled = false;
        text_c.disabled = false;
        start_button.disabled = false;
        stop_button.disabled = true;
        next_step_button.disabled = false;
        reset_button.disabled = false;
    };
    updateLabels();
    ready();
});
