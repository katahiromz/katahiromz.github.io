// NOTE: This needs jQuery UI.
;(function($){
	$.widget("custom.xword_hints", {
		options: {
			across: null,
			down: null,
			change: function(event, cap){
				console.log("change event: " + event.type);
			},
		},
		_create: function(){
		},
		_init: function(){
			if (this.options.across && this.options.down){
				this._build();
			}
		},
		hints: function(down, across){
			this.options.down = down;
			this.options.across = across;
			this._build();
		},
		文字正規化: function(str){
			let text = '';
			for (let i = 0; i < str.length; ++i){
				if (str[i] == '#' || str[i] == '■'){
					text += '■';
				} else if (str[i] == ' ' || str[i] == '　'){
					text += '　';
				} else {
					text += str[i];
				}
			}
			text = text.toUpperCase();
			text = 半角カナを全角に(text);
			text = ひらがなをカタカナに(text);
			text = 半角英数字を全角に(text);
			text = かな小文字を大文字に(text);
			return text;
		},
		_build: function(){
			let self = this;
			let id = self.element.prop("id");
			if (!id){
				id = "the-xword-hints-" + math.random();
				self.element.prop("id", id);
			}
			let html = '';
			let across = self.options.across;
			let down = self.options.down;
			if (across && down){
				html += '<section>';
				html += '<p>☆☆☆ タテのカギ ☆☆☆</p>';
				for (let i = 0; i < down.length; ++i){
					let number = down[i][0];
					let x = down[i][1];
					let y = down[i][2];
					let word = 文字正規化(down[i][3]);
					let text = down[i][4];
					html += '<div class="xword-hint-key">';
					html += '<label for="' + self._get_id('down', number) + '">【タテ' + number + '】</label>';
					html += '<span id="' + self._get_id('down', number) + '">'+ HTMLの特殊文字を変換(text) + '</span>';
					html += '</div>';
				}
				html += '</section><section>';
				html += '<p>☆☆☆ ヨコのカギ ☆☆☆</p>';
				for (let i = 0; i < across.length; ++i){
					let number = across[i][0];
					let x = across[i][1];
					let y = across[i][2];
					let word = 文字正規化(across[i][3]);
					let text = across[i][4];
					html += '<div class="xword-hint-key">';
					html += '<label for="' + self._get_id('across', number) + '">【ヨコ' + number + '】';
					html += '<span id="' + self._get_id('across', number) + '">'+ HTMLの特殊文字を変換(text) + '</span>';
					html += '</div>';
				}
				html += '</section>';
			}
			self.element.html(html);
		},
		_get_id: function(direction, number){
			var id = this.element.prop("id");
			return id + "-" + direction + "-" + number;
		},
	});
})(jQuery);
