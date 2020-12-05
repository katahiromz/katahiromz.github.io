'use strict'; // 厳密にする。

//////////////////////////////////////////////////////////////////////////////
// 拡張

// ダイアログでEnterキーを有効にする。
// See https://stackoverflow.com/questions/868889/submit-jquery-ui-dialog-on-enter
$(function() {
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
});

//////////////////////////////////////////////////////////////////////////////
// グローバル変数

const 製品名 = "新技術情報入力システム(港湾版)";
$(function() {
	$(".製品名").text(製品名);
});
const 製品内部名 = "港湾版";
const 分類データファイル = "港湾分類.json";
const 整備局事務所データファイル = "港湾整備局事務所.json";
const ローカルストレージ名 = "NETIS港湾新技術";

const JSONファイル最大サイズ = 2 * 1024 * 1024; // 2 MB
const 画像ファイル最大サイズ = 189440; // 185 KB
const 画像最大横幅 = 600;
const 画像最大高さ = 10000;

var 概要表_データ = 表計算初期化データ();
var 新規性と効果表_データ = 表計算初期化データ();
var 費用内訳書表_データ = 費用内訳書表初期化データ();
var 施工方法表_データ = 表計算初期化データ();
var 実験等実施状況表_データ = 表計算初期化データ();
var 問合せその他表_データ = [];
var 新技術内訳表_データ = [];
var 従来技術内訳表_データ = [];
var 国土交通省実績表_データ = [];
var 国土交通省以外実績表_データ = [];
var 証明項目表_データ = [];

function 表IDから表データを取得(表ID) {
	switch (表ID) {
	case "概要表": return 概要表_データ;
	case "新規性と効果表": return 新規性と効果表_データ;
	case "費用内訳書表": return 費用内訳書表_データ;
	case "施工方法表": return 施工方法表_データ;
	case "実験等実施状況表": return 実験等実施状況表_データ;
	case "問合せその他表": return 問合せその他表_データ;
	case "新技術内訳表": return 新技術内訳表_データ;
	case "従来技術内訳表": return 従来技術内訳表_データ;
	case "国土交通省実績表": return 国土交通省実績表_データ;
	case "国土交通省以外実績表": return 国土交通省以外実績表_データ;
	case "証明項目表": return 証明項目表_データ;
	}
	return "";
}

//////////////////////////////////////////////////////////////////////////////
// データ関連

function 小数第3位で四捨五入(value) {
	return Number(value).toFixed(2);
}

function HTMLの特殊文字を変換(テキスト) {
	return テキスト.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;");
}

function 改行をBRタグに変換(テキスト) {
	return テキスト.replace(/\n/g, "<br />");
}

function 今日の日付() {
	let d = new Date();
	let yyyy = d.getFullYear();
	let mm = ("00" + (d.getMonth() + 1)).slice(-2);
	let dd = ("00" + d.getDate()).slice(-2);
	let result = yyyy + "." + mm + "." + dd;
	return result;
}

function 無効な画像データ() {
	// img/invalid.gif
	return "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";
}

function コストタイプ詳細(タイプ) {
	switch (タイプ) {
	case "A(I)型": return "損益分岐点型：A(I)";
	case "A(II)型": return "損益分岐点型：A(II)";
	case "B(+)型": return "平行型：B(+)";
	case "B(-)型": return "平行型：B(-)";
	case "C(+)型": return "発散型：C(+)";
	case "C(-)型": return "発散型：C(-)";
	case "D(I)型": return "サイクルコスト型：D(I)";
	case "D(II)型": return "サイクルコスト型：D(II)";
	}
	return "";
}

function 表計算初期化データ() {
	return [
		{"id":"1", "A":"", "B":"", "C":"", "D":"", "E":"", "F":"", "G":"", "H":""},
		{"id":"2", "A":"", "B":"", "C":"", "D":"", "E":"", "F":"", "G":"", "H":""},
		{"id":"3", "A":"", "B":"", "C":"", "D":"", "E":"", "F":"", "G":"", "H":""},
		{"id":"4", "A":"", "B":"", "C":"", "D":"", "E":"", "F":"", "G":"", "H":""},
		{"id":"5", "A":"", "B":"", "C":"", "D":"", "E":"", "F":"", "G":"", "H":""},
		{"id":"6", "A":"", "B":"", "C":"", "D":"", "E":"", "F":"", "G":"", "H":""},
		{"id":"7", "A":"", "B":"", "C":"", "D":"", "E":"", "F":"", "G":"", "H":""},
		{"id":"8", "A":"", "B":"", "C":"", "D":"", "E":"", "F":"", "G":"", "H":""},
	];
}

function 表計算初期化フィールド群() {
	let formatter = function(cell, params, onRendered) {
		onRendered(function(){
			let table = cell.getTable();
			let options = table.options;
			let table_name = options.table_name;
			if (table_name) {
				let row = cell.getRow();
				let rowIndex = row.getIndex();
				let 見出し列数 = $("#" + table_name + "_見出し列数").val();
				let field = cell.getField();
				if (field.charCodeAt(0) - 'A'.charCodeAt(0) < 見出し列数) {
					$(cell.getElement()).addClass("セル見出し");
					return;
				}
				let 見出し行数 = $("#" + table_name + "_見出し行数").val();
				if (rowIndex <= 見出し行数) {
					let cells = row.getCells();
					for (let i in cells) {
						$(cells[i].getElement()).addClass("セル見出し");
					}
				}
			}
		});
		return cell.getValue();
	};
	return [
		{title:"", field:"id", formatter:"rownum", hozAlign:"center", width:20, resizable:false, headerSort:false },
		{title:"A", field:"A", hozAlign:"left", editor:"input", width:150, resizable:false, headerSort:false, formatter:formatter },
		{title:"B", field:"B", hozAlign:"left", editor:"input", width:150, resizable:false, headerSort:false, formatter:formatter },
		{title:"C", field:"C", hozAlign:"left", editor:"input", width:150, resizable:false, headerSort:false, formatter:formatter },
		{title:"D", field:"D", hozAlign:"left", editor:"input", width:150, resizable:false, headerSort:false, formatter:formatter },
		{title:"E", field:"E", hozAlign:"left", editor:"input", width:150, resizable:false, headerSort:false, formatter:formatter },
		{title:"F", field:"F", hozAlign:"left", editor:"input", width:150, resizable:false, headerSort:false, formatter:formatter },
		{title:"G", field:"G", hozAlign:"left", editor:"input", width:150, resizable:false, headerSort:false, formatter:formatter },
		{title:"H", field:"H", hozAlign:"left", editor:"input", width:150, resizable:false, headerSort:false, formatter:formatter },
	];
}

function 費用内訳書表初期化データ() {
	return [
		{"id":"1", "A":"工種", "B":"(事例)", "C":"", "D":"", "E":"", "F":"", "G":"", "H":""},
		{"id":"2", "A":"材料費", "B":"〇〇", "C":"～", "D":"〇〇", "E":"", "F":"", "G":"", "H":""},
		{"id":"3", "A":"施工費", "B":"〇〇", "C":"～", "D":"〇〇", "E":"", "F":"", "G":"", "H":""},
		{"id":"4", "A":"合計", "B":"〇〇", "C":"～", "D":"〇〇", "E":"", "F":"", "G":"", "H":""},
		{"id":"5", "A":"", "B":"", "C":"", "D":"", "E":"", "F":"", "G":"", "H":""},
		{"id":"6", "A":"", "B":"", "C":"", "D":"", "E":"", "F":"", "G":"", "H":""},
		{"id":"7", "A":"", "B":"", "C":"", "D":"", "E":"", "F":"", "G":"", "H":""},
		{"id":"8", "A":"", "B":"", "C":"", "D":"", "E":"", "F":"", "G":"", "H":""},
	];
}

//////////////////////////////////////////////////////////////////////////////
// DOM操作

function 写真クリア(写真ID) {
	$('#' + 写真ID + '_縮小版').prop('src', 無効な画像データ());
	$('.' + 写真ID + '_縮小版').prop('src', 無効な画像データ());
	$('#' + 写真ID + "_ファイル名").val("");
	$('.' + 写真ID + "_ファイル名").html("");
	$('#' + 写真ID + "_タイトル").val("");
	$('.' + 写真ID + "_タイトル").html("");
	$('.' + 写真ID + '_実寸大').prop('src', 無効な画像データ());
}

function 写真設定(写真ID, file, result) {
	if (!result) {
		return;
	}

	let image = new Image();
	image.onload = function() {
		if (image.width > 画像最大横幅) {
			写真クリア(写真ID);
			alert("画像の横幅は" + 画像最大横幅 + "ピクセルまでです。");
			return;
		}
		if (image.height > 画像最大高さ) {
			写真クリア(写真ID);
			alert("画像の高さは" + 画像最大高さ + "ピクセルまでです。");
			return;
		}
	}
	image.src = result;

	// 縮小版
	let 縮小版 = $('#' + 写真ID + '_縮小版');
	縮小版.prop('src', result);

	縮小版 = $('.' + 写真ID + '_縮小版');
	縮小版.prop('src', result);

	// 実寸大
	let 実寸大 = $('.' + 写真ID + '_実寸大');
	実寸大.prop('src', result);

	if (file) {
		// 拡張子
		let 拡張子 = "";
		let i = file.name.lastIndexOf('.');
		if (i >= 0) {
			拡張子 = file.name.slice(i);
		}

		// ファイル名
		$('#' + 写真ID + "_ファイル名").val("ファイル名" + 拡張子);
		$('.' + 写真ID + "_ファイル名").html("ファイル名" + HTMLの特殊文字を変換(拡張子));

		// ファイル名
		$('#' + 写真ID + "_タイトル").val("");
		$('.' + 写真ID + "_タイトル").html("");
	}
}

function 写真ファイル設定(写真ID, file) {
	if (file.size >= 画像ファイル最大サイズ) {
		写真クリア(写真ID);
		alert("ファイルサイズが大きすぎます。");
		return;
	}

	// 画像以外は処理を停止
	switch (file.type) {
	case 'image/jpeg':
	case 'image/png':
	case 'image/gif':
		break;
	default:
		写真クリア(写真ID);
		alert("画像ファイルはJPEG/PNG/GIFのいずれかでなければいけません。");
		return;
	}

	// 画像表示
	let reader = new FileReader();
	reader.onload = function() {
		写真設定(写真ID, file, reader.result);
	}
	reader.readAsDataURL(file);
}

function 写真同期(写真ID) {
	$('#' + 写真ID + "_ボタン").on("change", function() {
		let file = $(this).prop('files')[0];
		写真ファイル設定(写真ID, file);
	});
	let パネル = $('#' + 写真ID + "_パネル");
	if (パネル) {
		パネル.on('dragenter dragover', function(e) {
			e.stopPropagation();
			e.preventDefault();
			$(this).css("border", "4px dotted #f66");
		});
		パネル.on('dragleave', function(e) {
			e.stopPropagation();
			e.preventDefault();
			$(this).css("border", "4px dotted black");
		});
		パネル.on('drop', function(e) {
			$(this).css("border", "4px dotted black");
			file = e.originalEvent.dataTransfer.files[0];
			写真ファイル設定(写真ID, file);
			e.preventDefault();
			e.stopPropagation();
		});
	}
}

function HTMLデータ同期(id) {
	let html = $("#" + id).html();
	$("." + id).html(html);
}

function JSONファイル取り込み(file) {
	if (file.size > JSONファイル最大サイズ) {
		alert("JSONファイルのサイズが大きすぎます。");
		return;
	}
	let reader = new FileReader();
	reader.onload = function(event) {
		try {
			let data = JSON.parse(event.target.result);
			if (data) {
				if (!data['製品名'] || data['製品名'] != 製品名) {
					alert("データの種類が異なります。'" + 製品名 + "' != '" + data['製品名'] + "'");
					return false;
				}
				localStorage.setItem(ローカルストレージ名, JSON.stringify(data));
				location.reload();
			}
		} catch (e) {
			console.log("JSON.parse failed\n");
		}
	};
	try {
		reader.readAsText(file);
	} catch (e) {
		console.log("readAsText failed\n");
	}
}

