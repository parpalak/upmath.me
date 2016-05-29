/**
 * Based on https://github.com/markdown-it/markdown-it/blob/master/support/demo_template/index.js
 */

'use strict';

var mdHtml, mdSrc, mdHabr,
	imagePreloader = new ImagePreloader(),
	imageLoader = new ImageLoader(imagePreloader, location.protocol == 'https:' ? 'https:' : 'http:');

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
	var eNode = document.body;

	[
		'result-as-html',
		'result-as-htmltex',
		'result-as-habr',
		'result-as-src',
		'result-as-debug'
	].forEach(function (className) {
		if (eNode.classList) {
			eNode.classList.remove(className);
		}
		else {
			eNode.className = eNode.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
		}
	});

	if (eNode.classList) {
		eNode.classList.add('result-as-' + val);
	}
	else {
		eNode.className += ' ' + 'result-as-' + val;
	}

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

	// Custom image embedding for smooth UX
	mdHtml.renderer.rules.math_inline = function (tokens, idx) {
		return imageLoader.getHtmlStub(tokens[idx].content);
	};

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

function setHighlightedlContent(className, content, lang) {
	var eNode = document.getElementsByClassName(className)[0];
	if (window.hljs) {
		eNode.innerHTML = window.hljs.highlight(lang, content).value;
	}
	else {
		eNode.textContent = content;
	}
}

function getSource() {
	return document.querySelector('.source .ldt-textarea').value;
}

function setSource(text) {
	document.querySelector('.source .ldt-textarea').value = text;
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
		var result = document.getElementsByClassName('result-html');

		imageLoader.reset();
		result[0].innerHTML = mdHtml.render(source);
		imageLoader.fixDom();
	}
	else if (defaults._view === 'htmltex') {
		defaults._tex.noreplace = true;
		setHighlightedlContent('result-htmltex-content', mdSrc.render(source), 'html');
	}
	else if (defaults._view === 'debug') {
		setHighlightedlContent(
			'result-debug-content',
			JSON.stringify(mdSrc.parse(source, { references: {} }), null, 2),
			'json'
		);
	}
	else if (defaults._view === 'habr') {
		setHighlightedlContent('result-habr-content', getHabraMarkup(source), 'html');
	}
	else { /*defaults._view === 'src'*/
		defaults._tex.noreplace = false;
		setHighlightedlContent('result-src-content', mdSrc.render(source), 'html');
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

function getPositionFromMaps(eBlockNode, fromIndex, toIndex) {
	var	scrollTop = eBlockNode.scrollTop;

	if (scrollTop == 0) {
		return 0;
	}

	if (mapScroll[fromIndex] === null) {
		findScrollMarks();
	}

	var scrollShift    = eBlockNode.offsetHeight / 2,
		scrollLevel    = scrollTop + scrollShift,
		blockIndex     = findBisect(scrollLevel, mapScroll[fromIndex]),
		srcScrollLevel = parseFloat(mapScroll[toIndex][blockIndex.val] * (1 - blockIndex.part));

	if (mapScroll[toIndex][blockIndex.val + 1]) {
		srcScrollLevel += parseFloat(mapScroll[toIndex][blockIndex.val + 1] * blockIndex.part);
	}

	return srcScrollLevel - scrollShift;
}

var decorator;

/**
 * @param animatorSrc
 * @param animatorResult
 * @param eSrc
 * @param eResult
 * @constructor
 */
function SyncScroll(animatorSrc, animatorResult, eSrc, eResult) {
	// Synchronize scroll position from source to result
	var syncResultScroll = function () {
		animatorResult.setPos(getPositionFromMaps(eSrc, 0, 1));
	};

	// Synchronize scroll position from result to source
	var syncSrcScroll = function () {
		animatorSrc.setPos(getPositionFromMaps(eResult, 1, 0));
	};

	this.switchScrollToSrc = function () {
		eResult.removeEventListener('scroll', syncSrcScroll);
		eSrc.removeEventListener('scroll', syncResultScroll);
		eSrc.addEventListener('scroll', syncResultScroll);
		// animatorSrc.stop();
	};

	this.switchScrollToResult = function () {
		eSrc.removeEventListener('scroll', syncResultScroll);
		eResult.removeEventListener('scroll', syncSrcScroll);
		eResult.addEventListener('scroll', syncSrcScroll);
		// animatorResult.stop();
	}
}

documentReady(function() {
	var eTextarea = document.getElementsByClassName('source')[0];

	// start the decorator
	decorator = new TextareaDecorator(eTextarea, mdParser);

	var recalcHeight = debounce(function () { decorator.recalcHeight() }, 100),
		eResultHtml  = document.getElementsByClassName('result-html')[0];

	setResultView(defaults._view);

	mdInit();

	// .source has been changed after TextareaDecorator call
	var eNodeSource = document.getElementsByClassName('source')[0];

	var animatorSrc = new Animator(
		function () {
			return eNodeSource.scrollTop;
		},
		function (y) {
			eNodeSource.scrollTop = y;
		}
	);

	var animatorResult = new Animator(
		function () {
			return eResultHtml.scrollTop;
		},
		function (y) {
			eResultHtml.scrollTop = y;
		}
	);

	var syncScroll = new SyncScroll(animatorSrc, animatorResult, eNodeSource, eResultHtml);

	// Setup listeners
	var updateText = debounce(updateResult, 300, { maxWait: 3000 });
	eTextarea.addEventListener('keyup', updateText);
	eTextarea.addEventListener('paste', updateText);
	eTextarea.addEventListener('cut', updateText);
	eTextarea.addEventListener('mouseup', updateText);

	eTextarea.addEventListener('touchstart', syncScroll.switchScrollToSrc);
	eTextarea.addEventListener('mouseover', syncScroll.switchScrollToSrc);

	eResultHtml.addEventListener('touchstart', syncScroll.switchScrollToResult);
	eResultHtml.addEventListener('mouseover', syncScroll.switchScrollToResult);

	Array.prototype.forEach.call(document.getElementsByClassName('control-item'), function(eNode, index) {
		eNode.addEventListener('click', function () {
			var view = this.getAttribute('data-result-as');
			if (view) {
				setResultView(view);
				// only to update permalink
				updateResult(true);

				// Selecting all block content.
				var contentBlocks = document.getElementsByClassName('result-' + view + '-content');
				if (view !== 'preview' && contentBlocks.length) {
					setTimeout(function () {
						selectText(contentBlocks[0]);
					}, 0);
				}
			}
		})
	});

	// Need to recalculate line positions on window resize
	window.addEventListener('resize', function () {
		resetScrollMap();
		recalcHeight();
	});

	updateResult();
});