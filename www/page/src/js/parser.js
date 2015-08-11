/**
 * Markdown parser
 *
 * Originally written by Colin Kuebler 2012
 * Modified by Roman Parpalak 2015
 */

function MarkdownParser(i) {
	/* INIT */
	var api = this;

	// variables used internally
	i = i ? 'i' : '';
	var parseInlineRE = null,
		parseBlockRE = null,
		ruleMap = {},
		ruleBlockMap = {},
		ruleInlineMap = {},
		runInBlocks = {},
		markers = {};

	var subRules;

	function addBlockRule(s, rule) {
		var re = new RegExp('^(' + s + ')$', i);
		ruleMap[rule] = re;
		ruleBlockMap[rule] = re;
	}

	function addInlineRule(s, rule) {
		var re = new RegExp('^(' + s + ')$', i);
		ruleMap[rule] = re;
		ruleInlineMap[rule] = re;
	}

	api.addInlineRules = function (rules) {
		var ruleSrc = [];

		for (var rule in rules) {
			if (rules.hasOwnProperty(rule)) {
				var s = rules[rule].source;
				ruleSrc.push(s);
				addInlineRule(s, rule);
			}
		}

		parseInlineRE = new RegExp('(' + ruleSrc.join('|') + ')', i);

		return this;
	};
	api.addSubRules = function (rules) {
		subRules = rules;
		return this;
	};
	api.addBlockRules = function (rules) {
		var ruleArray = [];

		for (var rule in rules) {
			if (rules.hasOwnProperty(rule)) {
				var s = rules[rule].source;
				ruleArray.push(s);
				addBlockRule(s, rule);
			}
		}
		parseBlockRE = new RegExp('(' + ruleArray.join('|') + ')', i);

		return this;
	};
	api.addRunIn = function (rules) {
		runInBlocks = rules;

		return this;
	};
	api.addMarkers = function (m) {
		markers = m;

		return this;
	};

	function tokenizeBlock(block, className, result) {
		// Process specific rules for the given block type className
		if (className in subRules && subRules[className] === null) {
			result.push({
				token: block,
				block: className
			});

			return;
		}

		// Token for a block marker
		if (typeof markers[className] !== 'undefined') {
			var matches = block.match(markers[className]);
			if (matches[2]) {
				result.push({
					token: matches[1],
					block: className + '-mark'
				});
				block = matches[2];
			}
		}

		var items = block.split(parseInlineRE),
			j = 0, token;

		for (; j < items.length; j++) {
			token = items[j];
			if (token != '') {
				result.push({
					token: token,
					block: className
				});
			}
		}
	}

	api.tokenize = function (input) {
		input = input.replace('\r', '');

		var result = [],
			classNames = [],
			blocks = input.split(parseBlockRE),
			blockNum = blocks.length,
			block, i,
			prevIndex = 0, prevBlockClass;

		// Merge blocks separated by line breaks
		for (i = 0; i < blockNum; i++) {
			if (blocks[i] === '') {
				continue;
			}

			var className = identify(blocks[i], ruleBlockMap);

			if (prevIndex > 0 && className in runInBlocks) {
				var allowedPrevBlocks = runInBlocks[className].allowedBlocks;
				if (allowedPrevBlocks.indexOf(prevBlockClass) >= 0) {
					blocks[prevIndex] += blocks[i];
					blocks[i] = '';
					classNames[i] = '';

					continue;
				}
			}

			classNames[i] = className;

			prevIndex = i;
			prevBlockClass = className;
		}

		for (i = 0; i < blockNum; i++) {
			block = blocks[i];
			if (block !== '') {
				tokenizeBlock(block, classNames[i], result);
			}
		}

		return result;
	};
	api.identifyInline = function (tokenObj) {
		var className = tokenObj.block;
		if (className in subRules && subRules[className] === null) {
			return '';
		}
		return identify(tokenObj.token, ruleInlineMap);
	};

	function identify(token, ruleMap) {
		for (var rule in ruleMap) {
			if (ruleMap.hasOwnProperty(rule) && ruleMap[rule].test(token)) {
				return rule;
			}
		}

		return '';
	}

	return api;
}

// Markdown syntax parser
var mdParser = new MarkdownParser();

mdParser
	.addBlockRules({
		empty:     /(?:\n[ \t]*)*\n/,
		fence:     /```[\s\S]*?(?:$|```(?:\n|$))/,
		reference: /\[[^\]]+\]\:[^\n]*(?:\n|$)/,
		header:    /#{1,6} [^\n]*(?:\n|$)/,
		header2:   /[^\n]+\n[ \t]*[=-]{2,}(?:\n|$)/,
		rule:      /(?:[\*]{3,}|[\-]{3,}|[\_]{3,})(?:\n|$)/,
		list:      /[ ]{0,3}(?:[+\-\*]|\d+\.)[ \t]+[^\n]*(?:\n[ \t]*[^\n\t ]+[ \t]*)*(?:\n|$)/,
		quote:     /[ ]{0,3}>[^\n]*(?:\n|$)/,
		paragraph: /[\s\S]*?(?:\n|$)/
	})
	.addInlineRules({
		latex:      /\$\$[\s\S]*?\$\$/,
		link:       /\[.+?\][\(\[].*?[\)\]]/,
		bold:       /(?:\s|^)__[\s\S]*?\S__|\*\*[\s\S]*?\S\*\*/,
		italic:     /(?:\s|^)_[\s\S]*?[^\\\s]_|\*[^\\\s]\*|\*\S[\s\S]*?[^\\\s]\*/,
		strike:     /~~.+?~~/,
		sup:        /\^.+?\^/,
		sub:        /~.+?~/,
		code:       /``.+?``|`.*?[^`\\]`(?!`)/
	})
	.addSubRules({
		fence: null,
		rule:  null,
		latex: {
			keyword: /\\[a-zA_Z]]/
		}
	})
	.addRunIn({
		paragraph: {
			allowedBlocks : ['paragraph', 'quote', 'list']
		}
	})
	.addMarkers({
		list:  /^([ ]{0,3}(?:[+\-\*]|\d+\.)[ \t]+)([\s\S]*)$/,
		quote: /^([ ]{0,3}(?:>[ \t]*)+)([\s\S]*)$/
	});

