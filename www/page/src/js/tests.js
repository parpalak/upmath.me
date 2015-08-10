QUnit.test("Paragraphs", function (assert) {
	assert.deepEqual(markdownParser.tokenize('ABC\n123'), ['ABC\n123'], "Line break");
	assert.deepEqual(markdownParser.tokenize('ABC\n\n123'), ['ABC', '\n\n', '123'], "Empty line");
});

QUnit.test("Fence", function (assert) {
	assert.deepEqual(
		markdownParser.tokenize('``` js\nfunction a () {\n\treturn 1;\n}\n\nconsole.log(a());\n```\nmy code'),
		['``` js\nfunction a () {\n\treturn 1;\n}\n\nconsole.log(a());\n```\n', 'my code'],
		"Fence multiline no empty line after"
	);
	assert.deepEqual(
		markdownParser.tokenize('``` js\nfunction a () {\n\treturn 1;\n}\n\nconsole.log(a());\n```\n\nmy code'),
		['``` js\nfunction a () {\n\treturn 1;\n}\n\nconsole.log(a());\n```\n', '\nmy code'],
		"Fence multiline"
	);
});

QUnit.test("Heading", function (assert) {
	assert.deepEqual(
		markdownParser.tokenize('# Heading\n\ntext'),
		['# Heading\n\n', 'text'],
		"Heading hashed"
	);
	assert.deepEqual(
		markdownParser.tokenize('hello world\n===========\ntext'),
		['hello world\n===========\n', 'text'],
		"Heading underlined"
	);
	assert.deepEqual(
		markdownParser.tokenize('hello world\n===========\n\ntext'),
		['hello world\n===========\n\n', 'text'],
		"Heading underlined"
	);
	assert.deepEqual(
		markdownParser.tokenize('hello world\n===========\n\n text'),
		['hello world\n===========\n\n', ' text'],
		"Heading underlined"
	);
	assert.deepEqual(
		markdownParser.tokenize('hello world\n\n===========\n\ntext'),
		['hello world', '\n\n', '===========', '\n\n', 'text'],
		"No heading underlined"
	);
});

QUnit.test("Inline", function (assert) {
	assert.deepEqual(markdownParser.tokenize('a*b*'), ['a', '*b*'], "Italic 2");
	assert.deepEqual(markdownParser.tokenize('a^b^c'), ['a', '^b^', 'c'], "Superscript");
	assert.deepEqual(markdownParser.tokenize('a~b~c'), ['a', '~b~', 'c'], "Subscript");
	assert.deepEqual(markdownParser.tokenize('a~~bc~~'), ['a', '~~bc~~'], "Strike");
	assert.deepEqual(markdownParser.tokenize('`1``2`'), ['`1``2`'], "Code double");
});
