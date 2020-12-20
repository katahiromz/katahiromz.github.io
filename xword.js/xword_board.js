// NOTE: This needs jQuery UI.
;(function($){
	$.widget("custom.xword_board", {
		options: {
			cx: 7,
			cy: 7,
			change: function(event, cap){
				console.log("change event: " + event.type);
			},
			data: null,
			show_answer: false,
		},
		_create: function(){
			if (this.options.text){
				this.text(this.options.text);
			} else {
				
				this._build();
			}
		},
		_init: function(){
		},
		cx: function(){
			return this.options.cx;
		},
		cy: function(){
			return this.options.cy;
		},
		isData: function(value){
			if (Array.isArray(value) && value.length > 0){
				let len1 = value.length, len2 = value[0].length;
				for (let i = 0; i < len1; ++i){
					if (value[i].length != len2)
						return false;
				}
				return true;
			}
			return false;
		},
		文字正規化: function(str){
			let text = '';
			for (let i = 0; i < str.length; ++i) {
				if (str[i] == '#' || str[i] == '■') {
					text += '■';
				} else if (str[i] == ' ' || str[i] == '　') {
					text += '　';
				} else {
					text += str[i];
				}
			}
			text = text.toUpperCase();
			text = 半角カナを全角に(text);
			text = ひらがなをカタカナに(text);
			text = 半角英数字を全角に(text);
			text = 小文字を大文字に(text);
			return text;
		},
		normalizeData: function(value){
			if (value == undefined) {
				value = this.options.data;
			}
			let ary = value.concat();
			for (let i = 0; i < ary.length; ++i){
				ary[i] = this.文字正規化(ary[i]);
			}
			return ary;
		},
		data: function(newValue){
			if (newValue == undefined){
				return this.options.data;
			} else {
				if (this.isData(newValue)){
					this.options.data = this.normalizeData(newValue);
					this.options.cx = newValue[0].length;
					this.options.cy = newValue.length;
					this._build();
				}
			}
		},
		text: function(newValue){
			if (newValue == undefined){
				return this._data2text(this.data());
			} else {
				this.data(this._text2data(newValue));
			}
		},
		_data2text: function(data){
			let ary = data.concat();
			let text = ary.join("┃\n┃");
			let cx = ary[0].length;
			let bar = Array(cx + 1).join("━");
			let ret = "┏" + bar + "┓\n┃" + text + "┃\n┗" + bar + "┛\n";
			return ret;
		},
		_text2data: function(text){
			let data = text.join("\n");
			data = data.replace(/━/g, "");
			data = data.replace(/┏┓\n┃/g, '');
			data = data.replace(/┃\n┗┛/g, '');
			data = data.replace(/┃\n┃/g, "\n");
			return data.split("\n");
		},
		cell: function(x, y, ch){
			let self = this;
			if (self.options.data && x >= 0 && y >= 0 &&
			    y < self.options.data.length &&
			    x < self.options.data[0].length)
			{
				if (ch == undefined){
					ch = $("#" + this._get_id(x, y) + " input").val();
					if (ch == '' || ch == ' ' || ch == '　') {
						ch = '　';
					}
					return ch;
				} else {
					ch = this.文字正規化(ch);
					if (ch == '■' || ch == '#'){
						ch = '■';
						$("#" + this._get_id(x, y)).addClass('xword_board-cell-black');
						$("#" + this._get_id(x, y)).removeClass('xword_board-cell-white');
						$("#" + this._get_id(x, y)).removeClass('xword_board-cell-red');
						$("#" + this._get_id(x, y)).removeClass('xword_board-cell-yellow');
						$("#" + this._get_id(x, y) + " input").val(ch);
					} else {
						$("#" + this._get_id(x, y)).addClass('xword_board-cell-white');
						$("#" + this._get_id(x, y)).removeClass('xword_board-cell-black');
						$("#" + this._get_id(x, y)).removeClass('xword_board-cell-red');
						$("#" + this._get_id(x, y)).removeClass('xword_board-cell-yellow');
						if (ch == '' || ch == ' ' || ch == '　') {
							$("#" + this._get_id(x, y) + " input").val('');
						} else {
							$("#" + this._get_id(x, y) + " input").val(ch);
						}
					}
				}
			}
		},
		mark: function(x, y, mark){
			let self = this;
			if (self.options.data && x >= 0 && y >= 0 &&
			    y < self.options.data.length &&
			    x < self.options.data[0].length)
			{
				if (mark == undefined){
					return $("#" + this._get_id(x, y) + " .xword_board-small-text-mark").text();
				} else {
					$("#" + this._get_id(x, y) + " .xword_board-small-text-mark").text(mark);
				}
			}
		},
		number: function(x, y, num){
			let self = this;
			if (self.options.data && x >= 0 && y >= 0 &&
			    y < self.options.data.length &&
			    x < self.options.data[0].length)
			{
				if (num == undefined){
					return $("#" + this._get_id(x, y) + " .xword_board-small-text-number").text();
				} else {
					$("#" + this._get_id(x, y) + " .xword_board-small-text-number").text(num);
				}
			}
		},
		_build: function(){
			let self = this;
			let id = self.element.prop("id");
			if (!id){
				id = "the-xword-board-" + math.random();
				self.element.prop("id", id);
			}
			let html = '';
			if (self.options.data){
				let data = self.options.data;
				html += '<table class="xword_board-table">';
				html += '  <tbody>';
				let cx = this.options.cx, cy = this.options.cy;
				for(let y = 0; y < cy; ++y){
					html += '<tr>';
					for(let x = 0; x < cx; ++x){
						html += '<td id="' + self._get_id(x, y) + '" ';
						let ch = data[y][x];
						if (ch == '■' || ch == '#'){
							html += 'class="xword_board-cell xword_board-cell-black">';
						} else {
							html += 'class="xword_board-cell xword_board-cell-white">';
						}
						html += '<div class="xword_board-small-text-number"></div>';
						html += '<div class="xword_board-small-text-mark"></div>';
						if (ch == '■' || ch == '#'){
							html += '<input type="text" class="xword_board-textbox" value="■" maxlength="1" />';
						} else if (ch == '' || ch == '　' || ch == ' ' || !this.options.show_answer) {
							html += '<input type="text" class="xword_board-textbox" value="" maxlength="1" />';
						} else {
							html += '<input type="text" class="xword_board-textbox" value="' + ch + '" maxlength="1" />';
						}
						html += '</td>';
					}
					html += '</tr>';
				}
				html += '  </tbody>';
				html += '</table>';
			}
			self.element.html(html);
			$(".xword_board-textbox").blur(function(){
				self.updateTextBoxes();
			});
		},
		updateTextBoxes: function(){
			let cx = this.options.cx, cy = this.options.cy;
			for(let y = 0; y < cy; ++y){
				let text = '';
				for(let x = 0; x < cx; ++x){
					let ch = $("#" + this._get_id(x, y) + " input").val();
					if (ch == '') {
						ch = '　';
					}
					ch = this.文字正規化(ch);
					text += ch;
					if (ch == '' || ch == ' ' || ch == '　') {
						$("#" + this._get_id(x, y) + " input").val('');
					} else {
						$("#" + this._get_id(x, y) + " input").val(ch);
					}
				}
			}
		},
		_get_id: function(x, y){
			var id = this.element.prop("id");
			return id + "-" + x + "-" + y;
		},
		cell_needs_number: function(x, y){
			let data = this.options.data;
			let cx = this.options.cx, cy = this.options.cy;
			if (data[y][x] == '■') {
				return false;
			}
			if (x == 0 || data[y][x - 1] == '■') {
				if (x + 1 < cx && data[y][x + 1] != '■') {
					return true;
				}
			}
			if (y == 0 || data[y - 1][x] == '■') {
				if (y + 1 < cy && data[y + 1][x] != '■') {
					return true;
				}
			}
			return false;
		},
		cell_needs_number_x: function(x, y){
			let data = this.options.data;
			let cx = this.options.cx;
			if (data[y][x] == '■') {
				return false;
			}
			if (x == 0 || data[y][x - 1] == '■') {
				if (x + 1 < cx && data[y][x + 1] != '■') {
					return true;
				}
			}
			return false;
		},
		cell_needs_number_y: function(x, y){
			let data = this.options.data;
			let cy = this.options.cy;
			if (data[y][x] == '■') {
				return false;
			}
			if (y == 0 || data[y - 1][x] == '■') {
				if (y + 1 < cy && data[y + 1][x] != '■') {
					return true;
				}
			}
			return false;
		},
		do_numbering: function(dict) {
			let data = this.options.data;
			let cx = this.options.cx, cy = this.options.cy;
			let number = 1;
			for (let y = 0; y < cy; ++y) {
				for (let x = 0; x < cx; ++x) {
					if (this.cell_needs_number(x, y)) {
						this.number(x, y, number);
						number += 1;
					}
				}
			}
			let down = [];
			for (let y = 0; y < cy; ++y) {
				for (let x = 0; x < cx; ++x) {
					if (this.cell_needs_number_y(x, y)) {
						let word = '';
						for (let k = y; k < cy; ++k) {
							let ch = this.cell(x, y);
							if (ch == '■')
								break;
							word += ch;
						}
						word = this.文字正規化(word);
						number = this.number(x, y);
						let text = '';
						for (let i = 0; i < dict.length; ++i) {
							if (this.文字正規化(dict[i][0]) == word) {
								text = dict[i][1];
								break;
							}
						}
						down.push([number, x, y, word, text]);
					}
				}
			}
			let across = [];
			for (let y = 0; y < cy; ++y) {
				for (let x = 0; x < cx; ++x) {
					if (this.cell_needs_number_x(x, y)) {
						let word = '';
						for (let k = x; k < cx; ++k) {
							let ch = this.cell(x, y);
							if (ch == '■')
								break;
							word += ch;
						}
						word = this.文字正規化(word);
						number = this.number(x, y);
						let text = '';
						for (let i = 0; i < dict.length; ++i) {
							if (this.文字正規化(dict[i][0]) == word) {
								text = dict[i][1];
								break;
							}
						}
						across.push([number, x, y, word, text]);
					}
				}
			}
			if (down && across) {
				this.options.down = down;
				this.options.across = across;
			}
		},
		down: function(){
			return this.options.down;
		},
		across: function(){
			return this.options.across;
		},
		show_answer: function(newValue) {
			if (newValue == undefined) {
				return this.options.show_answer;
			} else {
				this.options.show_answer = newValue;
				let data = this.options.data;
				let cx = this.options.cx, cy = this.options.cy;
				if (newValue) {
					for (let y = 0; y < cy; ++y) {
						for (let x = 0; x < cx; ++x) {
							let ch = this.cell(x, y);
							ch = this.文字正規化(ch);
							let wrong = (data[y][x] != ch);
							if (wrong) {
								this.cell(x, y, data[y][x]);
								$("#" + this._get_id(x, y)).addClass('xword_board-cell-red');
								$("#" + this._get_id(x, y)).removeClass('xword_board-cell-white');
								$("#" + this._get_id(x, y)).removeClass('xword_board-cell-black');
							} else if (data[y][x] != '■') {
								$("#" + this._get_id(x, y)).addClass('xword_board-cell-yellow');
								$("#" + this._get_id(x, y)).removeClass('xword_board-cell-white');
								$("#" + this._get_id(x, y)).removeClass('xword_board-cell-black');
							}
							$("#" + this._get_id(x, y) + " input").prop('disabled', true);
						}
					}
				} else {
					for (let y = 0; y < cy; ++y) {
						for (let x = 0; x < cx; ++x) {
							if (data[y][x] != '■') {
								this.cell(x, y, '');
							}
						}
					}
				}
			}
		},
	});
})(jQuery);
