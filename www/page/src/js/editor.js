/**
 * Based on https://github.com/markdown-it/markdown-it/blob/master/support/demo_template/index.js
 */

'use strict';

var mdHtml, mdSrc, mdHabr;

var defaults = {
	html:         true,         // Enable HTML tags in source
	xhtmlOut:     false,        // Use '/' to close single tags (<br />)
	breaks:       false,        // Convert '\n' in paragraphs into <br>
	langPrefix:   'language-',  // CSS language prefix for fenced blocks
	linkify:      true,         // autoconvert URL-like texts to links
	typographer:  true,         // Enable smartypants and other sweet transforms
	quotes:       '«»„“',

	// option for tex plugin
	_tex: {noreplace: false}, // a switch for mdSrc parser
	_habr: {protocol: ''},    // no protocol for habrahabr markup

	// options below are for demo only
	_highlight: true,
	_strict: false,
	_view: 'html'               // html / src / debug
};

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
		.use(markdownitS2Tex, defaults._habr)
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
	mdHabr.renderer.rules.math_number = function (tokens, idx) {
		return '<img align="right" src="//tex.s2cms.ru/svg/' + tokens[idx].content + '" />';
	};

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
	}
	else {
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

var oldSource = null;

function updateResult(ignoreDiff) {
	var source = getSource();
	if (ignoreDiff !== true && oldSource === source) {
		return;
	}

	oldSource = source;

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
	resetScrollMap();

	try {
		localStorage.setItem("editor_content", source);
	}
	catch (e) {}
}

function resetScrollMap() {
	mapScroll = [null, null];
}

var mapScroll;

/**
 * Searches start position for text blocks
 */
function findScrollMarks() {
	var resElements = document.querySelectorAll('.result-html .line'),
		resElementHeight = [],
		line,
		mapSrc = [0],
		mapResult = [0],
		i = 0, len = resElements.length;

	for (; i < len; i++) {
		line = parseInt(resElements[i].getAttribute('data-line'));
		if (line) {
			resElementHeight[line] = Math.round(resElements[i].offsetTop);
		}
	}

	var srcElements = document.querySelectorAll('.ldt-pre .block-start');

	len  = srcElements.length;
	line = 0;

	for (i = 0; i < len; i++) {
		var lineDelta = parseInt(srcElements[i].getAttribute('data-line'));
		if (lineDelta) {
			line += lineDelta;

			// We track only lines in both containers
			if (typeof resElementHeight[line] !== 'undefined') {
				mapSrc.push(srcElements[i].offsetTop);
				mapResult.push(resElementHeight[line]);
			}
		}
	}

	mapScroll = [mapSrc, mapResult];
}

function getPositionFromMaps($block, fromIndex, toIndex) {
	var	scrollTop = $block.scrollTop();

	if (scrollTop == 0) {
		return 0;
	}

	if (mapScroll[fromIndex] === null) {
		findScrollMarks();
	}

	var scrollShift    = $block.height() / 2,
		scrollLevel    = scrollTop + scrollShift,
		blockIndex     = findBisect(scrollLevel, mapScroll[fromIndex]),
		srcScrollLevel = parseFloat(mapScroll[toIndex][blockIndex.val] * (1 - blockIndex.part));

	if (mapScroll[toIndex][blockIndex.val + 1]) {
		srcScrollLevel += parseFloat(mapScroll[toIndex][blockIndex.val + 1] * blockIndex.part);
	}

	return srcScrollLevel - scrollShift;
}

function getResultBlockPosition() {
	return getPositionFromMaps($('.source'), 0, 1);
}

function getSrcBlockPosition() {
	return getPositionFromMaps($('.result-html'), 1, 0);
}

if (parseUrlQuery().animation === 'linear') {
	// Synchronize scroll position from source to result
	var syncResultScroll = debounce(function () {
		$('.result-html').stop(true).animate({
			scrollTop: getResultBlockPosition()
		}, 100, 'linear');
	}, 50, { maxWait: 50 });

	// Synchronize scroll position from result to source
	var syncSrcScroll = debounce(function () {
		$('.source').stop(true).animate({
			scrollTop: getSrcBlockPosition()
		}, 100, 'linear');
	}, 50, { maxWait: 50 });
}
else {
	// Synchronize scroll position from source to result
	var syncResultScroll = function () {
		animatorResult.setPos(getResultBlockPosition());
	};

	// Synchronize scroll position from result to source
	var syncSrcScroll = function () {
		animatorSrc.setPos(getSrcBlockPosition());
	};
}

var decorator, animatorSrc, animatorResult;

$(function() {
	var $textareaSource = $('.source'),
		textarea = $textareaSource[0];

	// start the decorator
	decorator = new TextareaDecorator(textarea, mdParser);
	var recalcHeight = debounce(function () { decorator.recalcHeight() }, 100),
		$resultHtml  = $('.result-html');

	setResultView(defaults._view);

	mdInit();

	// Setup listeners
	$textareaSource
		.on('keyup paste cut mouseup', debounce(updateResult, 300, { maxWait: 3000 }))
		.on('touchstart mouseover', function () {
			$('.result-html').off('scroll');
			$('.source').off('scroll', syncResultScroll).on('scroll', syncResultScroll);
			// animatorSrc.stop();
		});

	$resultHtml
		.on('touchstart mouseover', function () {
			$('.source').off('scroll');
			$('.result-html').off('scroll', syncSrcScroll).on('scroll', syncSrcScroll);
			// animatorResult.stop();
		});

	// .source has been changed after TextareaDecorator call
	var $source = $('.source');

	animatorSrc = new Animator(
		function () {
			return $source.scrollTop();
		},
		function (x) {
			$source.scrollTop(x);
		}
	);

	animatorResult = new Animator(
		function () {
			return $resultHtml.scrollTop();
		},
		function (x) {
			$resultHtml.scrollTop(x);
		}
	);

	$('.control-item').on('click', function () {
		var view = $(this).data('resultAs');
		if (view) {
			setResultView(view);
			// only to update permalink
			updateResult(true);

			// Selecting all block content.
			var $contentBlock = $('.result-' + view + '-content');
			if (view !== 'preview' && $contentBlock.length) {
				setTimeout(function () {
					selectText($contentBlock[0]);
				}, 0);
			}
		}
	});

	// Need to recalculate line positions on window resize
	$(window).on('resize', function () {
		resetScrollMap();
		recalcHeight();
	});

	updateResult();
});