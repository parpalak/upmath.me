/**
 * Based on https://github.com/markdown-it/markdown-it/blob/master/support/demo_template/index.js
 */

'use strict';

var mdHtml, mdSrc, mdHabr, scrollMap;

var defaults = {
	html:         false,        // Enable HTML tags in source
	xhtmlOut:     false,        // Use '/' to close single tags (<br />)
	breaks:       false,        // Convert '\n' in paragraphs into <br>
	langPrefix:   'language-',  // CSS language prefix for fenced blocks
	linkify:      true,         // autoconvert URL-like texts to links
	typographer:  true,         // Enable smartypants and other sweet transforms
	quotes:       '«»„“',

	// options below are for demo only
	_highlight: true,
	_strict: false,
	_view: 'html'               // html / src / debug
};

function setOptionClass(name, val) {
	if (val) {
		$('body').addClass('opt_' + name);
	} else {
		$('body').removeClass('opt_' + name);
	}
}

function setResultView(val) {
	$('body')
		.removeClass('result-as-html')
		.removeClass('result-as-habr')
		.removeClass('result-as-src')
		.removeClass('result-as-debug')
		.addClass('result-as-' + val)
	;
	defaults._view = val;
}

function mdInit() {
	mdHtml = window.markdownit(defaults).use(markdownitS2Tex);
	mdSrc = window.markdownit(defaults).use(markdownitS2Tex);
	mdHabr = window.markdownit(defaults).use(markdownitS2Tex);

	// Beautify output of parser for html content
	mdHtml.renderer.rules.table_open = function () {
		return '<table class="table table-striped">\n';
	};

	//
	// Inject line numbers for sync scroll. Notes:
	//
	// - We track only headings and paragraphs on first level. That's enough.
	// - Footnotes content causes jumps. Level limit filter it automatically.
	function injectLineNumbers(tokens, idx, options, env, self) {
		var line;
		if (tokens[idx].map && tokens[idx].level === 0) {
			line = tokens[idx].map[0];
			tokens[idx].attrPush([ 'class', 'line' ]);
			tokens[idx].attrPush([ 'data-line', String(line) ]);
		}

		// Hack (maybe it is better to use block renderers?)
		if (tokens[idx+1] && tokens[idx+1].children) {
			for (var i = tokens[idx+1].children.length; i-- ;) {
				if (tokens[idx+1].children[i].tag === 'tex-block') {
					tokens[idx].attrPush(['align', 'center']);
				}
			}
		}

		return self.renderToken(tokens, idx, options, env, self);
	}

	function hasBlockFormula(tokens, idx) {
		if (idx >=0 && tokens[idx] && tokens[idx].children) {
			for (var i = tokens[idx].children.length; i--;) {
				if (tokens[idx].children[i].tag === 'tex-block') {
					return true;
				}
			}
		}
		return false;
	}

	function injectSpaces(tokens, idx, options, env, self) {
		var prefix = "";
		if (idx > 0 && tokens[idx-1].type === 'paragraph_close' && !hasBlockFormula(tokens, idx - 2)) {
			prefix = "\n";
		}

		// Hack (maybe it is better to use block renderers?)
		if (hasBlockFormula(tokens, idx + 1)) {
			tokens[idx].attrPush(['align', 'center']);
		}
		return prefix + self.renderToken(tokens, idx, options, env, self);
	}

	mdHtml.renderer.rules.paragraph_open = mdHtml.renderer.rules.heading_open = injectLineNumbers;
	mdHabr.renderer.rules.paragraph_open = mdHabr.renderer.rules.heading_open = injectSpaces;

	mdHabr.renderer.rules.math_number = (function (protocol) {
		return function (tokens, idx) {
			return '<img align="right" src="' + protocol + '//tex.s2cms.ru/svg/' + tokens[idx].content + '" />';
		}
	}(location.protocol == "https:" ? "https:" : 'http:'));
}

function setHighlightedlContent(selector, content, lang) {
	if (window.hljs) {
		$(selector).html(window.hljs.highlight(lang, content).value);
	} else {
		$(selector).text(content);
	}
}

function updateResult() {
	var source = $('.source').val();

	// Update only active view to avoid slowdowns
	// (debug & src view with highlighting are a bit slow)
	if (defaults._view === 'html') {
		$('.result-html').html(mdHtml.render(source));

	} else if (defaults._view === 'debug') {
		setHighlightedlContent(
			'.result-debug-content',
			JSON.stringify(mdSrc.parse(source, { references: {} }), null, 2),
			'json'
		);

	} else if (defaults._view === 'habr') {
		setHighlightedlContent('.result-habr-content', mdHabr.render(source), 'html');

	} else { /*defaults._view === 'src'*/
		setHighlightedlContent('.result-src-content', mdSrc.render(source), 'html');
	}

	// reset lines mapping cache on content update
	scrollMap = null;
}

