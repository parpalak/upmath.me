// noinspection ES6ConvertVarToLetConst

'use strict';

/**
 * DOMContentLoaded polyfill
 *
 * @param fn
 */
function documentReady(fn) {
	if (document.readyState != 'loading') {
		fn();
	}
	else {
		document.addEventListener('DOMContentLoaded', fn);
	}
}

/**
 * Formats a timestamp into a human-readable string representation of the date and time.
 *
 * @param {number} timestamp - The timestamp to be formatted
 * @return {string} The formatted date and time string
 */
function formatTimestamp(timestamp) {
	var date = new Date(timestamp);
	var now = new Date();
	var diff = Math.abs(now - date) / 1000;

	if (diff < 60) {
		return 'Just now';
	}
	if (diff < 3600) {
		var minutes = Math.floor(diff / 60);
		return minutes === 1 ? '1 minute ago' : minutes + ' minutes ago';
	}
	if (diff < 86400) {
		var hours = Math.floor(diff / 3600);
		var remainingMinutes = Math.floor((diff % 3600) / 60);
		if (remainingMinutes === 0) {
			return hours === 1 ? '1 hour ago' : hours + ' hours ago';
		} else {
			return hours + (hours === 1 ? ' hour ' : ' hours ') + remainingMinutes + (remainingMinutes === 1 ? ' minute ago' : ' minutes ago');
		}
	}

	return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}


/**
 * Find the index of a maximum value in values array
 * which is less than maxValue.
 *
 * @param maxValue
 * @param values
 *
 * @returns {object}
 */
function findBisect(maxValue, values) {
	var a = 0,
		b = values.length - 1,
		f_a = values[a];

	if (f_a >= maxValue) {
		return {val: a, part: 0};
	}

	var f_b = values[b];
	if (f_b < maxValue) {
		return {val: b, part: 0};
	}

	while (b - a > 1) {
		var c = a + Math.round((b - a) / 2),
			f_c = values[c];

		if (f_c >= maxValue) {
			b = c;
			f_b = f_c;
		}
		else {
			a = c;
			f_a = f_c;
		}
	}

	return {val: a, part: (maxValue - f_a) / (f_b - f_a)};
}

/**
 * Constructor function for CurrentDocumentTracker.
 * Wraps the documentStorage for using it in the editor.
 *
 * @param {Object} documentStorage - The document storage object.
 * @param {string} currentDocumentKey - The key for the current document.
 * @param {function} showStorageWarning - The function to show a storage warning.
 * @param {function} hideStorageWarning - The function to hide a storage warning.
 */
function CurrentDocumentTracker	(documentStorage, currentDocumentKey, showStorageWarning, hideStorageWarning) {
	this._documentStorage = documentStorage;
	this._showStorageWarning = showStorageWarning;
	this._hideStorageWarning = hideStorageWarning;
	this._currentDocumentKey = currentDocumentKey;
	this._currentDocumentId = localStorage.getItem(this._currentDocumentKey);

	this.getCurrentDocumentId = function () {
		return this._currentDocumentId;
	};
	this.hasDocument = function () {
		return this._currentDocumentId !== null;
	};
	this.getDocument = function () {
		return this._documentStorage.readDocument(this._currentDocumentId);
	};
	this.createDocument = function (content) {
		this._currentDocumentId = documentStorage.createNewDocument(content);
		if (this._currentDocumentId === null) {
			this._showStorageWarning();
		} else {
			this._hideStorageWarning();
			window.localStorage.setItem(this._currentDocumentKey, this._currentDocumentId);
		}
	};
	this.updateDocument = function (content) {
		if (this._currentDocumentId === null) {
			this.createDocument(content);
			return;
		}

		if (!this._documentStorage.writeDocument(this._currentDocumentId, content)) {
			this._showStorageWarning();
		} else {
			this._hideStorageWarning();
		}
	};
	this.openDocument = function (id) {
		this._currentDocumentId = id;
		window.localStorage.setItem(this._currentDocumentKey, this._currentDocumentId);

		return this._documentStorage.readDocument(id);
	}
	this.deleteDocumentAndGetAnother = function () {
		this._documentStorage.deleteDocument(this._currentDocumentId);

		var allDocumentIds = this._documentStorage.getAllDocumentIds();
		if (allDocumentIds.length === 0) {
			this.createDocument('');

			return '';
		}

		return this.openDocument(allDocumentIds[allDocumentIds.length - 1])
	};
}

