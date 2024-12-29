"use strict";

const VERSION = '1.1.1'; // バージョン

// 絵文字やサロゲートペアなどを考慮して、文字列を１つずつ文字に分割する
// https://qiita.com/yoya/items/636e3992ec45c1c40c14
function textCharaSplit(text) {
	const charArr = []
	let chara = []
	let needCode = 0;
	for (const c of text) {
		const cp = c.codePointAt(0);
		if (cp === 0x200d) { // ZWJ (Zero Width Joiner)
			needCode += 1;
		} else if (((0xfe00 <= cp) && (cp <= 0xfe0f)) ||
				   ((0xe0100 <= cp) && (cp <= 0xe01fe))) {
				; // Variation Selector
		} else if ((0x1f3fb <= cp) && (cp <= 0x1f3ff)) {
				; // Emoji Modifier
		} else if (needCode > 0) {
			needCode -= 1;
		} else if (chara.length > 0) {
			charArr.push(chara.join(''));
			chara = [];
		}
		chara.push(c);
	}
	if (chara.length > 0) {
		charArr.push(chara.join(''));
		chara = [];
	}
	return charArr;
}

// Google フォントを取得する
async function fetchGoogleFont(fontName, text = null) {
	// URLでは空白を+に置き換える
	const urlFamilyName = fontName.replace(/ /g, "+");
	// Google Fonts APIのURL
	let googleApiUrl;
	if (text != null) {
		let uri_comp = encodeURIComponent(text);
		googleApiUrl = `https://fonts.googleapis.com/css?family=${urlFamilyName}&text=${uri_comp}`;
	} else {
		googleApiUrl = `https://fonts.googleapis.com/css?family=${urlFamilyName}`;
	}

	const response = await fetch(googleApiUrl);
	if (!response.ok) {
		console.log(response);
		return false;
	}

	// url()の中身のURLだけ抽出
	const cssFontFace = await response.text();
	const matchUrls = cssFontFace.match(/url\(.+?\)/g);
	if (!matchUrls)
		return false;

	for (const url of matchUrls) {
		// 後は普通にFontFaceを追加
		const font = new FontFace(fontName, url);
		await font.load();
		document.fonts.add(font);
	}
	return true;
}

function window_mm_to_px(mm) {
	const dpi = window.devicePixelRatio * 96; // 96はCSSピクセルの標準DPI
	return mm * dpi / 25.4;
}

class PlacardGenerator {
	pla_select_page_size = null; // 用紙サイズ選択コンボボックス
	pla_canvas_for_display = null; // 画面表示用キャンバス
	pla_canvas_for_print = null; // 印刷用キャンバス
	pla_textbox = null; // テキストボックス
	pla_button_print = null; // 「印刷」ボタン
	pla_button_text_clear = null; // 「テキストのクリア」ボタン
	pla_checkbox_line_break = null; // 「自動改行」ボタン
	pla_select_font = null; // 「フォント」コンボボックス
	pla_number_margin = null; // 「余白の幅(mm)」テキストボックス
	pla_number_adjust_y = null; // 「垂直位置の調整(mm)」テキストボックス
	pla_button_reset = null; // 「リセット」ボタン
	pla_text_color = null; // テキストの色
	pla_back_color = null; // 背景の色
	pla_radio_orientation_landscape = null; // 用紙横向き
	pla_radio_orientation_portrait = null; // 用紙縦向き
	pla_checkbox_bold = null; // 「太字」チェックボックス
	pla_button_back_image = null; // 背景画像ボタン
	pla_button_back_image_close = null; // 背景画像を閉じるボタン
	page_info = null; // 印刷情報
	orientation = 'landscape'; // 用紙の向き('portrait' or 'landscape')
	width_mm = 0; // 用紙の幅(mm)
	height_mm = 0; // 用紙の高さ(mm)
	back_image = null; // 背景イメージ
	pla_display_div = null; // 画面表示用の<DIV>
	DEF_MONOSPACE_FONT = '(標準の等幅フォント)';
	DEF_PROPORTIONAL_FONT = '(標準のプロポーショナルフォント)';
	DEF_TEXT = 'テキストを入力してください';

