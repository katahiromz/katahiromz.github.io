class PlacardGenerator {
    VERSION = "1.0.8";                      // バージョン
    pla_select_page_size = null;            // 用紙サイズ選択コンボボックス
    pla_canvas_for_display = null;          // 画面表示用キャンバス
    pla_canvas_for_print = null;            // 印刷用キャンバス
    pla_textbox = null;                     // テキストボックス
    pla_button_print = null;                // 「印刷」ボタン
    pla_button_text_clear = null;           // 「テキストのクリア」ボタン
    pla_checkbox_line_break = null;         // 「自動改行」ボタン
    pla_select_font = null;                 // 「フォント」コンボボックス
    pla_number_margin = null;               // 「余白の幅(mm)」テキストボックス
    pla_number_adjust_y = null;             // 「垂直位置の調整(mm)」テキストボックス
    pla_button_reset = null;                // 「リセット」ボタン
    pla_text_color = null;                  // テキストの色
    pla_back_color = null;                  // 背景の色
    pla_radio_orientation_landscape = null; // 用紙横向き
    pla_radio_orientation_portrait = null;  // 用紙縦向き
    pla_checkbox_bold = null;               // 「太字」チェックボックス
    pla_button_back_image = null;           // 背景画像ボタン
    pla_button_back_image_close = null;     // 背景画像を閉じるボタン
    page_info = null;                       // 印刷情報
    orientation = 'landscape';              // 用紙の向き('portrait' or 'landscape')
    width_mm = 0;                           // 用紙の幅(mm)
    height_mm = 0;                          // 用紙の高さ(mm)
    back_image = null;                      // 背景イメージ
    pla_display_div = null;                 // 画面表示用の<DIV>
    DEF_MONOSPACE_FONT = "(標準の等幅フォント)";
    DEF_PROPORTIONAL_FONT = "(標準のプロポーショナルフォント)";

    // コンストラクタ
    constructor() {
        try {
            this.init_controls();
        } catch (error) {
            alert('constructor #1: ' + error);
        }
        try {
            this.redraw();
        } catch (error) {
            alert('constructor #2: ' + error);
        }
    }

    // ファイルを処理する
    do_image_file(file) {
        if (!file.type.match('image/.*')) {
            alert("画像ファイルではありません。");
            return;
        }

        let self = this;
        try {
            let reader = new FileReader();
            reader.onload = () => {
                self.back_image = new Image();
                self.back_image.onload = () => {
                    self.redraw();
                };
                self.back_image.src = reader.result;
            };
            reader.readAsDataURL(file);
            self.pla_button_back_image_close.classList.remove('hidden');
        } catch (error) {
            console.log(error);
        }
    }

    // コントロールを初期化
    init_controls() {
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

        try {
            if (!this.is_android()) {
                document.getElementById('android_notice').classList.add('hidden');
            }
            this.set_version();
            this.populate_fonts();
            this.populate_page_sizes();
        } catch (error) {
            alert("init_controls第2段階: " + error);
        }

        try {
            this.load_settings();
            this.add_event_listers();
        } catch (error) {
            alert("init_controls第3段階: " + error);
        }

        this.update_page_size();
    }

    set_version() {
        document.getElementById('pla_version').textContent = "Ver." + this.VERSION;
    }

    is_mobile() {
        return /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }
    is_android() {
        return /Android/i.test(navigator.userAgent);
    }

    // イベントリスナーを追加
    add_event_listers() {
        let self = this;

        this.pla_select_page_size.addEventListener('change', (event) => {
            let index = self.pla_select_page_size.selectedIndex;
            self.select_page_size(index);
        });

        this.pla_textbox.addEventListener('input', (event) => {
            self.redraw();
        });

        this.pla_button_print.addEventListener('click', (event) => {
            self.update_page_size();
            window.print();
        });

        this.pla_button_text_clear.addEventListener('click', (event) => {
            self.pla_textbox.value = "";
            self.redraw();
        });

        this.pla_checkbox_line_break.addEventListener('change', (event) => {
            self.redraw();
        });

        this.pla_select_font.addEventListener('change', (event) => {
            self.redraw();
        });

        this.pla_number_margin.addEventListener('change', (event) => {
            self.redraw();
        });
        this.pla_number_margin.addEventListener('input', (event) => {
            self.redraw();
        });
        this.pla_number_adjust_y.addEventListener('change', (event) => {
            self.redraw();
        });
        this.pla_number_adjust_y.addEventListener('input', (event) => {
            self.redraw();
        });
        this.pla_text_color.addEventListener('change', (event) => {
            self.redraw();
        });
        this.pla_text_color.addEventListener('input', (event) => {
            self.redraw();
        });
        this.pla_back_color.addEventListener('change', (event) => {
            self.back_image = null;
            self.redraw();
        });
        this.pla_back_color.addEventListener('input', (event) => {
            self.back_image = null;
            self.redraw();
        });

        this.pla_radio_orientation_landscape.addEventListener('click', (event) => {
            self.update_page_size();
        });
        this.pla_radio_orientation_portrait.addEventListener('click', (event) => {
            self.update_page_size();
        });
        this.pla_checkbox_bold.addEventListener('click', (event) => {
            self.redraw();
        });

        this.pla_button_back_image.addEventListener('change', (event) => {
            let file = event.target.files[0];
            self.do_image_file(file);
        });

        this.pla_button_reset.addEventListener('click', (event) => {
            self.reset();
        });

        // ドラッグ＆ドロップ
        let drag_enter_count = 0;
        this.pla_display_div.addEventListener('dragenter', (event) => {
            console.log('dragenter');
            event.preventDefault();
            if (drag_enter_count == 0) {
                self.pla_display_div.classList.add("dragover");
            }
            ++drag_enter_count;
        });
        this.pla_display_div.addEventListener('dragover', (event) => {
            console.log('dragover');
            event.preventDefault();
        });
        this.pla_display_div.addEventListener('dragleave', (event) => {
            console.log('dragleave');
            event.preventDefault();
            --drag_enter_count;
            if (drag_enter_count == 0) {
                self.pla_display_div.classList.remove("dragover");
            }
        });
        this.pla_display_div.ondrop = (event) => {
            console.log('ondrop');
            event.preventDefault();
            self.pla_display_div.classList.remove("dragover");
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

        this.pla_button_back_image_close.addEventListener('click', (event) => {
            self.pla_button_back_image_close.classList.add('hidden');
            self.back_image = null;
            self.redraw();
        });
    }

    // 設定のリセット
    reset() {
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
        try {
            if (localStorage.getItem('pla_select_page_size') != null)
                this.pla_select_page_size.selectedIndex = parseInt(localStorage.getItem('pla_select_page_size'));
            if (localStorage.getItem('pla_textbox') != null)
                this.pla_textbox.value = localStorage.getItem('pla_textbox');
            if (localStorage.getItem('pla_checkbox_line_break') != null)
                this.pla_checkbox_line_break.checked = localStorage.getItem('pla_checkbox_line_break') == "yes";
            if (localStorage.getItem('pla_number_margin') != null)
                this.pla_number_margin.value = parseInt(localStorage.getItem('pla_number_margin'));
            if (localStorage.getItem('pla_number_adjust_y') != null)
                this.pla_number_adjust_y.value = parseInt(localStorage.getItem('pla_number_adjust_y'));
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

    mm_to_px(mm) {
        const dpi = 96; // デフォルトのDPI
        return mm * dpi / 25.4; // mm -> px
    }

    mm_to_inch(mm) {
        return mm / 25.4;
    }

    // 印刷設定をセットする
    set_print_settings(page_info, orientation) {
        try {
            let width_mm, height_mm;
            if (orientation == 'landscape') {
                width_mm = page_info.long_mm;
                height_mm = page_info.short_mm;
            } else {
                width_mm = page_info.short_mm;
                height_mm = page_info.long_mm;
            }

            const style = document.getElementById('pla_choose_page_style');
            style.type = 'text/css';
            style.media = 'print';
            style.innerHTML = `
                @page {
                    size: ${orientation};
                    margin: 0;
                }
            `;

            let short = this.mm_to_px(page_info.short_mm);
            let long = this.mm_to_px(page_info.long_mm);

            if (orientation == 'landscape') {
                this.pla_canvas_for_print.width = long;
                this.pla_canvas_for_print.height = short;
                this.width_mm = page_info.long_mm;
                this.height_mm = page_info.short_mm;
            } else {
                this.pla_canvas_for_print.width = short;
                this.pla_canvas_for_print.height = long;
                this.width_mm = page_info.short_mm;
                this.height_mm = page_info.long_mm;
            }
        } catch (error) {
            alert('set_print_settings: ' + error);
        }

        this.redraw();
    }

    // ページサイズを更新する
    update_page_size() {
        let page_info, orientation;
        try {
            page_info = pla_page_size_info[this.pla_select_page_size.selectedIndex];
            this.page_info = page_info;

            if (this.pla_radio_orientation_portrait.checked)
                orientation = "portrait";
            else
                orientation = "landscape";

            let short_mm = page_info.short_mm, long_mm = page_info.long_mm;
            if (short_mm > long_mm) {
                [short_mm, long_mm] = [long_mm, short_mm]; // 短辺と長辺を入れ替え
            }

            console.assert(short_mm <= long_mm);
            let average = (short_mm + long_mm) / 2;
            let short_for_display_mm = short_mm * 150 / average;
            let long_for_display_mm = long_mm * 150 / average;

            let width_mm, height_mm;
            switch (orientation) {
            case 'landscape':
                width_mm = long_for_display_mm;
                height_mm = short_for_display_mm;
                break;
            case 'portrait':
                width_mm = short_for_display_mm;
                height_mm = long_for_display_mm;
                break;
            }
            this.pla_canvas_for_display.width = width_mm;
            this.pla_canvas_for_display.height = height_mm;
            this.orientation = orientation;
        } catch (error) {
            alert('update_page_size: ' + error);
        }

        this.set_print_settings(page_info, orientation);
    }

    // 用紙の向きを選択する
    select_orientation(orientation) {
        console.assert(orientation == 'landscape' || orientation == 'portrait');
        this.orientation = orientation;
        this.update_page_size();
    }

    // ページサイズを選択
    select_page_size(index) {
        console.assert(0 <= index && index < this.pla_select_page_size.options.length);
        this.pla_select_page_size.selectedIndex = index;
        this.update_page_size();
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
    get_font() {
        if (this.pla_select_font.value == this.DEF_MONOSPACE_FONT) {
            return `"ＭＳ ゴシック", "ヒラギノ角ゴシック", "Osaka-Mono", "MS Gothic", "Hiragino Sans", "Noto Sans Mono CJK JP", "MS Mincho", monospace, san-serif`;
        }
        if (this.pla_select_font.value == this.DEF_PROPORTIONAL_FONT) {
            return `"ＭＳ Ｐゴシック", "Yu Gothic", "Meiryo", "Hiragino Sans", "Noto Sans JP", "Roboto", san-serif`;
        }
        return `"${this.pla_select_font.value}`;
    }

    // フォント項目を入植
    populate_fonts() {
        try {
            for (let entry of fonts) {
                if (!this.is_font_available(entry))
                    continue;
                let option = document.createElement('option');
                option.text = entry;
                this.pla_select_font.add(option);
            }
        } catch (error) {
            console.log(error);
        }
    }

    // ページサイズを入植
    populate_page_sizes() {
        for (let item of pla_page_size_info) {
            let option = document.createElement('option');
            option.text = item.text;
            if (item.text == "A4") {
                option.selected = true;
            }
            this.pla_select_page_size.add(option);
        }
    }

    // 再描画
    redraw() {
        try {
            this.render(this.pla_canvas_for_display, true);
        } catch (error) {
            alert('pla_canvas_for_display: ' + error);
        }
        try {
            this.render(this.pla_canvas_for_print, false);
        } catch (error) {
            alert('pla_canvas_for_print: ' + error);
        }
        this.save_settings();
    }

    // 行を描画
    render_line(ctx, text, x, y, width, height, for_display) {
        if (text.length == 0)
            return;

        let adjust_y_mm = this.pla_number_adjust_y.value;
        let scale = 1;
        if (!for_display) {
            scale = this.pla_canvas_for_print.width / this.pla_canvas_for_display.width;
        }
        let adjust_y_px = this.mm_to_px(adjust_y_mm * scale);

        if (this.pla_checkbox_bold.checked) {
            ctx.font = `bold 16px ${this.get_font()}`;
        } else {
            ctx.font = `16px ${this.get_font()}`;
        }

        ctx.fillStyle = this.pla_text_color.value;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const metrics = ctx.measureText(text);
        const text_width = metrics.width;
        const text_height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2 - adjust_y_px);
        ctx.scale(width / text_width, height / text_height);
        ctx.fillText(text, 0, 0);
        ctx.restore();
    }

    // 行の折り返し処理
    line_break(text, width, height) {
        let codes = [];
        for (let ch of text) {
            codes.push(ch.codePointAt(0));
        }

        let char_width = width / codes.length;
        let aspect_ratio = height / char_width;
        let division = 1;
        while (aspect_ratio / division > 6) {
            division += 1;
        }

        text = '';
        let length = codes.length;
        let step = length / division;
        let icode = 0;
        for (let code of codes) {
            if (icode != 0 && Math.floor(icode % step) == 0)
                text += "\n";
            text += String.fromCharCode(code);
            ++icode;
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

        if (for_display) {
            // ページ境界線を描画する（画面表示用のみ）
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.strokeStyle = "black";
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        let margin_mm = this.pla_number_margin.value; // 余白(mm)
        let dpi;
        if (for_display) {
            let scale = this.pla_canvas_for_print.width / this.pla_canvas_for_display.width;
            dpi = 96 / scale;
        } else {
            dpi = 96;
        }
        const margin_px = margin_mm * dpi / 25.4; // mmをpxに変換

        const content_x = x + margin_px, content_y = y + margin_px;
        const content_width = width - (margin_px * 2);
        const content_height = height - (margin_px * 2);

        text = text.replace("\r", "");
        if (text.length == 0)
            return;

        let lines = text.split("\n");

        if (this.pla_checkbox_line_break.checked && lines.length == 1) {
            text = this.line_break(text, width, height);
            lines = text.split("\n");
        }

        let irow = 0;
        let rows = lines.length;
        for (let line of lines) {
            let text_x = content_x;
            let text_y = content_y + content_height * irow / rows;
            let text_width = content_width;
            let text_height = content_height / rows;
            this.render_line(ctx, line, text_x, text_y, text_width, text_height, for_display);
            ++irow;
        }
    }

    // 描画する
    render(canvas, for_display) {
        let width = canvas.width;
        let height = canvas.height;
        let ctx = canvas.getContext('2d', { alpha: false });
        let text = this.pla_textbox.value;
        this.render_page(ctx, text, 0, 0, width, height, for_display);
    }
};

document.addEventListener('DOMContentLoaded', function(){
    try {
        const placard = new PlacardGenerator();
    } catch (error) {
        alert('onload: ' + error);
    }
});
