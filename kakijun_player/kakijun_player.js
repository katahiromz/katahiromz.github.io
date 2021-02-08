// kakijun_player.js
// Copyright (C) 2021 katahiromz. All Rights Reserved.

let KP_debugging = true;

const KP_CANVAS_WIDTH = 200;
const KP_CANVAS_HEIGHT = 200;

const KP_MODE_INITIAL = 1;
const KP_MODE_NAME = 2;
const KP_MODE_SET_CHARACTER = 3;
const KP_MODE_EXPLANATION = 4;
const KP_MODE_FILL_LINE = 5;
const KP_MODE_LINE_INFO = 6;
const KP_MODE_GENERATING = 7;
const KP_MODE_DONE = 8;
const KP_MODE_MOVIE_LIST = 9;
const KP_MODE_MAX = KP_MODE_MOVIE_LIST;
let KP_mode = KP_MODE_INITIAL;

const KP_MOVIE_INITIAL_NAME = "無題";
let KP_movie_name = KP_MOVIE_INITIAL_NAME;

let KP_character = '';
let KP_font = '';
let KP_is_drawing_line = 0;
let KP_line_width = 8;
let KP_line_color = "255, 0, 0, 1";

(function($){
	$(function(){
		let KP_set_mode = function(mode) {
			if (KP_debugging) {
				if (mode < KP_MODE_INITIAL || KP_MODE_MAX < mode) {
					alert("ERROR: mode");
					mode = KP_MODE_INITIAL;
				}
			} else {
				for (let i = KP_MODE_INITIAL; i <= KP_MODE_MAX; ++i) {
					if (i == mode) {
						$("#mode_" + i + "_section").removeClass("invisible");
					} else {
						$("#mode_" + i + "_section").addClass("invisible");
					}
				}
			}
			if (mode != KP_MODE_INITIAL || location.href.slice(-1) != '\/') {
				location.href = "#mode_" + mode + "_ref";
			}
			KP_mode = mode;
			switch (mode) {
			case KP_MODE_INITIAL:
				KP_movie_name = KP_MOVIE_INITIAL_NAME;
				break;
			case KP_MODE_NAME:
				$("#movie_name_textbox").val(KP_movie_name);
				$("#movie_name_textbox").select();
				break;
			case KP_MODE_SET_CHARACTER:
				$("#character_textbox").select();
				break;
			case KP_MODE_EXPLANATION:
				$("#mode_4_next_button").focus();
				break;
			case KP_MODE_FILL_LINE:
				$("#mode_5_next_button").focus();
				$("#stroke_index_span").text("1");
				break;
			case KP_MODE_LINE_INFO:
				$("#animation_list").focus();
				$("#stroke_index_span").text("1");
				break;
			case KP_MODE_GENERATING:
				break;
			case KP_MODE_DONE:
				$("#mode_8_apng_button").focus();
				break;
			case KP_MODE_MOVIE_LIST:
				$("#mode_9_go_top_button").focus();
				break;
			}
		};
		let KP_fill_text = function(ctx, x, y, text, font, color = "black") {
			ctx.font = font;
			ctx.fillStyle = color;
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'center';
			ctx.fillText(text, x, y);
		}
		let KP_stroke_text = function(ctx, x, y, text, font, color = "black") {
			ctx.font = font;
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'center';
			ctx.strokeStyle = color;
			ctx.lineWidth = 3;
			ctx.strokeText(text, x, y);
		}
		let KP_update_character_canvas = function(text, canvas, font){
			let ctx = canvas.getContext("2d");
			let width = canvas.width, height = canvas.height;
			let x = Math.floor(width / 2), y = Math.floor(height / 2);
			let cxy = Math.min(width, height);
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, width, height);
			KP_fill_text(ctx, x, y, text, cxy + "px '" + font + "'");
		};
		let KP_draw_line = function(canvas, x, y) {
			let ctx = canvas.getContext('2d');
			ctx.lineCap = ctx.lineJoin = "round";
			ctx.lineWidth = KP_line_width;
			ctx.strokeStyle = "rgba(" + KP_line_color + ")";
			if (KP_is_drawing_line == 1) {
				KP_is_drawing_line = 2;
				ctx.beginPath();
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
			ctx.stroke();
		};
		let KP_main = function() {
			// KP_MODE_INITIAL
			$("#mode_1_upload_json_button").click(function(){
				;
			});
			$("#mode_1_movie_list_button").click(function(){
				KP_set_mode(KP_MODE_MOVIE_LIST);
			});
			$("#mode_1_next_button").click(function(){
				KP_set_mode(KP_MODE_NAME);
			});

			// KP_MODE_NAME
			$("#mode_2_back_button").click(function(){
				KP_set_mode(KP_MODE_INITIAL);
			});
			$("#mode_2_next_button").click(function(){
				let text = $("#movie_name_textbox").val().trim();
				if (text.length == 0) {
					$("#movie_name_textbox").select();
					alert("動画名を入力して下さい。");
					return;
				}
				KP_movie_name = text;
				$(".movie_name_span").text(text);
				KP_set_mode(KP_MODE_SET_CHARACTER);
			});

			// KP_MODE_SET_CHARACTER
			$("#mode_3_back_button").click(function(){
				KP_set_mode(KP_MODE_NAME);
			});
			let KP_mode_3_set_text = function(text, font) {
				if (text.length >= 2) {
					text = text.substr(0, 1);
				}
				if (text.length == 1) {
					KP_update_character_canvas(text, $("#base_canvas")[0], font);
				}
				return text;
			};
			$("#mode_3_next_button").click(function(){
				let text = $("#character_textbox").val().trim();
				if (text.length == 0) {
					$("#character_textbox").select();
					alert("文字を入力して下さい。");
					return;
				}
				let font = $("#font_selectbox").val().trim();
				text = KP_mode_3_set_text(text, font);
				KP_character = text;
				KP_font = font;
				KP_set_mode(KP_MODE_EXPLANATION);
			});
			$("#character_textbox").on('keyup change', function(){
				let text = $("#character_textbox").val().trim();
				let font = $("#font_selectbox").val().trim();
				text = KP_mode_3_set_text(text, font);
			});
			$("#font_selectbox").on('change', function(){
				let text = $("#character_textbox").val().trim();
				let font = $("#font_selectbox").val().trim();
				text = KP_mode_3_set_text(text, font);
			});

			// KP_MODE_EXPLANATION
			$("#mode_4_back_button").click(function(){
				KP_set_mode(KP_MODE_SET_CHARACTER);
			});
			$("#mode_4_next_button").click(function(){
				KP_set_mode(KP_MODE_FILL_LINE);
			});

			// KP_MODE_FILL_LINE
			let KP_set_line_width = function(name, width) {
				switch (name) {
				case "small":
					$("#mode_5_small").addClass("focus_box");
					$("#mode_5_middle").removeClass("focus_box");
					$("#mode_5_large").removeClass("focus_box");
					break;
				case "middle":
					$("#mode_5_small").removeClass("focus_box");
					$("#mode_5_middle").addClass("focus_box");
					$("#mode_5_large").removeClass("focus_box");
					break;
				case "large":
					$("#mode_5_small").removeClass("focus_box");
					$("#mode_5_middle").removeClass("focus_box");
					$("#mode_5_large").addClass("focus_box");
					break;
				}
				KP_line_width = width;
			};
			let KP_set_line_color = function(name, color) {
				switch (name) {
				case "black":
					$("#mode_5_black").addClass("focus_box");
					$("#mode_5_red").removeClass("focus_box");
					$("#mode_5_blue").removeClass("focus_box");
					$("#mode_5_green").removeClass("focus_box");
					break;
				case "red":
					$("#mode_5_black").removeClass("focus_box");
					$("#mode_5_red").addClass("focus_box");
					$("#mode_5_blue").removeClass("focus_box");
					$("#mode_5_green").removeClass("focus_box");
					break;
				case "blue":
					$("#mode_5_black").removeClass("focus_box");
					$("#mode_5_red").removeClass("focus_box");
					$("#mode_5_blue").addClass("focus_box");
					$("#mode_5_green").removeClass("focus_box");
					break;
				case "green":
					$("#mode_5_black").removeClass("focus_box");
					$("#mode_5_red").removeClass("focus_box");
					$("#mode_5_blue").removeClass("focus_box");
					$("#mode_5_green").addClass("focus_box");
					break;
				}
				KP_line_color = color;
			};
			$("#mode_5_back_button").click(function(){
				KP_set_mode(KP_MODE_EXPLANATION);
			});
			$("#mode_5_clear_button").click(function(){
				let canvas = $("#mode_5_drawing_canvas")[0];
				let ctx = canvas.getContext("2d");
				ctx.fillStyle = 'white';
				ctx.fillRect(0, 0, KP_CANVAS_WIDTH, KP_CANVAS_HEIGHT);
			});
			$("#mode_5_next_button").click(function(){
				;
			});
			$("#mode_5_done_button").click(function(){
				KP_set_mode(KP_MODE_LINE_INFO);
			});
			$("#mode_5_drawing_canvas").mousedown(function(){
				KP_is_drawing_line = 1;
			}).mouseup(function(){
				KP_is_drawing_line = 0;
			}).mousemove(function(e){
				if (!KP_is_drawing_line)
					return false;
				let canvas = $("#mode_5_drawing_canvas")[0];
				KP_draw_line(canvas, e.offsetX, e.offsetY);
			});
			$(".mode_5_bold a").click(function(){
				KP_set_line_width($(this).data("name"), $(this).data("bold"));
				return false;
			});
			KP_set_line_width("middle", 8);
			$(".mode_5_color a").click(function(){
				KP_set_line_color($(this).data("name"), $(this).data("color"));
				return false;
			});
			KP_set_line_color("red", "255, 0, 0, 1");

			// KP_MODE_LINE_INFO
			$("#mode_6_back_button").click(function(){
				KP_set_mode(KP_MODE_FILL_LINE);
			});
			$("#mode_6_next_button").click(function(){
				KP_set_mode(KP_MODE_GENERATING);
			});

			// KP_MODE_GENERATING
			$("#mode_7_back_button").click(function(){
				KP_set_mode(KP_MODE_FILL_LINE);
			});

			// KP_MODE_DONE
			$("#mode_8_apng_button").click(function(){
				;
			});
			$("#mode_8_json_button").click(function(){
				;
			});
			$("#mode_8_go_top_button").click(function(){
				KP_set_mode(KP_MODE_INITIAL);
			});

			// KP_MODE_MOVIE_LIST
			$("#mode_9_go_top_button").click(function(){
				KP_set_mode(KP_MODE_INITIAL);
			});

			KP_set_mode(KP_MODE_INITIAL);
			$("#mode_1_next_button").focus();
		};
		KP_main();
	});
})(jQuery);