	// コンストラクタ
	constructor() {
		// コントロール群を初期化
		try {
			this.init_controls();
		} catch (error) {
			alert('constructor #1: ' + error);
		}
	}

	// コントロールを初期化
	init_controls() {
		// とりあえず要素をIDで取得
		try {
			this.pla_select_page_size = document.getElementById('pla_select_page_size');
			this.pla_canvas_for_display = document.getElementById('pla_canvas_for_display');
			this.pla_canvas_for_print = document.getElementById('pla_canvas_for_print');
			this.pla_textbox = document.getElementById('pla_textbox');
			this.pla_button_print = document.getElementById('pla_button_print');
			this.pla_button_text_clear = document.getElementById('pla_button_text_clear');
			this.pla_checkbox_line_break = document.getElementById('pla_checkbox_line_break');
			this.pla_select_font = document.getElementById('pla_select_font');
			this.pla_number_margin = document.getElementById('pla_number_margin');
			this.pla_number_adjust_y = document.getElementById('pla_number_adjust_y');
			this.pla_button_reset = document.getElementById('pla_button_reset');
			this.pla_text_color = document.getElementById('pla_text_color');
			this.pla_back_color = document.getElementById('pla_back_color');
			this.pla_radio_orientation_landscape = document.getElementById('pla_radio_orientation_landscape');
			this.pla_radio_orientation_portrait = document.getElementById('pla_radio_orientation_portrait');
			this.pla_checkbox_bold = document.getElementById('pla_checkbox_bold');
			this.pla_button_back_image = document.getElementById('pla_button_back_image');
			this.pla_button_back_image_close = document.getElementById('pla_button_back_image_close');
			this.pla_display_div = document.getElementById('pla_display_div');
		} catch (error) {
			alert("init_controls第1段階: " + error);
		}

		// 必要なデータをセットする
		try {
			// バージョン情報を表示
			this.show_version();
			// フォント群を入植
			this.populate_fonts();
			// ページサイズを入植
			this.populate_page_sizes();
		} catch (error) {
			alert("init_controls第2段階: " + error);
		}

		try {
			// 設定を読み込む
			this.load_settings();
			// イベントリスナーを登録
			this.add_event_listers();
		} catch (error) {
			alert("init_controls第3段階: " + error);
		}

		// ページサイズを更新
		this.update_page_size();
	}

	// バージョン情報を表示
	show_version() {
		document.getElementById('pla_version').textContent = "Ver." + VERSION;
	}

	// スマホかタブレットか？
	is_mobile() {
		return /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
	}
	// Androidか？
	is_android() {
		return /Android/i.test(navigator.userAgent);
	}