function 印刷リセット() {
	$(".新技術情報タイトル").text("");
	$("#新技術情報タイトルの印刷").removeClass("非表示");
	$("#名称・分類等の印刷").removeClass("非表示");
	$("#新技術情報見出しの印刷").addClass("非表示");
	$("#概要の印刷").removeClass("非表示");
	$("#従来技術との比較の印刷").removeClass("非表示");
	$("#施工実績等の印刷").removeClass("非表示");
}

function 印刷する() {
	const 印刷プレビュータブ = 4;
	if ($("#メインタブ切り替え").tabs("option", "active") == 印刷プレビュータブ) {
		let index = $("#印刷プレビュータブ切り替え").tabs("option", "active");
		const 一括印刷タブ = 0;
		const 名称分類タブ = 1;
		const 概要タブ = 2;
		const 従来技術との比較タブ = 3;
		const 施工実績タブ = 4;

		switch (index) {
		case 一括印刷タブ:
			$(".新技術情報タイトル").text("");
			$("#新技術情報タイトルの印刷").removeClass("非表示");
			$("#名称・分類等の印刷").removeClass("非表示");
			$("#新技術情報見出しの印刷").addClass("非表示");
			$("#概要の印刷").removeClass("非表示");
			$("#従来技術との比較の印刷").removeClass("非表示");
			$("#施工実績等の印刷").removeClass("非表示");
			window.print();
			berak;
		case 名称分類タブ:
			$(".新技術情報タイトル").text("名称・分類等");
			$("#新技術情報タイトルの印刷").removeClass("非表示");
			$("#名称・分類等の印刷").removeClass("非表示");
			$("#新技術情報見出しの印刷").addClass("非表示");
			$("#概要の印刷").addClass("非表示");
			$("#従来技術との比較の印刷").addClass("非表示");
			$("#施工実績等の印刷").addClass("非表示");
			window.print();
			break;
		case 概要タブ:
			$(".新技術情報タイトル").text("概要");
			$("#新技術情報タイトルの印刷").removeClass("非表示");
			$("#名称・分類等の印刷").addClass("非表示");
			$("#新技術情報見出しの印刷").removeClass("非表示");
			$("#概要の印刷").removeClass("非表示");
			$("#従来技術との比較の印刷").addClass("非表示");
			$("#施工実績等の印刷").addClass("非表示");
			window.print();
			break;
		case 従来技術との比較タブ:
			$(".新技術情報タイトル").text("従来技術との比較");
			$("#新技術情報タイトルの印刷").removeClass("非表示");
			$("#名称・分類等の印刷").addClass("非表示");
			$("#新技術情報見出しの印刷").removeClass("非表示");
			$("#概要の印刷").addClass("非表示");
			$("#従来技術との比較の印刷").removeClass("非表示");
			$("#施工実績等の印刷").addClass("非表示");
			window.print();
			break;
		case 施工実績タブ:
			$(".新技術情報タイトル").text("施工実績等");
			$("#新技術情報タイトルの印刷").removeClass("非表示");
			$("#名称・分類等の印刷").addClass("非表示");
			$("#新技術情報見出しの印刷").removeClass("非表示");
			$("#概要の印刷").addClass("非表示");
			$("#従来技術との比較の印刷").addClass("非表示");
			$("#施工実績等の印刷").removeClass("非表示");
			window.print();
			break;
		default:
			印刷リセット();
			window.print();
			berak;
		}
		印刷リセット();
	} else {
		印刷リセット();
		window.print();
	}
}

function サイクルコスト更新() {
	let タイプ = ラジオ値取得("コストタイプ");
	$(".コストタイプ詳細").text(コストタイプ詳細(タイプ));
	let html = "";
	if (タイプ == "D(I)型" || タイプ == "D(II)型") {
		let new1 = 数値正規化($("#新技術サイクルコスト1年").val());
		let new3 = 数値正規化($("#新技術サイクルコスト3年").val());
		let new5 = 数値正規化($("#新技術サイクルコスト5年").val());
		let new10 = 数値正規化($("#新技術サイクルコスト10年").val());
		let old1 = 数値正規化($("#従来技術サイクルコスト1年").val());
		let old3 = 数値正規化($("#従来技術サイクルコスト3年").val());
		let old5 = 数値正規化($("#従来技術サイクルコスト5年").val());
		let old10 = 数値正規化($("#従来技術サイクルコスト10年").val());
		html += '<table class="印刷プレビュー表内部表">';
		html += '    <tbody>';
		html += '        <tr>';
		html += '            <th></th>';
		html += '            <th>1年</th>';
		html += '            <th>3年</th>';
		html += '            <th>5年</th>';
		html += '            <th>10年</th>';
		html += '        </tr>';
		html += '        <tr>';
		html += '            <th>新技術</th>';
		html += '            <td><div class="右そろえ">' + HTMLの特殊文字を変換(new1) + '</div></td>';
		html += '            <td><div class="右そろえ">' + HTMLの特殊文字を変換(new3) + '</div></td>';
		html += '            <td><div class="右そろえ">' + HTMLの特殊文字を変換(new5) + '</div></td>';
		html += '            <td><div class="右そろえ">' + HTMLの特殊文字を変換(new10) + '</div></td>';
		html += '        </tr>';
		html += '        <tr>';
		html += '            <th>従来技術</th>';
		html += '            <td><div class="右そろえ">' + HTMLの特殊文字を変換(old1) + '</div></td>';
		html += '            <td><div class="右そろえ">' + HTMLの特殊文字を変換(old3) + '</div></td>';
		html += '            <td><div class="右そろえ">' + HTMLの特殊文字を変換(old5) + '</div></td>';
		html += '            <td><div class="右そろえ">' + HTMLの特殊文字を変換(old10) + '</div></td>';
		html += '        </tr>';
		html += '    </tbody>';
		html += '</table>';
	}
	$(".サイクルコスト出力").html(html);
}

function 表計算出力更新(表ID) {
	let 表データ = 表IDから表データを取得(表ID);

	if (!表データ || !表データ.length)
		return;

	let 見出し列数 = $("#" + 表ID + "_見出し列数").val();
	let 見出し行数 = $("#" + 表ID + "_見出し行数").val();

	let 最大列数 = 0, 最大行数 = 0;
	let x, y;
	x = y = 0;
	for (let i in 表データ) {
		x = 0;
		for (let k in 表データ[i]) {
			if (x >= 1 && 表データ[i][k] && 表データ[i][k].trim() != "") {
				最大列数 = Math.max(x, 最大列数);
				最大行数 = Math.max(y, 最大行数);
			}
			x += 1;
		}
		y += 1;
	}

	let html = '<table class="印刷プレビュー表内部表"><tbody>';
	x = y = 0;
	for (let i in 表データ) {
		if (y > 最大行数)
			break;
		html += '<tr>';
		x = 0;
		for (let k in 表データ[i]) {
			if (x >= 1 && x <= 最大列数 && y <= 最大行数) {
				if (x <= 見出し列数 || y < 見出し行数) {
					html += '<th>' + HTMLの特殊文字を変換(表データ[i][k]) + '</th>';
				} else {
					html += '<td>' + HTMLの特殊文字を変換(表データ[i][k]) + '</td>';
				}
			}
			x += 1;
		}
		html += '</tr>';
		y += 1;
	}
	html += '</tbody></table>';

	$("." + 表ID + "_出力").html(html);
}

function 見出し列数行数更新(表ID) {
	$("#" + 表ID + " div.tabulator-cell").removeClass("セル見出し");
	let 列数 = +$("#" + 表ID + "_見出し列数").val();
	let 行数 = +$("#" + 表ID + "_見出し行数").val();
	$("#" + 表ID + " div.tabulator-row:lt(" + 行数 + ") div.tabulator-cell").addClass("セル見出し");
	$("#" + 表ID + " div.tabulator-row").each(function() {
		$(this).children("div.tabulator-cell:lt(" + (列数 + 1) + ")").addClass("セル見出し");
	});
	表計算出力更新(表ID);
}

function 見出し列数行数(表ID) {
	let 表データ = 表IDから表データを取得(表ID);
	$("#" + 表ID + "_見出し列数").bind('keyup mouseup change', function(){
		見出し列数行数更新(表ID);
	});
	$("#" + 表ID + "_見出し行数").bind('keyup mouseup change', function(){
		見出し列数行数更新(表ID);
	});
}

function 文字数カウント(textbox_id) {
	let max_count = $("#" + textbox_id).prop('maxlength');
	if (max_count == -1) {
		console.log("文字数カウント: " + textbox_id);
	}
	$("#" + textbox_id).on('input', function(){
		let text = $("#" + textbox_id).val();
		let len = text.length;
		text = HTMLの特殊文字を変換("( " + len + " / " + max_count + " )");
		if (len >= max_count) {
			$("." + textbox_id + "_文字数").html("<span class=\"赤字 太字\">" + text + "</" + "span>");
		} else {
			$("." + textbox_id + "_文字数").html(text);
		}
	});
}

