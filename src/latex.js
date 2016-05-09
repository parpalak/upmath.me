/**
 * Replaces LaTeX formulas by pictures
 * Inspired by http://www.codecogs.com/latex/htmlequations.php
 * @copyright 2012-2016 Roman Parpalak
 */

(function (w, d) {
	var prtcl = location.protocol,
		ntwPath = '//tex.s2cms.ru',
		url = (prtcl === 'http:' || prtcl === 'https:') ? ntwPath : 'http:' + ntwPath,
		im = d.implementation,
		ext = im && im.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1") ? 'svg' : 'png';

	(function (fn) {
		var done = !1,
			top = !0,
			root = d.documentElement,
			w3 = !!d.addEventListener,

			add = w3 ? 'addEventListener' : 'attachEvent',
			rem = w3 ? 'removeEventListener' : 'detachEvent',
			pre = w3 ? '' : 'on',

			init = function (e) {
				if (e.type == 'readystatechange' && d.readyState != 'complete') return;
				(e.type == 'load' ? w : d)[rem](pre + e.type, init, false);
				if (!done && (done = !0)) fn.call(w, e.type || e);
			},

			poll = function () {
				try {
					root.doScroll('left');
				} catch (e) {
					setTimeout(poll, 50);
					return;
				}
				init('poll');
			};

		if (d.readyState == 'complete') {
			fn.call(w, 'lazy');
		}
		else {
			if (d.createEventObject && root.doScroll) {
				try {
					top = !w.frameElement;
				} catch (e) {
				}
				if (top) poll();
			}
			d[add](pre + 'DOMContentLoaded', init, !1);
			d[add](pre + 'readystatechange', init, !1);
			w[add](pre + 'load', init, !1);
		}
	})(function () {
		processTree(d.body);
	});

	function image(f) {
		var s = (ext == 'svg'),
			i = d.createElement(s ? 'embed' : 'img');

		i.setAttribute('src', url + '/' + ext + '/' + encodeURIComponent(f));
		s && i.setAttribute('type', 'image/svg+xml');
		i.setAttribute('style', s ? 'width:0.2em; height:0.2em;' : 'vertical-align:middle; border:0; position: relative; z-index:-1; top:-4px;');
		!s && i.setAttribute('alt', f);

		return i;
	}

	var processTree = function (eItem) {
		var eNext = eItem.firstChild;

		while (eNext) {
			var eCur = eNext, sNn = eCur.nodeName;
			eNext = eNext.nextSibling;

			if (eCur.nodeType == 1 && sNn != 'SCRIPT' && sNn != 'TEXTAREA' && sNn != 'EMBED') {
				processTree(eCur);
			}
			else if (eCur.nodeType == 3) {
				var as = (' ' + eCur.nodeValue + ' ').split(/\$\$/g),
					n = as.length, i, s;

				if (n == 3 &&
					(/^[ \t]$/.test(as[0])) &&
					(/(?:[ \t]*\([ \t]*\S+[ \t]*\))?[ \t]*/.test(as[2])) &&
					eItem.tagName == 'P' && eItem.childNodes.length <= 2
				) {
					s = image(as[1]);
					eItem.insertBefore(s, eCur);
					eItem.setAttribute('align', 'center');

					var eSpan = d.createElement('span');
					eSpan.appendChild(d.createTextNode(as[2]));
					eSpan.setAttribute('style', 'float:right;');

					eItem.insertBefore(eSpan, eCur);
					eItem.removeChild(eCur);
				}
				else if (n > 2) {
					as[0] = as[0].substring(1);
					as[n - 1] = as[n - 1].substring(0, as[n - 1].length - 1);

					for (i = 0; i < n; i++) {
						if (i % 2) {
							if (i + 1 < n) {
								s = image(as[i]);

								var after = as[i + 1].substring(0, 2);
								if (/[,.;!?)] /.test(after)) {
									as[i + 1] = as[i + 1].substring(1);

									var nobr = d.createElement('nobr');
									nobr.appendChild(s);
									s = nobr;
									s.appendChild(d.createTextNode(after.substring(0, 1)));
								}
							}
							else {
								s = d.createTextNode('$$' + as[i]);
							}
						}
						else {
							s = d.createTextNode(as[i]);
						}

						eItem.insertBefore(s, eCur);
					}

					eItem.removeChild(eCur);
				}
			}
		}
	};

	w.S2Latex = {processTree: processTree};

	var ao;

	w.addEventListener && w.addEventListener('message', function (e) {
		if (e.origin.replace(/^https?:/, '') != ntwPath) {
			return;
		}

		if (!ao) {
			ao = d.getElementsByTagName('embed');
		}

		var s = e.data.split('|'),
			v = s.shift(), x = s.shift(), y = s.shift(),
			i = ao.length;

		s = s.join('|');

		for (; i-- ;) {
			if (ao[i].src == s || decodeURIComponent(ao[i].src) == s) {
				ao[i].setAttribute('style', 'vertical-align: ' + (-v) + 'pt; width: ' + x + 'pt; height: ' + y + 'pt;');
			}
		}
	}, !1);

})(window, document);
