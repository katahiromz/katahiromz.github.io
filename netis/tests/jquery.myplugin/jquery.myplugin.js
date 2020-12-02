;(function($) {
    var self = this;
    $.fn.myplugin = function(args) {
        var self = this;
        var methods = {
            init: function(options) {
                var defaults = {
                    // TODO:
                    width: "100%",
                    height: "auto",
                    border: "1px solid black",
                    text: "Hello, jQuery plugin",
                };
                let settings = $.extend(true, {}, defaults, options);
                self.data('settings', settings);
                return self.each(function(index, element) {
                    // TODO:
                    $(element).text(settings['text']);
                    $(element).css('width', settings['width']);
                    $(element).css('height', settings['height']);
                    $(element).css('border', settings['border']);
                });
            },
            destroy: function() {
                alert("destroy");
            },
            text: function(newValue) {
                if (newValue == undefined)
                    return self.data('settings')['text'];
                self.each(function(index, element) {
                    $(element).text(newValue);
                });
                self.data('settings', 'text') = newValue;
                return self;
            },
            border: function(newValue) {
                if (newValue == undefined)
                    return self.data('settings')['border'];
                self.each(function(index, element) {
                    $(element).css('border', newValue);
                });
                self.data('settings')['border'] = newValue;
                return self;
            },
            width: function(newValue) {
                if (newValue == undefined)
                    return self.data('settings')['width'];
                self.each(function(index, element) {
                    $(element).css('width', newValue);
                });
                self.data('settings')['width'] = newValue;
                return self;
            },
            height: function(newValue) {
                if (newValue == undefined)
                    return self.data('settings')['height'];
                self.each(function(index, element) {
                    $(element).css('height', newValue);
                });
                self.data('settings')['height'] = newValue;
                return self;
            },
            option: function(key, newValue) {
                if (newValue == undefined)
                    return self.data('settings')[key];
                self.data('settings')[key] = newValue;
                return self;
            },
        };
        if (methods[args]) {
            return methods[args].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof args === 'object' || !args) {
            return methods.init.apply(this, arguments);
        } else {
            $.error("Method '" + args + "' not found in myplugin");
        }
    };
})(jQuery);