// Build offsets for each line (lines can be wrapped)
// That's a bit dirty to process each line everytime, but ok for demo.
// Optimizations are required only for big texts.
function buildScrollMap() {
	var i, offset, nonEmptyList, pos, a, b, lineHeightMap, linesCount,
		acc, sourceLikeDiv, textarea = $('.source'),
		_scrollMap;

	sourceLikeDiv = $('<div />').css({
		position:   'absolute',
		visibility: 'hidden',
		height:     'auto',
		width:      textarea[0].clientWidth,

		'padding-left':  textarea.css('padding-left'),
		'padding-right': textarea.css('padding-right'),
		'font-size':     textarea.css('font-size'),
		'font-family':   textarea.css('font-family'),
		'line-height':   textarea.css('line-height'),
		'white-space':   textarea.css('white-space')
	}).appendTo('body');

	var $resultHtml = $('.result-html');
	offset = $resultHtml.scrollTop() - $resultHtml.offset().top - parseInt(textarea.css('padding-top'));
	_scrollMap = [];
	nonEmptyList = [];
	lineHeightMap = [];

	acc = 0;
	textarea.val().split('\n').forEach(function(str) {
		var h, lh;

		lineHeightMap.push(acc);

		if (str.length === 0) {
			acc++;
			return;
		}

		sourceLikeDiv.text(str);
		h = parseFloat(sourceLikeDiv.css('height'));
		lh = parseFloat(sourceLikeDiv.css('line-height'));
		acc += Math.round(h / lh);
	});
	sourceLikeDiv.remove();
	lineHeightMap.push(acc);
	linesCount = acc;

	for (i = 0; i < linesCount; i++) { _scrollMap.push(-1); }

	nonEmptyList.push(0);
	_scrollMap[0] = 0;

	$('.line').each(function(n, el) {
		var $el = $(el), t = $el.data('line');
		if (t === '') { return; }
		t = lineHeightMap[t];
		if (t !== 0) { nonEmptyList.push(t); }
		_scrollMap[t] = Math.round($el.offset().top + offset);
	});

	nonEmptyList.push(linesCount);
	_scrollMap[linesCount] = $resultHtml[0].scrollHeight;

	pos = 0;
	for (i = 1; i < linesCount; i++) {
		if (_scrollMap[i] !== -1) {
			pos++;
			continue;
		}

		a = nonEmptyList[pos];
		b = nonEmptyList[pos + 1];
		_scrollMap[i] = Math.round((_scrollMap[b] * (i - a) + _scrollMap[a] * (b - i)) / (b - a));
	}

	return _scrollMap;
}

// Synchronize scroll position from source to result
var syncResultScroll = _.debounce(function () {
	var textarea   = $('.source'),
		lineHeight = parseFloat(textarea.css('line-height')),
		lineNo, posTo;

	lineNo = Math.floor(textarea.scrollTop() / lineHeight);
	if (!scrollMap) { scrollMap = buildScrollMap(); }
	posTo = scrollMap[lineNo];
	$('.result-html').stop(true).animate({
		scrollTop: posTo
	}, 100, 'linear');
}, 50, { maxWait: 50 });

// Synchronize scroll position from result to source
var syncSrcScroll = _.debounce(function () {
	var resultHtml = $('.result-html'),
		scrollTop  = resultHtml.scrollTop(),
		textarea   = $('.source'),
		lineHeight = parseFloat(textarea.css('line-height')),
		lines,
		i,
		line;

	if (!scrollMap) { scrollMap = buildScrollMap(); }

	lines = Object.keys(scrollMap);

	if (lines.length < 1) {
		return;
	}

	line = lines[0];

	for (i = 1; i < lines.length; i++) {
		if (scrollMap[lines[i]] < scrollTop) {
			line = lines[i];
			continue;
		}

		break;
	}

	textarea.stop(true).animate({
		scrollTop: lineHeight * line
	}, 100, 'linear');
}, 50, { maxWait: 50 });

//////////////////////////////////////////////////////////////////////////////
// Init on page load
//
$(function() {

	// Set default option values and option listeners
	_.forOwn(defaults, function (val, key) {
		if (key === 'highlight') { return; }

		var el = document.getElementById(key);

		if (!el) { return; }

		var $el = $(el);

		if (_.isBoolean(val)) {
			$el.prop('checked', val);
			$el.on('change', function () {
				var value = Boolean($el.prop('checked'));
				setOptionClass(key, value);
				defaults[key] = value;
				mdInit();
				updateResult();
			});
			setOptionClass(key, val);

		} else {
			$el.val(val);
			$el.on('change update keyup', function () {
				defaults[key] = String($el.val());
				mdInit();
				updateResult();
			});
		}
	});

	setResultView(defaults._view);

	mdInit();

	// Setup listeners
	$('.source')
		.on('keyup paste cut mouseup', _.debounce(updateResult, 300, { maxWait: 500 }))
		.on('touchstart mouseover', function () {
			$('.result-html').off('scroll');
			$('.source').on('scroll', syncResultScroll);
		});

	$('.result-html').on('touchstart mouseover', function () {
		$('.source').off('scroll');
		$('.result-html').on('scroll', syncSrcScroll);
	});

	$('.source-clear').on('click', function (event) {
		$('.source').val('');
		updateResult();
		event.preventDefault();
	});

	$(document).on('click', '[data-result-as]', function (event) {
		var view = $(this).data('resultAs');
		if (view) {
			setResultView(view);
			// only to update permalink
			updateResult();
			event.preventDefault();
		}
	});

	// Need to recalculate line positions on window resize
	$(window).on('resize', function () {
		scrollMap = null;
	});

	updateResult();
});