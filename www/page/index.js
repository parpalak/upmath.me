/**
 * Based on https://github.com/markdown-it/markdown-it/blob/master/support/demo_template/index.js
 */

'use strict';

var mdHtml, mdSrc, mdHabr, scrollMap;

var defaults = {
	html:         true,         // Enable HTML tags in source
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
	mdHtml = window.markdownit(defaults)
		.use(markdownitS2Tex)
		.use(markdownitSub)
		.use(markdownitSup)
	;
	mdSrc = window.markdownit(defaults)
		.use(markdownitS2Tex)
		.use(markdownitSub)
		.use(markdownitSup)
	;
	mdHabr = window.markdownit(defaults)
		.use(markdownitS2Tex)
		.use(markdownitSub)
		.use(markdownitSup)
	;

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
					break;
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

	// Habrahabr ignores <p> tags but uses whitespaces
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

	// Habrahabr hack for numerating formulas
	mdHabr.renderer.rules.math_number = (function (protocol) {
		return function (tokens, idx) {
			return '<img align="right" src="' + protocol + '//tex.s2cms.ru/svg/' + tokens[idx].content + '" />';
		}
	}(location.protocol == "https:" ? "https:" : 'http:'));

	// Habrahabr "source" tag
	mdHabr.renderer.rules.fence = function (tokens, idx, options, env, self) {
		var token = tokens[idx],
			info = token.info ? mdHabr.utils.unescapeAll(token.info).trim() : '',
			langName = '',
			highlighted;

		if (info) {
			langName = info.split(/\s+/g)[0];
			token.attrPush([ 'lang', langName ]);
		}

		if (options.highlight) {
			highlighted = options.highlight(token.content, langName) || mdHabr.utils.escapeHtml(token.content);
		} else {
			highlighted = mdHabr.utils.escapeHtml(token.content);
		}

		return  '<source' + self.renderAttrs(token) + '>'
			+ highlighted
			+ '</source>\n';
	}
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
		position:    'absolute',
		visibility:  'hidden',
		height:      'auto',
		width:       textarea[0].clientWidth,
		'word-wrap': 'break-word',

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
var syncResultScroll = debounce(function () {
	var textarea   = $('.source'),
		lineHeight = parseFloat(textarea.css('line-height')),
		posTo,
		scrollTop = Math.max(0, textarea.scrollTop() /*- parseInt(textarea.css('padding-top'))*/),
		lineNo = Math.floor(scrollTop / lineHeight),
		linePart = scrollTop / lineHeight - lineNo;

	if (!scrollMap) {
		scrollMap = buildScrollMap();
	}

	posTo = scrollMap[lineNo];

	if (scrollMap[lineNo + 1]) {
		posTo += linePart * (scrollMap[lineNo + 1] - scrollMap[lineNo]);
	}

	$('.result-html').stop(true).animate({
		scrollTop: posTo
	}, 100, 'linear');
}, 50, { maxWait: 50 });

// Synchronize scroll position from result to source
var syncSrcScroll = debounce(function () {
	var resultHtml = $('.result-html'),
		scrollTop  = resultHtml.scrollTop(),
		textarea   = $('.source'),
		lineHeight = parseFloat(textarea.css('line-height')),
		lines,
		i,
		line,
		line_index;

	if (!scrollMap) { scrollMap = buildScrollMap(); }

	lines = Object.keys(scrollMap);

	if (lines.length < 1) {
		return;
	}

	line = lines[0];
	line_index = 0;

	for (i = 1; i < lines.length; i++) {
		if (scrollMap[lines[i]] < scrollTop) {
			line = lines[i];
			line_index = i;
			continue;
		}

		break;
	}

	var srcScrollTop = lineHeight * line;
	if (scrollMap[lines[line_index + 1]] >= scrollTop) {
		srcScrollTop += lineHeight * (scrollTop - scrollMap[lines[line_index]]) / (scrollMap[lines[line_index + 1]] - scrollMap[lines[line_index]]);
	}

	textarea.stop(true).animate({
		scrollTop: srcScrollTop
	}, 100, 'linear');
}, 50, { maxWait: 50 });


$(function() {
	setResultView(defaults._view);

	mdInit();

	// Setup listeners
	$('.source')
		.on('keyup paste cut mouseup', debounce(updateResult, 300, { maxWait: 500 }))
		.on('touchstart mouseover', function () {
			$('.result-html').off('scroll');
			$('.source').on('scroll', syncResultScroll);
		});

	$('.result-html').on('touchstart mouseover', function () {
		$('.source').off('scroll');
		$('.result-html').on('scroll', syncSrcScroll);
	});

	$('.control-item').on('click', function () {
		var view = $(this).data('resultAs');
		if (view) {
			setResultView(view);
			// only to update permalink
			updateResult();
		}
	});

	// Need to recalculate line positions on window resize
	$(window).on('resize', function () {
		scrollMap = null;
	});

	updateResult();
});