/**
 * Count the number of occurrences of a substring in a string
 *
 * @param substr
 * @param str
 * @returns {number}
 */
function substrCount(substr, str) {
	var count = -1,
		index = -2;

	while (index != -1) {
		count++;
		index = str.indexOf(substr, index + 1)
	}

	return count;
}

/**
 * Selects the content of the given DOM node.
 *
 * @param eNode
 */
function selectText(eNode) {
	if (!window.getSelection) {
		return;
	}

	var selection = window.getSelection(),
		range = document.createRange();

	range.selectNodeContents(eNode);
	selection.removeAllRanges();
	selection.addRange(range);
}

/**
 * Realistic animation module based on one-dimensional physical model.
 *
 * @param positionGetter
 * @param positionSetter
 * @constructor
 */
function Animator(positionGetter, positionSetter) {
	var x = 0,
		x1 = 0,
		x2 = 0,
		v = 0,
		animationTime = 200,
		timerId,
		startedAt = null;

	var loop = function (timestamp) {
		if (startedAt === null) {
			startedAt = timestamp;
		}

		var moveTime = timestamp - startedAt;

		if (moveTime < moveDuration) {
			// New position and velocity
			x = x2 + A * (Math.cos(omega * (moveTime - moveDuration)) - 1);
			v = A * omega * (Math.sin(omega * (moveDuration - moveTime)));

			positionSetter(x);

			timerId = requestAnimationFrame(loop);

			if (isReInit) {
				/**
				 * If the position has been forced, we run the animation again.
				 */
				initMotion(reInitPosition, x);
				isReInit = false;
				startedAt = timestamp;
			}
		}
		else {
			// Stop the animation
			startedAt = null;

			v = 0;
			positionSetter(x2);
			cancelAnimationFrame(timerId);

			if (isReInit) {
				isReInit = false;
			}
		}
	};

	/**
	 * The moveDuration of animation. It can be less than animationTime in case of high speed.
	 */
	var moveDuration;

	/**
	 * Motion parameters. See the loop formulas.
	 */
	var A, omega;

	/**
	 * Flag fired when the final position has been changed during running amination.
	 */
	var isReInit = false;

	/**
	 * New value for final position (that has been changed during running amination).
	 */
	var reInitPosition;

	/**
	 * Calculate parameters A and omega for the position given by formula
	 *
	 * x(t) = x0 + A * (Math.cos(omega * (t - t0)) - 1);
	 *
	 * @param newPosition
	 * @param oldPosition
	 */
	function initMotion(newPosition, oldPosition) {
		var k;
		x2 = newPosition;
		x1 = oldPosition;

		if (Math.abs(v) < 0.00001) {
			// Rest
			k = Math.PI;
			moveDuration = animationTime;
		}
		else {
			// Motion

			var alpha = (x2 - x1) / v / animationTime; // Motion parameter

			/**
			 * Instead of solving non-linear equation alpha * k = tan(k/2)
			 * we use approximation 0.5/a = 1 - (k/pi)^2
			 */
			if (alpha < 0 || alpha > 0.5) {
				k = Math.PI * Math.sqrt(1 - 0.5 / alpha);
			}
			else {
				k = 0.1;
			}

			/**
			 * After approximate value of k is determined, we redefine alpha
			 * since its value affects the animation. It means that the total
			 * animation duration (moveDuration) differs from animationTime.
			 * However, the difference does not impact the user experience.
			 */
			var alpha1 = (1 - Math.cos(k)) / k / Math.sin(k);
			moveDuration = (x2 - x1) / alpha1 / v;
		}

		omega = k / moveDuration;
		A = (x2 - x1) / (1 - Math.cos(k));
	}

	/**
	 * Public control method
	 *
	 * @param nextPos
	 */
	this.setPos = function (nextPos) {
		isReInit = (startedAt !== null);
		if (!isReInit) {
			x = positionGetter();
			initMotion(nextPos, x);
			timerId = requestAnimationFrame(loop);
		}
		else {
			reInitPosition = nextPos;
		}
	};

	this.stop = function () {
		startedAt = null;
		v = 0;
		cancelAnimationFrame(timerId);
		isReInit = false;
	};
}