	// イベントリスナーを追加
	add_event_listers() {
		let self = this; // 関数内からthisを参照するためにselfとして覚えておく

		// ページサイズの選択か？
		this.pla_select_page_size.addEventListener('change', (event) => {
			self.select_page_size(self.pla_select_page_size.selectedIndex);
		});
		// テキストボックスの入力があった？
		this.pla_textbox.addEventListener('input', (event) => {
			self.redraw();
		});
		// 印刷ボタンが押された？
		this.pla_button_print.addEventListener('click', async (event) => {
			await self.update_page_size();
			window.print();
		});
		// テキストのクリアボタンが押された？
		this.pla_button_text_clear.addEventListener('click', (event) => {
			self.pla_textbox.value = "";
			self.redraw();
		});
		// 自動改行チェックボックスがクリックされた？
		this.pla_checkbox_line_break.addEventListener('change', (event) => {
			self.redraw();
		});
		// フォント選択が変更された？
		this.pla_select_font.addEventListener('change', (event) => {
			self.redraw();
		});
		// 余白テキストボックスが変更された？
		this.pla_number_margin.addEventListener('change', (event) => {
			self.redraw();
		});
		this.pla_number_margin.addEventListener('input', (event) => {
			self.redraw();
		});
		// 垂直位置調整テキストボックスが変更された？
		this.pla_number_adjust_y.addEventListener('change', (event) => {
			self.redraw();
		});
		this.pla_number_adjust_y.addEventListener('input', (event) => {
			self.redraw();
		});
		// テキストの色が変更された？
		this.pla_text_color.addEventListener('change', (event) => {
			self.redraw();
		});
		this.pla_text_color.addEventListener('input', (event) => {
			self.redraw();
		});
		// 背景色が変更された？
		this.pla_back_color.addEventListener('change', (event) => {
			self.redraw();
		});
		this.pla_back_color.addEventListener('input', (event) => {
			self.redraw();
		});
		// 用紙の向きが変更された？
		this.pla_radio_orientation_landscape.addEventListener('click', (event) => {
			self.update_page_size();
		});
		this.pla_radio_orientation_portrait.addEventListener('click', (event) => {
			self.update_page_size();
		});
		// 太字かどうかが変更された？
		this.pla_checkbox_bold.addEventListener('click', (event) => {
			self.redraw();
		});
		// 背景画像ファイルが変更された？
		this.pla_button_back_image.addEventListener('change', (event) => {
			let file = event.target.files[0];
			self.do_image_file(file);
			// 続けて同じファイルを選んでも change を発火する
			self.pla_button_back_image.value = '';
		});
		// 設定のリセットボタンが押された？
		this.pla_button_reset.addEventListener('click', (event) => {
			self.reset();
		});

		//////////////////////////////////////////////////////////////////
		// ドラッグ＆ドロップ

		let dragenter_lock_count = 0; // dragenter と dragleave を管理するロックカウント変数

		// ドラッグが開始された？
		this.pla_display_div.addEventListener('dragenter', (event) => {
			console.log('dragenter');
			event.preventDefault(); // デフォルトの処理を防ぐ
			if (dragenter_lock_count == 0) {
				self.pla_display_div.classList.add("dragover"); // dragoverクラスを追加
			}
			++dragenter_lock_count; // 覚えておく
		});
		// ドラッグ中か？
		this.pla_display_div.addEventListener('dragover', (event) => {
			console.log('dragover');
			event.preventDefault(); // デフォルトの処理を防ぐ
		});
		// ドラッグがキャンセルされた？
		this.pla_display_div.addEventListener('dragleave', (event) => {
			console.log('dragleave');
			event.preventDefault(); // デフォルトの処理を防ぐ
			--dragenter_lock_count;
			if (dragenter_lock_count == 0) { // ロックが解除された？
				self.pla_display_div.classList.remove("dragover"); // dragoverクラスを削除
			}
		});
		// ドラッグ＆ドロップでファイルがドロップされた？
		this.pla_display_div.ondrop = (event) => {
			console.log('ondrop');
			event.preventDefault(); // デフォルトの処理を防ぐ
			self.pla_display_div.classList.remove("dragover"); // dragoverクラスを削除
			// event.dataTransferに応じてドロップされたファイルを処理する
			const items = event.dataTransfer.items;
			if (items) {
				for (const item of items) {
					const file = item.getAsFile();
					if (!file)
						continue;
					self.do_image_file(file);
					break;
				}
			} else if (event.dataTransfer.files) {
				const files = event.dataTransfer.files;
				for (const file of files) {
					self.do_image_file(file);
					break;
				}
			}
		};

		// 画像を閉じるボタンが押された？
		this.pla_button_back_image_close.addEventListener('click', (event) => {
			self.pla_button_back_image_close.classList.add('hidden');
			self.back_image = null;
			self.redraw();
		});
	}

	// 画像ファイルを処理する
	do_image_file(file) {
		if (!file.type.match('image/.*')) { // 画像でなければ失敗
			alert("画像ファイルではありません。");
			return;
		}

		let self = this; // 関数内からthisを参照するためにselfとして覚えておく
		try {
			// FileReaderを使ってファイルを読み込む
			let reader = new FileReader();
			reader.onload = () => { // ファイル読み込みが完了したか？
				self.back_image = new Image();
				self.back_image.onload = () => { // 画像読み込みが完了したか？
					self.redraw(); // よし、再描画
				};
				self.back_image.src = reader.result;
			};
			// データURLとして読み込む
			reader.readAsDataURL(file);
			// 「画像を閉じる」ボタンを表示
			self.pla_button_back_image_close.classList.remove('hidden');
		} catch (error) {
			alert('画像を読み込めませんでした: ' + error);
		}
	}

