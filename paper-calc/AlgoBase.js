// AlgoBase.js --- 筆算アルゴリズム基底クラス
// Author: katahiromz
// License: MIT
"use strict";
// 線の幅
const LINE_WIDTH = 3;
class AlgoBase {
    constructor(canvas, textarea, end_fn = null) {
        this.canvas = canvas; // キャンバス
        this.textarea = textarea; // 説明文を表示するテキストエリア
        this.running = false; // 実行中か？
        this.anime = null; // アニメーションフレーム
        this.timerId = null; // タイマーID
        this.ready = false; // 準備完了？
        this.digitWidth = digitInfo['0'].img.width;
        this.digitHeight = digitInfo['0'].img.height;
        this.columnWidth = this.digitWidth * 1.1;
        this.textCharWidth = this.digitWidth * 0.8;
        this.rowHeight = this.digitHeight;
        this.dotWidth = this.digitWidth * 0.2;
        this.a = null;
        this.b = null;
        this.c = null;
        this.end_fn = end_fn;
        this.stepInterval = 200; // 時間間隔(ミリ秒)
        this.reset();
    }
    // リセット
    reset() {
        this.answer = null;
        this.autoPlay = false;
        this.skipInitial = true;
        this.commands = [];
        this.iCommand = 0;
        this.clearMapping();
        this.paper = new Paper(1, 1, 'white');
    }
    // 速度を更新するメソッドを追加
    setDelay(ms) {
        this.stepInterval = ms;
        // 実行中に速度が変更された場合、タイマーを再設定する
        if (this.running && this.autoPlay && this.timerId) {
            clearInterval(this.timerId);
            this.timerId = setInterval(this.nextCommand.bind(this), this.stepInterval);
        }
    }
    // 写像
    mapDigit(ix, iy, digit = null) {
        if (!this.mapping.has(iy)) {
            this.mapping.set(iy, new Map());
        }
        const rowMap = this.mapping.get(iy);
        if (digit) {
            if (isDigit(digit)) {
                rowMap.set(ix, digit);
            }
            return;
        }
        let ch = rowMap.get(ix);
        if (ch === undefined || !isDigit(ch))
            return '0';
        return ch;
    }
    getMapDigit(ix, iy) {
        if (!this.mapping.has(iy))
            return undefined;
        return this.mapping.get(iy).get(ix);
    }
    setMapDigit(ix, iy, ch) {
        if (!this.mapping.has(iy)) {
            this.mapping.set(iy, new Map());
        }
        const rowMap = this.mapping.get(iy);
        // ch が null, undefined, または空文字の場合は、その座標のキーを削除する
        if (ch === undefined || ch === null || ch === '') {
            rowMap.delete(ix);
            // もし行(iy)が空になったら、行ごと削除してクリーンに保つ
            if (rowMap.size === 0) {
                this.mapping.delete(iy);
            }
        }
        else {
            rowMap.set(ix, ch);
        }
    }
    getMapDot(iy) {
        return this.dotMapping.get(iy);
    }
    setMapDot(ix, iy) {
        this.dotMapping.set(iy, ix);
    }
    clearMapDot(iy) {
        this.dotMapping.delete(iy);
    }
    clearMapping() {
        this.mapping = new Map(); // iy -> Map(ix -> digit)
        this.dotMapping = new Map(); // iy -> ix
    }
    // 紙をクリア
    clearPaper() {
        this.paper = new Paper(1, 1, 'white'); // 仮想的な紙
    }
    // 設定
    set(a, b, c = '0') {
        console.assert(typeof a === 'string');
        console.assert(typeof b === 'string');
        console.assert(typeof c === 'string');
        this.a = normalizeUnsignedNumber(a);
        this.b = normalizeUnsignedNumber(b);
        this.c = c;
        this.a_info = getNumberInfo(a);
        this.b_info = getNumberInfo(b);
        this.c_info = getNumberInfo(c);
        this.buildCommands();
    }
    // 出力
    output(str) {
        if (Paper.g_sizingOnly)
            return;
        const logItem = document.createElement('div');
        logItem.className = 'log-item active';
        logItem.innerText = str;
        const lastActive = this.textarea.querySelector('.active');
        if (lastActive) {
            lastActive.classList.remove('active');
        }
        this.textarea.insertBefore(logItem, this.textarea.firstChild);
        console.log(str);
    }
    // 開始
    start() {
        this.running = true;
        this.calcSizing();
        this.anime = requestAnimationFrame(this.draw.bind(this));
    }
    // 停止
    stop() {
        this.running = false;
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }
    // コマンドの追加
    addCommand(command) {
        if (!this.commands)
            this.commands = [];
        this.commands.push(command);
    }
    // コマンドの構築
    buildCommands() { }
    // サイズを計算
    calcSizing() {
        Paper.g_sizingOnly = true;
        for (let command of this.commands) {
            this.executeCommand(command);
        }
        Paper.g_sizingOnly = false;
    }
    // コマンドの実行
    executeCommand(op) {
        switch (op[0]) {
            case 'output':
                this.output(op[1]);
                break;
            case 'drawDigit':
                this.drawDigit(...op.slice(1));
                break;
            case 'drawCenterText':
                this.drawCenterText(...op.slice(1));
                break;
            case 'drawDivCurve':
                this.drawDivCurve(...op.slice(1));
                break;
            case 'backslashDigit':
                this.backslashDigit(...op.slice(1));
                break;
            case 'drawCarry':
                this.drawCarry(...op.slice(1));
                break;
            case 'drawSmallChars':
                this.drawSmallChars(...op.slice(1));
                break;
            case 'drawLine':
                this.drawLine(...op.slice(1));
                break;
            case 'drawStrike':
                this.drawStrike(...op.slice(1));
                break;
            case 'drawDot':
                this.drawDot(...op.slice(1));
                break;
            case 'slashDot':
                this.slashDot(...op.slice(1));
                break;
            case 'step':
                break;
            default:
                console.log("Unknown command:", op[0]);
                console.assert(false);
                return false;
        }
        return true;
    }
    // 次のコマンドへ
    nextCommand() {
        if (this.commands && this.iCommand < this.commands.length) {
            let ret, command;
            do {
                command = this.commands[this.iCommand];
                ret = this.executeCommand(command);
                this.iCommand++;
                if (!ret)
                    break;
            } while (command[0] == 'output' && this.iCommand < this.commands.length);
            if (this.iCommand == this.commands.length && this.end_fn)
                this.end_fn();
            return ret;
        }
        if (this.end_fn)
            this.end_fn();
        return false;
    }
    // 次のステップへ
    nextStep() {
        if (this.commands && this.iCommand < this.commands.length) {
            let ret = false;
            while (this.iCommand < this.commands.length) {
                let command = this.commands[this.iCommand];
                this.iCommand++;
                // 'step' コマンドを見つけたら、そこでこのターンの実行を終了する
                if (command[0] === 'step') {
                    ret = true;
                    break;
                }
                ret = this.executeCommand(command);
            }
            if (this.iCommand === this.commands.length && this.end_fn) {
                this.end_fn();
            }
            return ret;
        }
        if (this.end_fn)
            this.end_fn();
        return false;
    }
    // 指定したiyからX座標の最小値を取得
    min_x(iy) {
        const rowMap = this.mapping.get(iy);
        if (!rowMap || rowMap.size === 0)
            return undefined;
        return Math.min(...rowMap.keys());
    }
    // 指定したiyからX座標の最大値を取得
    max_x(iy) {
        const rowMap = this.mapping.get(iy);
        if (!rowMap || rowMap.size === 0)
            return undefined;
        return Math.max(...rowMap.keys());
    }
    min_x_by_ix(ix, iy) {
        const rowMap = this.mapping.get(iy);
        if (!rowMap || rowMap.size === 0)
            return undefined;
        let min_x = ix;
        if (!rowMap.has(min_x))
            return undefined;
        while (rowMap.has(min_x - 1)) {
            --min_x;
        }
        return min_x;
    }
    max_x_by_ix(ix, iy) {
        const rowMap = this.mapping.get(iy);
        if (!rowMap || rowMap.size === 0)
            return undefined;
        let max_x = ix;
        if (!rowMap.has(max_x))
            return undefined;
        while (rowMap.has(max_x + 1)) {
            ++max_x;
        }
        return max_x;
    }
    get_columns(iy) {
        const rowMap = this.mapping.get(iy);
        if (!rowMap || rowMap.size === 0)
            return undefined;
        const min_x = this.min_x(iy), max_x = this.max_x(iy);
        let prev_ix = null;
        let columns = [];
        for (let ix = min_x; ix <= max_x; ++ix) {
            if (!rowMap.has(prev_ix) && rowMap.has(ix)) {
                columns.push(ix);
            }
            prev_ix = ix;
        }
        return columns;
    }
    min_x_by_colunm(iy, iColumn) {
        let columns = this.get_columns(iy);
        if (columns === undefined)
            return undefined;
        return this.min_x_by_ix(columns[iColumn]);
    }
    max_x_by_ix(iy, iColumn) {
        let columns = this.get_columns(iy);
        if (columns === undefined)
            return undefined;
        return this.max_x_by_ix(columns[iColumn]);
    }
    // 小数部の長さ
    getFracLen(str) {
        let index = str.indexOf('.');
        if (index == -1)
            return 0;
        return str.length - index - 1;
    }
    // 数字を置く
    autoPutDigits(numStr, iy) {
        console.assert(typeof numStr === 'string');
        const info = getNumberInfo(numStr);
        if (!info) {
            alert(`${numStr} は、不正な数値文字列です。著者に報告ください。`);
            console.assert(false);
            return false;
        }
        let iDot = numStr.indexOf('.');
        if (iDot != -1) {
            numStr = numStr.substr(0, iDot) + numStr.substr(iDot + 1);
        }
        let m = (iDot != -1) ? iDot : numStr.length;
        // 整数部
        for (let ix = -m, k = 0; ix < 0; ++ix, ++k) {
            this.addCommand(['drawDigit', ix, iy, numStr[k]]);
            this.mapDigit(ix, iy, numStr[k]);
        }
        // 必要なら数Aの小数点を描画
        if (iDot != -1) {
            this.addCommand(['drawDot', 0, iy]);
            this.setMapDot(0, iy);
            // 小数部
            for (let k = iDot; k < numStr.length; ++k) {
                let ix = k - iDot;
                this.addCommand(['drawDigit', ix, iy, numStr[k]]);
                this.mapDigit(ix, iy, numStr[k]);
            }
        }
    }
    // 数字を置く
    autoPutDigitsEx(numStr, iy0) {
        console.assert(typeof numStr === 'string');
        const info = getNumberInfo(numStr);
        if (!info) {
            alert(`${numStr} は、不正な数値文字列です。著者に報告ください。`);
            console.assert(false);
            return false;
        }
        let iDot = numStr.indexOf('.');
        if (iDot != -1) {
            numStr = numStr.substr(0, iDot) + numStr.substr(iDot + 1);
        }
        let m = (iDot != -1) ? iDot : numStr.length;
        let kDot = numStr.length - m;
        // 整数部
        for (let k = 0; k < m; ++k) {
            let ix = -numStr.length + k;
            this.addCommand(['drawDigit', ix, iy0, numStr[k]]);
            this.mapDigit(ix, iy0, numStr[k]);
        }
        if (iDot != -1) {
            // 小数点を描画
            this.addCommand(['drawDot', -kDot, iy0]);
            this.setMapDot(-kDot, iy0);
            // 小数部
            for (let k = m; k < numStr.length; ++k) {
                let ix = -numStr.length + k;
                this.addCommand(['drawDigit', ix, iy0, numStr[k]]);
                this.mapDigit(ix, iy0, numStr[k]);
            }
        }
    }
    // 桁の足し算（繰り上がり可能）
    autoDigitAdd(iy0, iy1) {
        let min_ix = undefined, max_ix = undefined;
        for (let [iy, rowMap] of this.mapping) {
            let m0 = this.min_x(iy);
            let m1 = this.max_x(iy);
            if (min_ix === undefined || m0 < min_ix)
                min_ix = m0;
            if (max_ix === undefined || m1 > max_ix)
                max_ix = m1;
        }
        let answer_iy = iy1 + 1;
        let carry = 0;
        for (let ix = max_ix; ix >= min_ix; --ix) {
            // この桁にある数の合計
            let nums = [];
            for (let iy = iy0; iy <= iy1; ++iy) {
                let digit0 = this.getMapDigit(ix, iy);
                if (digit0 !== undefined)
                    nums.push(digit0);
            }
            let msg = '';
            let index = 0;
            let sum = carry; // ★ carry は「この桁」に足してから計算する（前の桁から来た繰り上がり）
            for (let num of nums) {
                if (index === 0)
                    msg += num;
                else
                    msg += ` 足す ${num}`;
                sum += parseInt(num, 10);
                ++index;
            }
            if (carry > 0) {
                // 説明文としても carry を表記
                if (nums.length > 0)
                    msg += ' 足す ';
                msg += carry;
            }
            // 次の桁へ送る carry を計算
            let nextCarry = Math.floor(sum / 10);
            let digit = (sum % 10).toString();
            msg += ` は ${sum} です。`;
            if (nextCarry > 0)
                msg += `くり上がりは ${nextCarry} です。`;
            this.addCommand(['output', msg]);
            // ★ 繰り上がりは「次の桁」に行くものだが、表示はこの桁の上に描くUIなのでここで描画してOK
            if (nextCarry > 0)
                this.addCommand(['drawCarry', ix, answer_iy, nextCarry.toString()]);
            this.addCommand(['drawDigit', ix, answer_iy, digit]);
            this.mapDigit(ix, answer_iy, digit);
            this.addCommand(['step']);
            carry = nextCarry;
        }
        if (carry > 0) {
            this.addCommand(['output', `くり上がりをわすれずに。`]);
            // carry が 2桁以上（例: 10）でも正しく左に展開して書く
            const carryStr = carry.toString(); // 例: "10"
            for (let k = 0; k < carryStr.length; ++k) {
                const digit = carryStr[carryStr.length - 1 - k];
                const ix = (min_ix - 1) - k;
                this.addCommand(['drawDigit', ix, answer_iy, digit]);
                this.mapDigit(ix, answer_iy, digit);
            }
            this.addCommand(['step']);
        }
    }
    // 桁の引き算（繰り下がり可能）
    autoDigitSub(iy0, iy1) {
        console.assert(iy0 + 1 === iy1);
        let min_ix = undefined, max_ix = undefined;
        for (let [iy, rowMap] of this.mapping) {
            let m0 = this.min_x(iy);
            let m1 = this.max_x(iy);
            if (min_ix === undefined || m0 < min_ix)
                min_ix = m0;
            if (max_ix === undefined || m1 > max_ix)
                max_ix = m1;
        }
        let answer_iy = iy1 + 1;
        for (let ix = max_ix; ix >= min_ix; --ix) {
            let x = parseInt(this.mapDigit(ix, iy0));
            let y = parseInt(this.mapDigit(ix, iy1));
            let z = x - y;
            let borrow = (z < 0) ? 1 : 0; // 繰り下がり
            if (z < 0)
                z += 10;
            if (borrow === 0) {
                if (this.getMapDigit(ix, iy1) === undefined) {
                    this.addCommand(['output', `${x} は ${z} です。`]);
                }
                else {
                    this.addCommand(['output', `${x} 引く ${y} は ${z} です。`]);
                }
                let digit = (z % 10).toString();
                this.addCommand(['drawDigit', ix, answer_iy, digit]);
                this.mapDigit(ix, answer_iy, digit);
                this.addCommand(['step']);
            }
            else {
                this.addCommand(['output', `${x} は ${y} より小さいので、くり下がりがあります。` +
                        `上の位から 1 を借りて、今の位に10を足します。${x} + ${10} = ${x + 10} です。`]);
                let i = 1;
                do {
                    let num1 = parseInt(this.mapDigit(ix - i, iy0));
                    let num2 = num1 - borrow;
                    borrow = (num2 < 0) ? 1 : 0;
                    if (num2 < 0)
                        num2 += 10;
                    this.addCommand(['backslashDigit', ix - i, iy0]);
                    this.addCommand(['drawSmallChars', ix - i, iy0 - 1, num2.toString(), iy0]);
                    this.setMapDigit(ix - i, iy0 - 1, '*');
                    this.mapDigit(ix - i, iy0, num2.toString());
                    ++i;
                } while (borrow > 0);
                this.addCommand(['backslashDigit', ix, iy0]);
                if (this.getMapDigit(ix, iy0 - 1) === undefined) {
                    this.addCommand(['drawSmallChars', ix, iy0 - 1, '1' + x.toString(), iy0]);
                    this.setMapDigit(ix, iy0 - 1, '*');
                }
                else {
                    this.addCommand(['drawStrike', ix, iy0 - 1, ix + 1, iy0 - 1, iy0]);
                    this.addCommand(['drawSmallChars', ix, iy0 - 2, '1' + x.toString(), iy0]);
                }
                this.addCommand(['step']);
                this.addCommand(['output', `${10 + x} 引く ${y} は ${z} です。`]);
                let digit = (z % 10).toString();
                this.addCommand(['drawDigit', ix, answer_iy, digit]);
                this.mapDigit(ix, answer_iy, digit);
                this.addCommand(['step']);
            }
        }
    }
    // 桁の掛け算（尾乗法、くり上がり可能）
    autoDigitMul(multiplicandStr, multiplierDigit, origin_ix, origin_iy) {
        console.assert(typeof multiplierDigit === 'string' && multiplierDigit.length === 1);
        let carry = 0;
        // 被乗数を右（一の位）から順に処理
        let revMultiplicand = multiplicandStr.split('').reverse().join('');
        for (let i = 0; i < revMultiplicand.length; ++i) {
            let digit1 = revMultiplicand[i];
            let m = parseInt(digit1), n = parseInt(multiplierDigit);
            let p = m * n + carry;
            // 座標計算: origin_ix から左へ i 桁進む
            let ix = origin_ix - i;
            let iy = origin_iy;
            let old_carry = carry;
            carry = Math.floor(p / 10);
            if (carry > 0)
                this.addCommand(['drawCarry', ix, iy, carry.toString()]);
            if (old_carry > 0) {
                this.addCommand(['output', `${m} × ${n} + くり上がり ${old_carry} = ${p}`]);
            }
            else {
                this.addCommand(['output', `${m} × ${n} = ${p}`]);
            }
            let unitDigit = (p % 10).toString();
            this.addCommand(['drawDigit', ix, iy, unitDigit]);
            this.mapDigit(ix, iy, unitDigit);
            this.addCommand(['step']);
        }
        // 最後に残った繰り上がりを処理
        if (carry > 0) {
            let ix = origin_ix - revMultiplicand.length;
            this.addCommand(['output', `くり上がり ${carry} を書きます。`]);
            this.addCommand(['drawDigit', ix, origin_iy, carry.toString()]);
            this.mapDigit(ix, origin_iy, carry.toString());
            this.addCommand(['step']);
        }
    }
    // 小数点の左に数字がなかった場合、左側にゼロを追加する
    addMissingZero(iy, test = false) {
        let iDot = this.getMapDot(iy);
        if (iDot === undefined)
            return false; // 小数点がなければ何もしない
        let ix0 = this.min_x(iy);
        // min_x が iDot 以上、つまり小数点より左に数字がない場合にゼロを追加
        if (ix0 === undefined || ix0 >= iDot) {
            if (test)
                return true;
            let zeroIx = iDot - 1;
            this.addCommand(['drawDigit', zeroIx, iy, '0']);
            this.mapDigit(zeroIx, iy, '0');
            return true;
        }
        return false;
    }
    // 先行するゼロを修正する
    fixLeadZeros(iy, test = false) {
        let ix0 = this.min_x(iy), ix1 = this.max_x(iy);
        let iDot = this.getMapDot(iy);
        let onePlaceIx = (iDot !== undefined) ? iDot - 1 : ix1;
        let changed = false;
        for (let ix = ix0; ix <= ix1; ++ix) {
            let digit = this.getMapDigit(ix, iy);
            if (digit === undefined)
                continue;
            if (digit !== '0')
                break;
            if (ix < onePlaceIx) {
                if (test)
                    return true;
                this.addCommand(['backslashDigit', ix, iy]);
                this.setMapDigit(ix, iy, undefined); // 内部データから削除
                changed = true;
            }
            else {
                break;
            }
        }
        return changed;
    }
    // 小数点の後に後続するゼロを修正する
    fixTrailingZeros(iy, test = false) {
        let ix0 = this.min_x(iy), ix1 = this.max_x(iy);
        let iDot = this.getMapDot(iy);
        if (iDot === undefined)
            return false;
        let changed = false;
        for (let ix = ix1; ix >= ix0; --ix) {
            let digit = this.getMapDigit(ix, iy);
            if (digit === undefined)
                continue;
            if (digit !== '0')
                break;
            if (ix >= iDot) {
                if (test)
                    return true;
                this.addCommand(['backslashDigit', ix, iy]);
                this.setMapDigit(ix, iy, undefined); // 内部データから削除
                changed = true;
            }
            else {
                break;
            }
        }
        if (!test && changed) {
            let hasFraction = false;
            let currentMaxX = this.max_x(iy);
            if (currentMaxX !== undefined) {
                for (let ix = iDot; ix <= currentMaxX; ix++) {
                    if (this.getMapDigit(ix, iy) !== undefined) {
                        hasFraction = true;
                        break;
                    }
                }
            }
            if (!hasFraction) {
                this.addCommand(['drawDot', iDot, iy]);
                this.clearMapDot(iy);
            }
        }
        return changed;
    }
    // 行の数を読み取る
    readRowNumber(iy, ignoreDot = false) {
        let ix0 = this.min_x(iy);
        let ix1 = this.max_x(iy);
        let iDot = this.getMapDot(iy);
        if (ix0 === undefined && iDot === undefined)
            return "";
        let start = (iDot !== undefined) ? Math.min(ix0 !== null && ix0 !== void 0 ? ix0 : iDot, iDot) : ix0;
        let end = (iDot !== undefined) ? Math.max(ix1 !== null && ix1 !== void 0 ? ix1 : iDot, iDot) : ix1;
        let numStr = '';
        for (let ix = start; ix <= end; ++ix) {
            if (!ignoreDot && iDot !== undefined && ix === iDot) {
                numStr += '.';
            }
            let digit = this.getMapDigit(ix, iy);
            if (digit !== undefined && isDigit(digit)) {
                numStr += digit;
            }
            else if (ix === iDot) {
                continue;
            }
            else {
                numStr += '0';
            }
        }
        return numStr;
    }
    // 行の数を補正して読み取る
    fixAndReadRowNumber(iy, ignoreDot = false, dontFixTrailZeros = false) {
        // 小数点の左側に数字がないとき、ゼロを追加
        if (this.addMissingZero(iy, true)) {
            this.addCommand(['output', `小数点の左がわに数字がないのでゼロを追加します。`]);
            this.addMissingZero(iy, false);
            this.addCommand(['step']);
        }
        // 余分なゼロを消す
        if (this.fixLeadZeros(iy, true)) {
            this.addCommand(['output', `整数の左がわにある、いらないゼロ（一の位以外）を消します。`]);
            this.fixLeadZeros(iy, false);
            this.addCommand(['step']);
        }
        if (!dontFixTrailZeros && this.fixTrailingZeros(iy, true)) {
            this.addCommand(['output', `小数の右がわにある、いらないゼロを消します。`]);
            this.fixTrailingZeros(iy, false);
            this.addCommand(['step']);
        }
        return this.readRowNumber(iy, ignoreDot);
    }
    // 描画
    draw() {
        if (!this.ready) {
            if (this.autoPlay)
                this.timerId = setInterval(this.nextCommand.bind(this), this.stepInterval);
            this.ready = true;
        }
        if (this.paper.canvas.width && this.paper.canvas.height) {
            const ctx = this.canvas.getContext('2d');
            this.canvas.width = this.paper.canvas.width;
            this.canvas.height = this.paper.canvas.height;
            ctx.fillStyle = "yellow";
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.drawImage(this.paper.canvas, 0, 0);
        }
        this.anime = window.requestAnimationFrame(this.draw.bind(this));
    }
    // 座標変換
    convert(ix, iy) {
        let x = ix * this.columnWidth, y = iy * this.rowHeight;
        return { x, y };
    }
    convert2(ix, iy, origin_iy) {
        let x = ix * this.columnWidth;
        let y = origin_iy * this.rowHeight + (iy + 1) * this.rowHeight / 3;
        return { x, y };
    }
    convert3(ix, iy) {
        let x = ix * this.textCharWidth, y = iy * this.rowHeight;
        return { x, y };
    }
    // 数字や記号を描画
    drawDigit(ix, iy, digit, is_red = false) {
        if (digit === ' ')
            return;
        let { x: x0, y: y0 } = this.convert(ix, iy);
        let prefix = (is_red ? 'red-' : '');
        let img = digitInfo[prefix + digit].img;
        this.paper.drawImage(img, x0, y0);
    }
    // テキストを描画(左右中央そろえ)
    drawCenterText(y, text, is_red = false) {
        let prefix = (is_red ? 'red-' : '');
        let cx = this.paper.cx;
        let textWidth = this.getTextWidth(text);
        let x = this.paper.originX + (cx - textWidth) / 2;
        for (let ich = 0; ich < text.length; ++ich) {
            let digit = text[ich];
            if (digit !== ' ') {
                let img = digitInfo[prefix + digit].img;
                this.paper.drawImage(img, x, y);
            }
            x += this.textCharWidth;
        }
    }
    // テキストの幅を返す
    getTextWidth(text) {
        return text.length * this.textCharWidth;
    }
    // 割り算の曲線を描画
    drawDivCurve(ix, iy, is_red = false) {
        let { x: x0, y: y0 } = this.convert(ix, iy);
        let prefix = (is_red ? 'red-' : '');
        let img = digitInfo[prefix + ')'].img;
        this.paper.drawImage(img, x0, y0 - img.height * 0.15, img.width, img.height * 1.3);
    }
    // 数字や記号をバックスラッシュで打ち消す
    backslashDigit(ix, iy, is_red = false) {
        is_red = true;
        let digit = '\\';
        let { x: x0, y: y0 } = this.convert(ix, iy);
        let prefix = (is_red ? 'red-' : '');
        let img = digitInfo[prefix + digit].img;
        this.paper.drawImage(img, x0, y0);
    }
    // 繰り上がりを描画
    drawCarry(ix, iy, text, is_red = false) {
        let { x: x0, y: y0 } = this.convert(ix, iy);
        let prefix = (is_red ? 'red-' : '');
        for (let ch of text) {
            let width = digitInfo[prefix + ch].img.width;
            let height = digitInfo[prefix + ch].img.height;
            let dWidth = width / 3;
            let dHeight = height / 3;
            this.paper.drawImage(digitInfo[prefix + ch].img, x0 - dWidth * text.length / 2, y0, dWidth, dHeight);
            x0 += dWidth;
        }
    }
    // 小さい文字を描画
    drawSmallChars(ix, iy, text, origin_iy = 0, is_red = false) {
        console.log(ix, iy, origin_iy);
        let { x: x0, y: y0 } = this.convert2(ix, iy - origin_iy, origin_iy);
        let prefix = (is_red ? 'red-' : '');
        for (let ch of text) {
            let width = digitInfo[prefix + ch].img.width;
            let height = digitInfo[prefix + ch].img.height;
            let dWidth = width / 3;
            let dHeight = height / 3;
            this.paper.drawImage(digitInfo[prefix + ch].img, x0 + width / 2 - dWidth * text.length / 2, y0 - dHeight, dWidth, dHeight);
            x0 += dWidth;
        }
    }
    // 線を描画する
    drawLine(ix0, iy0, ix1, iy1, is_red = false) {
        let { x: x0, y: y0 } = this.convert(ix0, iy0);
        let { x: x1, y: y1 } = this.convert(ix1, iy1);
        this.paper.lineWidth = LINE_WIDTH;
        this.paper.strokeStyle = is_red ? 'red' : 'black';
        this.paper.line(x0, y0, x1, y1);
    }
    // 横向きの打ち消し線を描画する
    drawStrike(ix0, iy0, ix1, iy1, origin_iy = 0, is_red = false) {
        is_red = true;
        let { x: x0, y: y0 } = this.convert2(ix0, iy0 - origin_iy, origin_iy);
        let { x: x1, y: y1 } = this.convert2(ix1, iy1 - origin_iy, origin_iy);
        x0 += this.columnWidth * 0.2;
        x1 -= this.columnWidth * 0.2;
        y0 -= this.rowHeight * 0.2;
        y1 -= this.rowHeight * 0.2;
        this.paper.lineWidth = LINE_WIDTH;
        this.paper.strokeStyle = is_red ? 'red' : 'black';
        this.paper.line(x0, y0, x1, y1);
    }
    // 小数点を描画する
    drawDot(ix, iy, is_red = false) {
        let { x: x0, y: y0 } = this.convert(ix - 0.1, iy + 0.8);
        this.paper.fillStyle = is_red ? 'red' : 'black';
        this.paper.fillCircle(x0, y0, LINE_WIDTH);
    }
    // 小数点を消す
    slashDot(ix, iy, is_red = false) {
        is_red = true;
        let { x: x0, y: y0 } = this.convert(ix - 0.1 - 0.1, iy + 0.8 - 0.1);
        let { x: x1, y: y1 } = this.convert(ix - 0.1 + 0.1, iy + 0.8 + 0.1);
        this.paper.strokeStyle = is_red ? 'red' : 'black';
        this.paper.line(x0, y0, x1, y1);
    }
    // 単体テスト
    unitTest() { }
}
