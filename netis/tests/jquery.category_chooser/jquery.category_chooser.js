;(function($) {
	function dict_parse(json) {
		if (dict_parse.dict) {
			return dict_parse.dict;
		}
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
		dict_parse.dict = dict;
		return dict;
	}

	// NOTE: This needs jQuery UI.
	$.widget("custom.category_chooser", {
		options: {
			level1: "",
			level2: "",
			level3: "",
			level4: "",
			data_filename: "data.json",
			dict: null,
			change: function(event, cap) {
				console.log("change event: " + event.type);
			},
		},
		_dict_loaded: function(){
			var self = this;

			this._setL0();
			this._setL1(this.options.level1);
			this._setL2(this.options.level2);
			this._setL3(this.options.level3);
			this._setL4(this.options.level4);

			$(this._get_id(1)).on('change', function(){
				self._setL1();
				self._setL2("");
				self._setL3("");
				self._setL4("");
				var cap = $(self._get_id(1));
				self._trigger('change', event, cap);
			});

			$(this._get_id(2)).on('change', function(){
				self._setL2();
				self._setL3("");
				self._setL4("");
				var cap = $(self._get_id(2));
				self._trigger('change', event, cap);
			});

			$(this._get_id(3)).on('change', function(){
				self._setL3();
				self._setL4("");
				var cap = $(self._get_id(3));
				self._trigger('change', event, cap);
			});

			$(this._get_id(4)).on('change', function(){
				self._setL4();
				var cap = $(self._get_id(4));
				self._trigger('change', event, cap);
			});
		},
		_create: function(){
			this._build();
			var self = this;
			if (!self.options.dict) {
				if (dict_parse.dict) {
					self.options.dict = dict_parse.dict;
					self._dict_loaded();
				}
				$.getJSON(this.options.data_filename, function(data) {
					self.options.dict = dict_parse(data);
					self._dict_loaded();
				});
			}
		},
		_get_id: function(number) {
			var id = this.element.prop("id");
			return "#" + id + "-level" + number;
		},
		_init: function(){
			;
		},
		level1: function(newValue) {
			if (newValue == undefined)
				return this.options.level1;
			this._setL1(newValue);
		},
		level2: function(newValue) {
			if (newValue == undefined)
				return this.options.level2;
			this._setL2(newValue);
		},
		level3: function(newValue) {
			if (newValue == undefined)
				return this.options.level3;
			this._setL3(newValue);
		},
		level4: function(newValue) {
			if (newValue == undefined)
				return this.options.level4;
			this._setL4(newValue);
		},
		values: function(newValue) {
			if (newValue == undefined)
				return ("" +
					this.options.level1 + "\t" +
					this.options.level2 + "\t" +
					this.options.level3 + "\t" +
					this.options.level4);
			var data = newValue.split("\t");
			if (data.length == 4) {
				this._setL0();
				this._setL1(data[0]);
				this._setL2(data[1]);
				this._setL3(data[2]);
				this._setL4(data[3]);
			}
		},
		_setL0: function() {
			var l1 = $(this._get_id(1));
			l1.empty().append('<option value="" selected>&nbsp;</option>');

			var m0 = this._getM0();
			if (m0) {
				for (var i in m0) {
					l1.append('<option value="' + i + '">' + i + '</option>');
				}
			}
		},
		_setL1: function(value) {
			var l1 = $(this._get_id(1));
			value = value || l1.val();
			l1.val(value);
			this.options.level1 = value;

			var l2 = $(this._get_id(2));
			l2.prop('disabled', true);
			l2.empty().append('<option value="" selected>&nbsp;</option>');
			var m1 = this._getM1();
			if (m1) {
				for (var i in m1) {
					l2.append('<option value="' + i + '">' + i + '</option>');
					l2.prop('disabled', false);
				}
			}
		},
		_setL2: function(value) {
			var l2 = $(this._get_id(2));
			value = value || l2.val();
			l2.val(value);
			this.options.level2 = value;
			var l3 = $(this._get_id(3));
			l3.prop('disabled', true);
			l3.empty().append('<option value="" selected>&nbsp;</option>');
			var m2 = this._getM2();
			if (m2) {
				for (var i in m2) {
					l3.append('<option value="' + i + '">' + i + '</option>');
					l3.prop('disabled', false);
				}
			}
		},
		_setL3: function(value) {
			var l3 = $(this._get_id(3));
			value = value || l3.val();
			l3.val(value);
			this.options.level3 = value;

			var l4 = $(this._get_id(4));
			l4.prop('disabled', true);
			l4.empty().append('<option value="" selected>&nbsp;</option>');
			var m3 = this._getM3();
			if (m3) {
				for (var i in m3) {
					l4.append('<option value="' + i + '">' + i + '</option>');
					l4.prop('disabled', false);
				}
			}
		},
		_setL4: function(value) {
			var l4 = $(this._get_id(4));
			var value = value || l4.val();
			l4.val(value);
			this.options.level4 = value;
		},
		_build: function() {
			var id = this.element.prop("id");
			if (!id) {
				id = "the-category_chooser-" + math.random();
				this.element.prop("id", id);
			}
			var html = '';
			html += '<ul class="category">';
			html += '    <li class="category_level l1">';
			html += '        <span class="level_label">レベル1</span><br />';
			html += '        <select id="' + id + '-level1" class="category_select level1">';
			html += '            <option value="" selected></option>';
			html += '        </select>';
			html += '    </li>';
			html += '    <li class="category_level l2">';
			html += '        <span class="level_label">レベル2</span><br />';
			html += '        <select id="' + id + '-level2" class="category_select level2">';
			html += '            <option value="" selected></option>';
			html += '        </select>';
			html += '    </li>';
			html += '    <li class="category_level l3">';
			html += '        <span class="level_label">レベル3</span><br />';
			html += '        <select id="' + id + '-level3" class="category_select level3">';
			html += '            <option value="" selected></option>';
			html += '        </select>';
			html += '    </li>';
			html += '    <li class="category_level l4">';
			html += '        <span class="level_label">レベル4</span><br />';
			html += '        <select id="' + id + '-level4" class="category_select level4">';
			html += '            <option value="" selected></option>';
			html += '        </select>';
			html += '    </li>';
			html += '</ul>';
			this.element.html(html);
		},
		_getM0: function() {
			return this.options.dict;
		},
		_getM1: function() {
			var level1 = this.options.level1;
			var dict = this._getM0();
			if (dict &&
				dict[level1])
			{
				return dict[level1];
			}
			return null;
		},
		_getM2: function() {
			var level1 = this.options.level1;
			var level2 = this.options.level2;
			var dict = this._getM0();
			if (dict &&
				dict[level1] &&
				dict[level1][level2])
			{
				return dict[level1][level2];
			}
			return null;
		},
		_getM3: function() {
			var level1 = this.options.level1;
			var level2 = this.options.level2;
			var level3 = this.options.level3;
			var dict = this._getM0();
			if (dict &&
				dict[level1] &&
				dict[level1][level2] &&
				dict[level1][level2][level3])
			{
				return dict[level1][level2][level3];
			}
			return null;
		},
		_getM4: function() {
			var level1 = this.options.level1;
			var level2 = this.options.level2;
			var level3 = this.options.level3;
			var level4 = this.options.level4;
			var dict = this._getM0();
			if (dict &&
				dict[level1] &&
				dict[level1][level2] &&
				dict[level1][level2][level3] &&
				dict[level1][level2][level3][level4])
			{
				return dict[level1][level2][level3][level4];
			}
			return null;
		},
	});
})(jQuery);