if (typeof String.prototype.replaceAll === "undefined") {
	function escapeRegExp(str) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
	}

	/**
	 * See http://stackoverflow.com/questions/1144783/replacing-all-occurrences-of-a-string-in-javascript
	 * @param search
	 * @param replacement
	 * @returns {string}
	 */
	String.prototype.replaceAll = function (search, replacement) {
		var target = this;
		if (typeof search === "string") {
			search = new RegExp(escapeRegExp(search), 'g');
		}
		return target.replace(search, replacement);
	};
}

/**
 * @param protocol  Needed for support the "file:" protocol.
 * @constructor
 */
function ImagePreloader(protocol) {
	var data = {},
		uniqueIndex = 0;

	function ajaxReady() {
		var svg;

		if (this.status >= 200 && this.status < 400) {
			svg = this.responseText;
		} else {
			// We reached our target server, but it returned an error
			svg = '<svg height="24" version="1.1" width="24" xmlns="http://www.w3.org/2000/svg">' +
				'<g transform="translate(0 -1028.4)">' +
				'<path d="m22 12c0 5.523-4.477 10-10 10-5.5228 0-10-4.477-10-10 0-5.5228 4.4772-10 10-10 5.523 0 10 4.4772 10 10z" fill="#742600" transform="translate(0 1029.4)"/>' +
				'<path d="m22 12c0 5.523-4.477 10-10 10-5.5228 0-10-4.477-10-10 0-5.5228 4.4772-10 10-10 5.523 0 10 4.4772 10 10z" fill="#AB562B" transform="translate(0 1028.4)"/>' +
				'<path d="m7.0503 1037.8 3.5357 3.6-3.5357 3.5 1.4142 1.4 3.5355-3.5 3.536 3.5 1.414-1.4-3.536-3.5 3.536-3.6-1.414-1.4-3.536 3.5-3.5355-3.5-1.4142 1.4z" fill="#742600"/>' +
				'<path d="m7.0503 1036.8 3.5357 3.6-3.5357 3.5 1.4142 1.4 3.5355-3.5 3.536 3.5 1.414-1.4-3.536-3.5 3.536-3.6-1.414-1.4-3.536 3.5-3.5355-3.5-1.4142 1.4z" fill="#ecf0f1"/>' +
				'</g>' +
				'</svg>';
		}

		setImage(this.S2formula, svg);
	}

	/**
	 * Compresses a text and returns a base64 string of the compressed text
	 *
	 * @param text
	 * @param callback
	 */
	function deflateRaw(text, callback) {
		if (typeof CompressionStream === 'undefined') {
			callback(null);
			return;
		}

		try {
			var stream = new Blob([text]).stream();
			var compressedStream = stream.pipeThrough(new CompressionStream('deflate-raw'));

			new Response(compressedStream).blob().then(function (compressedBlob) {
				return compressedBlob.arrayBuffer();
			}).then(function (buffer) {
				var compressedArray = new Uint8Array(buffer);
				var binary = Array.from(compressedArray).map(function (b) {
					return String.fromCharCode(b);
				}).join('');
				var base64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
				callback(base64);
			}).catch(function () {
				callback(null);
			});
		} catch (e) {
			callback(null);
		}
	}

	function loadImage(formula) {
		var fallbackUrl = protocol + '//i.upmath.me/svg/' + encodeURIComponent(formula);

		deflateRaw(formula, function (compressed) {
			var shortUrl = compressed ? protocol + '//i.upmath.me/svgb/' + compressed : null,
				url = shortUrl && shortUrl.length < fallbackUrl.length ? shortUrl : fallbackUrl;

			var request = new XMLHttpRequest();
			request.open('GET', url, true);
			request.S2formula = formula;
			request.onload = ajaxReady;
			request.onerror = function () {
				// Handle load error silently.
			};
			request.send();
		});
	}

	this.onLoad = function (formula, callback) {
		if (!data[formula]) {
			data[formula] = {
				svg: null,
				baseline: null,
				callback: callback
			};
			loadImage(formula);
		} else if (data[formula].svg !== null) {
			callback(formula, data[formula].svg, data[formula].baseline);
		}
	};

	/**
	 * Make ids in svg unique across the html code by adding a prefix.
	 *
	 * @param svg
	 * @returns {*}
	 */
	function makeSvgIdsUnique(svg) {
		var m = svg.match(/id=["']([^"']*)["']/g);

		if (!m) {
			return svg;
		}

		var i = m.length,
			id, newId, curStr;

		for (; i--;) {
			curStr = m[i];
			id = curStr.match(/id=["']([^"']*)["']/)[1];
			newId = 's' + uniqueIndex + id;

			svg = svg
				.replaceAll(curStr, 'id="' + newId + '"')
				.replaceAll('#' + id, '#' + newId)
			;
		}

		uniqueIndex++;

		return svg;
	}

	/**
	 * Stores sizes, source and removes the xhr object.
	 * @param formula
	 * @param svg
	 */
	function setImage(formula, svg) {
		var urlData = data[formula];
		if (!urlData) {
			return;
		}

		svg = makeSvgIdsUnique(svg);

		var m = svg.match(/postMessage\((?:&quot;|")([\d\|\.\-eE]*)(?:&quot;|")/); // ["&quot;2.15299|31.42377|11.65223|&quot;", "2.15299|31.42377|11.65223|"]
		if (m) {
			var baselineShift = m && m[1] ? m[1].split('|').shift() : 0; // 2.15299
		} else {
			// svg can be empty like "<svg xmlns="http://www.w3.org/2000/svg"/>"
			// Mark as something is wrong.
			baselineShift = null;
		}

		urlData.svg = svg;
		urlData.baseline = baselineShift;

		if (urlData.callback) {
			urlData.callback(formula, svg, baselineShift);
			urlData.callback = null;
		}
	}

	/**
	 * External API
	 *
	 * @param formula
	 * @returns {null}
	 */
	this.getImageDataFromFormula = function (formula) {
		return data[formula] || null;
	};
}

/**
 *
 * @param preloader
 * @constructor
 */
function ImageLoader(preloader) {
	var curItems = [],  // current formula content
		prevItems = [], // previous formula content
		map = {},       // maps formula content to index
		n = 0,          // current formula number

		placeholderTimer = null,
		placeholderIndex = null,
		placeholderFormula = null;

	/**
	 * Find if user has edited only one formula.
	 */
	function detectPlaceholderFormula() {
		if (n == prevItems.length) {
			var editNum = 0, index, i = n;

			for (; i--;) {
				if (curItems[i] != prevItems[i]) {
					editNum++;
					index = i;
				}
			}

			if (editNum == 1) {
				if (placeholderIndex === null) {
					// A formula has been changed.
					// Use previous one as a placeholder.
					placeholderIndex = index;
					placeholderFormula = prevItems[index];
					return;
				}
				if (placeholderIndex === index) {
					// Formula has been changed again since previous change,
					// but the previous image has not been loaded yet.
					// Keep previous placeholder.
					return;
				}
			}
		}

		// Many formulas has been changed. We do not display any placeholders.
		placeholderIndex = null;
		placeholderFormula = null;
	}

	function buildMap() {
		map = {};
		for (var i = n; i--;) {
			var formula = curItems[i];

			if (typeof map[formula] === 'undefined') {
				map[formula] = [i]
			}
			else {
				map[formula].push(i);
			}
		}
	}

	/**
	 * Start parsing process.
	 */
	this.reset = function () {
		curItems = [];
		n = 0;
	};

	/**
	 * Insert SVG images.
	 *
	 * @param formula
	 * @param svg
	 * @param baselineShift
	 */
	var callback = function (formula, svg, baselineShift) {
		var indexes = map[formula], i;

		if (indexes && (i = indexes.length)) {
			for (; i--;) {
				var index = indexes[i];

				insertPicture(index, svg, baselineShift, index === placeholderIndex ? 'fade-in' : 'replace');

				if (index === placeholderIndex) {
					// Clear the fade out timer if the new image has just bee
					clearTimeout(placeholderTimer);
					placeholderIndex = null;
					placeholderFormula = null;
				}
			}
		}
	};

	/**
	 * Mark formula as loading.
	 * Use previous image but transparent.
	 *
	 * @param index
	 * @param svg
	 * @param baselineShift
	 * @param mode One of 'replace', 'fade-in', 'fade-out'
	 */
	function insertPicture(index, svg, baselineShift, mode) {
		var id = 's2tex_' + index,
			oldSvgNode = document.getElementById(id),
			parentNode = oldSvgNode.parentNode,
			startOpacity = '1', // mode == 'fade-in' ? '0.5' : '1', // sometimes images opacity can be '1' yet. How can one track it?
			finalOpacity = mode == 'fade-out' ? '0.5' : '1',
			newSvgAttrs = '<svg class="svg-preview" id="' + id + '" ';

		if (baselineShift === null) {
			// svg has been loaded but something went wrong.
			newSvgAttrs += 'width="13px" height="13px" ';
		}
		else {
			newSvgAttrs += 'style="vertical-align:' + (-baselineShift) + 'pt; opacity: ' + startOpacity + '" ';
		}

		// Polyfill for outerHTML
		var divNode = document.createElement('div');
		divNode.innerHTML = svg.replace('<svg ', newSvgAttrs);

		var newSvgNode = divNode.firstElementChild; // there can be comments before <svg>
		divNode.removeChild(newSvgNode);

		parentNode.insertBefore(newSvgNode, oldSvgNode);
		parentNode.removeChild(oldSvgNode);

		if (finalOpacity != startOpacity) {
			placeholderTimer = setTimeout(function () {
				document.getElementById(id).style.opacity = finalOpacity;
			}, 0);
		}
	}

	/**
	 * Generate the picture HTML code while parsing and store the state.
	 *
	 * @param formula
	 * @returns {string}
	 */
	this.getHtmlStub = function (formula) {
		curItems[n] = formula;

		var html = '<span id="s2tex_' + n + '"></span>';

		n++;

		return html;
	};

	/**
	 * Finish the parsing process.
	 */
	this.fixDom = function () {
		detectPlaceholderFormula();
		buildMap();
		for (var i = n; i--;) {
			preloader.onLoad(curItems[i], callback);
		}

		if (placeholderIndex !== null) {
			var data = preloader.getImageDataFromFormula(placeholderFormula);
			if (data !== null && data.callback === null) {
				insertPicture(placeholderIndex, data.svg, data.baseline, 'fade-out');
			}
		}

		prevItems = curItems.slice(0);
	};
}

/**
 * Access to the map between blocks in sync scroll.
 *
 * @param mapBuilder
 * @constructor
 */
function ScrollMap(mapBuilder) {
	var map = null;

	this.reset = function () {
		map = [null, null];
	};

	this.getPosition = function (eBlockNode, fromIndex, toIndex) {
		var offsetHeight = eBlockNode.offsetHeight;
		var scrollTop    = eBlockNode.scrollTop;

		if (scrollTop == 0) {
			return 0;
		}

		if (map[fromIndex] === null) {
			map = mapBuilder();
		}

		var maxMapIndex = map[fromIndex].length - 1;
		if (map[fromIndex][maxMapIndex] <= scrollTop + offsetHeight) {
			return map[toIndex][maxMapIndex] - offsetHeight
		}

		var scrollShift    = offsetHeight / 2,
			scrollLevel    = scrollTop + scrollShift,
			blockIndex     = findBisect(scrollLevel, map[fromIndex]),
			srcScrollLevel = parseFloat(map[toIndex][blockIndex.val] * (1 - blockIndex.part));

		if (map[toIndex][blockIndex.val + 1]) {
			srcScrollLevel += parseFloat(map[toIndex][blockIndex.val + 1] * blockIndex.part);
		}

		return srcScrollLevel - scrollShift;
	}
}

/**
 * Controls sync scroll of the source and preview blocks
 *
 * @param scrollMap
 * @param animatorSrc
 * @param animatorResult
 * @param eSrc
 * @param eResult
 * @param eContainer
 * @constructor
 */
function SyncScroll(scrollMap, animatorSrc, animatorResult, eSrc, eResult, eContainer) {
	// Synchronize scroll position from source to result
	var syncResultScroll = function () {
		animatorResult.setPos(scrollMap.getPosition(eSrc, 0, 1));
	};

	// Synchronize scroll position from result to source
	var syncSrcScroll = function () {
		animatorSrc.setPos(scrollMap.getPosition(eResult, 1, 0));
	};

	/**
	 * If the source scrolling is at the bottom, the result scrolling is also set to the bottom.
	 * This is useful when the source is edited at the very bottom, and the result is partially hidden.
	 *
	 * This method bypasses building the scroll map for performance reasons.
	 */
	this.scrollToBottomIfRequired = function () {
		if (eSrc.scrollHeight >= eSrc.offsetHeight && eSrc.scrollHeight - eSrc.offsetHeight - eSrc.scrollTop < 5) {
			animatorResult.setPos(eResult.scrollHeight - eResult.offsetHeight);
		}
	}

	this.switchScrollToSrc = function () {
		eResult.removeEventListener('scroll', syncSrcScroll);
		eSrc.removeEventListener('scroll', syncResultScroll);
		eSrc.addEventListener('scroll', syncResultScroll);
		eContainer.id = 'container-block-source';
		// animatorSrc.stop();
	};

	this.switchScrollToResult = function () {
		eSrc.removeEventListener('scroll', syncResultScroll);
		eResult.removeEventListener('scroll', syncSrcScroll);
		eResult.addEventListener('scroll', syncSrcScroll);
		eContainer.id = 'container-block-result';
		// animatorResult.stop();
	}
}

/**
 * Functions from lodash.js
 * @see https://github.com/lodash/lodash/
 */

var now = Date.now || function () {
	return new Date().getTime();
};

function debounce(func, wait, options) {
	var args,
		maxTimeoutId,
		result,
		stamp,
		thisArg,
		timeoutId,
		trailingCall,
		lastCalled = 0,
		leading = false,
		maxWait = false,
		trailing = true;

	if (typeof func != 'function') {
		throw new TypeError(FUNC_ERROR_TEXT);
	}
	wait = wait < 0 ? 0 : (+wait || 0);
	if (typeof options === 'object') {
		leading = !!options.leading;
		maxWait = 'maxWait' in options && Math.max(+options.maxWait || 0, wait);
		trailing = 'trailing' in options ? !!options.trailing : trailing;
	}

	function cancel() {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		if (maxTimeoutId) {
			clearTimeout(maxTimeoutId);
		}
		lastCalled = 0;
		maxTimeoutId = timeoutId = trailingCall = undefined;
	}

	function complete(isCalled, id) {
		if (id) {
			clearTimeout(id);
		}
		maxTimeoutId = timeoutId = trailingCall = undefined;
		if (isCalled) {
			lastCalled = now();
			result = func.apply(thisArg, args);
			if (!timeoutId && !maxTimeoutId) {
				args = thisArg = undefined;
			}
		}
	}

	function delayed() {
		var remaining = wait - (now() - stamp);
		if (remaining <= 0 || remaining > wait) {
			complete(trailingCall, maxTimeoutId);
		} else {
			timeoutId = setTimeout(delayed, remaining);
		}
	}

	function maxDelayed() {
		complete(trailing, timeoutId);
	}

	function debounced() {
		args = arguments;
		stamp = now();
		thisArg = this;
		trailingCall = trailing && (timeoutId || !leading);

		if (maxWait === false) {
			var leadingCall = leading && !timeoutId;
		} else {
			if (!maxTimeoutId && !leading) {
				lastCalled = stamp;
			}
			var remaining = maxWait - (stamp - lastCalled),
				isCalled = remaining <= 0 || remaining > maxWait;

			if (isCalled) {
				if (maxTimeoutId) {
					maxTimeoutId = clearTimeout(maxTimeoutId);
				}
				lastCalled = stamp;
				result = func.apply(thisArg, args);
			}
			else if (!maxTimeoutId) {
				maxTimeoutId = setTimeout(maxDelayed, remaining);
			}
		}
		if (isCalled && timeoutId) {
			timeoutId = clearTimeout(timeoutId);
		}
		else if (!timeoutId && wait !== maxWait) {
			timeoutId = setTimeout(delayed, wait);
		}
		if (leadingCall) {
			isCalled = true;
			result = func.apply(thisArg, args);
		}
		if (isCalled && !timeoutId && !maxTimeoutId) {
			args = thisArg = undefined;
		}
		return result;
	}
	debounced.cancel = cancel;
	return debounced;
}
