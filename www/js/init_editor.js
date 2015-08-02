/**
 * Formula format watcher.
 *
 * @type {{setFormat, setSource, getSource, setCallback, resetTimer}}
 */
var Renderer = (function () {
	var source, format,
		callback = function () {},
		timeout;

	function timerTick() {
		callback(source, format);
	}

	function update() {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(timerTick, 300);
	}

	return {
		setFormat: function (value) {
			if (format !== value) {
				format = value;
				update();
			}
		},
		setSource: function (value) {
			if (source !== value) {
				source = value;
				update();
			}
		},
		getSource: function () {
			return source;
		},
		setCallback: function (f) {
			callback = f;
		}
	};
}());

function initTexEditor(serviceURL) {
	var $source = $('.editor-text'),
		preview = document.getElementById('editor-preview'),
		oldOutput;

	/**
	 * Displays after 300ms the formula rendered.
	 *
	 * @param text
	 * @param format
	 */
	function timerTick(text, format) {
		var encodedText = encodeURIComponent(text),
			output = text ? serviceURL + format + '/' + encodedText : '';

		if (output === oldOutput) {
			return;
		}
		oldOutput = output;

		document.forms['editor'].result.value = output;
		preview.src = output;

		if (encodedText === 'f(x)' && location.pathname === '/') {
			return;
		}
		history && history.replaceState && history.replaceState(null, '', '/g/' + encodedText);
	}

	// Connect to the renderer
	Renderer.setCallback(timerTick);

	function updateFormat() {
		Renderer.setFormat(document.getElementById('svg_radio').checked ? 'svg' : 'png');
	}

	function updateSource() {
		Renderer.setSource($.trim($source.val()));
	}

	$(document.forms['editor'].elements['format']).on('change', updateFormat);
	$source.on('propertychange keyup input paste', updateSource);

	// Renderer initialization
	updateFormat();
	updateSource();

	// Select the content of URL field on focus.
	$('.editor-result').on('focus', function () {
		var that = this;
		setTimeout(function () {
			that.select();
		}, 10);
	});

	autosize($source);

	// Highlight textarea when the formula is invalid.
	$(preview).error(function () {
		if (Renderer.getSource() !== '') {
			setTimeout(function () {
				$source.removeClass('load-error').addClass('load-error');
			}, 0);
		}
	}).load(function () {
		$source.removeClass('load-error');
	});

	// Add sample formula to the textarea.
	$('.add-formula').click(function () {
		var cur = $source.val(),
			sampleText = $(this).parent().children('.sample-source').text();

		if (cur)
			cur += "\n";
		$source.val(cur + sampleText).trigger('autosize.resize');
		updateSource();
		scrollPage($('#editor'));
	});

	function scrollPage($target) {
		$('html,body').animate({
			scrollTop: $target.offset().top - 45
		}, 300);
	}

	$('a.inside').click(function () {
		if (location.pathname.replace(/^\//, '') !== this.pathname.replace(/^\//, '')) {
			return;
		}
		if (location.hostname !== this.hostname) {
			return;
		}

		var target = $(this.hash);
		target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');

		if (target.length) {
			scrollPage(target);
			return false;
		}
	});
}

function initTexSite() {
	$('.sticky').Stickyfill();
	new Image().src = "//counter.yadro.ru/hit?r" + escape(document.referrer) + ((typeof(screen) == "undefined") ? "" : ";s" + screen.width + "*" + screen.height + "*" + (screen.colorDepth ? screen.colorDepth : screen.pixelDepth)) + ";u" + escape(document.URL) + ";h" + escape(document.title.substring(0, 80)) + ";" + Math.random();
}
