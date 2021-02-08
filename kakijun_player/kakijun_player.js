// kakijun_player.js
// Copyright (C) 2021 katahiromz. All Rights Reserved.

let KP_debugging = true;

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
				break;
			case KP_MODE_LINE_INFO:
				$("#animation_list").focus();
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
			$("#mode_5_back_button").click(function(){
				KP_set_mode(KP_MODE_EXPLANATION);
			});
			$("#mode_5_clear_button").click(function(){
				;
			});
			$("#mode_5_next_button").click(function(){
				;
			});
			$("#mode_5_done_button").click(function(){
				KP_set_mode(KP_MODE_LINE_INFO);
			});

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
