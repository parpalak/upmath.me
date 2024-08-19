// noinspection ES6ConvertVarToLetConst

/**
 * Markdown and LaTeX Editor
 *
 * (c) Roman Parpalak, 2016-2024
 */

(function (document, window) {
	'use strict';

	var defaults = {
		html: true,         // Enable HTML tags in source
		xhtmlOut: false,        // Use '/' to close single tags (<br />)
		breaks: false,        // Convert '\n' in paragraphs into <br>
		langPrefix: 'language-',  // CSS language prefix for fenced blocks
		linkify: true,         // autoconvert URL-like texts to links
		typographer: true,         // Enable smartypants and other sweet transforms
		quotes: '""\'\'',

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
			} else {
				eNode.className = eNode.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
			}
		});

		if (eNode.classList) {
			eNode.classList.add('result-as-' + val);
		} else {
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
		var _mdPreview = markdownit(defaults)
			.use(markdownitS2Tex)
			.use(markdownitSub)
			.use(markdownitSup)
		;

		var _mdHtmlAndImages = markdownit(defaults)
			.use(markdownitS2Tex)
			.use(markdownitSub)
			.use(markdownitSup)
		;

		var _mdHtmlAndTex = markdownit(defaults)
			.use(markdownitS2Tex, {noreplace: true})
			.use(markdownitSub)
			.use(markdownitSup)
		;

		var _mdHtmlHabrAndImages = markdownit(defaults)
			.use(markdownitS2Tex, defaults._habr)
			.use(markdownitSub)
			.use(markdownitSup)
		;

		var _mdMdAndImages = markdownit('zero')
			.use(markdownitS2Tex)
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

		_mdPreview.renderer.rules.paragraph_open = _mdPreview.renderer.rules.heading_open = injectLineNumbersAndCentering;
		_mdHtmlAndImages.renderer.rules.paragraph_open = _mdHtmlAndImages.renderer.rules.heading_open = injectCentering;

		_mdHtmlHabrAndImages.renderer.rules.heading_open = habrHeading;
		_mdHtmlHabrAndImages.renderer.rules.paragraph_open = habrParagraphOpen;
		_mdHtmlHabrAndImages.renderer.rules.paragraph_close = habrParagraphClose;

		// A copy of Markdown-it original backticks parser.
		// We want to prevent from parsing dollars inside backticks as TeX delimeters (`$$`).
		// But we do not want HTML in result.
		_mdMdAndImages.inline.ruler.before('backticks', 'backticks2', function (state, silent) {
			var start, max, marker, matchStart, matchEnd, token,
				pos = state.pos,
				ch = state.src.charCodeAt(pos);
			if (ch !== 0x60/* ` */) {
				return false;
			}

			start = pos;
			pos++;
			max = state.posMax;

			while (pos < max && state.src.charCodeAt(pos) === 0x60/* ` */) {
				pos++;
			}

			marker = state.src.slice(start, pos);

			matchStart = matchEnd = pos;

			while ((matchStart = state.src.indexOf('`', matchEnd)) !== -1) {
				matchEnd = matchStart + 1;

				while (matchEnd < max && state.src.charCodeAt(matchEnd) === 0x60/* ` */) {
					matchEnd++;
				}

				if (matchEnd - matchStart === marker.length) {
					if (!silent) {
						token = state.push('backticks2_inline', 'code', 0); // <-- The change
						token.markup = marker;
						token.content = state.src.slice(pos, matchStart)
					}
					state.pos = matchEnd;
					return true;
				}
			}

			if (!silent) {
				state.pending += marker;
			}
			state.pos += marker.length;
			return true;
		});

		_mdMdAndImages.renderer.rules.backticks2_inline = function (tokens, idx /*, options, env, slf*/) {
			var token = tokens[idx];
			return token.markup + token.content + token.markup;
		};

		// Prevents HTML escaping.
		_mdMdAndImages.renderer.rules.text = function (tokens, idx /*, options, env */) {
			return tokens[idx].content;
		};

		// Custom image embedding for smooth UX
		_mdPreview.renderer.rules.math_inline = function (tokens, idx) {
			return imageLoader.getHtmlStub(tokens[idx].content);
		};

		// no conversion required due to latex.js
		_mdHtmlAndTex.renderer.rules.math_number = function (tokens, idx) {
			return tokens[idx].content;
		};

		/**
		 * Habrahabr hack for numerating formulas
		 */
		_mdHtmlHabrAndImages.renderer.rules.math_number = function (tokens, idx) {
			return '<img align="right" src="//i.upmath.me/svg/' + tokens[idx].content + '" />';
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
		_mdHtmlHabrAndImages.renderer.rules.fence = function (tokens, idx, options, env, self) {
			var token = tokens[idx],
				info = token.info ? _mdHtmlHabrAndImages.utils.unescapeAll(token.info).trim() : '',
				langName = '',
				highlighted;

			if (info) {
				langName = info.split(/\s+/g)[0];
				token.attrPush(['lang', langName]);
			}

			if (options.highlight) {
				highlighted = options.highlight(token.content, langName) || _mdHtmlHabrAndImages.utils.escapeHtml(token.content);
			} else {
				highlighted = _mdHtmlHabrAndImages.utils.escapeHtml(token.content);
			}

			return '\n<source' + self.renderAttrs(token) + '>'
				+ highlighted
				+ '</source>\n';
		};

		function getHabraMarkup(source) {
			var html = _mdHtmlHabrAndImages.render(source);

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
				imageLoader.reset();
				domSetPreviewHTML(_mdPreview.render(source));
				imageLoader.fixDom();
			} else if (_view === 'htmltex') {
				domSetHighlightedContent('result-src-content', '<script src="https://i.upmath.me/latex.js"></script>\n' + _mdHtmlAndTex.render(source), 'html');
			} else if (_view === 'debug') {
				domSetHighlightedContent(
					'result-src-content',
					JSON.stringify(_mdHtmlAndImages.parse(source, {references: {}}), null, 2),
					'json'
				);
			} else if (_view === 'habr') {
				domSetHighlightedContent('result-src-content', getHabraMarkup(source), 'html');
			} else if (_view === 'md') {
				domSetHighlightedContent('result-src-content', _mdMdAndImages.renderInline(source), 'html');
			} else { /*_view === 'src'*/
				domSetHighlightedContent('result-src-content', _mdHtmlAndImages.render(source), 'html');
			}

			updateCallback(source);
		};

		this.getDisplayedResult = function () {
			if (_view === 'html') {
				return domGetPreviewHTML();
			}

			var source = sourceGetter();

			if (_view === 'habr') {
				return _mdHtmlHabrAndImages.render(source);
			}

			if (_view === 'htmltex') {
				return '<script src="https://i.upmath.me/latex.js"></script>\n' + _mdHtmlAndTex.render(source);
			}

			if (_view === 'md') {
				return _mdMdAndImages.renderInline(source);
			}

			return _mdHtmlAndImages.render(source);
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
		} else {
			eNode.textContent = content;
		}
	}

	function domSetPreviewHTML(html) {
		var result = document.getElementsByClassName('result-html');
		result[0].innerHTML = html;
	}

	function domGetPreviewHTML() {
		return document.getElementsByClassName('result-html')[0].innerHTML;
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

		var srcScrollHeight = document.querySelector('.ldt-pre').scrollHeight,
			lastSrcElemPos = mapSrc[mapSrc.length - 1],
			allowedHeight = 5; // workaround for automatic textarea scrolling on entering new source lines

		mapSrc.push(srcScrollHeight - allowedHeight > lastSrcElemPos ? srcScrollHeight - allowedHeight : lastSrcElemPos);
		mapResult.push(document.querySelector('.result-html').scrollHeight);

		return [mapSrc, mapResult];
	}

	documentReady(function () {
		var eTextarea = document.getElementById('editor-source'),
			eResultHtml = document.getElementsByClassName('result-html')[0];

		var historyManager = new TextHistoryManager(2 * 1024 * 1024, 'file_history_', 300),
			documentStorage = new DocumentStorage(3 * 1024 * 1024, 'file_storage_', function (id, text) {
				historyManager.storeText(id, text);
			}),
			currentDocumentTracker = new CurrentDocumentTracker(
				documentStorage,
				'current_document_id',
				function () {
					document.getElementById('storage-warning').style.display = 'block';
				},
				function () {
					document.getElementById('storage-warning').style.display = 'none';
				}
			),
			content = '';

		if (currentDocumentTracker.hasDocument()) {
			content = currentDocumentTracker.getDocument();
		} else {
			content = window.localStorage.getItem("editor_content") || window.instructionText;
			currentDocumentTracker.createDocument(content);
		}
		eTextarea.value = content;

		var recalcHeight = debounce(function () {
			decorator.recalcHeight()
		}, 100);

		var scrollMap = new ScrollMap(domFindScrollMarks);
		var syncScroll;
		var parserCollection = new ParserCollection(
			defaults,
			new ImageLoader(new ImagePreloader(), location.protocol === 'https:' ? 'https:' : 'http:'),
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

				if (syncScroll) {
					// syncScroll.switchScrollToSrc(); // see comment on eResultHtml.addEventListener('mouseenter') below
					syncScroll.scrollToBottomIfRequired();
				}

				try {
					currentDocumentTracker.updateDocument(source);
				} catch (e) {
				}
			}
		);

		parserCollection.updateResult();

		// start the decorator
		var decorator = new TextareaDecorator(eTextarea, mdParser);

		// .source has been changed after TextareaDecorator call
		var eNodeSource = document.getElementsByClassName('source')[0];

		syncScroll = new SyncScroll(
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
			document.querySelector('[id^="container-block"]')
		);

		// Sync scroll listeners

		var updateText = debounce(parserCollection.updateResult, 300, {maxWait: 3000});
		eTextarea.addEventListener('keyup', updateText);
		eTextarea.addEventListener('paste', updateText);
		eTextarea.addEventListener('cut', updateText);
		eTextarea.addEventListener('mouseup', updateText);

		eTextarea.addEventListener('touchstart', syncScroll.switchScrollToSrc);
		eNodeSource.addEventListener('mouseenter', syncScroll.switchScrollToSrc);

		eResultHtml.addEventListener('touchstart', syncScroll.switchScrollToResult);
		/**
		 * Here is a minor bug related to updating the content of the resulting block via innerHtml,
		 * causing the mouseenter event to trigger again. If the mouse remains within the preview area
		 * while we update the source, first switchScrollToSrc is fired,
		 * and then due to the repeated mouseenter event, switchScrollToResult will be fired.
		 * This causes the source to jitter slightly. Reattaching mouseenter to the parent did not help.
		 * Apparently, the reason lies in updating content via innerHtml.
		 *
		 * The bug stops manifesting if the mouse is moved outside the result block, for example, into the source block.
		 * Therefore, for now, I decided to leave it as is, not fixing it at any cost.
		 */
		eResultHtml.addEventListener('mouseenter', syncScroll.switchScrollToResult);

		syncScroll.switchScrollToSrc();

		// Tab support
		enableTabToIndent(eTextarea);

		Array.prototype.forEach.call(document.getElementsByClassName('control-item'), function (eNode, index) {
			function clickHandler(e) {
				var view = e.target.getAttribute('data-result-as');
				if (!view) {
					return;
				}

				parserCollection.switchView(view);

				if (view !== 'preview') {
					// Selecting all block content.
					var contentBlocks = document.getElementsByClassName('result-src-content');
					if (contentBlocks.length) {
						setTimeout(function () {
							selectText(contentBlocks[0]);
						}, 0);
					}
				}
			}

			eNode.addEventListener('click', clickHandler);
			eNode.addEventListener('keydown', function (e) {
				if (e.target === this && (e.code === 'Space' || e.code === 'Enter')) {
					clickHandler(e);
				}
			});
		});

		// Interface element listeners

		var mainMenu = new MainMenu(
			[
				{
					label: "New",
					action: function () {
						currentDocumentTracker.createDocument('');
						parserCollection.setSource('');
					}
				},
				{
					label: "⇑ Upload a file",
					action: function () {
						var eNode = document.getElementById('fileElem');
						// Fire click on file input
						(eNode.onclick || eNode.click || function () {
						}).call(eNode);
					}
				},
				{
					label: "⇓ Download source",
					action: function () {
						var blob = new Blob([parserCollection.getSource()], {type: 'text/markdown;charset=utf-8'});
						saveAs(blob, 'upmath.me.' + currentDocumentTracker.getCurrentDocumentId() + '.md');
					}
				},
				{
					label: "Open",
					items: function () {
						return documentStorage.getAllDocumentIds().reverse().map(id => {
							var label = documentStorage.readDocument(id).replace(new RegExp('^[\\s#]+'), '').substring(0, 100);
							return {
								label: label === '' ? '[Untitled]' : label.replace(/&/g, '&amp;')
									.replace(/>/g, '&gt;')
									.replace(/</g, '&lt;')
									.replace(/"/g, '&quot;')
								,
								action: function () {
									parserCollection.setSource(currentDocumentTracker.openDocument(id));
								}
							};
						});
					}
				},
				{
					label: "Restore from history...",
					action: function () {
						var dialog = document.getElementById('versionsDialog');
						var list = document.getElementById('versionsList');
						list.innerHTML = '';

						document.getElementById('versionSelectedText').innerHTML = 'No version selected';

						var versions = historyManager.getAllVersions();
						var selectedTimestamp = null;

						versions.forEach(function (version) {
							var eListItem = document.createElement('a');
							eListItem.href = '#';
							eListItem.classList.add('version-item');

							var eTitle = document.createElement('span');
							eTitle.classList.add('version-header');
							eTitle.textContent = version.text === '' ? '[Untitled]' : version.text.substring(0, 100) + (version.text.length > 100 ? '...' : '');
							eListItem.appendChild(eTitle);

							var eDate = document.createElement('span');
							eDate.classList.add('version-date');
							eDate.textContent = formatTimestamp(version.timestamp);
							eListItem.appendChild(eDate);

							eListItem.addEventListener('click', function (e) {
								var eTextDisplay = document.getElementById('versionSelectedText');
								selectedTimestamp = version.timestamp;
								eTextDisplay.textContent = version.text;
								document.querySelectorAll('a.version-item.selected').forEach(function (eA) {
									eA.classList.remove('selected');
								});
								eListItem.classList.add('selected');

								e.preventDefault();
							});
							list.appendChild(eListItem);
						});

						dialog.showModal();

						document.getElementById('versionCloseButton').onclick = function () {
							dialog.close();
						};

						document.getElementById('versionRestoreButton').onclick = function () {
							if (!selectedTimestamp) {
								return;
							}

							versions.forEach(function (version) {
								if (version.timestamp === selectedTimestamp) {
									currentDocumentTracker.createDocument(version.text);
									parserCollection.setSource(version.text);
									dialog.close();
								}
							})
						};
					}
				},
				{
					label: "Open instruction",
					action: function () {
						currentDocumentTracker.createDocument(instructionText);
						parserCollection.setSource(instructionText);
					}
				},
				{
					label: "Delete",
					action: function () {
						var currentText = eTextarea.value;
						if (
							currentText.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "") !== ''
							&& !confirm('Are you sure you want to delete this document?')
						) {
							return;
						}
						historyManager.storeText(currentDocumentTracker.getCurrentDocumentId(), currentText, true);
						parserCollection.setSource(currentDocumentTracker.deleteDocumentAndGetAnother());
					}
				},
				{},
				{
					label: "What's new",
					action: '/whatsnew.html?2024-08-19',
					title: 'Last update on 2024-08-19'
				},
				{
					label: "By me a coffee ☕",
					action: 'https://buymeacoffee.com/upmath',
				},
				{},
				{
					// label: "Print or save PDF <span class='shortcut'>Ctrl+P</span>", // OS-dependent?
					label: "Print or save PDF",
					action: function () {
						window.print();
					}
				},
				{
					label: function () {
						return document.fullscreenElement ? "Exit full-screen" : "Enter full-screen";
					},
					action: function () {
						if (document.fullscreenElement) {
							document.exitFullscreen();
						} else {
							document.documentElement.requestFullscreen();
						}
					}
				}
			],
			document.getElementsByClassName('menu-container')[0],
			function () {
				// Here is a strange behaviour. Textarea is scrolled to the bottom on focus.
				// It causes an early scrolling of the preview content without images loaded.
				// This leads to a wrong ScrollMap content.
				// TODO: uncomment if figure out how to fix this
				// setTimeout(function () {
				// 	eTextarea.focus();
				// }, 0);
			}
		);

		document.querySelector('._download-result').addEventListener('click', function () {
			var blob = new Blob([parserCollection.getDisplayedResult()], {type: 'text/html;charset=utf-8'});
			saveAs(blob, parserCollection.getDisplayedResultFilename());
		});

		document.getElementById('fileElem').addEventListener('change', function () {
			// A file has been chosen
			if (!this.files || !FileReader) {
				return;
			}

			var reader = new FileReader(),
				fileInput = this;

			reader.onload = function () {
				currentDocumentTracker.createDocument(this.result);
				parserCollection.setSource(this.result);
				fileInput.value = fileInput.defaultValue;
			};
			reader.readAsText(this.files[0]);
		});

		(function () {
			var eSlider = document.querySelector('.slider'),
				dragSlider = new Draggabilly(eSlider, {
					axis: 'x'
				}),
				sourceBlock = document.getElementById('source-block'),
				resultBLock = document.getElementById('result-block'),
				windowWidth;

			function setWidth(percent) {
				sourceBlock.style.width = 'calc(' + percent + '% - 3px)';
				resultBLock.style.width = 'calc(' + (100 - percent) + '% - 3px)';

				scrollMap.reset();
				recalcHeight();
			}

			eSlider.addEventListener('dblclick', function () {
				setWidth(50);
			});

			dragSlider.on('dragStart', function (event, pointer, moveVector) {
				windowWidth = window.innerWidth;
			});

			dragSlider.on('dragMove', function (event, pointer, moveVector) {
				setWidth(100.0 * pointer.pageX / windowWidth);
			});
		})();

		// Need to recalculate line positions on window resize
		window.addEventListener('resize', function () {
			scrollMap.reset();
			recalcHeight();
		});
	});
})(document, window);
