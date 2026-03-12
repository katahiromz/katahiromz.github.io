// AlgoDiv.js --- 割り算アルゴリズム
// Author: katahiromz
// License: MIT
"use strict";
class AlgoDiv extends AlgoBase {
    // コンストラクタ
    constructor(canvas, textarea, end_fn = null) {
        super(canvas, textarea, end_fn);
        this.reset();
    }
    // 計算を行う
    doCalc(a, b, c, origin_iy = 0) {
        // 長除法で割り算を行う
        this.clearMapping();
        this.addCommand(['output', `これから ${a} ÷ ${b} を計算します。`]);
        // 数の情報を取得
        let a_info = getNumberInfo(a), b_info = getNumberInfo(b);
        // 小数点なし
        let a_digits = a_info.digits, b_digits = b_info.digits;
        // 小数点の位置
        let a_fracLen = a_info.frac_len, b_fracLen = b_info.frac_len;
        // 精度
        let accuracy = parseInt(c);
        // 修正された小数点の位置
        let fixedDotPos = b_fracLen - a_fracLen;
        // 右端の位置
        let ix1 = accuracy + b_fracLen - a_fracLen;
        // 被除数(A)を配置
        this.addCommand(['output', `わられる数 ${a} を書いてください。`]);
        this.autoPutDigitsEx(a, 0, origin_iy + 1);
        this.addCommand(['step']);
        // 線を描く
        this.addCommand(['output', `図のように線を描いてください。`]);
        this.addCommand(['drawDivCurve', -a_digits.length - 1, origin_iy + 1]);
        this.addCommand(['drawLine', -a_digits.length - 0.7, origin_iy + 1, Math.max(ix1, 0), origin_iy + 1]);
        this.addCommand(['step']);
        // 除数(B)を配置
        this.addCommand(['output', `左にわる数 ${b} を書いてください。`]);
        this.autoPutDigitsEx(b, -a_digits.length - 1, origin_iy + 1);
        this.addCommand(['step']);
        // 除数に小数点がある場合の処理
        if (b_fracLen > 0) {
            this.addCommand(['output', `わる数に小数点がありますので、わられる数とわる数を ${Math.pow(10, b_fracLen)} 倍して、わる数の小数点を消します。`]);
            // わる数の小数点を消す
            this.addCommand(['slashDot', -(a_digits.length + b_fracLen + 1), origin_iy + 1]);
            // わられる数の小数点を消す。わられる数に小数点がなかった場合は、小数点の位置を強調するために小数点を書いてから消すようにする
            if (a_fracLen == 0)
                this.addCommand(['drawDot', -a_fracLen, origin_iy + 1]);
            if (a_fracLen >= 0)
                this.addCommand(['slashDot', -a_fracLen, origin_iy + 1]);
            // 小数点以下の桁数により場合分け
            if (a_fracLen > b_fracLen) {
                // 小数点の位置をずらす
                this.addCommand(['drawDot', -(a_fracLen - b_fracLen), origin_iy + 1]);
                this.setMapDot(-(a_fracLen - b_fracLen), origin_iy + 1);
            }
            else if (a_fracLen < b_fracLen) {
                // ゼロを追加
                for (let i = 0; i < (b_fracLen - a_fracLen); ++i) {
                    this.addCommand(['drawDigit', i, origin_iy + 1, '0', true]);
                    this.mapDigit(i, origin_iy + 1, '0');
                }
                this.clearMapDot(origin_iy + 1);
            }
            // わる数の先行するゼロを消す
            let ix = this.min_x(origin_iy + 1);
            while (this.mapDigit(ix, origin_iy + 1) === '0') {
                let digit = this.mapDigit(ix + 1, origin_iy + 1);
                if (digit === undefined)
                    break;
                this.setMapDigit(ix, origin_iy + 1, undefined);
                this.addCommand(['backslashDigit', ix, origin_iy + 1]);
                ++ix;
                b_digits = b_digits.replace(/^0/, ''); // ついでに b_digitsも修正
            }
            this.addCommand(['step']);
        }
        // 左の桁から見ていく
        let iy = origin_iy + 2;
        let foundDot = false; // 小数点を見つけた？フラグ変数
        let tateta = false; // 立てた？フラグ変数
        for (let i = -a_digits.length; i < ix1; ++i) {
            // 小数点を確認
            if (!foundDot && i === fixedDotPos) { // 小数点を見つけた？
                // 小数点の前のゼロを書く
                if (!tateta) {
                    this.addCommand(['output', `小数点があったので、ゼロと小数点を書きます。`]);
                    this.addCommand(['drawDigit', i - 1, origin_iy, '0']);
                    this.mapDigit(i - 1, origin_iy, '0');
                }
                else {
                    this.addCommand(['output', `小数点があったので、同じ位置に小数点を書きます。`]);
                }
                // 小数点を書く
                this.addCommand(['drawDot', fixedDotPos, origin_iy]);
                this.setMapDot(fixedDotPos, origin_iy);
                this.addCommand(['step']);
                foundDot = true; // 覚えておく
            }
            if (tateta) { // 立てた？
                // 数を下ろす
                let digit = this.mapDigit(i, origin_iy + 1);
                this.addCommand(['output', `わられる数から ${digit} を下ろします。`]);
                this.addCommand(['drawDigit', i, iy, digit]);
                this.mapDigit(i, iy, digit);
                this.addCommand(['step']);
                // 行iyから数を読み込む
                let digits = normalizeUnsignedNumber(this.readRowNumber(iy, true));
                if (comparePositiveNumbers(digits, b_digits) < 0) {
                    this.addCommand(['output', `${digits} は ${b_digits} より小さいので 0 を立てます。`]);
                    this.addCommand(['drawDigit', i, origin_iy, '0']);
                    this.mapDigit(i, origin_iy, '0');
                    this.addCommand(['step']);
                    continue;
                }
                ++iy;
                // 立てる数を求める
                let num1 = BigInt(digits), num2 = BigInt(b_digits);
                let count = BigInt(0);
                while (num1 >= num2) {
                    num1 -= num2;
                    ++count;
                }
                // 数を立てる
                this.addCommand(['output', `${digits} の中に ${b_digits} が ${count} 個ありますので、${count} を立てます。`]);
                this.addCommand(['drawDigit', i, origin_iy, count.toString()]);
                this.mapDigit(i, origin_iy, count.toString());
                this.addCommand(['step']);
                // 掛け算を計算する
                this.addCommand(['output', `${b_digits} × ${count} を計算します。`]);
                this.autoDigitMul(b_digits, count.toString(), i, iy);
                // 引き算の線を引く
                ++iy;
                this.addCommand(['output', `引き算の線を描きます。`]);
                this.addCommand(['drawLine', -a_digits.length, iy, Math.max(ix1, 0), iy]);
                this.addCommand(['step']);
                this.addCommand(['output', `${digits} - ${BigInt(b_digits) * count} = ${num1.toString()}`]);
                this.autoPutDigitsEx(num1.toString(), i + 1, iy);
                this.addCommand(['step']);
            }
            else { // 非ゼロを見つけてない
                // 行(origin_iy + 1)から数を読み込む
                let digits = '';
                for (let k = -a_digits.length; k <= i; ++k) {
                    digits += this.mapDigit(k, origin_iy + 1);
                }
                digits = normalizeUnsignedNumber(digits);
                if (comparePositiveNumbers(digits, b_digits) < 0) {
                    if (foundDot) {
                        this.addCommand(['output', `${digits} は ${b_digits} より小さいので数を立てられませんが、小数点を過ぎているので 0 を立てます。`]);
                        this.addCommand(['drawDigit', i, origin_iy, '0']);
                        this.mapDigit(i, origin_iy, '0');
                    }
                    else {
                        this.addCommand(['output', `${digits} は ${b_digits} より小さいので数を立てられません。`]);
                    }
                    this.addCommand(['step']);
                    continue;
                }
                // 立てる数を求める
                let num1 = BigInt(digits), num2 = BigInt(b_digits);
                let count = BigInt(0);
                while (num1 >= num2) {
                    num1 -= num2;
                    ++count;
                }
                // 立てる
                this.addCommand(['output', `${digits} の中に ${b_digits} が ${count} 個ありますので、${count} を立てます。`]);
                this.addCommand(['drawDigit', i, origin_iy, count.toString()]);
                this.mapDigit(i, origin_iy, count.toString());
                this.addCommand(['step']);
                tateta = true; // 立てた
                // 掛け算を計算する
                this.addCommand(['output', `${b_digits} × ${count} を計算します。`]);
                this.autoDigitMul(b_digits, count.toString(), i, iy);
                // 引き算の線を引く
                ++iy;
                this.addCommand(['output', `引き算の線を描きます。`]);
                this.addCommand(['drawLine', -a_digits.length, iy, Math.max(ix1, 0), iy]);
                this.addCommand(['step']);
                // 引き算を計算する
                this.addCommand(['output', `${digits} - ${BigInt(b_digits) * count} = ${num1.toString()}`]);
                this.autoPutDigitsEx(num1.toString(), i + 1, iy);
                this.addCommand(['step']);
            }
        }
        // 数が立てられなかったときにゼロを追加
        if (!tateta) {
            this.addCommand(['output', `数を立てられなかったので、ゼロを立てます。`]);
            this.addCommand(['drawDigit', fixedDotPos - 1, origin_iy, '0']);
            this.mapDigit(fixedDotPos - 1, origin_iy, '0');
            this.addCommand(['step']);
        }
        // 必要ならば余りの行に小数点を打つ
        else if (a_fracLen > 0 || b_fracLen > 0 || accuracy > 0) {
            if (b_fracLen > 0)
                this.addCommand(['output', `前の小数点の位置で、あまりに小数点を打ちます。`]);
            else
                this.addCommand(['output', `あまりに小数点を打ちます。`]);
            this.addCommand(['drawDot', -a_fracLen, iy]);
            this.setMapDot(-a_fracLen, iy);
            this.addCommand(['step']);
        }
        // 計算打ち切り後、被除数(origin_iy+1)にまだ下ろしていない桁が残っていれば
        // 余りの行(iy)に全て追記する（ix1はループ未処理の先頭）
        if (tateta && ix1 < 0) {
            this.addCommand(['output', `計算を打ち切ったので、あまりを全部下ろします。`]);
            let appended = false;
            for (let i = ix1; i < 0; ++i) {
                // getMapDigit で実際にマップに存在する桁のみ取得
                let digit = this.getMapDigit(i, origin_iy + 1);
                if (digit === undefined)
                    continue;
                // 既に余りの行に書かれていない座標だけ追記
                if (this.getMapDigit(i, iy) === undefined) {
                    this.addCommand(['drawDigit', i, iy, digit]);
                    this.mapDigit(i, iy, digit);
                    appended = true;
                }
            }
            // 残り桁を追記した場合、余りの行の小数点位置を設定する
            if (appended && a_fracLen > 0 && this.getMapDot(iy) === undefined) {
                this.addCommand(['drawDot', -a_fracLen, iy]);
                this.setMapDot(-a_fracLen, iy);
            }
            this.addCommand(['step']);
        }
        // 答えを求める
        let shou = this.fixAndReadRowNumber(origin_iy, false, true); // 商
        let amari;
        if (comparePositiveNumbers(shou, '0') == 0) { // 商がゼロの場合
            amari = a; // 余り
        }
        else {
            amari = this.fixAndReadRowNumber(iy); // 余り
        }
        if (comparePositiveNumbers(amari, '0') == 0) { // 余りがゼロの場合
            this.addCommand(['output', `商は ${shou}です。あまりはありません。`]);
            this.addCommand(['output', `こたえ: ${shou}`]);
            this.answer = shou;
        }
        else {
            this.addCommand(['output', `商は ${shou}、あまりは ${amari} です。`]);
            this.addCommand(['output', `こたえ: ${shou} … ${amari}`]);
            this.answer = `${shou} … ${amari}`;
        }
        // 答えを表示する
        this.addCommand(['drawCenterText', iy + 2, `${a} ÷ ${b} = ${this.answer}`]);
        return this.answer;
    }
    // コマンドの構築
    buildCommands() {
        this.doCalc(this.a, this.b, this.c || '0');
    }
    testEntry(a, b, answer, c) {
        console.assert(typeof a === 'string');
        console.assert(typeof b === 'string');
        console.assert(typeof c === 'string');
        this.reset();
        this.set(a, b, c);
        while (this.nextCommand()) {
            ;
        }
        return this.answer === answer;
    }
    testEntryEx(a, b, answer, c = '0') {
        if (!this.testEntry(a, b, answer, c)) {
            console.log(a, b, c, answer, this.answer);
            return false;
        }
        return true;
    }
    // 単体テスト
    unitTest() {
        // 【ちびむすより引用】ここから
        console.assert(this.testEntryEx('13', '2', '6 … 1'));
        console.assert(this.testEntryEx('73', '8', '9 … 1'));
        console.assert(this.testEntryEx('62', '8', '7 … 6'));
        console.assert(this.testEntryEx('50', '7', '7 … 1'));
        console.assert(this.testEntryEx('33', '4', '8 … 1'));
        console.assert(this.testEntryEx('43', '6', '7 … 1'));
        console.assert(this.testEntryEx('29', '5', '5 … 4'));
        console.assert(this.testEntryEx('57', '6', '9 … 3'));
        console.assert(this.testEntryEx('32', '5', '6 … 2'));
        console.assert(this.testEntryEx('19', '5', '3 … 4'));
        console.assert(this.testEntryEx('78', '9', '8 … 6'));
        console.assert(this.testEntryEx('19', '2', '9 … 1'));
        // 【ちびむすより引用】ここまで
        // 【ちびむすより引用】ここから
        console.assert(this.testEntryEx('63', '2', '31 … 1'));
        console.assert(this.testEntryEx('88', '4', '22'));
        console.assert(this.testEntryEx('95', '9', '10 … 5'));
        console.assert(this.testEntryEx('89', '4', '22 … 1'));
        console.assert(this.testEntryEx('38', '3', '12 … 2'));
        console.assert(this.testEntryEx('57', '5', '11 … 2'));
        console.assert(this.testEntryEx('89', '2', '44 … 1'));
        console.assert(this.testEntryEx('75', '7', '10 … 5'));
        console.assert(this.testEntryEx('43', '2', '21 … 1'));
        // 【ちびむすより引用】ここまで
        // 【ちびむすより引用】ここから
        console.assert(this.testEntryEx('21', '2', '10 … 1'));
        console.assert(this.testEntryEx('83', '2', '41 … 1'));
        console.assert(this.testEntryEx('67', '3', '22 … 1'));
        console.assert(this.testEntryEx('62', '6', '10 … 2'));
        console.assert(this.testEntryEx('87', '4', '21 … 3'));
        console.assert(this.testEntryEx('61', '2', '30 … 1'));
        console.assert(this.testEntryEx('85', '4', '21 … 1'));
        console.assert(this.testEntryEx('64', '6', '10 … 4'));
        console.assert(this.testEntryEx('68', '3', '22 … 2'));
        // 【ちびむすより引用】ここまで
        // 【ちびむすより引用】ここから
        console.assert(this.testEntryEx('168', '22', '7 … 14'));
        console.assert(this.testEntryEx('107', '32', '3 … 11'));
        console.assert(this.testEntryEx('286', '31', '9 … 7'));
        console.assert(this.testEntryEx('207', '44', '4 … 31'));
        console.assert(this.testEntryEx('183', '26', '7 … 1'));
        console.assert(this.testEntryEx('127', '23', '5 … 12'));
        console.assert(this.testEntryEx('567', '64', '8 … 55'));
        console.assert(this.testEntryEx('186', '34', '5 … 16'));
        console.assert(this.testEntryEx('386', '42', '9 … 8'));
        console.assert(this.testEntryEx('101', '18', '5 … 11'));
        console.assert(this.testEntryEx('163', '26', '6 … 7'));
        console.assert(this.testEntryEx('380', '85', '4 … 40'));
        // 【ちびむすより引用】ここまで
        // 【ちびむすより引用】ここから
        console.assert(this.testEntryEx('2.4', '4.8', '0.5', '1'));
        console.assert(this.testEntryEx('5.16', '8.6', '0.6', '1'));
        console.assert(this.testEntryEx('3.4', '8.5', '0.4', '1'));
        console.assert(this.testEntryEx('1.29', '4.3', '0.3', '1'));
        console.assert(this.testEntryEx('6.2', '15.5', '0.4', '1'));
        console.assert(this.testEntryEx('8.33', '9.8', '0.85', '2'));
        console.assert(this.testEntryEx('8.6', '21.5', '0.4', '1'));
        console.assert(this.testEntryEx('2.87', '8.2', '0.35', '2'));
        console.assert(this.testEntryEx('0.26', '6.5', '0.04', '2'));
        console.assert(this.testEntryEx('2.52', '5.6', '0.45', '2'));
        console.assert(this.testEntryEx('0.21', '4.2', '0.05', '2'));
        console.assert(this.testEntryEx('2.07', '4.6', '0.45', '2'));
        console.assert(this.testEntryEx('0.26', '5.2', '0.05', '2'));
        console.assert(this.testEntryEx('0.14', '0.4', '0.35', '2'));
        console.assert(this.testEntryEx('0.23', '4.6', '0.05', '2'));
        console.assert(this.testEntryEx('0.28', '0.8', '0.35', '2'));
        // 【ちびむすより引用】ここまで
        // 【ちびむすより引用】ここから
        console.assert(this.testEntryEx('3.2', '0.5', '6 … 0.2'));
        console.assert(this.testEntryEx('3.6', '1.5', '2 … 0.6'));
        console.assert(this.testEntryEx('3.9', '0.6', '6 … 0.3'));
        console.assert(this.testEntryEx('5.5', '2.5', '2 … 0.5'));
        console.assert(this.testEntryEx('5.4', '4.5', '1 … 0.9'));
        console.assert(this.testEntryEx('2.8', '0.8', '3 … 0.4'));
        console.assert(this.testEntryEx('6.3', '1.5', '4 … 0.3'));
        console.assert(this.testEntryEx('5.6', '1.6', '3 … 0.8'));
        console.assert(this.testEntryEx('39.6', '12.3', '3 … 2.7'));
        console.assert(this.testEntryEx('38.6', '31.5', '1 … 7.1'));
        console.assert(this.testEntryEx('73.4', '35.6', '2 … 2.2'));
        console.assert(this.testEntryEx('63.4', '15.2', '4 … 2.6'));
        console.assert(this.testEntryEx('63.5', '14.2', '4 … 6.7'));
        console.assert(this.testEntryEx('83.5', '41.2', '2 … 1.1'));
        console.assert(this.testEntryEx('64.7', '15.2', '4 … 3.9'));
        console.assert(this.testEntryEx('45.3', '12.3', '3 … 8.4'));
        // 【ちびむすより引用】ここまで
        // 【ちびむすより引用】ここから
        console.assert(this.testEntryEx('3.9', '1.9', '2 … 0.1'));
        console.assert(this.testEntryEx('7.6', '2.3', '3 … 0.7'));
        console.assert(this.testEntryEx('2.9', '0.4', '7 … 0.1'));
        console.assert(this.testEntryEx('2.7', '1.1', '2 … 0.5'));
        console.assert(this.testEntryEx('7.6', '0.9', '8 … 0.4'));
        console.assert(this.testEntryEx('3.5', '1.4', '2 … 0.7'));
        console.assert(this.testEntryEx('5.8', '0.7', '8 … 0.2'));
        console.assert(this.testEntryEx('6.1', '5.3', '1 … 0.8'));
        console.assert(this.testEntryEx('62.8', '18.9', '3 … 6.1'));
        console.assert(this.testEntryEx('67.3', '19.4', '3 … 9.1'));
        console.assert(this.testEntryEx('38.6', '11.7', '3 … 3.5'));
        console.assert(this.testEntryEx('46.8', '18.6', '2 … 9.6'));
        console.assert(this.testEntryEx('62.4', '19.3', '3 … 4.5'));
        console.assert(this.testEntryEx('82.5', '11.6', '7 … 1.3'));
        console.assert(this.testEntryEx('46.7', '12.3', '3 … 9.8'));
        console.assert(this.testEntryEx('67.2', '16.5', '4 … 1.2'));
        // 【ちびむすより引用】ここまで
        // 【ちびむすより引用】ここから
        console.assert(this.testEntryEx('3.64', '1.4', '2.6', '1'));
        console.assert(this.testEntryEx('3.22', '2.3', '1.4', '1'));
        console.assert(this.testEntryEx('8.82', '4.2', '2.1', '1'));
        console.assert(this.testEntryEx('3.72', '3.1', '1.2', '1'));
        console.assert(this.testEntryEx('1.44', '0.6', '2.4', '1'));
        console.assert(this.testEntryEx('5.76', '1.8', '3.2', '1'));
        console.assert(this.testEntryEx('2.88', '0.8', '3.6', '1'));
        console.assert(this.testEntryEx('3.22', '2.3', '1.4', '1'));
        console.assert(this.testEntryEx('3.68', '1.6', '2.3', '1'));
        console.assert(this.testEntryEx('7.26', '3.3', '2.2', '1'));
        console.assert(this.testEntryEx('1.68', '0.7', '2.4', '1'));
        console.assert(this.testEntryEx('2.88', '0.9', '3.2', '1'));
        console.assert(this.testEntryEx('3.15', '1.5', '2.1', '1'));
        console.assert(this.testEntryEx('7.68', '2.4', '3.2', '1'));
        console.assert(this.testEntryEx('1.92', '0.8', '2.4', '1'));
        console.assert(this.testEntryEx('1.77', '0.3', '5.9', '1'));
        // 【ちびむすより引用】ここまで
        console.assert(this.testEntryEx('0', '1', '0'));
        console.assert(this.testEntryEx('1', '1', '1'));
        console.assert(this.testEntryEx('999', '999', '1'));
        console.assert(this.testEntryEx('612', '3', '204'));
        console.assert(this.testEntryEx('100', '5', '20'));
        console.assert(this.testEntryEx('100', '20', '5'));
        console.assert(this.testEntryEx('100', '25', '4'));
        console.assert(this.testEntryEx('100', '4', '25'));
        console.assert(this.testEntryEx('10', '0.5', '20'));
        console.assert(this.testEntryEx('10', '2', '5'));
        console.assert(this.testEntryEx('10', '2.5', '4'));
        console.assert(this.testEntryEx('10', '0.4', '25'));
        console.assert(this.testEntryEx('10', '40', '0 … 10'));
        console.assert(this.testEntryEx('10', '40', '0.25', '2'));
        console.assert(this.testEntryEx('10', '40', '0.250', '3'));
        console.assert(this.testEntryEx('0.1', '0.4', '0.2 … 0.02', '1'));
        console.assert(this.testEntryEx('0.1', '2', '0.0500', '4'));
        console.assert(this.testEntryEx('999', '0.1', '9990', '0'));
        console.assert(this.testEntryEx('999', '0.1', '9990.00', '2'));
        console.assert(this.testEntryEx('99999999999999999999', '99999999999999999999', '1.0', '1'));
        console.assert(this.testEntryEx('99.9', '990', '0 … 99.9', '0'));
        console.assert(this.testEntryEx('12.355', '789', '0.0 … 12.355', '1'));
        console.assert(this.testEntryEx('7.955', '7.89', '1.00 … 0.065', '2'));
        console.assert(this.testEntryEx('0.3', '0.25', '1 … 0.05'));
        console.assert(this.testEntryEx('1.3', '0.25', '5 … 0.05'));
        console.assert(this.testEntryEx('0.01', '0.1', '0 … 0.01'));
        console.assert(this.testEntryEx('0.25', '0.3', '0 … 0.25'));
        console.assert(this.testEntryEx('10', '40', '0.2 … 2', '1'));
        console.assert(this.testEntryEx('12345', '67', '184.25 … 0.25', '2'));
        console.assert(this.testEntryEx('1', '0.3', '3.3 … 0.01', '1'));
        console.assert(this.testEntryEx('123.55', '789', '0.1 … 44.65', '1'));
        console.assert(this.testEntryEx('12.345', '1', '12.34 … 0.005', '2'));
        console.assert(this.testEntryEx('12.355', '78', '0.1 … 4.555', '1'));
        console.assert(this.testEntryEx('12.355', '7', '1.7 … 0.455', '1'));
        console.assert(this.testEntryEx('100', '20.1', '4 … 19.6'));
        this.reset();
    }
}