function 新技術内訳表更新() {
	if ($("#新技術内訳表").jsGrid("option", "data") !== 新技術内訳表_データ) {
		新技術内訳表_データ = $("#新技術内訳表").jsGrid("option", "data");
	}
	if (!新技術内訳表_データ || !新技術内訳表_データ.length) {
		$(".新技術内訳表_出力").html("新技術内訳表はありません。");
		return;
	}
	let html = '';
	html += '<table class="印刷プレビュー表内部表">';
	html += '    <tbody>';
	html += '        <tr>';
	html += '            <th>項目</th>';
	html += '            <th>仕様</th>';
	html += '            <th>数量</th>';
	html += '            <th>単位</th>';
	html += '            <th>単価(円)</th>';
	html += '            <th>金額(円)</th>';
	html += '            <th>適用</th>';
	html += '        </tr>';
	for (let i in 新技術内訳表_データ) {
		let item = 新技術内訳表_データ[i];
		html += '<tr>';
		html += '    <td>' + HTMLの特殊文字を変換(item["項目"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["仕様"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["数量"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["単位"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["単価"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["金額"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["摘要"]) + '</td>';
		html += '</tr>';
	}
	html += '</tbody></table>';
	$(".新技術内訳表_出力").html(html);
}

function 従来技術内訳表更新() {
	if ($("#従来技術内訳表").jsGrid("option", "data") !== 従来技術内訳表_データ) {
		従来技術内訳表_データ = $("#従来技術内訳表").jsGrid("option", "data");
	}
	if (!従来技術内訳表_データ || !従来技術内訳表_データ.length) {
		$(".従来技術内訳表_出力").html("従来技術内訳表はありません。");
		return;
	}
	let html = '';
	html += '<table class="印刷プレビュー表内部表">';
	html += '    <tbody>';
	html += '        <tr>';
	html += '            <th>項目</th>';
	html += '            <th>仕様</th>';
	html += '            <th>数量</th>';
	html += '            <th>単位</th>';
	html += '            <th>単価(円)</th>';
	html += '            <th>金額(円)</th>';
	html += '            <th>適用</th>';
	html += '        </tr>';
	for (let i in 従来技術内訳表_データ) {
		let item = 従来技術内訳表_データ[i];
		html += '<tr>';
		html += '    <td>' + HTMLの特殊文字を変換(item["項目"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["仕様"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["数量"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["単位"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["単価"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["金額"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["摘要"]) + '</td>';
		html += '</tr>';
	}
	html += '</tbody></table>';
	$(".従来技術内訳表_出力").html(html);
}

function 問合せその他表更新() {
	if (!問合せその他表_データ || !問合せその他表_データ.length) {
		$(".問合せその他表_出力").html("問合せその他はありません。");
		return;
	}
	let html = '';
	html += '<table class="印刷プレビュー表内部表">';
	html += '    <tbody>';
	html += '        <tr>';
	html += '            <th>会社</th>';
	html += '            <th>担当部署</th>';
	html += '            <th>担当者</th>';
	html += '            <th>郵便番号</th>';
	html += '            <th>住所</th>';
	html += '            <th>TEL</th>';
	html += '            <th>FAX</th>';
	html += '            <th>E-Mail</th>';
	html += '            <th>URL</th>';
	html += '        </tr>';
	for (let i in 問合せその他表_データ) {
		let item = 問合せその他表_データ[i];
		html += '<tr>';
		html += '    <td>' + HTMLの特殊文字を変換(item["会社"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["担当部署"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["担当者"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["郵便番号"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["住所"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["TEL"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["FAX"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["E-Mail"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["URL"]) + '</td>';
		html += '</tr>';
	}
	html += '</tbody></table>';
	$(".問合せその他表_出力").html(html);
}

function 国土交通省の実績追加の事務所更新() {
	let 整備局名 = $("#国土交通省の実績追加の整備局名").val();
	let 事務所名 = $('#国土交通省の実績追加の事務所名');
	事務所名.find('option').remove().end().append('<option value="">&nbsp;</option>').val('');
	if (整備局事務所データ) {
		let データ = 整備局事務所データ[整備局名];
		if (データ) {
			for (let i in データ) {
				事務所名.append("<option value=\"" + i + "\">" + i + "</option>");
			}
		}
	}
}

function 国土交通省の実績編集の事務所更新() {
	let 整備局名 = $("#国土交通省の実績編集の整備局名").val();
	let 事務所名 = $('#国土交通省の実績編集の事務所名');
	let 事務所名値 = 事務所名.val();
	事務所名.find('option').remove().end().append('<option value="">&nbsp;</option>').val('');
	if (整備局事務所データ) {
		let データ = 整備局事務所データ[整備局名];
		if (データ) {
			for (let i in データ) {
				事務所名.append("<option value=\"" + i + "\">" + i + "</option>");
			}
		}
	}
}

function 整備局事務所データ同期() {
	let 整備局名;

	整備局名 = $("#国土交通省の実績追加の整備局名");
	整備局名.find('option').remove().end().append('<option value="">&nbsp;</option>').val('');
	if (整備局事務所データ) {
		for (let i in 整備局事務所データ) {
			整備局名.append("<option value=\"" + i + "\">" + i + "</option>");
		}
	}
	整備局名 = $("#国土交通省の実績編集の整備局名");
	整備局名.find('option').remove().end().append('<option value="">&nbsp;</option>').val('');
	if (整備局事務所データ) {
		for (let i in 整備局事務所データ) {
			整備局名.append("<option value=\"" + i + "\">" + i + "</option>");
		}
	}

	// 整備局が入力されたら、事務所名の項目を拡充する。
	$("#国土交通省の実績追加の整備局名").change(国土交通省の実績追加の事務所更新);
	$("#国土交通省の実績編集の整備局名").change(国土交通省の実績編集の事務所更新);
	国土交通省の実績追加の事務所更新();
	国土交通省の実績編集の事務所更新();
}

function _値データ同期内部(id) {
	let 値 = $("#" + id).val();
	$("." + id).html(改行をBRタグに変換(HTMLの特殊文字を変換((値))));
}

function 値データ同期(id) {
	$("#" + id).on("input keyup blur change", function() {
		_値データ同期内部(id);
	});
	_値データ同期内部(id);
	$(function() {
		$(function() {
			_値データ同期内部(id);
		});
	});
}

function 証明項目表更新() {
	if (!証明項目表_データ || !証明項目表_データ.length) {
		let html = '<div class="印刷プレビュー表">証明項目はありません。</div>';
		$(".証明項目表_出力").html(html);
		return;
	}
	let html = '';
	html += '<table class="印刷プレビュー表内部表">';
	html += '    <tbody>';
	html += '        <tr>';
	html += '            <th>証明項目</th>';
	html += '            <th>試験・調査内容</th>';
	html += '            <th>結果</th>';
	html += '        </tr>';
	for (let i in 証明項目表_データ) {
		let item = 証明項目表_データ[i];
		html += '<tr>';
		html += '    <td>' + HTMLの特殊文字を変換(item["証明項目"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["試験・調査内容"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["結果"]) + '</td>';
		html += '</tr>';
	}
	html += '</tbody></table>';
	$(".証明項目表_出力").html(html);
}

function 国土交通省実績表更新() {
	if (!国土交通省実績表_データ || !国土交通省実績表_データ.length) {
		let html = '<div class="印刷プレビュー表内部表">国土交通省における実績はありません。</div>';
		$(".国土交通省実績表_出力").html(html);
		return;
	}
	let html = '';
	html += '<table class="印刷プレビュー表内部表">';
	html += '    <tbody>';
	html += '        <tr>';
	html += '            <th colspan="7">国土交通省における施工実績</th>';
	html += '        </tr>';
	html += '        <tr>';
	html += '            <th>工事名</th>';
	html += '            <th>事業種類</th>';
	html += '            <th>地方整備局名</th>';
	html += '            <th>事務所名</th>';
	html += '            <th>施工開始</th>';
	html += '            <th>施工終了</th>';
	html += '            <th>CORINS登録No.</th>';
	html += '        </tr>';
	for (let i in 国土交通省実績表_データ) {
		let item = 国土交通省実績表_データ[i];
		html += '<tr>';
		html += '    <td>' + HTMLの特殊文字を変換(item["工事名"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["事業種類"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["地方整備局名"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["事務所"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["施工開始"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["施工終了"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["CORINS登録No"]) + '</td>';
		html += '</tr>';
	}
	html += '</tbody></table>';
	$(".国土交通省実績表_出力").html(html);
}

function 国土交通省以外実績表更新() {
	if (!国土交通省以外実績表_データ || !国土交通省以外実績表_データ.length) {
		let html = '<div class="印刷プレビュー表内部表">国土交通省以外の実績はありません。</div>';
		$(".国土交通省以外実績表_出力").html(html);
		return;
	}
	let html = '';
	html += '<table class="印刷プレビュー表内部表">';
	html += '    <tbody>';
	html += '        <tr>';
	html += '            <th colspan="6">国土交通省以外の施工実績</th>';
	html += '        </tr>';
	html += '        <tr>';
	html += '            <th>工事名</th>';
	html += '            <th>発注者(種別)</th>';
	html += '            <th>発注者(事務所)</th>';
	html += '            <th>施工開始</th>';
	html += '            <th>施工終了</th>';
	html += '            <th>CORINS登録No.</th>';
	html += '        </tr>';
	for (let i in 国土交通省以外実績表_データ) {
		let item = 国土交通省以外実績表_データ[i];
		html += '<tr>';
		html += '    <td>' + HTMLの特殊文字を変換(item["工事名"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["発注者(種別)"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["発注者(事務所)"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["施工開始"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["施工終了"]) + '</td>';
		html += '    <td>' + HTMLの特殊文字を変換(item["CORINS登録No"]) + '</td>';
		html += '</tr>';
	}
	html += '</tbody></table>';
	$(".国土交通省以外実績表_出力").html(html);
}

function 分類データ同期(id) {
	$("#" + id).category_chooser({
		change: function(e, cap) {
			let level1 = $("#" + id).category_chooser("level1");
			$("." + id + "レベル1").html(level1);
			let level2 = $("#" + id).category_chooser("level2");
			$("." + id + "レベル2").html(level2);
			let level3 = $("#" + id).category_chooser("level3");
			$("." + id + "レベル3").html(level3);
			let level4 = $("#" + id).category_chooser("level4");
			$("." + id + "レベル4").html(level4);
		},
	});
}

function _チェックデータ同期内部(値, 名前) {
	if ($("#" + 値).prop('checked')) {
		$("." + 値).html('*');
	} else {
		$("." + 値).html('&nbsp;');
	}
}

function チェックデータ同期(値, 名前) {
	if (名前) {
		$("[name=" + 名前 + "]").click(function() {
			_チェックデータ同期内部(値, 名前);
		});
	} else {
		$("#" + 値).click(function() {
			_チェックデータ同期内部(値, 名前);
		});
	}
	_チェックデータ同期内部(値, 名前);
	$(function() {
		$(function() {
			_チェックデータ同期内部(値, 名前);
		});
	});
}

// ４個の文字列配列の配列で格納されたNETIS分類データをそれを多重連想配列に変換する。
function NETIS分類データ解析(json) {
	let dict = {};
	for (let i in json) {
		let item = json[i];
		if (item[0] == '') continue;
		if (!(item[0] in dict)) {
			dict[item[0]] = {};
		}
		if (item[1] == '') continue;
		if (!(item[1] in dict[item[0]])) {
			dict[item[0]][item[1]] = {};
		}
		if (item[2] == '') continue;
		if (!(item[2] in dict[item[0]][item[1]])) {
			dict[item[0]][item[1]][item[2]] = {};
		}
		if (item[3] == '') continue;
		if (!(item[3] in dict[item[0]][item[1]][item[2]])) {
			dict[item[0]][item[1]][item[2]][item[3]] = {};
		}
	}
	return dict;
}

// ２個の文字列配列の配列で格納されたNETIS分類データをそれを多重連想配列に変換する。
function NETIS整備局事務所データ解析(json) {
	let dict = {};
	for (let i in json) {
		let item = json[i];
		if (item[0] == '') continue;
		if (!(item[0] in dict)) {
			dict[item[0]] = {};
		}
		if (item[1] == '') continue;
		if (!(item[1] in dict[item[0]])) {
			dict[item[0]][item[1]] = {};
		}
	}
	return dict;
}

function チェックボックス値配列取得(name) {
	let values = [];
	$("input[name=\"" + name + "\"]:checked").map(function() {
		values.push($(this).val());
	});
	return values;
}

function _チェックボックス値配列設定内部(name, values) {
	$("input[name=\"" + name + "\"]:checked").prop('checked', false);
	for (let i in values) {
		$("input[value=\"" + values[i] + "\"]").prop('checked', true);
	}
}

function チェックボックス値配列設定(name, values) {
	_チェックボックス値配列設定内部(name, values);
	$(function() {
		$(function() {
			_チェックボックス値配列設定内部(name, values);
		});
	});
}

function ラジオ値取得(name) {
	let value = $("input[name='" + name + "']:checked").prop('id');
	if (!value) {
		value = $("input[name=\"" + name + "\"]:checked").val();
		if (!value) {
			value = "";
		}
	}
	return value;
}

function _ラジオ値設定内部(name, value) {
	if (!value) {
		$("input[name='" + name + "']").prop('checked', false);
		return;
	}
	$("input:radio[name=\"" + name + "\"]").val([value]);
}

function ラジオ値設定(name, value) {
	_ラジオ値設定内部(name, value);
	$(function() {
		$(function() {
			_ラジオ値設定内部(name, value);
		});
	});
}

function _分類値設定内部(id, value) {
	if (!value) {
		$("#" + id).category_chooser('values', "\t\t\t");
		$("." + id + "レベル1").text("");
		$("." + id + "レベル2").text("");
		$("." + id + "レベル3").text("");
		$("." + id + "レベル4").text("");
		return;
	}
	$("#" + id).category_chooser('values', value);
	$("." + id + "レベル1").text($("#" + id).category_chooser('level1'));
	$("." + id + "レベル2").text($("#" + id).category_chooser('level2'));
	$("." + id + "レベル3").text($("#" + id).category_chooser('level3'));
	$("." + id + "レベル4").text($("#" + id).category_chooser('level4'));
}

function 分類値設定(id, value) {
	$(function(){
		$(function(){
			_分類値設定内部(id, value);
		});
	});
}

function _出願中マーク同期内部(id, name) {
	if (ラジオ値取得(name) == id) {
		$("." + id + "マーク").text("【出願中】");
	} else {
		$("." + id + "マーク").text("");
	}
}

function 出願中マーク同期(id, name) {
	if (name) {
		$("[name=" + name + "]").click(function() {
			_出願中マーク同期内部(id, name);
		});
	} else {
		$("#" + id).click(function() {
			_出願中マーク同期内部(id, name);
		});
	}
	_出願中マーク同期内部(id, name);
	$(function() {
		$(function() {
			_出願中マーク同期内部(id, name);
		});
	});
}

function 技術比較合計金額(表データ) {
	let 合計金額 = 0;
	for (let i in 表データ) {
		let 数量 = Number(表データ[i]['数量']);
		let 単価 = Number(表データ[i]['単価']);
		let 金額 = 数量 * 単価;
		合計金額 += 金額;
	}
	return 合計金額;
}

function 技術比較再計算() {
	let 基準とする数量 = Number(数値正規化($("#基準とする数量").val()));
	let 基準とする単位 = テキスト正規化($("#基準とする単位").val());
	$(".基準とする数量").text(基準とする数量);
	$(".基準とする単位").text(基準とする単位);

	// 新旧の合計金額を求める。
	let 従来技術合計金額 = 技術比較合計金額(従来技術内訳表_データ);
	let 新技術合計金額 = 技術比較合計金額(新技術内訳表_データ);
	$("#従来技術経済性").val(従来技術合計金額);
	$("#新技術経済性").val(新技術合計金額);
	$(".従来技術経済性").text(従来技術合計金額);
	$(".新技術経済性").text(新技術合計金額);
	$(".従来技術内訳合計").text(従来技術合計金額);
	$(".新技術内訳合計").text(新技術合計金額);

	// 経済性の変化値を求める。
	if (従来技術合計金額 != 0) {
		let 経済性変化値 = (従来技術合計金額 - 新技術合計金額) / 従来技術合計金額;
		経済性変化値 = 小数第3位で四捨五入(経済性変化値 * 100);
		$("#経済性変化値").text(経済性変化値);
		$(".経済性変化値").text(経済性変化値);
		if (経済性変化値 > 0) {
			$(".経済性向上").text("*");
			$(".経済性同程度").text(" ");
			$(".経済性低下").text(" ");
			$(".経済性向上百分率").text("(" + 経済性変化値 + "％)");
			$(".経済性低下百分率").text("");
		} else if (経済性変化値 < 0) {
			$(".経済性向上").text(" ");
			$(".経済性同程度").text(" ");
			$(".経済性低下").text("*");
			$(".経済性向上百分率").text("");
			$(".経済性低下百分率").text("(" + 経済性変化値 + "％)");
		} else {
			$(".経済性向上").text(" ");
			$(".経済性同程度").text("*");
			$(".経済性低下").text(" ");
			$(".経済性向上百分率").text("");
			$(".経済性低下百分率").text("");
		}
	} else {
		let 経済性変化値 = 0;
		$("#経済性変化値").text(経済性変化値);
		$(".経済性変化値").text(経済性変化値);
		$(".経済性向上").text(" ");
		$(".経済性同程度").text("*");
		$(".経済性低下").text(" ");
		$(".経済性向上百分率").text("");
		$(".経済性低下百分率").text("");
	}

	// 工程変化値を求める。
	let 従来技術工程 = Number(数値正規化($("#従来技術工程").val()));
	let 新技術工程 = Number(数値正規化($("#新技術工程").val()));
	if (従来技術工程 != 0) {
		let 工程変化値 = (従来技術工程 - 新技術工程) / 従来技術工程;
		工程変化値 = 小数第3位で四捨五入(工程変化値 * 100);
		$("#工程変化値").text(工程変化値);
		$(".工程変化値").text(工程変化値);
		if (工程変化値 > 0) {
			$(".工程短縮").text("*");
			$(".工程同程度").text(" ");
			$(".工程増加").text(" ");
			$(".工程短縮百分率").text("(" + 工程変化値 + "％)");
			$(".工程増加百分率").text("");
		} else if (工程変化値 < 0) {
			$(".工程短縮").text(" ");
			$(".工程同程度").text(" ");
			$(".工程増加").text("*");
			$(".工程短縮百分率").text("");
			$(".工程増加百分率").text("(" + 工程変化値 + "％)");
		} else {
			$(".工程短縮").text(" ");
			$(".工程同程度").text("*");
			$(".工程増加").text(" ");
			$(".工程短縮百分率").text("");
			$(".工程増加百分率").text("");
		}
	} else {
		let 工程変化値 = 0;
		$("#工程変化値").text(工程変化値);
		$(".工程変化値").text(工程変化値);
		$(".工程短縮").text(" ");
		$(".工程同程度").text("*");
		$(".工程増加").text(" ");
		$(".工程短縮百分率").text("");
		$(".工程増加百分率").text("");
	}
}

//////////////////////////////////////////////////////////////////////////////
// 正規化とバリデーション

function 半角カナを全角に(text) {
	// https://www.yoheim.net/blog.php?q=20191101
	let kanaMap = {
		'ｶﾞ': 'ガ', 'ｷﾞ': 'ギ', 'ｸﾞ': 'グ', 'ｹﾞ': 'ゲ', 'ｺﾞ': 'ゴ',
		'ｻﾞ': 'ザ', 'ｼﾞ': 'ジ', 'ｽﾞ': 'ズ', 'ｾﾞ': 'ゼ', 'ｿﾞ': 'ゾ',
		'ﾀﾞ': 'ダ', 'ﾁﾞ': 'ヂ', 'ﾂﾞ': 'ヅ', 'ﾃﾞ': 'デ', 'ﾄﾞ': 'ド',
		'ﾊﾞ': 'バ', 'ﾋﾞ': 'ビ', 'ﾌﾞ': 'ブ', 'ﾍﾞ': 'ベ', 'ﾎﾞ': 'ボ',
		'ﾊﾟ': 'パ', 'ﾋﾟ': 'ピ', 'ﾌﾟ': 'プ', 'ﾍﾟ': 'ペ', 'ﾎﾟ': 'ポ',
		'ｳﾞ': 'ヴ', 'ﾜﾞ': 'ヷ', 'ｦﾞ': 'ヺ',
		'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
		'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
		'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
		'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
		'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
		'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
		'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
		'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
		'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
		'ﾜ': 'ワ', 'ｦ': 'ヲ', 'ﾝ': 'ン',
		'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
		'ｯ': 'ッ', 'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ',
		'｡': '。', '､': '、', 'ｰ': 'ー', '｢': '「', '｣': '」', '･': '・'
	};
	let reg = new RegExp('(' + Object.keys(kanaMap).join('|') + ')', 'g');
	return text.replace(reg, function (match) {
		return kanaMap[match];
	}).replace(/ﾞ/g, '゛').replace(/ﾟ/g, '゜');
}

function 半角文字のみか(text) {
	// https://javascript.programmer-reference.com/js-check-hankaku-ascii/
	return text.match(/^[\x20-\x7e]*$/);
}

function 半角カナを含むか(text) {
	return text.match(/[ｦ-ﾟ]/);
}

function 連続するスペースを含むか(text) {
	return text.match(/( |\t)( |\t)+/);
}

function 全角英数字を半角に(text) {
	// https://webllica.com/change-double-byte-to-half-width/
	return text.replace(/[！-～]/g, function(tmp) {
		return String.fromCharCode(tmp.charCodeAt(0) - 0xFEE0);
	});
}

function 数値正規化(text) {
	text = text.trim();
	text = 全角英数字を半角に(text);
	text = text.replace(/,/g, ""); // カンマ区切りを削除。
	text = text.replace(/(ー|ｰ)/g, '-'); // 長音をハイフンに変換。
	return text;
}

function 整数正規化(text) {
	text = text.trim();
	text = 全角英数字を半角に(text);
	text = text.replace(/,/g, ""); // カンマ区切りを削除。
	text = text.replace(/(ー|ｰ)/g, '-'); // 長音をハイフンに変換。
	return text;
}

function 郵便番号正規化(text) {
	text = text.trim();
	text = 全角英数字を半角に(text);
	text = text.replace(/(ー|ｰ)/g, '-'); // 長音をハイフンに変換。
	// 必要ならハイフンを入れる。
	if (/^[0-9]{7}$/.test(text)) {
		text = text.slice(0, 3) + "-" + text.slice(3);
	}
	return text;
}

function 年月日正規化テキスト用(text) {
	text = text.trim();
	text = 全角英数字を半角に(text);
	text = text.replace(/(ー|ｰ)/g, '-'); // 長音をハイフンに変換。
	text = text.replace(/-/g, '/'); // ハイフンをスラッシュに変換。
	text = text.replace(/\./g, '/'); // ドットをスラッシュに変換。
	let ary = text.split('/');
	if (ary.length == 3) {
		text = ary[0] + '/' + ('0' + ary[1]).slice(-2) + '/' + ('0' + ary[2]).slice(-2);
	}
	return text;
}

function 年月日正規化INPUT用(text) {
	text = 年月日正規化テキスト用(text);
	text = text.replace(/\//g, '-'); // スラッシュをハイフンに変換。
	return text;
}

function 電話番号正規化(text) {
	text = text.trim();
	text = 全角英数字を半角に(text);
	text = text.replace(/(ー|ｰ)/g, '-'); // 長音をハイフンに変換。
	text = text.replace(/[\(\)]/g, '-'); // 丸カッコをハイフンに変換。
	text = text.replace(/\-\-+/g, '-'); // ハイフンの連続を一つのハイフンに変換。
	text = text.replace(/^\-+/g, ''); // 先頭のハイフンを削除。
	return text;
}

function FAX番号正規化(text) {
	return 電話番号正規化(text);
}

function メールアドレス正規化(text) {
	text = text.trim();
	text = 全角英数字を半角に(text);
	text = text.replace(/(ー|ｰ)/g, '-'); // 長音をハイフンに変換。
	return text;
}

function URL正規化(text) {
	text = text.trim();
	text = 全角英数字を半角に(text);
	return text;
}

function 表タイトル正規化(text) {
	text = text.trim();
	return text;
}

function 写真タイトル正規化(text) {
	text = text.trim();
	return text;
}

function ファイル名正規化(text) {
	text = text.trim();
	return text;
}

function 建設技術番号正規化(text) {
	// TODO:
	text = text.trim();
	text = 全角英数字を半角に(text);
	return text;
}

function CORINS登録番号正規化(text) {
	// TODO:
	text = text.trim();
	text = 全角英数字を半角に(text);
	return text;
}

function 文章正規化(text) {
	text = text.trim();
	text = 半角カナを全角に(text);
	// 全角スペースを2個の半角スペースに。
	text = text.replace(/　/g, '  ');
	// 連続するスペースを１つのスペースにする。
	text = text.replace(/  +/g, ' ');
	// 連続する改行を２つの改行にする。
	text = text.replace(/(\r?\n)([ \t]*\r?\n)+/g, "\r\n\r\n");
	return text;
}

function 整数か(text, 空でもいいか) {
	text = text.trim();
	if (空でもいいか && text == '') {
		return true;
	}
	return /^(\+|-)?[0-9,]+$/.test(text);
}

function 符号なし整数か(text, 空でもいいか) {
	text = text.trim();
	if (空でもいいか && text == '') {
		return true;
	}
	return /^[0-9,]+$/.test(text);
}

function 郵便番号か(text, 空でもいいか) {
	text = text.trim();
	if (空でもいいか && text == '') {
		return true;
	}
	return /^[0-9]{3}-?[0-9]{4}$/.test(text);
}

function 数値か(text, 空でもいいか) {
	text = text.trim();
	if (空でもいいか && text == '') {
		return true;
	}
	return /^[+,-]?\d+(\.\d*)?$/.test(text);
}

function 符号なし数値か(text, 空でもいいか) {
	text = text.trim();
	if (空でもいいか && text == '') {
		return true;
	}
	return /^\d+(\.\d*)?$/.test(text);
}

function 西暦年か(text, 空でもいいか) {
	text = text.trim();
	if (空でもいいか && text == '') {
		return true;
	}
	return /^\d{4}$/.test(text);
}

function 年月日か(text, 空でもいいか) {
	text = text.trim();
	if (空でもいいか && text == '') {
		return true;
	}
	text = text.replace(/-/g, '/');
	text = text.replace(/\./g, '/');
	if (!/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(text))
		return false;
	let ary = text.split('/');
	if (ary.length != 3)
		return false;
	let y = ary[0], m = ary[1] - 1, d = ary[2];
	let date = new Date(y, m, d);
	if (date.getFullYear() != y || date.getMonth() != m || date.getDate() != d)
		return false;
	return true;
}

function 電話番号か(text, 空でもいいか) {
	text = text.trim();
	if (空でもいいか && text == '') {
		return true;
	}
	return /^[\d\-\+]+$/.test(text);
}

function FAX番号か(text, 空でもいいか) {
	return 電話番号か(text, 空でもいいか);
}

function メールアドレスか(text, 空でもいいか) {
	text = text.trim();
	if (空でもいいか && text == '') {
		return true;
	}
	text = text.trim();
	// https://techacademy.jp/magazine/33601
	let reg = /^[A-Za-z0-9]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]{1,}\.[A-Za-z0-9]{1,}$/;
	return reg.test(text);
}

function URLか(text, 空でもいいか) {
	text = text.trim();
	if (空でもいいか && text == '') {
		return true;
	}
	text = text.trim();
	// https://www.it-swarm-ja.tech/ja/javascript/javascript%E3%81%AE%E6%96%87%E5%AD%97%E5%88%97%E3%81%8Curl%E3%81%8B%E3%81%A9%E3%81%86%E3%81%8B%E3%82%92%E7%A2%BA%E8%AA%8D/971354377/
	let pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
		'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
		'((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
		'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
		'(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
		'(\\#[-a-z\\d_]*)?$','i'); // fragment locator
	return !!pattern.test(text);
}

function 表タイトルか(text, 空でもいいか) {
	text = text.trim();
	if (空でもいいか && text == '') {
		return true;
	}
	// TODO:
	return true;
}

function 写真タイトルか(text, 空でもいいか) {
	text = text.trim();
	if (空でもいいか && text == '') {
		return true;
	}
	// TODO:
	return true;
}

function 建設技術番号か(text, 空でもいいか) {
	text = text.trim();
	if (空でもいいか && text == '') {
		return true;
	}
	// TODO:
	text = 全角英数字を半角に(text);
	return 半角文字のみか(text);
}

function CORINS登録番号か(text, 空でもいいか) {
	text = text.trim();
	if (空でもいいか && text == '') {
		return true;
	}
	// TODO:
	text = 全角英数字を半角に(text);
	return 半角文字のみか(text);
}

function 正しい文章か(text, 空でもいいか) {
	text = text.trim();
	if (空でもいいか && text == '') {
		return true;
	}
	if (半角カナを含むか(text))
		return false;
	if (連続するスペースを含むか(text))
		return false;
	return true;
}

function 文章が長すぎるか(text) {
	return text.length > 1000;
}

function テキストが長すぎるか(text) {
	return text.length > 64;
}

function テキスト正規化(text) {
	text = 半角カナを全角に(text);
	text = text.replace(/\s\s+/g, " ");
	return text;
}

function 会社名正規化(text) {
	text = 半角カナを全角に(text);
	text = text.replace(/　/g, " ");
	text = text.replace(/㈱/g, "(株)");
	text = text.replace(/株式会社/g, "(株)");
	text = text.replace(/㈲/g, "(有)");
	text = text.replace(/有限会社/g, "(有)");
	text = text.replace(/\s*\(株\)\s*/g, "(株)");
	text = text.replace(/\s*\(有\)\s*/g, "(有)");
	text = text.replace(/\s\s+/g, " ");
	return text;
}

//////////////////////////////////////////////////////////////////////////////
// ローカルストレージ部

function NETIS名称分類等設定(data) {
	if (!data) {
		return false;
	}
	$("#技術名称").val(テキスト正規化(data["技術名称"]));
	$("#副題").val(テキスト正規化(data["副題"]));
	$("#技術開発年").val(整数正規化(data["技術開発年"]));
	$("#記入年月日").val(年月日正規化INPUT用(data["記入年月日"]));
	ラジオ値設定("情報提供の範囲", data['情報提供の範囲']);
	分類値設定("分類1", data['分類1']);
	分類値設定("分類2", data['分類2']);
	分類値設定("分類3", data['分類3']);
	分類値設定("分類4", data['分類4']);
	分類値設定("分類5", data['分類5']);
	$("#区分").val(data["区分"]);
	チェックボックス値配列設定("キーワード", data['キーワード']);
	$("#キーワード自由記入1").val(テキスト正規化(data["キーワード自由記入1"]));
	$("#キーワード自由記入2").val(テキスト正規化(data["キーワード自由記入2"]));
	$("#キーワード自由記入3").val(テキスト正規化(data["キーワード自由記入3"]));
	チェックボックス値配列設定("開発目標", data['開発目標']);
	ラジオ値設定("開発体制", data['開発体制']);
	$("#開発目標その他").val(テキスト正規化(data["開発目標その他"]));
	$("#開発会社").val(テキスト正規化(data["開発会社"]));
	$("#技術の会社").val(テキスト正規化(data["技術の会社"]));
	$("#技術の担当部署").val(テキスト正規化(data["技術の担当部署"]));
	$("#技術の担当者").val(テキスト正規化(data["技術の担当者"]));
	$("#技術の郵便番号").val(郵便番号正規化(data["技術の郵便番号"]));
	$("#技術の住所").val(テキスト正規化(data["技術の住所"]));
	$("#技術のTEL").val(電話番号正規化(data["技術のTEL"]));
	$("#技術のFAX").val(FAX番号正規化(data["技術のFAX"]));
	$("#技術のEMAIL").val(メールアドレス正規化(data["技術のEMAIL"]));
	$("#技術のURL").val(テキスト正規化(data["技術のURL"]));
	$("#営業の会社").val(テキスト正規化(data["営業の会社"]));
	$("#営業の担当部署").val(テキスト正規化(data["営業の担当部署"]));
	$("#営業の担当者").val(テキスト正規化(data["営業の担当者"]));
	$("#営業の郵便番号").val(郵便番号正規化(data["営業の郵便番号"]));
	$("#営業の住所").val(テキスト正規化(data["営業の住所"]));
	$("#営業のTEL").val(電話番号正規化(data["営業のTEL"]));
	$("#営業のFAX").val(FAX番号正規化(data["営業のFAX"]));
	$("#営業のEMAIL").val(メールアドレス正規化(data["営業のEMAIL"]));
	$("#営業のURL").val(テキスト正規化(data["営業のURL"]));
	問合せその他表_データ = data["問合せその他表_データ"];
	if (!問合せその他表_データ) {
		問合せその他表_データ = [];
	}
	$("#問合せその他表").jsGrid("option", "data", 問合せその他表_データ);
	問合せその他表更新();
	return true;
}

function NETIS名称分類等取得() {
	let data = {
		"技術名称": $("#技術名称").val(),
		"副題": $("#副題").val(),
		"技術開発年": $("#技術開発年").val(),
		"記入年月日": $("#記入年月日").val(),
		"情報提供の範囲": ラジオ値取得("情報提供の範囲"),
		"分類1": $("#分類1").category_chooser("values"),
		"分類2": $("#分類2").category_chooser("values"),
		"分類3": $("#分類3").category_chooser("values"),
		"分類4": $("#分類4").category_chooser("values"),
		"分類5": $("#分類5").category_chooser("values"),
		"区分": $("#区分").val(),
		"キーワード": チェックボックス値配列取得("キーワード"),
		"キーワード自由記入1": $("#キーワード自由記入1").val(),
		"キーワード自由記入2": $("#キーワード自由記入2").val(),
		"キーワード自由記入3": $("#キーワード自由記入3").val(),
		"開発目標": チェックボックス値配列取得("開発目標"),
		"開発目標その他": $("#開発目標その他").val(),
		"開発体制": ラジオ値取得("開発体制"),
		"開発会社": $("#開発会社").val(),
		"技術の会社": $("#技術の会社").val(),
		"技術の担当部署": $("#技術の担当部署").val(),
		"技術の担当者": $("#技術の担当者").val(),
		"技術の郵便番号": $("#技術の郵便番号").val(),
		"技術の住所": $("#技術の住所").val(),
		"技術のTEL": $("#技術のTEL").val(),
		"技術のFAX": $("#技術のFAX").val(),
		"技術のEMAIL": $("#技術のEMAIL").val(),
		"技術のURL": $("#技術のURL").val(),
		"営業の会社": $("#営業の会社").val(),
		"営業の担当部署": $("#営業の担当部署").val(),
		"営業の担当者": $("#営業の担当者").val(),
		"営業の郵便番号": $("#営業の郵便番号").val(),
		"営業の住所": $("#営業の住所").val(),
		"営業のTEL": $("#営業のTEL").val(),
		"営業のFAX": $("#営業のFAX").val(),
		"営業のEMAIL": $("#営業のEMAIL").val(),
		"営業のURL": $("#営業のURL").val(),
		"問合せその他表_データ": 問合せその他表_データ,
	};
	return data;
}

function NETIS技術概要等設定(data) {
	if (!data) {
		return false;
	}
	$("#技術概要").val(文章正規化(data["技術概要"]));
	$("#概要").val(文章正規化(data["概要"]));

	写真設定("概要写真", null, data["概要写真"]);
	$("#概要写真_タイトル").val(写真タイトル正規化(data["概要写真_タイトル"]));
	$(".概要写真_タイトル").text(写真タイトル正規化(data["概要写真_タイトル"]));
	$("#概要写真_ファイル名").val(ファイル名正規化(data["概要写真_ファイル名"]));
	$(".概要写真_ファイル名").text(ファイル名正規化(data["概要写真_ファイル名"]));

	$("#概要表_タイトル").val(表タイトル正規化(data["概要表_タイトル"]));

	概要表_データ = data["概要表_データ"];
	if (!概要表_データ) {
		概要表_データ = 表計算初期化データ();
	}

	$("#概要表_見出し列数").val(整数正規化(data["概要表_見出し列数"]));
	$("#概要表_見出し行数").val(整数正規化(data["概要表_見出し行数"]));
	表計算出力更新("概要表");
	見出し列数行数更新("概要表");

	$("#新規性及び期待される効果").val(文章正規化(data["新規性及び期待される効果"]));

	写真設定("新規性と効果の写真", null, data["新規性と効果の写真"]);
	$("#新規性と効果の写真_タイトル").val(写真タイトル正規化(data["新規性と効果の写真_タイトル"]));
	$(".新規性と効果の写真_タイトル").text(写真タイトル正規化(data["新規性と効果の写真_タイトル"]));
	$("#新規性と効果の写真_ファイル名").val(ファイル名正規化(data["新規性と効果の写真_ファイル名"]));
	$(".新規性と効果の写真_ファイル名").text(ファイル名正規化(data["新規性と効果の写真_ファイル名"]));

	$("#新規性と効果表_タイトル").val(表タイトル正規化(data["新規性と効果表_タイトル"]));

	新規性と効果表_データ = data["新規性と効果表_データ"];
	if (!新規性と効果表_データ) {
		新規性と効果表_データ = 表計算初期化データ();
	}
	$("#新規性と効果表_見出し列数").val(整数正規化(data["新規性と効果表_見出し列数"]));
	$("#新規性と効果表_見出し行数").val(整数正規化(data["新規性と効果表_見出し行数"]));
	表計算出力更新("新規性と効果表");
	見出し列数行数更新("新規性と効果表");

	$("#適用条件").val(文章正規化(data["適用条件"]));
	$("#適用範囲").val(文章正規化(data["適用範囲"]));
	$("#留意事項").val(文章正規化(data["留意事項"]));
	return true;
}

function NETIS技術概要等取得() {
	let data = {
		"技術概要": $("#技術概要").val(),
		"概要": $("#概要").val(),
		"概要表_タイトル": $("#概要表_タイトル").val(),
		"概要写真": $("#概要写真_縮小版").attr("src"),
		"概要写真_タイトル": $("#概要写真_タイトル").val(),
		"概要写真_ファイル名": $("#概要写真_ファイル名").val(),
		"概要表_データ": 概要表_データ,
		"概要表_見出し列数": $("#概要表_見出し列数").val(),
		"概要表_見出し行数": $("#概要表_見出し行数").val(),
		"新規性及び期待される効果": $("#新規性及び期待される効果").val(),
		"新規性と効果の写真": $("#新規性と効果の写真_縮小版").attr("src"),
		"新規性と効果の写真_タイトル": $("#新規性と効果の写真_タイトル").val(),
		"新規性と効果の写真_ファイル名": $("#新規性と効果の写真_ファイル名").val(),
		"新規性と効果表_タイトル": $("#新規性と効果表_タイトル").val(),
		"新規性と効果表_データ": 新規性と効果表_データ,
		"新規性と効果表_見出し列数": $("#新規性と効果表_見出し列数").val(),
		"新規性と効果表_見出し行数": $("#新規性と効果表_見出し行数").val(),
		"適用条件": $("#適用条件").val(),
		"適用範囲": $("#適用範囲").val(),
		"留意事項": $("#留意事項").val(),
	};
	return data;
}

function NETIS従来技術との比較設定(data) {
	if (!data) {
		return false;
	}
	$("#従来技術名").val(data["従来技術名"]);
	従来技術名変更();
	$("#基準とする数量").val(数値正規化(data["基準とする数量"]));
	$("#基準とする単位").val(テキスト正規化(data["基準とする単位"]));

	新技術内訳表_データ = data["新技術内訳表_データ"];
	if (!新技術内訳表_データ) {
		新技術内訳表_データ = [];
	}
	$("#新技術内訳表").jsGrid("option", "data", 新技術内訳表_データ);
	新技術内訳表更新();

	従来技術内訳表_データ = data["従来技術内訳表_データ"];
	if (!従来技術内訳表_データ) {
		従来技術内訳表_データ = [];
	}
	$("#従来技術内訳表").jsGrid("option", "data", 従来技術内訳表_データ);
	従来技術内訳表更新();

	$("#経済性の比較のポイント").val(テキスト正規化(data["経済性の比較のポイント"]));

	$("#新技術工程").val(数値正規化(data["新技術工程"]));
	$("#従来技術工程").val(数値正規化(data["従来技術工程"]));
	$("#工程の比較のポイント").val(テキスト正規化(data["工程の比較のポイント"]));

	ラジオ値設定("品質比較", data['品質比較']);

	技術比較再計算();

	$("#品質の比較のポイント").val(テキスト正規化(data["品質の比較のポイント"]));
	ラジオ値設定("安全性比較", data['安全性比較']);
	$("#安全性の比較のポイント").val(テキスト正規化(data["安全性の比較のポイント"]));
	ラジオ値設定("施工性比較", data['施工性比較']);
	$("#施工性の比較のポイント").val(テキスト正規化(data["施工性の比較のポイント"]));
	ラジオ値設定("周辺環境への影響比較", data['周辺環境への影響比較']);
	$("#周辺環境への影響の比較のポイント").val(テキスト正規化(data["周辺環境への影響の比較のポイント"]));
	$("#比較用自由設定項目１").val(テキスト正規化(data["比較用自由設定項目１"]));
	ラジオ値設定("自由設定項目１比較", data['自由設定項目１比較']);
	$("#自由設定項目１の比較のポイント").val(テキスト正規化(data["自由設定項目１の比較のポイント"]));
	$("#比較用自由設定項目２").val(テキスト正規化(data["比較用自由設定項目２"]));
	ラジオ値設定("自由設定項目２比較", data['自由設定項目２比較']);
	$("#自由設定項目２の比較のポイント").val(テキスト正規化(data["自由設定項目２の比較のポイント"]));
	$("#技術のアピールポイント等").val(テキスト正規化(data["技術のアピールポイント等"]));
	ラジオ値設定("コストタイプ", data["コストタイプ"]);
	$(".コストタイプ").text(data["コストタイプ"]);
	$("#コストタイプ").val(data["コストタイプ"]);

	$("#新技術サイクルコスト1年").val(数値正規化(data["新技術サイクルコスト1年"]));
	$("#新技術サイクルコスト3年").val(数値正規化(data["新技術サイクルコスト3年"]));
	$("#新技術サイクルコスト5年").val(数値正規化(data["新技術サイクルコスト5年"]));
	$("#新技術サイクルコスト10年").val(数値正規化(data["新技術サイクルコスト10年"]));
	$("#従来技術サイクルコスト1年").val(数値正規化(data["従来技術サイクルコスト1年"]));
	$("#従来技術サイクルコスト3年").val(数値正規化(data["従来技術サイクルコスト3年"]));
	$("#従来技術サイクルコスト5年").val(数値正規化(data["従来技術サイクルコスト5年"]));
	$("#従来技術サイクルコスト10年").val(数値正規化(data["従来技術サイクルコスト10年"]));
	$(function() {
		サイクルコスト更新();
	});

	$("#施行単価").val(文章正規化(data["施行単価"]));
	$("#費用内訳書表_タイトル").val(表タイトル正規化(data["費用内訳書表_タイトル"]));

	費用内訳書表_データ = data["費用内訳書表_データ"];
	if (!費用内訳書表_データ) {
		費用内訳書表_データ = 費用内訳書表初期化データ();
	}
	$("#費用内訳書表_見出し列数").val(整数正規化(data["費用内訳書表_見出し列数"]));
	$("#費用内訳書表_見出し行数").val(整数正規化(data["費用内訳書表_見出し行数"]));
	表計算出力更新("費用内訳書表");
	見出し列数行数更新("費用内訳書表");

	ラジオ値設定("歩掛の種類", data['歩掛の種類']);
	$("#施工方法").val(文章正規化(data["施工方法"]));

	写真設定("施工方法写真", null, data["施工方法写真"]);
	$("#施工方法写真_タイトル").val(写真タイトル正規化(data["施工方法写真_タイトル"]));
	$(".施工方法写真_タイトル").text(写真タイトル正規化(data["施工方法写真_タイトル"]));
	$("#施工方法写真_ファイル名").val(ファイル名正規化(data["施工方法写真_ファイル名"]));
	$(".施工方法写真_ファイル名").text(ファイル名正規化(data["施工方法写真_ファイル名"]));

	$("#施工方法表_タイトル").val(表タイトル正規化(data["施工方法表_タイトル"]));
	施工方法表_データ = data["施工方法表_データ"];
	if (!施工方法表_データ) {
		施工方法表_データ = 表計算初期化データ();
	}
	$("#施工方法表_見出し列数").val(整数正規化(data["施工方法表_見出し列数"]));
	$("#施工方法表_見出し行数").val(整数正規化(data["施工方法表_見出し行数"]));
	表計算出力更新("施工方法表");
	見出し列数行数更新("施工方法表");

	$("#今後の課題とその対応計画").val(文章正規化(data["今後の課題とその対応計画"]));
	return true;
}

function NETIS従来技術との比較取得() {
	let data = {
		"従来技術名": $("#従来技術名").val(),
		"基準とする数量": $("#基準とする数量").val(),
		"基準とする単位": $("#基準とする単位").val(),
		"新技術内訳表_データ": 新技術内訳表_データ,
		"従来技術内訳表_データ": 従来技術内訳表_データ,
		"新技術工程": $("#新技術工程").val(),
		"従来技術工程": $("#従来技術工程").val(),
		"経済性の比較のポイント": $("#経済性の比較のポイント").val(),
		"工程の比較のポイント": $("#工程の比較のポイント").val(),
		"品質比較": ラジオ値取得("品質比較"),
		"品質の比較のポイント": $("#品質の比較のポイント").val(),
		"安全性比較": ラジオ値取得("安全性比較"),
		"安全性の比較のポイント": $("#安全性の比較のポイント").val(),
		"施工性比較": ラジオ値取得("施工性比較"),
		"施工性の比較のポイント": $("#施工性の比較のポイント").val(),
		"周辺環境への影響比較": ラジオ値取得("周辺環境への影響比較"),
		"周辺環境への影響の比較のポイント": $("#周辺環境への影響の比較のポイント").val(),
		"比較用自由設定項目１": $("#比較用自由設定項目１").val(),
		"自由設定項目１比較": ラジオ値取得("自由設定項目１比較"),
		"自由設定項目１の比較のポイント": $("#自由設定項目１の比較のポイント").val(),
		"比較用自由設定項目２": $("#比較用自由設定項目２").val(),
		"自由設定項目２比較": ラジオ値取得("自由設定項目２比較"),
		"自由設定項目２の比較のポイント": $("#自由設定項目２の比較のポイント").val(),
		"技術のアピールポイント等": $("#技術のアピールポイント等").val(),
		"コストタイプ": $("#コストタイプ").val(),
		"新技術サイクルコスト1年": $("#新技術サイクルコスト1年").val(),
		"新技術サイクルコスト3年": $("#新技術サイクルコスト3年").val(),
		"新技術サイクルコスト5年": $("#新技術サイクルコスト5年").val(),
		"新技術サイクルコスト10年": $("#新技術サイクルコスト10年").val(),
		"従来技術サイクルコスト1年": $("#従来技術サイクルコスト1年").val(),
		"従来技術サイクルコスト3年": $("#従来技術サイクルコスト3年").val(),
		"従来技術サイクルコスト5年": $("#従来技術サイクルコスト5年").val(),
		"従来技術サイクルコスト10年": $("#従来技術サイクルコスト10年").val(),
		"施行単価": $("#施行単価").val(),
		"費用内訳書表_タイトル": $("#費用内訳書表_タイトル").val(),
		"費用内訳書表_データ": 費用内訳書表_データ,
		"費用内訳書表_見出し列数": $("#費用内訳書表_見出し列数").val(),
		"費用内訳書表_見出し行数": $("#費用内訳書表_見出し行数").val(),
		"歩掛の種類": ラジオ値取得("歩掛の種類"),
		"施工方法": $("#施工方法").val(),
		"施工方法写真": $("#施工方法写真_縮小版").attr("src"),
		"施工方法写真_タイトル": $("#施工方法写真_タイトル").val(),
		"施工方法写真_ファイル名": $("#施工方法写真_ファイル名").val(),
		"施工方法表_タイトル": $("#施工方法表_タイトル").val(),
		"施工方法表_データ": 施工方法表_データ,
		"施工方法表_見出し列数": $("#施工方法表_見出し列数").val(),
		"施工方法表_見出し行数": $("#施工方法表_見出し行数").val(),
		"今後の課題とその対応計画": $("#今後の課題とその対応計画").val(),
	};
	return data;
}

function NETIS施工実績等設定(data) {
	if (!data) {
		return false;
	}
	$("#国土交通省の実績何件").val(整数正規化(data["国土交通省の実績何件"]));

	国土交通省実績表_データ = data["国土交通省実績表_データ"];
	if (!国土交通省実績表_データ) {
		国土交通省実績表_データ = []
	}
	$("#国土交通省実績表").jsGrid("option", "data", 国土交通省実績表_データ);
	$(function(){
		国土交通省実績表更新();
	});

	$("#その他公共機関の実績何件").val(整数正規化(data["その他公共機関の実績何件"]));
	$("#民間の実績何件").val(整数正規化(data["民間の実績何件"]));

	国土交通省以外実績表_データ = data["国土交通省以外実績表_データ"];
	if (!国土交通省以外実績表_データ) {
		国土交通省以外実績表_データ = []
	}
	$("#国土交通省以外実績表").jsGrid("option", "data", 国土交通省以外実績表_データ);
	$(function(){
		国土交通省以外実績表更新();
	});

	ラジオ値設定("特許の有無", data['特許の有無']);
	$("#特許1番号").val(テキスト正規化(data["特許1番号"]));
	ラジオ値設定("特許1の有無", data['特許1の有無']);
	ラジオ値設定("特許1通常実施権の有無", data['特許1通常実施権の有無']);
	ラジオ値設定("特許1専用実施権の有無", data['特許1専用実施権の有無']);
	$("#特許1特許権者").val(テキスト正規化(data["特許1特許権者"]));
	$("#特許1実施権者").val(テキスト正規化(data["特許1実施権者"]));
	$("#特許1特許料等").val(テキスト正規化(data["特許1特許料等"]));
	$("#特許1実施形態").val(テキスト正規化(data["特許1実施形態"]));
	$("#特許1問合せ先").val(テキスト正規化(data["特許1問合せ先"]));
	$("#特許2番号").val(テキスト正規化(data["特許2番号"]));
	ラジオ値設定("特許2の有無", data['特許2の有無']);
	ラジオ値設定("特許2通常実施権の有無", data['特許2通常実施権の有無']);
	ラジオ値設定("特許2専用実施権の有無", data['特許2専用実施権の有無']);
	$("#特許2特許権者").val(テキスト正規化(data["特許2特許権者"]));
	$("#特許2実施権者").val(テキスト正規化(data["特許2実施権者"]));
	$("#特許2特許料等").val(テキスト正規化(data["特許2特許料等"]));
	$("#特許2実施形態").val(テキスト正規化(data["特許2実施形態"]));
	$("#特許2問合せ先").val(テキスト正規化(data["特許2問合せ先"]));
	$("#特許3番号").val(テキスト正規化(data["特許3番号"]));
	ラジオ値設定("特許3の有無", data['特許3の有無']);
	ラジオ値設定("特許3通常実施権の有無", data['特許3通常実施権の有無']);
	ラジオ値設定("特許3専用実施権の有無", data['特許3専用実施権の有無']);
	$("#特許3特許権者").val(テキスト正規化(data["特許3特許権者"]));
	$("#特許3実施権者").val(テキスト正規化(data["特許3実施権者"]));
	$("#特許3特許料等").val(テキスト正規化(data["特許3特許料等"]));
	$("#特許3実施形態").val(テキスト正規化(data["特許3実施形態"]));
	$("#特許3問合せ先").val(テキスト正規化(data["特許3問合せ先"]));
	$("#特許4番号").val(テキスト正規化(data["特許4番号"]));
	ラジオ値設定("特許4の有無", data['特許4の有無']);
	ラジオ値設定("特許4通常実施権の有無", data['特許4通常実施権の有無']);
	ラジオ値設定("特許4専用実施権の有無", data['特許4専用実施権の有無']);
	$("#特許4特許権者").val(テキスト正規化(data["特許4特許権者"]));
	$("#特許4実施権者").val(テキスト正規化(data["特許4実施権者"]));
	$("#特許4特許料等").val(テキスト正規化(data["特許4特許料等"]));
	$("#特許4実施形態").val(テキスト正規化(data["特許4実施形態"]));
	$("#特許4問合せ先").val(テキスト正規化(data["特許4問合せ先"]));
	$("#特許5番号").val(テキスト正規化(data["特許5番号"]));
	ラジオ値設定("特許5の有無", data['特許5の有無']);
	ラジオ値設定("特許5通常実施権の有無", data['特許5通常実施権の有無']);
	ラジオ値設定("特許5専用実施権の有無", data['特許5専用実施権の有無']);
	$("#特許5特許権者").val(テキスト正規化(data["特許5特許権者"]));
	$("#特許5実施権者").val(テキスト正規化(data["特許5実施権者"]));
	$("#特許5特許料等").val(テキスト正規化(data["特許5特許料等"]));
	$("#特許5実施形態").val(テキスト正規化(data["特許5実施形態"]));
	$("#特許5問合せ先").val(テキスト正規化(data["特許5問合せ先"]));
	ラジオ値設定("実用新案の有無", data['実用新案の有無']);
	ラジオ値設定("実施新案通常実施権の有無", data['実施新案通常実施権の有無']);
	ラジオ値設定("実施新案専用実施権の有無", data['実施新案専用実施権の有無']);
	$("#実用新案特許番号").val(テキスト正規化(data["実用新案特許番号"]));
	$("#特許実用新案備考").val(テキスト正規化(data["特許実用新案備考"]));
	$("#建設技術番号").val(テキスト正規化(data["建設技術番号"]));
	$("#港湾関連民間技術の評価年月日").val(年月日正規化INPUT用(data["港湾関連民間技術の評価年月日"]));
	$("#港湾関連民間技術の評価機関").val(テキスト正規化(data["港湾関連民間技術の評価機関"]));
	$("#港湾関連民間技術の評価URL").val(テキスト正規化(data["港湾関連民間技術の評価URL"]));
	$("#港湾に係る民間技術評価番号").val(テキスト正規化(data["港湾に係る民間技術評価番号"]));
	$("#民間技術評価の評価年月日").val(年月日正規化INPUT用(data["民間技術評価の評価年月日"]));
	$("#民間技術評価の評価URL").val(テキスト正規化(data["民間技術評価の評価URL"]));
	$("#制度の名称1").val(テキスト正規化(data["制度の名称1"]));
	$("#制度の番号1").val(テキスト正規化(data["制度の番号1"]));
	$("#制度の証明年月日1").val(年月日正規化INPUT用(data["制度の証明年月日1"]));
	$("#制度の証明機関名称1").val(テキスト正規化(data["制度の証明機関名称1"]));
	$("#制度の証明範囲1").val(テキスト正規化(data["制度の証明範囲1"]));
	$("#制度のURL1").val(テキスト正規化(data["制度のURL1"]));
	$("#制度の名称2").val(テキスト正規化(data["制度の名称2"]));
	$("#制度の番号2").val(テキスト正規化(data["制度の番号2"]));
	$("#制度の証明年月日2").val(年月日正規化INPUT用(data["制度の証明年月日2"]));
	$("#制度の証明機関名称2").val(テキスト正規化(data["制度の証明機関名称2"]));
	$("#制度の証明範囲2").val(テキスト正規化(data["制度の証明範囲2"]));
	$("#制度のURL2").val(テキスト正規化(data["制度のURL2"]));

	証明項目表_データ = data["証明項目表_データ"];
	if (!証明項目表_データ) {
		証明項目表_データ = [];
	}
	$("#証明項目表").jsGrid("option", "data", 証明項目表_データ);
	$(function(){
		証明項目表更新();
	});

	$("#実験等実施状況").val(文章正規化(data["実験等実施状況"]));

	写真設定("実験等実施状況写真", null, data["実験等実施状況写真"]);
	$("#実験等実施状況写真_タイトル").val(写真タイトル正規化(data["実験等実施状況写真_タイトル"]));
	$(".実験等実施状況写真_タイトル").text(写真タイトル正規化(data["実験等実施状況写真_タイトル"]));
	$("#実験等実施状況写真_ファイル名").val(ファイル名正規化(data["実験等実施状況写真_ファイル名"]));
	$(".実験等実施状況写真_ファイル名").text(ファイル名正規化(data["実験等実施状況写真_ファイル名"]));

	$("#実験等実施状況表_タイトル").val(表タイトル正規化(data["実験等実施状況表_タイトル"]));
	実験等実施状況表_データ = data["実験等実施状況表_データ"];
	if (!実験等実施状況表_データ) {
		実験等実施状況表_データ = 表計算初期化データ();
	}
	$("#実験等実施状況表_見出し列数").val(整数正規化(data["実験等実施状況表_見出し列数"]));
	$("#実験等実施状況表_見出し行数").val(整数正規化(data["実験等実施状況表_見出し行数"]));
	表計算出力更新("実験等実施状況表");
	見出し列数行数更新("実験等実施状況表");

	$("#添付資料").val(文章正規化(data["添付資料"]));
	$("#参考文献").val(文章正規化(data["参考文献"]));

	写真設定("その他の写真1", null, data["その他の写真1"]);
	$("#その他の写真1_タイトル").val(写真タイトル正規化(data["その他の写真1_タイトル"]));
	$("#その他の写真1_ファイル名").val(ファイル名正規化(data["その他の写真1_ファイル名"]));

	写真設定("その他の写真2", null, data["その他の写真2"]);
	$("#その他の写真2_タイトル").val(写真タイトル正規化(data["その他の写真2_タイトル"]));
	$("#その他の写真2_ファイル名").val(ファイル名正規化(data["その他の写真2_ファイル名"]));

	写真設定("その他の写真3", null, data["その他の写真3"]);
	$("#その他の写真3_タイトル").val(写真タイトル正規化(data["その他の写真3_タイトル"]));
	$("#その他の写真3_ファイル名").val(ファイル名正規化(data["その他の写真3_ファイル名"]));
	return true;
}

function NETIS施工実績等取得() {
	let data = {
		"国土交通省の実績何件": $("#国土交通省の実績何件").val(),
		"国土交通省実績表_データ": 国土交通省実績表_データ,
		"その他公共機関の実績何件": $("#その他公共機関の実績何件").val(),
		"民間の実績何件": $("#民間の実績何件").val(),
		"国土交通省以外実績表_データ": 国土交通省以外実績表_データ,
		"特許の有無": ラジオ値取得('特許の有無'),
		"特許1番号": $("#特許1番号").val(),
		"特許1の有無": ラジオ値取得("特許1の有無"),
		"特許1通常実施権の有無": ラジオ値取得("特許1通常実施権の有無"),
		"特許1専用実施権の有無": ラジオ値取得("特許1専用実施権の有無"),
		"特許1特許権者": $("#特許1特許権者").val(),
		"特許1実施権者": $("#特許1実施権者").val(),
		"特許1特許料等": $("#特許1特許料等").val(),
		"特許1実施形態": $("#特許1実施形態").val(),
		"特許1問合せ先": $("#特許1問合せ先").val(),
		"特許2番号": $("#特許2番号").val(),
		"特許2の有無": ラジオ値取得("特許2の有無"),
		"特許2通常実施権の有無": ラジオ値取得("特許2通常実施権の有無"),
		"特許2専用実施権の有無": ラジオ値取得("特許2専用実施権の有無"),
		"特許2特許権者": $("#特許2特許権者").val(),
		"特許2実施権者": $("#特許2実施権者").val(),
		"特許2特許料等": $("#特許2特許料等").val(),
		"特許2実施形態": $("#特許2実施形態").val(),
		"特許2問合せ先": $("#特許2問合せ先").val(),
		"特許3番号": $("#特許3番号").val(),
		"特許3の有無": ラジオ値取得("特許3の有無"),
		"特許3通常実施権の有無": ラジオ値取得("特許3通常実施権の有無"),
		"特許3専用実施権の有無": ラジオ値取得("特許3専用実施権の有無"),
		"特許3特許権者": $("#特許3特許権者").val(),
		"特許3実施権者": $("#特許3実施権者").val(),
		"特許3特許料等": $("#特許3特許料等").val(),
		"特許3実施形態": $("#特許3実施形態").val(),
		"特許3問合せ先": $("#特許3問合せ先").val(),
		"特許4番号": $("#特許4番号").val(),
		"特許4の有無": ラジオ値取得("特許4の有無"),
		"特許4通常実施権の有無": ラジオ値取得("特許4通常実施権の有無"),
		"特許4専用実施権の有無": ラジオ値取得("特許4専用実施権の有無"),
		"特許4特許権者": $("#特許4特許権者").val(),
		"特許4実施権者": $("#特許4実施権者").val(),
		"特許4特許料等": $("#特許4特許料等").val(),
		"特許4実施形態": $("#特許4実施形態").val(),
		"特許4問合せ先": $("#特許4問合せ先").val(),
		"特許5番号": $("#特許5番号").val(),
		"特許5の有無": ラジオ値取得("特許5の有無"),
		"特許5通常実施権の有無": ラジオ値取得("特許5通常実施権の有無"),
		"特許5専用実施権の有無": ラジオ値取得("特許5専用実施権の有無"),
		"特許5特許権者": $("#特許5特許権者").val(),
		"特許5実施権者": $("#特許5実施権者").val(),
		"特許5特許料等": $("#特許5特許料等").val(),
		"特許5実施形態": $("#特許5実施形態").val(),
		"特許5問合せ先": $("#特許5問合せ先").val(),
		"実用新案の有無": ラジオ値取得("実用新案の有無"),
		"実施新案通常実施権の有無": ラジオ値取得("実施新案通常実施権の有無"),
		"実施新案専用実施権の有無": ラジオ値取得("実施新案専用実施権の有無"),
		"実用新案特許番号": $("#実用新案特許番号").val(),
		"特許実用新案備考": $("#特許実用新案備考").val(),
		"建設技術番号": $("#建設技術番号").val(),
		"港湾関連民間技術の評価年月日": $("#港湾関連民間技術の評価年月日").val(),
		"港湾関連民間技術の評価機関": $("#港湾関連民間技術の評価機関").val(),
		"港湾関連民間技術の評価URL": $("#港湾関連民間技術の評価URL").val(),
		"港湾に係る民間技術評価番号": $("#港湾に係る民間技術評価番号").val(),
		"民間技術評価の評価年月日": $("#民間技術評価の評価年月日").val(),
		"民間技術評価の評価URL": $("#民間技術評価の評価URL").val(),
		"制度の名称1": $("#制度の名称1").val(),
		"制度の番号1": $("#制度の番号1").val(),
		"制度の証明年月日1": $("#制度の証明年月日1").val(),
		"制度の証明機関名称1": $("#制度の証明機関名称1").val(),
		"制度の証明範囲1": $("#制度の証明範囲1").val(),
		"制度のURL1": $("#制度のURL1").val(),
		"制度の名称2": $("#制度の名称2").val(),
		"制度の番号2": $("#制度の番号2").val(),
		"制度の証明年月日2": $("#制度の証明年月日2").val(),
		"制度の証明機関名称2": $("#制度の証明機関名称2").val(),
		"制度の証明範囲2": $("#制度の証明範囲2").val(),
		"制度のURL2": $("#制度のURL2").val(),
		"証明項目表_データ": 証明項目表_データ,
		"実験等実施状況": $("#実験等実施状況").val(),
		"実験等実施状況写真": $("#実験等実施状況写真_縮小版").attr("src"),
		"実験等実施状況写真_タイトル": $("#実験等実施状況写真_タイトル").val(),
		"実験等実施状況写真_ファイル名": $("#実験等実施状況写真_ファイル名").val(),
		"実験等実施状況表_タイトル": $("#実験等実施状況表_タイトル").val(),
		"実験等実施状況表_データ": 実験等実施状況表_データ,
		"実験等実施状況表_見出し列数": $("#実験等実施状況表_見出し列数").val(),
		"実験等実施状況表_見出し行数": $("#実験等実施状況表_見出し行数").val(),
		"添付資料": $("#添付資料").val(),
		"参考文献": $("#参考文献").val(),
		"その他の写真1": $("#その他の写真1_縮小版").attr("src"),
		"その他の写真1_タイトル": $("#その他の写真1_タイトル").val(),
		"その他の写真1_ファイル名": $("#その他の写真1_ファイル名").val(),
		"その他の写真2": $("#その他の写真2_縮小版").attr("src"),
		"その他の写真2_タイトル": $("#その他の写真2_タイトル").val(),
		"その他の写真2_ファイル名": $("#その他の写真2_ファイル名").val(),
		"その他の写真3": $("#その他の写真3_縮小版").attr("src"),
		"その他の写真3_タイトル": $("#その他の写真3_タイトル").val(),
		"その他の写真3_ファイル名": $("#その他の写真3_ファイル名").val(),
	};
	return data;
}

function NETIS技術データ設定(data) {
	try {
		do {
			if (!data['製品名'] || 製品名 != data['製品名']) {
				console.error("データの種類が異なります。'" + 製品名 + "' != '" + data['製品名']+ "'");
				break;
			}
			if (!NETIS名称分類等設定(data['NETIS名称分類等'])) {
				console.error("名称分類等設定が読み込めません。");
				break;
			}
			if (!NETIS技術概要等設定(data['NETIS技術概要等'])) {
				console.error("技術概要等設定が読み込めません。");
				break;
			}
			if (!NETIS従来技術との比較設定(data['NETIS従来技術との比較'])) {
				console.error("従来技術との比較設定が読み込めません。");
				break;
			}
			if (!NETIS施工実績等設定(data['NETIS施工実績等'])) {
				console.error("施工実績等設定が読み込めません。");
				break;
			}
			return true;
		} while (0);
	} catch (e) {
		console.error("データ読み込み中に例外が発生しました。");
	}
	return false;
}

function NETIS技術データ取得() {
	let NETIS名称分類等 = NETIS名称分類等取得();
	if (!NETIS名称分類等) {
		console.error("保存できませんでした。");
		return null;
	}
	let NETIS技術概要等 = NETIS技術概要等取得();
	if (!NETIS技術概要等) {
		console.error("保存できませんでした。");
		return null;
	}
	let NETIS従来技術との比較 = NETIS従来技術との比較取得();
	if (!NETIS従来技術との比較) {
		console.error("保存できませんでした。");
		return null;
	}
	let NETIS施工実績等 = NETIS施工実績等取得();
	if (!NETIS施工実績等) {
		console.error("保存できませんでした。");
		return null;
	}
	let NETIS技術データ = {
		"製品名": 製品名,
		"NETIS名称分類等": NETIS名称分類等,
		"NETIS技術概要等": NETIS技術概要等,
		"NETIS従来技術との比較": NETIS従来技術との比較,
		"NETIS施工実績等": NETIS施工実績等,
	};
	return NETIS技術データ;
}

const 監査成功 = 0;
const 監査失敗 = 999;

function 表データ監査(data, 監査結果) {
	// TODO:
	return 監査結果;
}

function NETIS名称分類等監査(data, 監査結果) {
	if (data["技術名称"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「技術名称」が無指定です。\r\n";
	}
	if (data["副題"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「副題」が無指定です。\r\n";
	}
	if (data["技術開発年"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「技術開発年」が無指定です。\r\n";
	}
	if (!年月日か(data["記入年月日"], true)) {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「記入年月日」が不正です。YYYY/MM/DD形式で指定して下さい。\r\n";
	}
	if (data["情報提供の範囲"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「情報提供の範囲」が無指定です。\r\n";
	}
	if (data["分類1"] == "\t\t\t") {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「分類1」が無指定です。\r\n";
	}
	if (data["区分"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「区分」が無指定です。\r\n";
	}
	if (data["キーワード"].length == 0) {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「キーワード」が無指定です。\r\n";
	}
	if (data["開発目標"].length == 0) {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「開発目標」が無指定です。\r\n";
	}
	if (data["開発体制"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「開発体制」が無指定です。\r\n";
	}
	if (data["技術の会社"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「技術の会社」が無指定です。\r\n";
	}
	if (!郵便番号か(data["技術の郵便番号"], true)) {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「技術の郵便番号」が不正です。XXX-YYYY形式で指定して下さい。\r\n";
	}
	if (data["技術の住所"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「技術の住所」が無指定です。\r\n";
	}
	if (data["技術のTEL"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「技術のTEL」が無指定です。\r\n";
	}
	if (!電話番号か(data["技術のTEL"], true)) {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「技術のTEL」が不正です。入力内容をご確認下さい。\r\n";
	}
	if (!FAX番号か(data["技術のFAX"], true)) {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「技術のFAX」が不正です。入力内容をご確認下さい。\r\n";
	}
	if (!メールアドレスか(data["技術のEMAIL"], true)) {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「技術のEMAIL」が不正です。入力内容をご確認下さい。\r\n";
	}
	if (!URLか(data["技術のURL"], true)) {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「技術のURL」が不正です。入力内容をご確認下さい。\r\n";
	}
	if (data["営業の会社"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「営業の会社」が無指定です。\r\n";
	}
	if (!郵便番号か(data["営業の郵便番号"], true)) {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「営業の郵便番号」が不正です。XXX-YYYY形式で指定して下さい。\r\n";
	}
	if (data["営業の住所"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「営業の住所」が無指定です。\r\n";
	}
	if (data["営業のTEL"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「営業のTEL」が無指定です。\r\n";
	}
	if (!電話番号か(data["営業のTEL"], true)) {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「営業のTEL」が不正です。入力内容をご確認下さい。\r\n";
	}
	if (!FAX番号か(data["営業のFAX"], true)) {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「営業のFAX」が不正です。入力内容をご確認下さい。\r\n";
	}
	if (!メールアドレスか(data["営業のEMAIL"], true)) {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「営業のEMAIL」が不正です。入力内容をご確認下さい。\r\n";
	}
	if (!URLか(data["営業のURL"], true)) {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：名称分類等の「営業のURL」が不正です。入力内容をご確認下さい。\r\n";
	}
	監査結果 = 表データ監査(問合せその他表_データ, 監査結果);
	return 監査結果;
}

function NETIS技術概要等監査(data, 監査結果) {
	if (data["技術概要"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：概要の「技術概要」が無指定です。\r\n";
	}
	if (data["概要"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：概要の「概要」が無指定です。\r\n";
	}
	if (data["新規性及び期待される効果"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：概要の「新規性及び期待される効果」が無指定です。\r\n";
	}
	if (data["適用条件"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：概要の「適用条件」が無指定です。\r\n";
	}
	if (data["適用範囲"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：概要の「適用範囲」が無指定です。\r\n";
	}
	if (data["留意事項"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：概要の「留意事項」が無指定です。\r\n";
	}
	return 監査結果;
}

function NETIS従来技術との比較監査(data, 監査結果) {
	if (data["従来技術名"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：従来技術との比較の「従来技術名」が無指定です。\r\n";
	}
	if (data["基準とする数量"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：従来技術との比較の「基準とする数量」が無指定です。\r\n";
	}
	if (data["基準とする単位"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：従来技術との比較の「基準とする単位」が無指定です。\r\n";
	}
	if (data["新技術内訳表_データ"] == 表計算初期化データ()) {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：従来技術との比較の「新技術内訳表」が無指定です。\r\n";
	}
	if (data["従来技術内訳表_データ"] == 表計算初期化データ()) {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：従来技術との比較の「従来技術内訳表」が無指定です。\r\n";
	}
	if (data["新技術工程"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：従来技術との比較の「新技術工程」が無指定です。\r\n";
	}
	if (data["従来技術工程"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：従来技術との比較の「従来技術工程」が無指定です。\r\n";
	}
	if (data["品質比較"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：従来技術との比較の「品質比較」が無指定です。\r\n";
	}
	if (data["安全性比較"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：従来技術との比較の「安全性比較」が無指定です。\r\n";
	}
	if (data["施工性比較"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：従来技術との比較の「施工性比較」が無指定です。\r\n";
	}
	if (data["周辺環境への影響比較"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：従来技術との比較の「周辺環境への影響比較」が無指定です。\r\n";
	}
	if (data["技術のアピールポイント等"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：従来技術との比較の「技術のアピールポイント等」が無指定です。\r\n";
	}
	if (data["コストタイプ"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：従来技術との比較の「コストタイプ」が無指定です。\r\n";
	}
	if (data["施行単価"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：従来技術との比較の「施行単価」が無指定です。\r\n";
	}
	if (data["歩掛の種類"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：従来技術との比較の「歩掛の種類」が無指定です。\r\n";
	}
	if (data["施工方法"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：従来技術との比較の「施工方法」が無指定です。\r\n";
	}
	if (data["今後の課題とその対応計画"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：従来技術との比較の「今後の課題とその対応計画」が無指定です。\r\n";
	}
	return 監査結果;
}

function NETIS施工実績等監査(data, 監査結果) {
	if (data["国土交通省の実績何件"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：施工実績等の「国土交通省の実績何件」が無指定です。\r\n";
	}
	if (data["その他公共機関の実績何件"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：施工実績等の「その他公共機関の実績何件」が無指定です。\r\n";
	}
	if (data["民間の実績何件"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：施工実績等の「民間の実績何件」が無指定です。\r\n";
	}
	if (data["特許の有無"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：施工実績等の「特許の有無」が無指定です。\r\n";
	}
	if (data["実用新案の有無"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：施工実績等の「実用新案の有無」が無指定です。\r\n";
	}
	if (data["実験等実施状況"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：施工実績等の「実験等実施状況」が無指定です。\r\n";
	}
	if (data["添付資料"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：施工実績等の「添付資料」が無指定です。\r\n";
	}
	if (data["参考文献"] == '') {
		監査結果[0] = 監査失敗;
		監査結果[1] += "エラー：施工実績等の「参考文献」が無指定です。\r\n";
	}
	return 監査結果;
}

function NETIS技術データ監査(data, 監査結果) {
	監査結果[0] = 監査成功;
	try {
		if (!data['製品名'] || 製品名 != data['製品名']) {
			監査結果[0] = 監査失敗;
			監査結果[1] += "データの種類が異なります。「" + 製品名 + "」ではありません。\r\n";
		}
		監査結果 = NETIS名称分類等監査(data["NETIS名称分類等"], 監査結果);
		監査結果 = NETIS技術概要等監査(data["NETIS技術概要等"], 監査結果);
		監査結果 = NETIS従来技術との比較監査(data["NETIS従来技術との比較"], 監査結果);
		監査結果 = NETIS施工実績等監査(data["NETIS施工実績等"], 監査結果);
	} catch (e) {
		監査結果[0] = 監査失敗;
		監査結果[1] += "例外が発生しました。管理者にご連絡下さい。\r\n";
	}
	if (監査結果[0] == 監査成功) {
		監査結果[1] += "データ監査に成功しました。\r\n";
	} else {
		監査結果[1] += "データ監査に失敗しました。\r\n";
	}
	return 監査結果;
}
