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

	// option for tex plugin
	_tex: {noreplace: false},

	// options below are for demo only
	_highlight: true,
	_strict: false,
	_view: 'html'               // html / src / debug
};

function SelectText(eItem) {
	var range, selection;

	if (window.getSelection) {
		selection = window.getSelection();
		range = document.createRange();
		range.selectNodeContents(eItem);
		selection.removeAllRanges();
		selection.addRange(range);
	}
}

function setResultView(val) {
	$('body')
		.removeClass('result-as-html result-as-htmltex result-as-habr result-as-src result-as-debug')
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
		.use(markdownitS2Tex, defaults._tex)
		.use(markdownitSub)
		.use(markdownitSup)
	;
	mdHabr = window.markdownit(defaults)
		.use(markdownitS2Tex)
		.use(markdownitSub)
		.use(markdownitSup)
	;

	/**
	 * Detects if the paragraph contains the only formula.
	 * Parser gives the class 'tex-block' to such formulas.
	 *
	 * @param tokens
	 * @param idx
	 * @returns {boolean}
	 */
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

	/**
	 * Inject line numbers for sync scroll. Notes:
	 * - We track only headings and paragraphs on first level. That's enough.
	 * - Footnotes content causes jumps. Level limit filter it automatically.
	 *
	 * @param tokens
	 * @param idx
	 * @param options
	 * @param env
	 * @param self
	 */
	function injectLineNumbers(tokens, idx, options, env, self) {
		var line;
		if (tokens[idx].map && tokens[idx].level === 0) {
			line = tokens[idx].map[0];
			tokens[idx].attrPush([ 'class', 'line' ]);
			tokens[idx].attrPush([ 'data-line', line + '' ]);
		}

		// Hack (maybe it is better to use block renderers?)
		if (hasBlockFormula(tokens, idx+1)) {
			tokens[idx].attrPush(['align', 'center']);
		}

		return self.renderToken(tokens, idx, options, env, self);
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

	/**
	 * Habrahabr hack for numerating formulas
 	 */
	mdHabr.renderer.rules.math_number = (function (protocol) {
		return function (tokens, idx) {
			return '<img align="right" src="' + protocol + '//tex.s2cms.ru/svg/' + tokens[idx].content + '" />';
		}
	}(location.protocol == "https:" ? "https:" : 'http:'));

	/**
	 * Habrahabr "source" tag
	 *
	 * @param tokens
	 * @param idx
	 * @param options
	 * @param env
	 * @param self
	 * @returns {string}
	 */
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

		return  '\n<source' + self.renderAttrs(token) + '>'
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

function getSource() {
	return $('.source .ldt-textarea').val();
}

function setSource(text) {
	$('.source .ldt-textarea').val(text);
	decorator.update();
}

function getHabraMarkup(source) {
	var html = mdHabr.render(source);
	html = html.replace('<spoiler ', '\n<spoiler ');
	return html;
}

function updateResult() {
	var source = getSource();

	// Update only active view to avoid slowdowns
	// (debug & src view with highlighting are a bit slow)
	if (defaults._view === 'html') {
		$('.result-html').html(mdHtml.render(source));
	}
	else if (defaults._view === 'htmltex') {
		defaults._tex.noreplace = true;
		setHighlightedlContent('.result-htmltex-content', mdSrc.render(source), 'html');
	}
	else if (defaults._view === 'debug') {
		setHighlightedlContent(
			'.result-debug-content',
			JSON.stringify(mdSrc.parse(source, { references: {} }), null, 2),
			'json'
		);
	}
	else if (defaults._view === 'habr') {
		setHighlightedlContent('.result-habr-content', getHabraMarkup(source), 'html');
	}
	else { /*defaults._view === 'src'*/
		defaults._tex.noreplace = false;
		setHighlightedlContent('.result-src-content', mdSrc.render(source), 'html');
	}

	// reset lines mapping cache on content update
	scrollMap = null;

	try {
		localStorage.setItem("editor_content", source);
	}
	catch (e) {}
}

// Build offsets for each line (lines can be wrapped)
// That's a bit dirty to process each line everytime, but ok for demo.
// Optimizations are required only for big texts.
function buildScrollMap() {
	var i, offset, nonEmptyList, pos, a, b, lineHeightMap, linesCount,
		acc, sourceLikeDiv, textarea = $('.source .ldt-textarea'),
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
	var $source   = $('.source'),
		lineHeight = parseFloat($source.css('line-height')),
		posTo,
		scrollShift = $source.height() / 2,
		scrollTop = $source.scrollTop(),
		scrollLevel = scrollTop + scrollShift,
		lineNo = Math.floor(scrollLevel / lineHeight),
		linePart = scrollLevel / lineHeight - lineNo;

	if (scrollTop == 0) {
		posTo = 0
	}
	else {
		if (!scrollMap) {
			scrollMap = buildScrollMap();
		}

		if (lineNo >= scrollMap.length) {
			lineNo = scrollMap.length - 1;
		}

		posTo = scrollMap[lineNo] - scrollShift;

		if (scrollMap[lineNo + 1]) {
			posTo += linePart * (scrollMap[lineNo + 1] - scrollMap[lineNo]);
		}
	}

	$('.result-html').stop(true).animate({
		scrollTop: posTo
	}, 100, 'linear');
}, 50, { maxWait: 50 });

// Synchronize scroll position from result to source
var syncSrcScroll = debounce(function () {
	var $resultHtml = $('.result-html'),
		scrollShift = $resultHtml.height() / 2,
		scrollLevel  = $resultHtml.scrollTop() + scrollShift,
		$source   = $('.source'),
		lineHeight = parseFloat($source.css('line-height')),
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
		if (scrollMap[lines[i]] < scrollLevel) {
			line = lines[i];
			line_index = i;
			continue;
		}

		break;
	}

	var srcScrollLevel = lineHeight * line;
	if (scrollMap[lines[line_index + 1]] >= scrollLevel) {
		srcScrollLevel += lineHeight * (scrollLevel - scrollMap[lines[line_index]]) / (scrollMap[lines[line_index + 1]] - scrollMap[lines[line_index]]);
	}

	$source.stop(true).animate({
		scrollTop: srcScrollLevel - scrollShift
	}, 100, 'linear');
}, 50, { maxWait: 50 });

var decorator;

$(function() {
	var $source = $('.source'),
		textarea = $source[0];

	// start the decorator
	decorator = new TextareaDecorator(textarea, mdParser);
	var recalcHeight = debounce(function () { decorator.recalcHeight() }, 100);

	setResultView(defaults._view);

	mdInit();

	// Setup listeners
	$source
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

			// Selecting all block content.
			var $contentBlock = $('.result-' + view + '-content');
			if (view !== 'preview' && $contentBlock.length) {
				setTimeout(function () {
					SelectText($contentBlock[0]);
				}, 0);
			}
		}
	});

	// Need to recalculate line positions on window resize
	$(window).on('resize', function () {
		scrollMap = null;
		recalcHeight();
	});

	updateResult();
});