	// 設定のリセット
	reset() {
		// localStorageを使用した設定を消す
		try {
			localStorage.removeItem('pla_select_page_size');
			localStorage.removeItem('pla_textbox');
			localStorage.removeItem('pla_checkbox_line_break');
			localStorage.removeItem('pla_number_margin');
			localStorage.removeItem('pla_number_adjust_y');
			localStorage.removeItem('pla_select_font');
			localStorage.removeItem('pla_text_color');
			localStorage.removeItem('pla_back_color');
			localStorage.removeItem('pla_radio_orientation');
			localStorage.removeItem('pla_checkbox_bold');
		} catch (error) {
			console.log(error);
		}
		location.reload();
	}

	// 設定を読み込む
	load_settings() {
		// localStorageを使用した設定を読み込む
		try {
			if (localStorage.getItem('pla_select_page_size') != null)
				this.pla_select_page_size.selectedIndex = parseInt(localStorage.getItem('pla_select_page_size'));
			if (localStorage.getItem('pla_textbox') != null)
				this.pla_textbox.value = localStorage.getItem('pla_textbox');
			if (localStorage.getItem('pla_checkbox_line_break') != null)
				this.pla_checkbox_line_break.checked = localStorage.getItem('pla_checkbox_line_break') == "yes";
			if (localStorage.getItem('pla_number_margin') != null)
				this.pla_number_margin.value = parseFloat(localStorage.getItem('pla_number_margin'));
			if (localStorage.getItem('pla_number_adjust_y') != null)
				this.pla_number_adjust_y.value = parseFloat(localStorage.getItem('pla_number_adjust_y'));
			if (localStorage.getItem('pla_select_font') != null)
				this.combobox_select_by_text(this.pla_select_font, localStorage.getItem('pla_select_font'));
			if (localStorage.getItem('pla_text_color') != null)
				this.pla_text_color.value = localStorage.getItem('pla_text_color');
			if (localStorage.getItem('pla_back_color') != null)
				this.pla_back_color.value = localStorage.getItem('pla_back_color');
			if (localStorage.getItem('pla_radio_orientation') != null) {
				let orientation = localStorage.getItem('pla_radio_orientation');
				if (orientation == 'portrait') {
					this.pla_radio_orientation_portrait.checked = true;
					this.pla_radio_orientation_landscape.checked = false;
				} else {
					this.pla_radio_orientation_portrait.checked = false;
					this.pla_radio_orientation_landscape.checked = true;
				}
			}
			if (localStorage.getItem('pla_checkbox_bold') != null)
				this.pla_checkbox_bold.checked = localStorage.getItem('pla_checkbox_bold') == "yes";
		} catch (error) {
			console.log(error);
		}
	}
	// 設定を保存
	save_settings() {
		// localStorageを使用して設定を保存する
		try {
			localStorage.setItem('pla_select_page_size', this.pla_select_page_size.selectedIndex.toString());
			localStorage.setItem('pla_textbox', this.pla_textbox.value);
			localStorage.setItem('pla_checkbox_line_break', this.pla_checkbox_line_break.checked ? "yes" : "no");
			localStorage.setItem('pla_number_margin', this.pla_number_margin.value.toString());
			localStorage.setItem('pla_number_adjust_y', this.pla_number_adjust_y.value.toString());
			localStorage.setItem('pla_select_font', this.pla_select_font.options[this.pla_select_font.selectedIndex].text);
			localStorage.setItem('pla_text_color', this.pla_text_color.value);
			localStorage.setItem('pla_back_color', this.pla_back_color.value);
			localStorage.setItem('pla_radio_orientation', this.orientation);
			localStorage.setItem('pla_checkbox_bold', this.pla_checkbox_bold.checked ? "yes" : "no");
		} catch (error) {
			console.log(error);
		}
	}

