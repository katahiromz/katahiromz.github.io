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
let KP_line_color = "red";
let KP_last_pos = [0, 0]; // [x, y]
let KP_line_index = 0;
let KP_base_image = null; // new Image()
let KP_line_images = []; // new Image()[]
let KP_current_tool = "brush";

(function($){
	$(function(){
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
			ctx.lineWidth = 1;
			ctx.strokeText(text, x, y);
		}
		let KP_flood_fill = function(canvas, x, y, fillColor = [0, 0, 0, 255]) {
			x = Math.floor(x);
			y = Math.floor(y);
			// https://stackoverflow.com/questions/53077955/how-do-i-do-flood-fill-on-the-html-canvas-in-javascript
			let ctx = canvas.getContext("2d");
			let imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
			let getPixel = function(x, y) {
				if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height)
					return [-1, -1, -1, -1];
				let offset = (y * imageData.width + x) * 4;
				return imageData.data.slice(offset, offset + 4);
			};
			let setPixel = function(x, y) {
				if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) {
					return;
				}
				let offset = (y * imageData.width + x) * 4;
				imageData.data[offset + 0] = fillColor[0];
				imageData.data[offset + 1] = fillColor[1];
				imageData.data[offset + 2] = fillColor[2];
				imageData.data[offset + 3] = fillColor[3];
			};
			let colorMatch = function(a, b) {
				return a[0] == b[0] && a[1] == b[1] && a[2] == b[2] && a[3] == b[3];
			};
			let targetColor = getPixel(x, y);
			let fillPixel = function(x, y) {
				let currentColor = getPixel(x, y);
				if (currentColor[0] == -1)
					return;
				if (colorMatch(currentColor, targetColor)) {
					setPixel(x, y);
					fillPixel(x - 1, y);
					fillPixel(x + 1, y);
					fillPixel(x, y - 1);
					fillPixel(x, y + 1);
				}
			};
			if (!colorMatch(targetColor, fillColor)) {
				try {
					fillPixel(x, y);
					ctx.putImageData(imageData, 0, 0);
				} catch (e) {
					;
				}
			}
		};
		let KP_draw_character = function(canvas, text, font, color = "lightgray", color2 = null){
			let ctx = canvas.getContext("2d");
			let width = canvas.width, height = canvas.height;
			let x = Math.floor(width / 2), y = Math.floor(height / 2);
			let cxy = Math.min(width, height);
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, width, height);
			KP_fill_text(ctx, x, y, text, cxy + "px '" + font + "'", color);
			if (color2) {
				KP_stroke_text(ctx, x, y, text, cxy + "px '" + font + "'", color2);
			}
			KP_base_image = new Image();
			KP_base_image.src = canvas.toDataURL();
		};
		let KP_next_line = function(index, do_add = true) {
			let canvas = $("#mode_5_drawing_canvas")[0];
			if (index >= 1) {
				let img = new Image();
				img.src = canvas.toDataURL();
				if (do_add) {
					KP_line_images.push(img);
				} else {
					KP_line_images[index - 1] = img;
				}
			}
			$("#stroke_index_span").text(index + 1);
			let ctx = canvas.getContext('2d');
			ctx.drawImage(KP_base_image, 0, 0);
		};
		let KP_set_mode = function(mode, go_back = false) {
			if (!KP_debugging) {
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
				if (go_back) {
					KP_line_index = KP_line_images.length - 1;
				} else {
					KP_line_index = 0;
				}
				KP_next_line(KP_line_index, !go_back);
				$("#mode_5_next_button").focus();
				break;
			case KP_MODE_LINE_INFO:
				if (go_back) {
					KP_line_index = KP_line_images.length - 1;
				} else {
					KP_line_index = 0;
				}
				$("#animation_list").focus();
				$("#stroke_index_span").text(KP_line_index);
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
				KP_set_mode(KP_MODE_INITIAL, true);
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
				KP_set_mode(KP_MODE_NAME, true);
			});
			$("#mode_3_next_button").click(function(){
				let text = $("#character_textbox").val().trim();
				//if (text.length == 0) {
				//	$("#character_textbox").select();
				//	alert("文字を入力して下さい。");
				//	return;
				//}
				let font = $("#font_selectbox").val().trim();
				text = KP_draw_character($("#base_canvas")[0], text, font);
				KP_character = text;
				KP_font = font;
				KP_set_mode(KP_MODE_EXPLANATION);
			});
			$("#character_textbox").on('keyup change', function(){
				let text = $("#character_textbox").val().trim();
				let font = $("#font_selectbox").val().trim();
				text = KP_draw_character($("#base_canvas")[0], text, font);
			});
			$("#font_selectbox").on('change', function(){
				let text = $("#character_textbox").val().trim();
				let font = $("#font_selectbox").val().trim();
				text = KP_draw_character($("#base_canvas")[0], text, font);
			});

			// KP_MODE_EXPLANATION
			$("#mode_4_back_button").click(function(){
				KP_set_mode(KP_MODE_SET_CHARACTER, true);
			});
			$("#mode_4_next_button").click(function(){
				KP_set_mode(KP_MODE_FILL_LINE);
			});

			// KP_MODE_FILL_LINE
			let KP_mode_5_canvas = $("#mode_5_drawing_canvas")[0];
			let KP_set_tool = function(name, width) {
				switch (name) {
				case "small":
					$("#mode_5_small").addClass("focus_box");
					$("#mode_5_middle").removeClass("focus_box");
					$("#mode_5_large").removeClass("focus_box");
					$("#mode_5_eraser").removeClass("focus_box");
					$("#mode_5_auto").removeClass("focus_box");
					KP_line_width = width;
					KP_current_tool = "brush";
					break;
				case "middle":
					$("#mode_5_small").removeClass("focus_box");
					$("#mode_5_middle").addClass("focus_box");
					$("#mode_5_large").removeClass("focus_box");
					$("#mode_5_eraser").removeClass("focus_box");
					$("#mode_5_auto").removeClass("focus_box");
					KP_line_width = width;
					KP_current_tool = "brush";
					break;
				case "large":
					$("#mode_5_small").removeClass("focus_box");
					$("#mode_5_middle").removeClass("focus_box");
					$("#mode_5_large").addClass("focus_box");
					$("#mode_5_eraser").removeClass("focus_box");
					$("#mode_5_auto").removeClass("focus_box");
					KP_line_width = width;
					KP_current_tool = "brush";
					break;
				case "eraser":
					$("#mode_5_small").removeClass("focus_box");
					$("#mode_5_middle").removeClass("focus_box");
					$("#mode_5_large").removeClass("focus_box");
					$("#mode_5_eraser").addClass("focus_box");
					$("#mode_5_auto").removeClass("focus_box");
					KP_line_width = 8;
					KP_current_tool = "eraser";
					break;
				case "auto":
					$("#mode_5_small").removeClass("focus_box");
					$("#mode_5_middle").removeClass("focus_box");
					$("#mode_5_large").removeClass("focus_box");
					$("#mode_5_eraser").removeClass("focus_box");
					$("#mode_5_auto").addClass("focus_box");
					KP_line_width = 8;
					KP_current_tool = "auto";
					break;
				}
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
				KP_set_mode(KP_MODE_EXPLANATION, true);
			});
			$("#mode_5_clear_button").click(function(){
				KP_draw_character($("#mode_5_drawing_canvas")[0], KP_character, KP_font);
				KP_is_drawing_line = 0;
			});
			$("#mode_5_next_button").click(function(){
				;
			});
			$("#mode_5_done_button").click(function(){
				KP_set_mode(KP_MODE_LINE_INFO);
			});
			let KP_pos = function(e){
				e = e.originalEvent || e;
				let x = e.clientX - KP_mode_5_canvas.getBoundingClientRect().left;
				let y = e.clientY - KP_mode_5_canvas.getBoundingClientRect().top;
				return [x, y];
			};
			let KP_mode_5_move = function(pos){
				if (!KP_is_drawing_line)
					return false;
				let ctx = KP_mode_5_canvas.getContext("2d");
				ctx.lineCap = ctx.lineJoin = "round";
				ctx.lineWidth = KP_line_width;
				ctx.strokeStyle = KP_line_color;
				ctx.beginPath();
				ctx.moveTo(KP_last_pos[0], KP_last_pos[1]);
				ctx.lineTo(pos[0], pos[1]);
				ctx.stroke();
				KP_last_pos = pos;
				return false;
			};
			let KP_mode_5_down = function(pos){
				if (KP_current_tool == "auto") {
					KP_flood_fill($("#mode_5_drawing_canvas")[0], pos[0], pos[1]);
					return false;
				}
				KP_is_drawing_line = 1;
				KP_last_pos = pos;
				return false;
			};
			let KP_mode_5_up = function(pos){
				KP_mode_5_move(pos);
				KP_is_drawing_line = 0;
				return false;
			};
			$("#mode_5_drawing_canvas").mousedown(function(e){
				return KP_mode_5_down(KP_pos(e));
			}).mouseup(function(e){
				return KP_mode_5_up(KP_pos(e));
			}).mousemove(function(e){
				return KP_mode_5_move(KP_pos(e));
			}).on('touchstart', function(e){
				e = e.originalEvent || e;
				if (e.changedTouches.length == 1) {
					KP_mode_5_down(KP_pos(e.changedTouches[0]));
				}
				return false;
			}).on('touchmove', function(e){
				e = e.originalEvent || e;
				e.preventDefault();
				if (e.changedTouches.length == 1) {
					KP_mode_5_move(KP_pos(e.changedTouches[0]));
				}
				return false;
			}).on('touchend', function(e){
				e = e.originalEvent || e;
				if (e.changedTouches.length == 1) {
					KP_mode_5_up(KP_pos(e.changedTouches[0]));
				}
				return false;
			});
			$(".mode_5_tool a").click(function(){
				KP_set_tool($(this).data("name"), $(this).data("tool"));
				return false;
			});
			KP_set_tool("middle", 8);
			$(".mode_5_color a").click(function(){
				KP_set_line_color($(this).data("name"), $(this).data("color"));
				return false;
			});
			KP_set_line_color("red", "red");

			// KP_MODE_LINE_INFO
			$("#mode_6_back_button").click(function(){
				KP_set_mode(KP_MODE_FILL_LINE, true);
			});
			$("#mode_6_next_button").click(function(){
				KP_set_mode(KP_MODE_GENERATING);
			});

			// KP_MODE_GENERATING
			$("#mode_7_back_button").click(function(){
				KP_set_mode(KP_MODE_FILL_LINE, true);
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
