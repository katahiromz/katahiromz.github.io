// AlgoAdd.js --- 足し算アルゴリズム
// Author: katahiromz
// License: MIT
"use strict";
class AlgoAdd extends AlgoBase {
    // コンストラクタ
    constructor(canvas, textarea, end_fn = null) {
        super(canvas, textarea, end_fn);
        this.reset();
    }
    // 計算を行う
    doCalc(a, b, origin_iy = 0) {
        this.clearMapping();
        this.addCommand(['output', `これから ${a} ＋ ${b} を計算します。`]);
        this.addCommand(['output', `まず、上の方に ${a} を書きます。`]);
        // 被加数(A)を置く
        this.autoPutDigits(a, origin_iy);
        this.addCommand(['step']);
        if (this.a_info.fraction || this.b_info.fraction) {
            this.addCommand(['output', `その下に ${b} を書きますが、小数点の位置と位(くらい)をそろえてください。`]);
        }
        else {
            this.addCommand(['output', `その下に ${b} を書きますが、一の位をそろえてください。`]);
        }
        // 加数(B)を置く
        this.autoPutDigits(b, origin_iy + 1);
        this.addCommand(['step']);
        // '+'を描画
        this.addCommand(['output', `２番目の数の左にプラス記号(＋)を書きます。`]);
        {
            let ix0 = Math.min(this.min_x(origin_iy), this.min_x(origin_iy + 1)) - 1;
            this.addCommand(['drawDigit', ix0, origin_iy + 1, '+']);
        }
        this.addCommand(['step']);
        // 区分線を描画
        this.addCommand(['output', `２番目の数の下に定規で線を引きます。`]);
        {
            let ix0 = Math.min(this.min_x(origin_iy), this.min_x(origin_iy + 1)) - 1;
            let ix1 = Math.max(this.max_x(origin_iy), this.max_x(origin_iy + 1)) + 1;
            this.addCommand(['drawLine', ix0, origin_iy + 2, ix1, origin_iy + 2]);
        }
        this.addCommand(['step']);
        // 足し算を計算
        this.addCommand(['output', `一番右の位から足し算をしていきます。`]);
        this.autoDigitAdd(0, origin_iy + 1);
        // 答えの小数点
        let fracMax = Math.max(this.getFracLen(a), this.getFracLen(b));
        {
            if (fracMax > 0) {
                this.addCommand(['output', `小数があるときは、小数点を付けます。`]);
                this.addCommand(['drawDot', 0, origin_iy + 2]);
                this.setMapDot(0, origin_iy + 2);
                this.addCommand(['step']);
            }
        }
        // 答えを取得
        let answer = this.fixAndReadRowNumber(origin_iy + 2);
        {
            const text = `${a} + ${b} = ${answer}`;
            let { x, y } = this.convert3(0, origin_iy + 4);
            this.addCommand(['drawCenterText', y, text]);
        }
        this.answer = answer;
        this.addCommand(['output', `こたえ: ${answer}`]);
        return answer;
    }
    // コマンドの構築
    buildCommands() {
        this.doCalc(this.a, this.b);
    }
    testEntry(a, b, answer) {
        console.assert(typeof a === 'string');
        console.assert(typeof b === 'string');
        this.reset();
        this.set(a, b);
        this.buildCommands();
        while (this.nextCommand()) {
            ;
        }
        return this.answer === answer;
    }
    testEntryEx(a, b, answer) {
        if (!this.testEntry(a, b, answer)) {
            console.log(a, b, answer, this.answer);
            return false;
        }
        return true;
    }
    // 単体テスト
    unitTest() {
        console.assert(this.testEntryEx('3.15', '1.85', '5'));
        console.assert(this.testEntryEx('0', '0', '0'));
        console.assert(this.testEntryEx('0', '1', '1'));
        console.assert(this.testEntryEx('1', '0', '1'));
        console.assert(this.testEntryEx('10', '0', '10'));
        console.assert(this.testEntryEx('0', '10', '10'));
        console.assert(this.testEntryEx('10', '1', '11'));
        console.assert(this.testEntryEx('1', '10', '11'));
        console.assert(this.testEntryEx('9', '1', '10'));
        console.assert(this.testEntryEx('1', '9', '10'));
        console.assert(this.testEntryEx('1', '9999', '10000'));
        console.assert(this.testEntryEx('9999', '1', '10000'));
        console.assert(this.testEntryEx('9999', '99', '10098'));
        console.assert(this.testEntryEx('99', '9999', '10098'));
        console.assert(this.testEntryEx('99', '9999.1', '10098.1'));
        console.assert(this.testEntryEx('99.1', '9999', '10098.1'));
        console.assert(this.testEntryEx('99.9', '9999.1', '10099'));
        console.assert(this.testEntryEx('99.1', '9999.9', '10099'));
        console.assert(this.testEntryEx('0.0001', '9999.9999', '10000'));
        console.assert(this.testEntryEx('0.1', '0.2', '0.3')); // JavaScriptの誤差注意
        // 【ちびむすより引用】ここから
        console.assert(this.testEntryEx('56', '21', '77'));
        console.assert(this.testEntryEx('32', '48', '80'));
        console.assert(this.testEntryEx('49', '16', '65'));
        console.assert(this.testEntryEx('81', '15', '96'));
        console.assert(this.testEntryEx('85', '14', '99'));
        console.assert(this.testEntryEx('38', '55', '93'));
        console.assert(this.testEntryEx('22', '35', '57'));
        console.assert(this.testEntryEx('67', '24', '91'));
        console.assert(this.testEntryEx('67', '26', '93'));
        console.assert(this.testEntryEx('35', '27', '62'));
        console.assert(this.testEntryEx('19', '71', '90'));
        console.assert(this.testEntryEx('68', '23', '91'));
        console.assert(this.testEntryEx('35', '18', '53'));
        console.assert(this.testEntryEx('58', '36', '94'));
        console.assert(this.testEntryEx('72', '11', '83'));
        console.assert(this.testEntryEx('64', '29', '93'));
        console.assert(this.testEntryEx('83', '12', '95'));
        console.assert(this.testEntryEx('28', '39', '67'));
        console.assert(this.testEntryEx('64', '17', '81'));
        console.assert(this.testEntryEx('37', '30', '67'));
        // 【ちびむすより引用】ここまで
        this.reset();
    }
}