	// テキストでコンボボックス項目を選択
	combobox_select_by_text(select, text) {
		for (let option of select.options) {
			if (option.text == text) {
				select.selectedIndex = option.index;
				break;
			}
		}
	}

	// mmからピクセルへ変換
	mm_to_px(mm) {
		const dpi = 96; // デフォルトのDPI
		return mm * dpi / 25.4; // mm -> px
	}

	// 印刷設定をセットする
	async set_print_settings(page_info, orientation) {
		try {
			// ページ情報からサイズをmmで取得
			let width_mm, height_mm;
			if (orientation == 'landscape') {
				width_mm = page_info.long_mm;
				height_mm = page_info.short_mm;
			} else {
				width_mm = page_info.short_mm;
				height_mm = page_info.long_mm;
			}

			// 印刷サイズのスタイルを設定
			const style = document.getElementById('pla_choose_page_style');
			style.type = 'text/css';
			style.media = 'print';
			style.innerHTML = `
				@page {
					size: ${orientation};
					margin: 0;
				}
			`;

			// mmをピクセル単位に変換
			let short = this.mm_to_px(page_info.short_mm);
			let long = this.mm_to_px(page_info.long_mm);

			// 用紙の向きに応じてキャンバスのサイズをセット
			if (orientation == 'landscape') { // 横向きか？
				this.pla_canvas_for_print.width = long;
				this.pla_canvas_for_print.height = short;
				this.width_mm = page_info.long_mm;
				this.height_mm = page_info.short_mm;
			} else { // 縦向きか？
				this.pla_canvas_for_print.width = short;
				this.pla_canvas_for_print.height = long;
				this.width_mm = page_info.short_mm;
				this.height_mm = page_info.long_mm;
			}
		} catch (error) {
			alert('set_print_settings: ' + error);
		}

		await this.redraw(); // 再描画
	}

	// ページサイズを更新する
	async update_page_size() {
		let page_info, orientation;
		try {
			// ページ情報を取得
			page_info = pla_page_size_info[this.pla_select_page_size.selectedIndex];
			this.page_info = page_info;

			// 縦向きか横向きか、用紙の向きをセット
			if (this.pla_radio_orientation_portrait.checked)
				orientation = "portrait"; // 縦向き
			else
				orientation = "landscape"; // 横向き

			this.orientation = orientation;

			// 短辺と長辺をmmで取得
			let short_mm = page_info.short_mm, long_mm = page_info.long_mm;
			if (short_mm > long_mm) {
				[short_mm, long_mm] = [long_mm, short_mm]; // 短辺と長辺を入れ替え
			}
			console.assert(short_mm <= long_mm);

			// 表示用のサイズをセット
			let average = (short_mm + long_mm) / 2;
			let short_for_display_px = short_mm * 150 / average;
			let long_for_display_px = long_mm * 150 / average;
			let width_px, height_px;
			switch (orientation) {
			case 'landscape':
				width_px = long_for_display_px;
				height_px = short_for_display_px;
				break;
			case 'portrait':
				width_px = short_for_display_px;
				height_px = long_for_display_px;
				break;
			}
			this.pla_canvas_for_display.width = width_px;
			this.pla_canvas_for_display.height = height_px;
		} catch (error) {
			alert('update_page_size: ' + error);
		}

		await this.set_print_settings(page_info, orientation);
	}

	// 用紙の向きを選択する
	select_orientation(orientation) {
		console.assert(orientation == 'landscape' || orientation == 'portrait');
		this.orientation = orientation;
		this.update_page_size(); // ページサイズを更新
	}

	// ページサイズを選択
	select_page_size(index) {
		console.assert(0 <= index && index < this.pla_select_page_size.options.length);
		this.pla_select_page_size.selectedIndex = index;
		this.update_page_size(); // ページサイズを更新
	}

