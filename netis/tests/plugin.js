(function($) {
	$.fn.myplugin = function(options) {
		var defaults = {};
		var settings = $.extend({}, defaults, options);
		return this.each(function() {
			var elem = this;
			elem.html("Hello, My jQuery Plugin");
			elem.prototype.myplugin2 = function(option, value) {
				alert(option + ": " + value);
			};
			return elem;
		});
	};
}(jQuery));
