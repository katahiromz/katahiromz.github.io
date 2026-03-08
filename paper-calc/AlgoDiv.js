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
        // 1. 小数点の調整（除数を整数にする）―― 計算値を求める
        const bFracLen = this.getFracLen(b);
        const aFracLen = this.getFracLen(a);
        // workB: bの小数点を除去して整数文字列化（誤差なし）
        const workB = bFracLen > 0 ? b.replace('.', '').replace(/^0+/, '') || '0' : b;
        const bVal = BigInt(workB);
        // workA: aの小数点をbFracLen桁右にずらした文字列（aDigits・aDotIdx算出用）
        let workA = a;
        if (bFracLen > 0) {
            let rawA = a.replace('.', '');
            let newDotPos = (a.includes('.') ? a.indexOf('.') : a.length) + bFracLen;
            while (rawA.length < newDotPos)
                rawA += '0';
            workA = newDotPos < rawA.length
                ? rawA.substring(0, newDotPos) + '.' + rawA.substring(newDotPos)
                : rawA;
            workA = workA.replace(/^0+/, '') || '0';
            if (workA.startsWith('.'))
                workA = '0' + workA;
        }
        const aDigits = workA.replace('.', '');
        const aDotIdx = workA.includes('.') ? workA.indexOf('.') : workA.length;
        // 2. 割られる数(A)と割る数(B)を元の値でそのまま配置する
        this.addCommand(['output', `わられる数 ${a} とわる数 ${b} を図のように書いてください。`]);
        // 除数(B)を元の値で配置
        this.autoPutDigitsEx(b, origin_iy + 1);
        const bMaxX = this.max_x(origin_iy + 1);
        const aStartIx = bMaxX + 2;
        // 被除数(A)を元の値で配置（小数点含む）
        const aRaw = a.replace('.', '');
        const aOrigDotIdx = a.includes('.') ? a.indexOf('.') : a.length;
        for (let i = 0; i < aRaw.length; i++) {
            this.addCommand(['drawDigit', aStartIx + i, origin_iy + 1, aRaw[i]]);
            this.setMapDigit(aStartIx + i, origin_iy + 1, aRaw[i]);
        }
        if (a.includes('.')) {
            this.addCommand(['drawDot', aStartIx + aOrigDotIdx, origin_iy + 1]);
            this.setMapDot(aStartIx + aOrigDotIdx, origin_iy + 1);
        }
        this.addCommand(['step']);
        const extraDigits = parseInt(c) || 0; // 仕様A: 小数点以下ちょうど c 桁
        const totalDigits = Math.min(aDotIdx, aDigits.length) + extraDigits;
        this.addCommand(['output', `図のように線を描いてください。`]);
        this.addCommand(['drawDivCurve', aStartIx - 1, origin_iy + 1]);
        this.addCommand(['drawLine', aStartIx - 0.7, origin_iy + 1, aStartIx + aDigits.length + extraDigits, origin_iy + 1]);
        this.addCommand(['step']);
        // 3. 小数点がある場合、slashDotで消す演出をする
        if (bFracLen > 0) {
            this.addCommand(['output', `わる数 ${b} を整数にするため、小数点を ${bFracLen} 桁右に動かします。`]);
            this.addCommand(['output', `わられる数 ${a} も同じだけ小数点を動かします。`]);
            // 除数(B)の小数点を消す
            // autoPutDigitsExはBの小数点を -bFracLen に置き、bMaxX = -1 なので
            // 小数点のix = bMaxX - bFracLen + 1
            this.addCommand(['slashDot', bMaxX - bFracLen + 1, origin_iy + 1]);
            this.clearMapDot(origin_iy + 1);
            // 被除数(A)の小数点を消す
            const extraZeros = bFracLen - aFracLen;
            if (a.includes('.')) {
                this.addCommand(['slashDot', aStartIx + aOrigDotIdx, origin_iy + 1]);
                this.clearMapDot(origin_iy + 1);
            }
            else if (extraZeros > 0) {
                this.addCommand(['drawDot', aStartIx + aOrigDotIdx, origin_iy + 1]);
                this.addCommand(['slashDot', aStartIx + aOrigDotIdx, origin_iy + 1]);
            }
            // 新しい小数点をAに描画する（シフト後も小数点が残る場合）
            if (aDotIdx < aDigits.length) {
                this.addCommand(['output', `小数点を ${bFracLen} 桁右に動かします。`]);
                this.addCommand(['drawDot', aStartIx + aDotIdx, origin_iy + 1]);
                this.setMapDot(aStartIx + aDotIdx, origin_iy + 1);
            }
            // bFracLen > aFracLen のとき、桁数を合わせるため被除数の右側に赤色の0を追加する
            if (extraZeros > 0) {
                this.addCommand(['output', `小数点の桁(けた)を合わせるため、わられる数の右がわに 0 をかきたします。`]);
                for (let i = 0; i < extraZeros; i++) {
                    this.addCommand(['drawDigit', aStartIx + aRaw.length + i, origin_iy + 1, '0', true]); // 赤色
                    this.setMapDigit(aStartIx + aRaw.length + i, origin_iy + 1, '0');
                }
            }
            this.addCommand(['step']);
        }
        // 4. 割り算のメインループ
        let currentVal = 0n;
        let iy = origin_iy + 1;
        let isFirstDigit = true;
        let lastRemIy = null; // 最後の余り行のiy
        let lastRemIx = null; // 最後の余り行の右端ix（ループ時のix）
        let quotientDotDrawn = false;
        // --- 商は i(処理回数)ベースで記録する（答え文字列生成用） ---
        const quotientDigits = new Array(totalDigits).fill(null); // '0'..'9' or null
        // 商の小数点位置（i基準。dotPos の前に '.' を入れる）
        const dotPos = aDotIdx < aDigits.length ? aDotIdx
            : extraDigits > 0 ? aDigits.length
                : null;
        const putQuotientDigit = (i, ix, digitChar) => {
            this.addCommand(['drawDigit', ix, origin_iy, digitChar]);
            this.setMapDigit(ix, origin_iy, digitChar);
            quotientDigits[i] = digitChar;
        };
        const putQuotientDotIfNeeded = () => {
            if (dotPos === null || quotientDotDrawn)
                return;
            const dotIx = aStartIx + dotPos;
            this.addCommand(['drawDot', dotIx, origin_iy]);
            this.setMapDot(dotIx, origin_iy);
            quotientDotDrawn = true;
            this.addCommand(['step']);
        };
        for (let i = 0; i < totalDigits; i++) {
            const ix = aStartIx + i;
            const digitChar = (i < aDigits.length) ? aDigits[i] : '0';
            const digit = parseInt(digitChar);
            currentVal = currentVal * 10n + BigInt(digit);
            // 数字を下ろす処理
            if (i > 0 && iy != origin_iy + 1) {
                if (i < aDigits.length) {
                    this.addCommand(['output', `右の桁(けた)から ${digit} を下ろします。`]);
                    this.addCommand(['drawDigit', ix, iy, digitChar]);
                    this.setMapDigit(ix, iy, digitChar);
                }
                else {
                    this.addCommand(['output', `あまりの右に 0 を書いて計算を続けます。`]);
                    this.addCommand(['drawDigit', ix, iy, '0']);
                    this.setMapDigit(ix, iy, '0');
                }
                this.addCommand(['step']);
            }
            // 商の小数点描画（必要な位置で描く）
            if (!quotientDotDrawn && dotPos !== null && i === dotPos) {
                putQuotientDotIfNeeded();
            }
            if (currentVal >= bVal) {
                const q = Number(currentVal / bVal);
                const qChar = q.toString();
                const productBig = BigInt(q) * bVal;
                // autoDigitMul は「1桁×多桁」なので q は 0..9 のはず
                console.assert(qChar.length === 1);
                this.addCommand(['output', `${currentVal} の中に ${bVal} は ${q} 個あります。`]);
                // 商をセット
                putQuotientDigit(i, ix, qChar);
                isFirstDigit = false;
                // 掛け算
                iy++;
                this.addCommand(['output', `商の ${q} とわる数 ${bVal} をかけます。`]);
                this.autoDigitMul(workB, qChar, ix, iy);
                // 引き算の線
                this.addCommand(['output', `下に、ひき算の線を描きます。`]);
                this.addCommand(['drawLine', ix - productBig.toString().length + 1, iy + 1, aStartIx + Math.max(totalDigits, i + 1), iy + 1]);
                this.addCommand(['step']);
                // 引き算の結果（あまり）
                iy++;
                const remainder = currentVal - productBig;
                const remStr = remainder.toString();
                this.addCommand(['output', `${currentVal} から、かけ算の答え ${productBig} を引きます。`]);
                for (let j = remStr.length - 1; j >= 0; --j) {
                    const targetIx = ix - (remStr.length - 1 - j);
                    this.addCommand(['drawDigit', targetIx, iy, remStr[j]]);
                    this.setMapDigit(targetIx, iy, remStr[j]);
                    this.addCommand(['step']);
                }
                this.addCommand(['output', `${currentVal} 引く ${productBig} で ${remainder} あまりました。`]);
                this.addCommand(['step']);
                lastRemIy = iy;
                lastRemIx = ix;
                // --- 重要: remainder を次のループの currentVal に反映 ---
                currentVal = remainder;
                // currentVal が 0 になっても、被除数(aDigits)の残り桁がある間は打ち切らない
                if (currentVal === 0n && extraDigits > 0 && i >= aDigits.length) {
                    break;
                }
            }
            else {
                // 0 を商に書くかどうかの条件は元コード踏襲
                if (!isFirstDigit || i >= aDotIdx - 1) {
                    putQuotientDigit(i, ix, '0');
                    if (isFirstDigit)
                        isFirstDigit = false;
                }
            }
        }
        // 商の小数点の処理（まだ描かれていない場合）
        if (!quotientDotDrawn) {
            putQuotientDotIfNeeded();
        }
        // --- 商文字列を quotientDigits + dotPos から構築する ---
        // 商の表示開始位置（整数部の先頭の不要な0を避ける）
        let first = 0;
        for (let i = 0; i < totalDigits; i++) {
            if (quotientDigits[i] !== null) {
                first = i;
                break;
            }
            if (i === totalDigits - 1)
                first = totalDigits - 1;
        }
        // dot があるなら、dotの左に最低1桁必要
        if (dotPos !== null)
            first = Math.min(first, Math.max(0, dotPos - 1));
        // null は「その桁は書かなかった」だが、答えとしては 0 扱いにする
        const filled = quotientDigits.map(d => (d === null ? '0' : d));
        let quotient;
        if (dotPos === null || dotPos >= totalDigits) {
            quotient = filled.slice(first).join('').replace(/^0+(?=\d)/, '') || '0';
        }
        else {
            // 整数部（dotより左）
            const intPart = (filled.slice(first, dotPos).join('').replace(/^0+(?=\d)/, '') || '0');
            // 小数部（dotより右）は仕様Aで必ず extraDigits 桁
            const fracPart = filled.slice(dotPos, dotPos + extraDigits).join('').padEnd(extraDigits, '0');
            quotient = `${intPart}.${fracPart}`;
        }
        // 指定桁(c)で打ち切った際に被除数(aDigits)にまだ処理していない桁がある場合、
        // 余りを確定するため残りの桁を全部下ろしてから小数点を描画する
        // （currentVal が 0 でも、未処理桁がある場合は余りを構成するため条件から除外）
        let remainderDotFixed = false;
        let elseIfExtraLen = 0; // else if ブランチで蓄積した追加桁数（remScale補正用）
        if (lastRemIy !== null && totalDigits < aDigits.length) {
            this.addCommand(['output', `ここで計算を打ち切ります。あまりをぜんぶ下ろします。`]);
            for (let j = totalDigits; j < aDigits.length; j++) {
                const digitChar = aDigits[j];
                const ix = aStartIx + j;
                currentVal = currentVal * 10n + BigInt(digitChar);
                this.addCommand(['drawDigit', ix, lastRemIy, digitChar]);
                this.setMapDigit(ix, lastRemIy, digitChar);
            }
            this.addCommand(['step']);
            // 余りの行に小数点を描画する（被除数の小数点位置と同じ列）
            if (aDotIdx < aDigits.length) {
                // 小数点位置と打ち切り位置の間に空欄がある場合、0 を埋める（readRowNumber の桁抜けを防ぐ）
                for (let j = aDotIdx; j < totalDigits; j++) {
                    const fillIx = aStartIx + j;
                    if (this.getMapDigit(fillIx, lastRemIy) === undefined) {
                        this.addCommand(['drawDigit', fillIx, lastRemIy, '0']);
                        this.setMapDigit(fillIx, lastRemIy, '0');
                    }
                }
                const dotIx = aStartIx + aDotIdx;
                this.addCommand(['drawDot', dotIx, lastRemIy]);
                this.setMapDot(dotIx, lastRemIy);
                this.addCommand(['step']);
            }
            remainderDotFixed = true;
        }
        else if (lastRemIy === null && totalDigits < aDigits.length) {
            // 商がすべて 0 で割り算ステップが発生せず、かつ未処理の桁がある場合：
            // あまりとして被除数全体を新しい行に表示する
            iy++;
            this.addCommand(['output', `ここで計算を打ち切ります。あまりをぜんぶ下ろします。`]);
            // 処理済みの先頭 totalDigits 桁と残りの桁をまとめて描画する
            for (let j = 0; j < aDigits.length; j++) {
                this.addCommand(['drawDigit', aStartIx + j, iy, aDigits[j]]);
                this.setMapDigit(aStartIx + j, iy, aDigits[j]);
            }
            this.addCommand(['step']);
            // 小数点を描画する
            if (aDotIdx < aDigits.length) {
                const dotIx = aStartIx + aDotIdx;
                this.addCommand(['drawDot', dotIx, iy]);
                this.setMapDot(dotIx, iy);
                this.addCommand(['step']);
            }
            // 余りを BigInt で正確に求めるため、未処理の桁を currentVal に蓄積し
            // remScale の補正量として elseIfExtraLen に記録する
            for (let j = totalDigits; j < aDigits.length; j++) {
                currentVal = currentVal * 10n + BigInt(aDigits[j]);
            }
            elseIfExtraLen = aDigits.length - totalDigits;
            lastRemIy = iy;
            remainderDotFixed = true;
        }
        // あまり（表示用に元スケールへ戻す）
        // 条件: 除数が小数(bFracLen>0)かつ余りが非ゼロかつ余り行が描画済みで、
        //       extraDigits==0 の場合のみ（extraDigits>0 は後述の BigInt 計算で処理）
        if (bFracLen > 0 && extraDigits === 0 && currentVal > 0n && lastRemIy !== null && !remainderDotFixed) {
            // dotIx: 余り R の小数点位置は、右端(lastRemIx)から bFracLen 桁分左
            // 例: bFracLen=2, R=5 → 小数部2桁('05')が右端から並ぶ → dotIx = lastRemIx - bFracLen
            const dotIx = lastRemIx - bFracLen;
            this.addCommand(['drawDot', dotIx, lastRemIy]);
            this.setMapDot(dotIx, lastRemIy);
            this.addCommand(['step']);
        }
        // 条件: 除数が整数(bFracLen===0)かつ小数桁指定あり(extraDigits>0)かつ余りが非ゼロかつ余り行が描画済み
        // この場合、余りの数値はextraDigits桁分スケールアップされた状態で描かれているため、
        // 商の小数点位置(dotPos)に小数点を追加して元のスケールに戻す
        const shouldAddDecimalPointToRemainder = extraDigits > 0 && bFracLen === 0 && dotPos !== null &&
            currentVal > 0n && lastRemIy !== null && !remainderDotFixed;
        if (shouldAddDecimalPointToRemainder) {
            const dotIx = aStartIx + dotPos;
            this.addCommand(['drawDot', dotIx, lastRemIy]);
            this.setMapDot(dotIx, lastRemIy);
            this.addCommand(['step']);
        }
        // bFracLen>0 かつ extraDigits>0 の場合、ループ後の currentVal は
        // 最後に商が立った余りからさらに (totalDigits - lastQuotientI - 1) 回 ×10 されている。
        // 余り行の描画内容は途中経過のものなので、BigInt から正確な余りを再計算して
        // 余り行を上書き描画し直す。
        // スケール: currentVal = 実際の余り × 10^(bFracLen + extraDigits)
        // workA = a×10^bFracLen, bVal = b×10^bFracLen で割り算を行い、
        // さらに extraDigits 桁分の小数を処理したため、
        // スケールは 10^(bFracLen + extraDigits) となる。
        if (bFracLen > 0 && extraDigits > 0 && currentVal > 0n && lastRemIy !== null && !remainderDotFixed) {
            // 正しいスケール: currentVal = 実際の余り × 10^(bFracLen + extraDigits)
            const remScale = bFracLen + extraDigits;
            // BigInt で正確な余りを文字列化
            let remPower = 1n;
            for (let i = 0; i < remScale; ++i)
                remPower *= 10n;
            const remWhole = currentVal / remPower;
            const remFrac = currentVal % remPower;
            let remStr;
            if (remFrac === 0n) {
                remStr = remWhole.toString();
            }
            else {
                const fracStr = remFrac.toString().padStart(remScale, '0').replace(/0+$/, '');
                remStr = `${remWhole}.${fracStr}`;
            }
            // 余り行を remStr で上書き描画する
            this.addCommand(['output', `あまりを元のスケールに直します。`]);
            // 既存の余り行をクリアして remStr を再描画
            const remDigits = remStr.replace('.', '');
            const remDotIdx = remStr.includes('.') ? remStr.indexOf('.') : remStr.length;
            // 余り行の右端 ix を基準に左から描画（右揃え）
            const remStartIx = lastRemIx - remDigits.length + 1;
            for (let j = 0; j < remDigits.length; j++) {
                const tIx = remStartIx + j;
                this.addCommand(['drawDigit', tIx, lastRemIy, remDigits[j]]);
                this.setMapDigit(tIx, lastRemIy, remDigits[j]);
            }
            if (remStr.includes('.')) {
                const dotIx = remStartIx + remDotIdx;
                this.addCommand(['drawDot', dotIx, lastRemIy]);
                this.setMapDot(dotIx, lastRemIy);
            }
            this.addCommand(['step']);
        }
        // 浮動小数点誤差を避けるため、あまりは BigInt から文字列化する
        // 特に b が小数(bFracLen>0)のときは、最後まで「整数化されたスケール」の currentVal を持っているため、
        // 余り行の表示(map)を読まず、必ずスケール補正して元の値に戻す。
        let finalRemainderStr;
        if (bFracLen > 0) {
            // currentVal = 実際の余り × 10^(bFracLen + extraDigits + elseIfExtraLen)
            const remScale = bFracLen + extraDigits + elseIfExtraLen;
            let remPower = 1n;
            for (let i = 0; i < remScale; ++i)
                remPower *= 10n;
            const remWhole = currentVal / remPower;
            const remFrac = currentVal % remPower;
            if (remFrac === 0n) {
                finalRemainderStr = remWhole.toString();
            }
            else {
                const fracStr = remFrac.toString().padStart(remScale, '0').replace(/0+$/, '');
                finalRemainderStr = `${remWhole}.${fracStr}`;
            }
        }
        else if (lastRemIy !== null) {
            // b が整数のときは、余り行(map)から読み取った値でよい
            finalRemainderStr = this.fixAndReadRowNumber(lastRemIy);
        }
        else {
            finalRemainderStr = currentVal.toString();
        }
        let answer;
        if (finalRemainderStr === '' || finalRemainderStr === '0') {
            answer = quotient;
            this.addCommand(['output', `こたえは ${quotient} です。あまりはありません。`]);
        }
        else {
            answer = `${quotient} … ${finalRemainderStr}`;
            this.addCommand(['output', `商は ${quotient} 、あまりは ${finalRemainderStr} です。`]);
        }
        this.answer = answer;
        {
            const text = `${a} ÷ ${b} = ${answer}`;
            const { x, y } = this.convert3(0, iy + 2);
            this.addCommand(['drawCenterText', y, text]);
        }
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
        console.assert(this.testEntryEx('10', '40', '0.25', "2"));
        console.assert(this.testEntryEx('10', '40', '0.250', "3"));
        console.assert(this.testEntryEx('10', '40', '0.2 … 2', "1"));
        console.assert(this.testEntryEx('0.1', '0.4', '0.2 … 0.02', "1"));
        console.assert(this.testEntryEx('0.1', '2', '0.0500', '4'));
        console.assert(this.testEntryEx('999', '0.1', '9990', '0'));
        console.assert(this.testEntryEx('999', '0.1', '9990.00', '2'));
        console.assert(this.testEntryEx('99999999999999999999', '99999999999999999999', '1.0', '1'));
        console.assert(this.testEntryEx('99.90', '990.0', '0 … 99.9', '0'));
        console.assert(this.testEntryEx('123.55', '789', '0.1 … 44.65', '1'));
        console.assert(this.testEntryEx('12.345', '1', '12.34 … 0.005', '2'));
        console.assert(this.testEntryEx('12.355', '789', '0.0 … 12.355', '1'));
        console.assert(this.testEntryEx('12.355', '78', '0.1 … 4.555', '1'));
        console.assert(this.testEntryEx('12.355', '7', '1.7 … 0.455', '1'));
        console.assert(this.testEntryEx('12345', '67', '184.25 … 0.25', '2'));
        console.assert(this.testEntryEx('7.955', '7.89', '1.00 … 0.065', '2'));
        console.assert(this.testEntryEx('0.3', '0.25', '1 … 0.05'));
        console.assert(this.testEntryEx('1.3', '0.25', '5 … 0.05'));
        console.assert(this.testEntryEx('0.01', '0.1', '0 … 0.01'));
        console.assert(this.testEntryEx('0.25', '0.3', '0 … 0.25'));
        console.assert(this.testEntryEx('1', '0.3', '3.3 … 0.01', '1'));
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
        this.reset();
    }
}