	// フォントが利用可能か？
	is_font_available(fontName) {
		// テスト用のテキスト
		const testString = 'mmmmmmmmmmlli';

		// 参照用のフォント（システムに必ず存在するもの）
		const baseFont = 'monospace';

		// テスト用のCanvas要素を作成
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		const size = '32px';

		// ベースとなる幅を計測
		context.font = `${size} ${baseFont}`;
		const baseFontWidth = context.measureText(testString).width;

		// 確認したいフォントの幅を計測
		context.font = `${size} ${fontName}, ${baseFont}`;
		const testFontWidth = context.measureText(testString).width;

		// 幅が異なれば、指定したフォントが利用可能
		return baseFontWidth !== testFontWidth;
	}

	// 現在のフォント名を取得
	get_font_names() {
		// カラー絵文字を優先
		if (this.pla_select_font.value == this.DEF_MONOSPACE_FONT) {
			return `"Noto Color Emoji", "ＭＳ ゴシック", "ヒラギノ角ゴシック", "Osaka-Mono", "MS Gothic", "Hiragino Sans", "Noto Sans Mono CJK JP", "MS Mincho", monospace, san-serif`;
		}
		if (this.pla_select_font.value == this.DEF_PROPORTIONAL_FONT) {
			return `"Noto Color Emoji", "ＭＳ Ｐゴシック", "Yu Gothic", "Meiryo", "Hiragino Sans", "Noto Sans JP", "Roboto", san-serif`;
		}
		return `"Noto Color Emoji", "${this.pla_select_font.value}`;
	}

	// フォント項目を入植
	populate_fonts() {
		try {
			// コンボボックスにフォント項目を追加していく
			for (let entry of fonts) {
				if (!this.is_font_available(entry))
					continue;
				let option = document.createElement('option');
				option.text = entry;
				this.pla_select_font.add(option);
			}
			for (let entry of google_fonts) {
				let option = document.createElement('option');
				option.text = entry;
				this.pla_select_font.add(option);
			}
		} catch (error) {
			alert('populate_fonts: ' + error);
		}
	}

	// ページサイズを入植
	populate_page_sizes() {
		try {
			// コンボボックスにページサイズを追加していく
			for (let item of pla_page_size_info) {
				let option = document.createElement('option');
				option.text = item.text;
				if (item.text == "A4") {
					option.selected = true;
				}
				this.pla_select_page_size.add(option);
			}
		} catch (error) {
			alert('populate_page_sizes: ' + error);
		}
	}

	// 再描画
	async redraw() {
		// 画面表示用の描画
		try {
			await this.render(this.pla_canvas_for_display, true);
		} catch (error) {
			alert('pla_canvas_for_display: ' + error);
		}
		// 印刷用の描画
		try {
			await this.render(this.pla_canvas_for_print, false);
		} catch (error) {
			alert('pla_canvas_for_print: ' + error);
		}
		// 設定の保存
		this.save_settings();
	}

	// 行を描画
	render_line(ctx, text, x, y, width, height, for_display) {
		// テキストが空なら問題が起こるので何もしない
		if (text.length == 0)
			return;

		// 垂直位置調整
		let adjust_y_mm = this.pla_number_adjust_y.value;
		let scale = 1;
		if (!for_display) {
			scale = this.pla_canvas_for_print.width / this.pla_canvas_for_display.width;
		}
		let adjust_y_px = this.mm_to_px(adjust_y_mm * scale);

		// フォント
		if (this.pla_checkbox_bold.checked) {
			ctx.font = `bold 16px ${this.get_font_names()}`;
		} else {
			ctx.font = `16px ${this.get_font_names()}`;
		}

		// テキストを描画する
		ctx.fillStyle = this.pla_text_color.value; // テキストの色
		ctx.textAlign = "center"; // 水平位置は中央
		ctx.textBaseline = "middle"; // 垂直位置は中央
		const metrics = ctx.measureText(text); // テキストの寸法を取得
		const text_width = metrics.width; // テキストの幅
		const text_height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
		ctx.save(); // 描画コンテキストを保存
		ctx.translate(x + width / 2, y + height / 2 - adjust_y_px); // 座標変換で水平移動
		ctx.scale(width / text_width, height / text_height); // 座標変換で拡大縮小
		ctx.fillText(text, 0, 0); // テキストを描画
		ctx.restore(); // 描画コンテキストを復元
	}

