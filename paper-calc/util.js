// util.ts --- 便利な定義
// Author: katahiromz
// License: MIT
"use strict";
// 1文字の数字か？
function isDigit(ch) {
    return ch.length == 1 && '0' <= ch && ch <= '9';
}
const digitInfo = {
    '0': { img: null, src: 'img/0.svg' },
    '1': { img: null, src: 'img/1.svg' },
    '2': { img: null, src: 'img/2.svg' },
    '3': { img: null, src: 'img/3.svg' },
    '4': { img: null, src: 'img/4.svg' },
    '5': { img: null, src: 'img/5.svg' },
    '6': { img: null, src: 'img/6.svg' },
    '7': { img: null, src: 'img/7.svg' },
    '8': { img: null, src: 'img/8.svg' },
    '9': { img: null, src: 'img/9.svg' },
    '+': { img: null, src: 'img/plus.svg' },
    '-': { img: null, src: 'img/minus.svg' },
    '×': { img: null, src: 'img/times.svg' },
    '÷': { img: null, src: 'img/div.svg' },
    '=': { img: null, src: 'img/equal.svg' },
    '/': { img: null, src: 'img/slash.svg' },
    '\\': { img: null, src: 'img/backslash.svg' },
    '(': { img: null, src: 'img/paren-left.svg' },
    ')': { img: null, src: 'img/paren-right.svg' },
    '.': { img: null, src: 'img/dot.svg' },
    '…': { img: null, src: 'img/cdots.svg' },
    'red-0': { img: null, src: 'img/red-0.svg' },
    'red-1': { img: null, src: 'img/red-1.svg' },
    'red-2': { img: null, src: 'img/red-2.svg' },
    'red-3': { img: null, src: 'img/red-3.svg' },
    'red-4': { img: null, src: 'img/red-4.svg' },
    'red-5': { img: null, src: 'img/red-5.svg' },
    'red-6': { img: null, src: 'img/red-6.svg' },
    'red-7': { img: null, src: 'img/red-7.svg' },
    'red-8': { img: null, src: 'img/red-8.svg' },
    'red-9': { img: null, src: 'img/red-9.svg' },
    'red-+': { img: null, src: 'img/red-plus.svg' },
    'red--': { img: null, src: 'img/red-minus.svg' },
    'red-×': { img: null, src: 'img/red-times.svg' },
    'red-÷': { img: null, src: 'img/red-div.svg' },
    'red-=': { img: null, src: 'img/red-equal.svg' },
    'red-/': { img: null, src: 'img/red-slash.svg' },
    'red-\\': { img: null, src: 'img/red-backslash.svg' },
    'red-(': { img: null, src: 'img/red-paren-left.svg' },
    'red-)': { img: null, src: 'img/red-paren-right.svg' },
    'red-.': { img: null, src: 'img/red-dot.svg' },
    'red-…': { img: null, src: 'img/red-cdots.svg' },
};
// 画像を読み込む
function loadImage(key) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load ${digitInfo[key].src}`));
        img.src = digitInfo[key].src;
        digitInfo[key].img = img;
    });
}
const replaceJapaneseNumericChars = (numStr) => {
    numStr = numStr.replaceAll('　', ' '); // U+3000
    numStr = numStr.replaceAll('０', '0');
    numStr = numStr.replaceAll('１', '1');
    numStr = numStr.replaceAll('２', '2');
    numStr = numStr.replaceAll('３', '3');
    numStr = numStr.replaceAll('４', '4');
    numStr = numStr.replaceAll('５', '5');
    numStr = numStr.replaceAll('６', '6');
    numStr = numStr.replaceAll('７', '7');
    numStr = numStr.replaceAll('８', '8');
    numStr = numStr.replaceAll('９', '9');
    numStr = numStr.replaceAll('．', '.');
    // カンマをドットのように扱う文化圏や、カンマとドットの混同があるので念のため
    numStr = numStr.replaceAll('，', '.');
    numStr = numStr.replaceAll(',', '.');
    // 日本語入力システム(IME)を通すと、ドットが句点（。）になる場合があるので念のため
    numStr = numStr.replaceAll('。', '.');
    numStr = numStr.replaceAll('｡', '.');
    return numStr;
};
// 数値の情報
const getNumberInfo = (numStr) => {
    console.assert(typeof numStr === 'string');
    numStr = numStr.trim();
    numStr = replaceJapaneseNumericChars(numStr);
    numStr = numStr.replaceAll(' ', '');
    const found = numStr.match(/^0*(\d+)(\.\d*?)?0*$/);
    if (numStr === '' || found === null) {
        console.log("不正な数値文字列です: " + numStr);
        return null;
    }
    let integer = found[1].toString();
    if (integer === '')
        integer = '0';
    let fraction = found[2] ? found[2].substr(1) : '';
    let numeric = parseInt(numStr);
    return { numeric, numStr, integer, int_len: integer.length, fraction, frac_len: fraction.length };
};
// 数値文字列の整形。今回は筆算なので、符号付きの数値は扱わない。
const normalizeUnsignedNumber = (numStr) => {
    console.assert(typeof numStr === 'string');
    numStr = replaceJapaneseNumericChars(numStr);
    numStr = numStr.replaceAll(' ', '');
    while (numStr.startsWith('0'))
        numStr = numStr.substr(1, numStr.length - 1);
    if (numStr.startsWith('.'))
        numStr = '0' + numStr;
    if (numStr.indexOf('.') >= 0) {
        while (numStr.endsWith('0'))
            numStr = numStr.substr(0, numStr.length - 1);
    }
    if (numStr.endsWith('.'))
        numStr = numStr.substr(0, numStr.length - 1);
    if (numStr.startsWith('.'))
        numStr = '0' + numStr;
    if (numStr.length == 0)
        numStr = '0';
    return numStr;
};
// normalizeUnsignedNumber関数のテストエントリ
const normalizeUnsignedNumberTestEntry = (numStr, trueAnswer) => {
    let answer = normalizeUnsignedNumber(numStr);
    if (answer === trueAnswer)
        return true;
    console.log(`${answer} !== ${trueAnswer}`);
    return false;
};
// normalizeUnsignedNumber関数の単体テスト
const normalizeUnsignedNumberUnitTest = () => {
    console.assert(normalizeUnsignedNumberTestEntry('', '0'));
    console.assert(normalizeUnsignedNumberTestEntry('0', '0'));
    console.assert(normalizeUnsignedNumberTestEntry('0.', '0'));
    console.assert(normalizeUnsignedNumberTestEntry('0.0', '0'));
    console.assert(normalizeUnsignedNumberTestEntry('0.01', '0.01'));
    console.assert(normalizeUnsignedNumberTestEntry('0.010', '0.01'));
    console.assert(normalizeUnsignedNumberTestEntry('10', '10'));
    console.assert(normalizeUnsignedNumberTestEntry('10.', '10'));
    console.assert(normalizeUnsignedNumberTestEntry('10.1', '10.1'));
    console.assert(normalizeUnsignedNumberTestEntry('10.10', '10.1'));
    console.assert(normalizeUnsignedNumberTestEntry('10.100', '10.1'));
    console.assert(normalizeUnsignedNumberTestEntry('000100', '100'));
    console.assert(normalizeUnsignedNumberTestEntry('000100.1', '100.1'));
    console.assert(normalizeUnsignedNumberTestEntry('123456789.0', '123456789'));
    console.assert(normalizeUnsignedNumberTestEntry('0000000000000000000.000', '0'));
    console.assert(normalizeUnsignedNumberTestEntry('10000000000000000000000.000', '10000000000000000000000'));
    console.assert(normalizeUnsignedNumberTestEntry('０', '0'));
    console.assert(normalizeUnsignedNumberTestEntry('０．', '0'));
    console.assert(normalizeUnsignedNumberTestEntry('０．０', '0'));
    console.assert(normalizeUnsignedNumberTestEntry('０．０１', '0.01'));
    console.assert(normalizeUnsignedNumberTestEntry('０．０１０', '0.01'));
    console.assert(normalizeUnsignedNumberTestEntry('１２３４５６７８９．０１０', '123456789.01'));
};
normalizeUnsignedNumberUnitTest();
// 特殊文字を置き換える
function htmlspecialchars(str) {
    return (str + '').replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
/**
 * 文字列として表現された2つの正の数 a, b を比較する
 * @return {number} a > b なら 1, a < b なら -1, 等しければ 0
 */
function comparePositiveNumbers(a, b) {
    // 正規化（前後の余計な0を取り除く）
    const normA = normalizeUnsignedNumber(a);
    const normB = normalizeUnsignedNumber(b);
    const partsA = normA.split('.');
    const partsB = normB.split('.');
    const intA = partsA[0];
    const intB = partsB[0];
    const fracA = partsA[1] || "";
    const fracB = partsB[1] || "";
    // 1. 整数部の桁数で比較
    if (intA.length > intB.length)
        return 1;
    if (intA.length < intB.length)
        return -1;
    // 2. 整数部の値（文字列の辞書順）で比較
    if (intA > intB)
        return 1;
    if (intA < intB)
        return -1;
    // 3. 小数部を比較（短い方に0を詰めて長さを合わせる）
    const maxFracLen = Math.max(fracA.length, fracB.length);
    const paddedFracA = fracA.padEnd(maxFracLen, '0');
    const paddedFracB = fracB.padEnd(maxFracLen, '0');
    if (paddedFracA > paddedFracB)
        return 1;
    if (paddedFracA < paddedFracB)
        return -1;
    return 0;
}
