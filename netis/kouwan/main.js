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
	var d = new Date();
	var yyyy = d.getFullYear();
	var mm = ("00" + (d.getMonth() + 1)).slice(-2);
	var dd = ("00" + d.getDate()).slice(-2);
	var result = yyyy + "." + mm + "." + dd;
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
		let new1 = $("#新技術サイクルコスト1年").val();
		let new3 = $("#新技術サイクルコスト3年").val();
		let new5 = $("#新技術サイクルコスト5年").val();
		let new10 = $("#新技術サイクルコスト10年").val();
		let old1 = $("#従来技術サイクルコスト1年").val();
		let old3 = $("#従来技術サイクルコスト3年").val();
		let old5 = $("#従来技術サイクルコスト5年").val();
		let old10 = $("#従来技術サイクルコスト10年").val();
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
	for (var i in 表データ) {
		x = 0;
		for (var k in 表データ[i]) {
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
	for (var i in 表データ) {
		if (y > 最大行数)
			break;
		html += '<tr>';
		x = 0;
		for (var k in 表データ[i]) {
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
	for (var i in 問合せその他表_データ) {
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
	_分類値設定内部(id, value);
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
	let 基準とする数量 = Number($("#基準とする数量").val());
	let 基準とする単位 = $("#基準とする単位").val();
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
	let 従来技術工程 = Number($("#従来技術工程").val());
	let 新技術工程 = Number($("#新技術工程").val());
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
	var kanaMap = {
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
	var reg = new RegExp('(' + Object.keys(kanaMap).join('|') + ')', 'g');
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

function 年月日正規化(text) {
	text = text.trim();
	text = 全角英数字を半角に(text);
	text = text.replace(/(ー|ｰ)/g, '-'); // 長音をハイフンに変換。
	text = text.replace(/-/g, '/'); // ハイフンをスラッシュに変換。
	text = text.replace(/\./g, '/'); // ドットをスラッシュに変換。
	let ary = text.split('/');
	if (ary.length == 3) {
		text = ary[0] + '/' + ('0' + ary[1]).slice(-2) + '/' + ary[2];
	}
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
	if (空でもいいか && text.trim() == "") {
		return true;
	}
	return /^(\+|-)?[0-9,]+$/.test(text);
}

function 符号なし整数か(text, 空でもいいか) {
	if (空でもいいか && text.trim() == "") {
		return true;
	}
	return /^[0-9,]+$/.test(text);
}

function 郵便番号か(text, 空でもいいか) {
	if (空でもいいか && text.trim() == "") {
		return true;
	}
	return /^[0-9]{3}-?[0-9]{4}$/.test(text);
}

function 数値か(text, 空でもいいか) {
	if (空でもいいか && text.trim() == "") {
		return true;
	}
	// https://webllica.com/javascript-number-check-function/
	return /^[+,-]?\d(\.\d+)?$/.test(text);
}

function 符号なし数値か(text, 空でもいいか) {
	if (空でもいいか && text.trim() == "") {
		return true;
	}
	// https://webllica.com/javascript-number-check-function/
	return /^\d(\.\d+)?$/.test(text);
}

function 西暦年か(text, 空でもいいか) {
	if (空でもいいか && text.trim() == "") {
		return true;
	}
	return /^\d{4}$/.test(text);
}

function 年月日か(text, 空でもいいか) {
	if (空でもいいか && text.trim() == "") {
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
	if (空でもいいか && text.trim() == "") {
		return true;
	}
	return /^[\d\-\+]+$/.test(text);
}

function FAX番号か(text, 空でもいいか) {
	return 電話番号か(text, 空でもいいか);
}

function メールアドレスか(text, 空でもいいか) {
	if (空でもいいか && text.trim() == "") {
		return true;
	}
	text = text.trim();
	// https://techacademy.jp/magazine/33601
	var reg = /^[A-Za-z0-9]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]{1,}\.[A-Za-z0-9]{1,}$/;
	return reg.test(text);
}

function URLか(text, 空でもいいか) {
	if (空でもいいか && text.trim() == "") {
		return true;
	}
	text = text.trim();
	// https://www.it-swarm-ja.tech/ja/javascript/javascript%E3%81%AE%E6%96%87%E5%AD%97%E5%88%97%E3%81%8Curl%E3%81%8B%E3%81%A9%E3%81%86%E3%81%8B%E3%82%92%E7%A2%BA%E8%AA%8D/971354377/
	var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
		'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
		'((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
		'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
		'(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
		'(\\#[-a-z\\d_]*)?$','i'); // fragment locator
	return !!pattern.test(text);
}

function 表タイトルか(text, 空でもいいか) {
	if (空でもいいか && text.trim() == "") {
		return true;
	}
	// TODO:
	return true;
}

function 写真タイトルか(text, 空でもいいか) {
	if (空でもいいか && text.trim() == "") {
		return true;
	}
	// TODO:
	return true;
}

function 建設技術番号か(text, 空でもいいか) {
	if (空でもいいか && text.trim() == "") {
		return true;
	}
	// TODO:
	text = 全角英数字を半角に(text);
	return 半角文字のみか(text);
}

function CORINS登録番号か(text, 空でもいいか) {
	if (空でもいいか && text.trim() == "") {
		return true;
	}
	// TODO:
	text = 全角英数字を半角に(text);
	return 半角文字のみか(text);
}

function 正しい文章か(text, 空でもいいか) {
	if (空でもいいか && text.trim() == "") {
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
