// AlgoMul.js --- 掛け算アルゴリズム
// Author: katahiromz
// License: MIT
"use strict";
class AlgoMul extends AlgoBase {
    // コンストラクタ
    constructor(canvas, textarea, end_fn = null) {
        super(canvas, textarea, end_fn);
        this.reset();
    }
    // 計算を行う
    doCalc(a, b, origin_iy = 0) {
        this.clearMapping();
        this.addCommand(['output', `これから ${a} × ${b} を計算します。`]);
        let a_str = a.toString();
        let b_str = b.toString();
        let a_digits = a_str.replaceAll('.', '');
        let b_digits = b_str.replaceAll('.', '');
        // 被乗数(A)をセット (iy = origin_iy)
        this.addCommand(['output', `まず、上の方に ${a} を書きます。`]);
        this.autoPutDigitsEx(a_str, 0, origin_iy);
        this.addCommand(['step']);
        // 乗数(B)をセット (iy = origin_iy + 1)
        this.addCommand(['output', `その下に ${b} を書きますが、右はしの数字をそろえてください。`]);
        this.autoPutDigitsEx(b_str, 0, origin_iy + 1);
        this.addCommand(['step']);
        // '×'を描画
        this.addCommand(['output', `２番目の数の左にバツ印(×)を書きます。`]);
        {
            let ix = -Math.max(a_digits.length, b_digits.length) - 1;
            this.addCommand(['drawDigit', ix, origin_iy + 1, '×']);
        }
        this.addCommand(['step']);
        // 区分線を描画
        this.addCommand(['output', `２番目の数の下に定規で線を引きます。`]);
        {
            let ix0 = Math.min(this.min_x(origin_iy), this.min_x(origin_iy + 1)) - 1;
            this.addCommand(['drawLine', ix0, origin_iy + 2, 0, origin_iy + 2]);
        }
        this.addCommand(['step']);
        let x_digits = this.readRowNumber(origin_iy, true); // 被乗数(上)
        let y_rev = this.readRowNumber(origin_iy + 1, true).split('').reverse().join(''); // 乗数(下)を逆順に
        for (let level = 0; level < y_rev.length; ++level) {
            let digitY = y_rev[level];
            let iy_sub_product = origin_iy + 2 + level;
            // 重要なポイント:
            // 掛け算の各行は、右端（一の位）が左に level 分だけズレる
            // 基本の右端を -1 とすると、level0は -1, level1は -2 ...
            let target_origin_ix = -1 - level;
            this.addCommand(['output', `${digitY} をかけます。`]);
            // 再定義した autoDigitMul を呼び出し
            this.autoDigitMul(x_digits, digitY, target_origin_ix, iy_sub_product);
        }
        let result_iy_start = origin_iy + 2;
        let result_iy_end = origin_iy + 1 + y_rev.length;
        let answer_iy = result_iy_end + 1;
        if (y_rev.length > 1) {
            let min_ix = this.min_x(result_iy_end) - 1;
            this.addCommand(['output', `下に定規で線を引きます。`]);
            this.addCommand(['drawLine', min_ix, answer_iy, 0, answer_iy]);
            this.addCommand(['output', `かけ合わせた結果を合計します。`]);
            // 合計処理: 2番目の線の直上の行までを足す
            this.autoDigitAdd(result_iy_start, result_iy_end);
        }
        else {
            // 1桁の場合は足し算不要。そのまま answer_iy として扱う
            answer_iy = result_iy_start;
        }
        // 小数点の処理
        let a_frac_len = getFracLen(a_str);
        let b_frac_len = getFracLen(b_str);
        let frac_len_sum = a_frac_len + b_frac_len;
        if (frac_len_sum > 0) {
            this.addCommand(['output', `二つの数の小数点以下の桁数(けたすう)を足し合わせた位置に小数点を付けます。`]);
            let ix = -frac_len_sum;
            this.addCommand(['drawDot', ix, answer_iy]);
            this.setMapDot(ix, answer_iy);
            this.addCommand(['step']);
        }
        // 答えを取得
        let answer = this.fixAndReadRowNumber(answer_iy);
        {
            const text = `${a} × ${b} = ${answer}`;
            this.addCommand(['drawCenterText', answer_iy + 2, text]);
        }
        this.answer = answer;
        this.addCommand(['output', `こたえ: ${this.answer}`]);
        return answer;
    }
    // コマンドの構築
    buildCommands() {
        this.doCalc(this.a, this.b);
    }
    testEntry(a, b, answer) {
        this.reset();
        this.set(a, b);
        // 全コマンド消化
        while (this.nextCommand()) {
            ;
        }
        return this.answer === answer;
    }
    testEntryEx(a, b, answer) {
        if (!this.testEntry(a, b, answer)) {
            console.error(`Test Failed: ${a} * ${b} = ${answer}, but got ${this.answer}`);
            return false;
        }
        return true;
    }
    unitTest() {
        console.log("AlgoMul unit testing...");
        console.assert(this.testEntryEx('304', '2', '608'));
        console.assert(this.testEntryEx('0', '0', '0'));
        console.assert(this.testEntryEx('2', '3', '6'));
        console.assert(this.testEntryEx('111', '111', '12321'));
        console.assert(this.testEntryEx('11.1', '1.11', '12.321'));
        console.assert(this.testEntryEx('0.2', '0.2', '0.04'));
        console.assert(this.testEntryEx('80.7', '100', '8070'));
        // 【ちびむすより引用】ここから
        console.assert(this.testEntryEx('35', '4', '140'));
        console.assert(this.testEntryEx('54', '3', '162'));
        console.assert(this.testEntryEx('27', '6', '162'));
        console.assert(this.testEntryEx('42', '6', '252'));
        console.assert(this.testEntryEx('74', '2', '148'));
        console.assert(this.testEntryEx('67', '4', '268'));
        console.assert(this.testEntryEx('35', '5', '175'));
        console.assert(this.testEntryEx('38', '7', '266'));
        console.assert(this.testEntryEx('42', '6', '252'));
        console.assert(this.testEntryEx('26', '9', '234'));
        console.assert(this.testEntryEx('82', '9', '738'));
        console.assert(this.testEntryEx('34', '8', '272'));
        console.assert(this.testEntryEx('28', '8', '224'));
        console.assert(this.testEntryEx('46', '9', '414'));
        console.assert(this.testEntryEx('53', '7', '371'));
        console.assert(this.testEntryEx('42', '4', '168'));
        console.assert(this.testEntryEx('52', '4', '208'));
        console.assert(this.testEntryEx('15', '8', '120'));
        console.assert(this.testEntryEx('34', '6', '204'));
        console.assert(this.testEntryEx('78', '8', '624'));
        // 【ちびむすより引用】ここまで
        // 【ちびむすより引用】ここから
        console.assert(this.testEntryEx('23', '26', '598'));
        console.assert(this.testEntryEx('16', '42', '672'));
        console.assert(this.testEntryEx('24', '82', '1968'));
        console.assert(this.testEntryEx('36', '45', '1620'));
        console.assert(this.testEntryEx('13', '37', '481'));
        console.assert(this.testEntryEx('29', '49', '1421'));
        console.assert(this.testEntryEx('58', '96', '5568'));
        console.assert(this.testEntryEx('28', '69', '1932'));
        console.assert(this.testEntryEx('83', '74', '6142'));
        console.assert(this.testEntryEx('49', '94', '4606'));
        console.assert(this.testEntryEx('67', '39', '2613'));
        console.assert(this.testEntryEx('27', '35', '945'));
        console.assert(this.testEntryEx('46', '76', '3496'));
        console.assert(this.testEntryEx('45', '53', '2385'));
        console.assert(this.testEntryEx('79', '48', '3792'));
        console.assert(this.testEntryEx('61', '54', '3294'));
        console.assert(this.testEntryEx('53', '76', '4028'));
        console.assert(this.testEntryEx('62', '49', '3038'));
        console.assert(this.testEntryEx('75', '26', '1950'));
        console.assert(this.testEntryEx('28', '16', '448'));
        // 【ちびむすより引用】ここまで
        this.reset();
    }
}
