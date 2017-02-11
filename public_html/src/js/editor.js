/**
 * Markdown and LaTeX Editor
 *
 * (c) Roman Parpalak, 2016
 */

(function (document, window) {
	'use strict';

	var defaults = {
		html:        true,         // Enable HTML tags in source
		xhtmlOut:    false,        // Use '/' to close single tags (<br />)
		breaks:      false,        // Convert '\n' in paragraphs into <br>
		langPrefix:  'language-',  // CSS language prefix for fenced blocks
		linkify:     true,         // autoconvert URL-like texts to links
		typographer: true,         // Enable smartypants and other sweet transforms
		quotes:      '«»„“',

		// option for tex plugin
		_habr: {protocol: ''},    // no protocol for habrahabr markup

		// options below are for demo only
		_highlight: true,
		_strict: false
	};

	function domSetResultView(val) {
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
	}

	function ParserCollection(
		defaults,
		imageLoader,
		markdownit,
		setResultView,
		sourceGetter,
		sourceSetter,
		domSetPreviewHTML,
		domSetHighlightedContent,
		updateCallback
	) {
		var
			_mdHtml = markdownit(defaults)
				.use(markdownitS2Tex)
				.use(markdownitSub)
				.use(markdownitSup)
			;
		var
			_mdSrc = markdownit(defaults)
				.use(markdownitS2Tex)
				.use(markdownitSub)
				.use(markdownitSup)
			;
		var
			_mdOnly = markdownit(defaults)
				.use(markdownitS2Tex, {noreplace: true})
				.use(markdownitSub)
				.use(markdownitSup)
			;
		var
			_mdHabr = markdownit(defaults)
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
			if (idx >= 0 && tokens[idx] && tokens[idx].children) {
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
		function injectLineNumbersAndCentering(tokens, idx, options, env, self) {
			var line;
			if (tokens[idx].map && tokens[idx].level === 0) {
				line = tokens[idx].map[0];
				tokens[idx].attrPush(['class', 'line']);
				tokens[idx].attrPush(['data-line', line + '']);
			}

			// Hack (maybe it is better to use block renderers?)
			if (hasBlockFormula(tokens, idx + 1)) {
				tokens[idx].attrPush(['align', 'center']);
			}

			return self.renderToken(tokens, idx, options, env, self);
		}

		// Habrahabr does not ignore <p> tags and meanwhile uses whitespaces
		function habrHeading(tokens, idx, options, env, self) {
			var prefix = "";
			if (idx > 0 && tokens[idx - 1].type === 'paragraph_close' && !hasBlockFormula(tokens, idx - 2)) {
				prefix = "\n";
			}

			return prefix + self.renderToken(tokens, idx, options, env, self);
		}

		function habrParagraphOpen(tokens, idx, options, env, self) {
			var prefix = "";
			if (idx > 0 && tokens[idx - 1].type === 'paragraph_close' && !hasBlockFormula(tokens, idx - 2)) {
				prefix = "\n";
			}
			return prefix; //+ self.renderToken(tokens, idx, options, env, self);
		}

		function habrParagraphClose(tokens, idx, options, env, self) {
			var prefix = "\n";
			return prefix; //+ self.renderToken(tokens, idx, options, env, self);
		}

		function injectCentering(tokens, idx, options, env, self) {
			// Hack (maybe it is better to use block renderers?)
			if (hasBlockFormula(tokens, idx + 1)) {
				tokens[idx].attrPush(['align', 'center']);
			}
			return self.renderToken(tokens, idx, options, env, self);
		}

		_mdHtml.renderer.rules.paragraph_open = _mdHtml.renderer.rules.heading_open = injectLineNumbersAndCentering;
		_mdSrc.renderer.rules.paragraph_open  = _mdSrc.renderer.rules.heading_open  = injectCentering;

		_mdHabr.renderer.rules.heading_open    = habrHeading;
		_mdHabr.renderer.rules.paragraph_open  = habrParagraphOpen;
		_mdHabr.renderer.rules.paragraph_close = habrParagraphClose;

		// Custom image embedding for smooth UX
		_mdHtml.renderer.rules.math_inline = function (tokens, idx) {
			return imageLoader.getHtmlStub(tokens[idx].content);
		};

		/**
		 * Habrahabr hack for numerating formulas
		 */
		_mdHabr.renderer.rules.math_number = function (tokens, idx) {
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
		_mdHabr.renderer.rules.fence = function (tokens, idx, options, env, self) {
			var token = tokens[idx],
				info = token.info ? _mdHabr.utils.unescapeAll(token.info).trim() : '',
				langName = '',
				highlighted;

			if (info) {
				langName = info.split(/\s+/g)[0];
				token.attrPush(['lang', langName]);
			}

			if (options.highlight) {
				highlighted = options.highlight(token.content, langName) || _mdHabr.utils.escapeHtml(token.content);
			} else {
				highlighted = _mdHabr.utils.escapeHtml(token.content);
			}

			return '\n<source' + self.renderAttrs(token) + '>'
				+ highlighted
				+ '</source>\n';
		};

		function getHabraMarkup(source) {
			var html = _mdHabr.render(source);
			html = html.replace('<spoiler ', '\n<spoiler ');
			return html;
		}

		this.getSource = sourceGetter;

		this.setSource = function (source) {
			sourceSetter(source);
			this.updateResult();
		};

		var _oldSource = null,
			_view = 'html'; // html / src / debug

		this.updateResult = function () {
			var source = sourceGetter();
			if (_oldSource === source) {
				return;
			}

			_oldSource = source;

			// Update only active view to avoid slowdowns
			// (debug & src view with highlighting are a bit slow)
			if (_view === 'html') {
				var result = document.getElementsByClassName('result-html');

				imageLoader.reset();
				domSetPreviewHTML(_mdHtml.render(source));
				imageLoader.fixDom();
			}
			else if (_view === 'htmltex') {
				domSetHighlightedContent('result-htmltex-content', _mdOnly.render(source), 'html');
			}
			else if (_view === 'debug') {
				domSetHighlightedContent(
					'result-debug-content',
					JSON.stringify(_mdSrc.parse(source, {references: {}}), null, 2),
					'json'
				);
			}
			else if (_view === 'habr') {
				domSetHighlightedContent('result-habr-content', getHabraMarkup(source), 'html');
			}
			else { /*_view === 'src'*/
				domSetHighlightedContent('result-src-content', _mdSrc.render(source), 'html');
			}

			updateCallback(source);
		};


		this.getDisplayedResult = function () {
			var source = sourceGetter();
			return _view === 'habr' ? _mdHabr.render(source) : (_view === 'htmltex' ? _mdOnly.render(source) : _mdSrc.render(source));
		};

		this.getDisplayedResultFilename = function () {
			return _view + '.html';
		};

		setResultView(_view);
		this.switchView = function (view) {
			_view = view;
			setResultView(view);

			_oldSource = null;
			this.updateResult();
		}
	}

	function domSetHighlightedContent(className, content, lang) {
		var eNode = document.getElementsByClassName(className)[0];
		if (window.hljs) {
			eNode.innerHTML = window.hljs.highlight(lang, content).value;
		}
		else {
			eNode.textContent = content;
		}
	}

	function domSetPreviewHTML(html) {
		var result = document.getElementsByClassName('result-html');
		result[0].innerHTML = html;
	}

	/**
	 * Searches start position for text blocks
	 */
	function domFindScrollMarks() {
		var resElements = document.querySelectorAll('.result-html .line'),
			resElementHeight = [],
			line,
			mapSrc = [0],
			mapResult = [0],
			i = 0,
			len = resElements.length;

		for (; i < len; i++) {
			line = parseInt(resElements[i].getAttribute('data-line'));
			if (line) {
				resElementHeight[line] = Math.round(resElements[i].offsetTop);
			}
		}

		var srcElements = document.querySelectorAll('.ldt-pre .block-start');

		len = srcElements.length;
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

		return [mapSrc, mapResult];
	}

	documentReady(function () {
		var eTextarea = document.getElementsByClassName('source')[0],
			eResultHtml = document.getElementsByClassName('result-html')[0];

		var recalcHeight = debounce(function () {
				decorator.recalcHeight()
			}, 100);

		var scrollMap = new ScrollMap(domFindScrollMarks);

		var parserCollection = new ParserCollection(
			defaults,
			new ImageLoader(new ImagePreloader(), location.protocol == 'https:' ? 'https:' : 'http:'),
			window.markdownit,
			domSetResultView,
			function domGetSource() {
				return eTextarea.value;
			},
			function domSetSource(text) {
				eTextarea.value = text;
				decorator.update();
			},
			domSetPreviewHTML,
			domSetHighlightedContent,
			function (source) {
				// reset lines mapping cache on content update
				scrollMap.reset();

				try {
					localStorage.setItem("editor_content", source);
				}
				catch (e) {
				}
			}
		);

		parserCollection.updateResult();

		// start the decorator
		var decorator = new TextareaDecorator(eTextarea, mdParser);

		// .source has been changed after TextareaDecorator call
		var eNodeSource = document.getElementsByClassName('source')[0];

		var syncScroll = new SyncScroll(
			scrollMap,
			new Animator(function () {
				return eNodeSource.scrollTop;
			}, function (y) {
				eNodeSource.scrollTop = y;
			}),
			new Animator(function () {
				return eResultHtml.scrollTop;
			}, function (y) {
				eResultHtml.scrollTop = y;
			}),
			eNodeSource,
			eResultHtml,
			document.getElementById('container-block')
		);

		// Sync scroll listeners

		var updateText = debounce(parserCollection.updateResult, 300, {maxWait: 3000});
		eTextarea.addEventListener('keyup', updateText);
		eTextarea.addEventListener('paste', updateText);
		eTextarea.addEventListener('cut', updateText);
		eTextarea.addEventListener('mouseup', updateText);

		eTextarea.addEventListener('touchstart', syncScroll.switchScrollToSrc);
		eTextarea.addEventListener('mouseover', syncScroll.switchScrollToSrc);

		eResultHtml.addEventListener('touchstart', syncScroll.switchScrollToResult);
		eResultHtml.addEventListener('mouseover', syncScroll.switchScrollToResult);

		syncScroll.switchScrollToSrc();

		Array.prototype.forEach.call(document.getElementsByClassName('control-item'), function (eNode, index) {
			eNode.addEventListener('click', function () {
				var view = this.getAttribute('data-result-as');
				if (view) {
					parserCollection.switchView(view);

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

		// Interface element listeners

		document.querySelector('._download-source').addEventListener('click', function () {
			var blob = new Blob([parserCollection.getSource()], {type: 'text/markdown;charset=utf-8'});
			saveAs(blob, 'source.md');
		});

		document.querySelector('._download-result').addEventListener('click', function () {
			var blob = new Blob([parserCollection.getDisplayedResult()], {type: 'text/html;charset=utf-8'});
			saveAs(blob, parserCollection.getDisplayedResultFilename());
		});

		document.querySelector('._upload-source').addEventListener('click', function () {
			var eNode = document.getElementById('fileElem');
			// Fire click on file input
			(eNode.onclick || eNode.click || function () {}).call(eNode);
		});

		document.getElementById('fileElem').addEventListener('change', function () {
			// A file has been chosen
			if (!this.files || !FileReader) {
				return;
			}

			var reader = new FileReader(),
				fileInput = this;

			reader.onload = function () {
				parserCollection.setSource(this.result);
				fileInput.value = fileInput.defaultValue;
			};
			reader.readAsText(this.files[0]);
		});

		// Need to recalculate line positions on window resize
		window.addEventListener('resize', function () {
			scrollMap.reset();
			recalcHeight();
		});
	});
})(document, window);