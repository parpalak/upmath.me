(function () {
	'use strict';

	QUnit.test('Preview preserves unchanged blocks across edits', function (assert) {
		var element = document.getElementById('qunit-fixture'), renderer = new PreviewRenderer(element);
		renderer.update('<p>first</p>\n<p>last</p>');
		var first = element.firstChild, last = element.lastChild;
		renderer.update('<p>first</p>\n<p>middle</p>\n<p>last</p>');
		assert.strictEqual(element.firstChild, first, 'Prefix is reused');
		assert.strictEqual(element.lastChild, last, 'Suffix is reused after insertion');
		renderer.update('<p>changed</p>\n<p>last</p>');
		assert.equal(element.firstChild.textContent, 'changed', 'Changed block is rendered');
		assert.strictEqual(element.lastChild, last, 'Suffix is reused after deletion');
		renderer.update('');
		assert.equal(element.childNodes.length, 0, 'Preview can be cleared');
		renderer.update('<!--same-->');
		renderer.update('same');
		assert.equal(element.firstChild.nodeType, 3, 'Comments and text are distinguished');
	});

	QUnit.test('Preview clears changed formulas while new SVG are loading', function (assert) {
		var element = document.getElementById('qunit-fixture'), renderer = new PreviewRenderer(element),
			pending = {}, cached = {x: true, z: true, k: true},
			loader = new ImageLoader({
				onLoad: function (formula, callback) {
					if (cached[formula]) {
						callback(formula, makeSvg(formula), 0);
					} else {
						pending[formula] = callback;
					}
				}
			});

		function makeSvg(formula) {
			return '<svg xmlns="http://www.w3.org/2000/svg"><text>' + formula + '</text></svg>';
		}

		function render(formulas) {
			loader.reset();
			var html = '';
			formulas.forEach(function (formula) {
				html += '<p>' + loader.getHtmlStub(formula) + '</p>\n';
			});
			renderer.update(html);
			loader.fixDom();
		}

		render(['x', 'z', 'k']);
		var unchangedSvg = document.getElementById('s2tex_2');
		render(['y', 'w', 'k']);
		assert.equal(element.querySelectorAll('svg').length, 1, 'Outdated SVG are removed while requests are pending');
		assert.equal(element.querySelectorAll('span[data-formula]').length, 2, 'Changed formulas show loading stubs');
		assert.strictEqual(document.getElementById('s2tex_2'), unchangedSvg, 'Unchanged SVG is preserved');
		pending.w('w', makeSvg('w'), 0);
		assert.equal(document.getElementById('s2tex_1').textContent, 'w', 'Second request may finish first');
		assert.equal(document.getElementById('s2tex_0').tagName.toLowerCase(), 'span', 'First formula stays empty until loaded');
		pending.y('y', makeSvg('y'), 0);
		assert.equal(document.getElementById('s2tex_0').textContent, 'y', 'First formula receives its own SVG');
	});

	QUnit.test('Editing one formula still uses the previous SVG as a placeholder', function (assert) {
		var element = document.getElementById('qunit-fixture'), renderer = new PreviewRenderer(element),
			oldSvg = '<svg xmlns="http://www.w3.org/2000/svg"><text>x</text></svg>', pending,
			loader = new ImageLoader({
				onLoad: function (formula, callback) {
					if (formula === 'x') {
						callback(formula, oldSvg, 0);
					} else {
						pending = callback;
					}
				},
				getImageDataFromFormula: function () { return {svg: oldSvg, baseline: 0, callback: null}; }
			});
		function render(formula) {
			loader.reset();
			renderer.update('<p>' + loader.getHtmlStub(formula) + '</p>');
			loader.fixDom();
		}
		render('x');
		render('y');
		assert.equal(element.textContent, 'x', 'Previous image is used while one edited formula loads');
		pending('y', '<svg xmlns="http://www.w3.org/2000/svg"><text>y</text></svg>', 0);
		assert.equal(element.textContent, 'y', 'Loaded formula replaces the placeholder');
		assert.equal(element.querySelector('svg').style.opacity, '1', 'New formula has full opacity');
	});

	QUnit.test('Formula metadata is escaped in preview stubs', function (assert) {
		var element = document.getElementById('qunit-fixture'), loader = new ImageLoader({}),
			formula = '\\text{"a" & <b>}';
		element.innerHTML = loader.getHtmlStub(formula);
		assert.equal(element.firstChild.getAttribute('data-formula'), formula, 'Formula survives attribute escaping');
		assert.equal(element.querySelectorAll('*').length, 1, 'Formula markup does not create extra elements');
	});

	QUnit.test('Preview keeps cached SVG and loads repeated formulas once', function (assert) {
		var element = document.getElementById('qunit-fixture'), renderer = new PreviewRenderer(element),
			loads = 0, inserts = 0, svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg>',
			loader = new ImageLoader({
				onLoad: function (formula, callback) {
					loads++;
					callback(formula, svg, 0);
				}
			}, function () { inserts++; });

		function render(text, formula) {
			loader.reset();
			var html = '<p>' + text + '</p>\n<p>' + loader.getHtmlStub(formula) + '</p>\n<p>' + loader.getHtmlStub(formula) + '</p>';
			renderer.update(html);
			loader.fixDom();
		}

		render('first', 'x');
		var firstSvg = document.getElementById('s2tex_0'), secondSvg = document.getElementById('s2tex_1');
		assert.equal(loads, 1, 'One subscription for repeated formula');
		assert.equal(inserts, 2, 'Both formula occurrences are inserted');
		render('edited', 'x');
		assert.strictEqual(document.getElementById('s2tex_0'), firstSvg, 'First SVG is reused');
		assert.strictEqual(document.getElementById('s2tex_1'), secondSvg, 'Second SVG is reused');
		assert.equal(inserts, 2, 'Text edit does not reinsert unchanged SVG');
		svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M1 1" /></svg>';
		render('edited', 'y');
		assert.notStrictEqual(document.getElementById('s2tex_0'), firstSvg, 'Changed formula is replaced');
	});
}());