	// 行の折り返し処理
	line_break(text, width, height) {
		// テキストを1文字ずつ分割
		let chars = textCharaSplit(text);

		// 縦横比と分割数を取得
		let char_width = width / chars.length;
		let aspect_ratio = height / char_width;
		let division = 1;
		while (aspect_ratio / division > 6) {
			division += 1;
		}

		// コードからテキストを再構築しつつ、いい感じに改行文字を挿入する
		text = '';
		let length = chars.length;
		let step = length / division;
		let ich = 0;
		for (let ch of chars) {
			if (ich != 0 && Math.floor(ich % step) == 0)
				text += "\n";
			text += ch;
			++ich;
		}
		return text;
	}

	// ページを描画する
	render_page(ctx, text, x, y, width, height, for_display) {
		// 背景を塗りつぶす
		ctx.fillStyle = this.pla_back_color.value;
		ctx.fillRect(x, y, width, height);

		// 背景画像があれば描画
		if (this.back_image) {
			ctx.drawImage(this.back_image, x, y, width, height);
		}

		text = text.replace("\r", "");
		if (text.length == 0)
			return; // テキストが空ならもう何もしない

		// 余白を計算
		let margin_mm = this.pla_number_margin.value; // 余白(mm)
		let dpi;
		if (for_display) {
			let scale = this.pla_canvas_for_print.width / this.pla_canvas_for_display.width;
			dpi = 96 / scale;
		} else {
			dpi = 96;
		}
		const margin_px = margin_mm * dpi / 25.4; // mmをpxに変換

		// 余白を除いた印刷範囲を計算
		const content_x = x + margin_px, content_y = y + margin_px;
		const content_width = width - (margin_px * 2);
		const content_height = height - (margin_px * 2);

		// 改行文字で分割
		let lines = text.split("\n");

		// テキストが１行で自動改行なら複数の行に分割
		if (this.pla_checkbox_line_break.checked && lines.length == 1) {
			text = this.line_break(text, width, height);
			lines = text.split("\n");
		}

		// 一行ずつ描画する
		let irow = 0; // 行番号
		let rows = lines.length; // 行数
		for (let line of lines) {
			// テキストの座標を計算
			let text_x = content_x, text_y = content_y + content_height * irow / rows;
			let text_width = content_width;
			let text_height = content_height / rows;
			// 指定した座標に行を描画
			this.render_line(ctx, line, text_x, text_y, text_width, text_height, for_display);
			++irow; // 行番号を加算
		}
	}

	// 描画する
	async render(canvas, for_display) {
		// テキストを取得
		let text = this.pla_textbox.value;

		// テキストが空なら、デフォルトのテキストにする
		if (text.length == 0) {
			text = this.DEF_TEXT;
		}

		// カラー絵文字を取得
		try {
			await fetchGoogleFont('Noto Color Emoji', text);
		} catch (error) {
			console.log(error);
		}

		// Googleフォントを取得
		let font_name = this.pla_select_font.options[this.pla_select_font.selectedIndex].text
		if (google_fonts.includes(font_name)) {
			try {
				await fetchGoogleFont(font_name, text);
			} catch (error) {
				console.log(error);
			}
		}

		// キャンバスのサイズを取得
		let width = canvas.width, height = canvas.height;
		// 描画コンテキストを取得
		let ctx = canvas.getContext('2d', { alpha: false });
		// ページを描画
		this.render_page(ctx, text, 0, 0, width, height, for_display);
	}
};

// 文書を読み込んだか？
document.addEventListener('DOMContentLoaded', function(){
	try {
		// プラカード ジェネレータを起動
		const placard = new PlacardGenerator();
	} catch (error) {
		// エラー
		alert('DOMContentLoaded: ' + error);
	}
});
