/**
 * Markdown parser
 *
 * Originally written by Colin Kuebler 2012
 * Modified by Roman Parpalak 2015
 */

function Parser(blockRules, rules, i) {
	/* INIT */
	var api = this;

	// variables used internally
	i = i ? 'i' : '';
	var parseRE = null;
	var parseBlockRE = null;
	var ruleSrc = [];
	var ruleMap = {};

	api.add = function (rules) {
		for (var rule in rules) {
			if (rules.hasOwnProperty(rule)) {
				var s = rules[rule].source;
				ruleSrc.push(s);

				ruleMap[rule] = new RegExp('^(' + s + ')$', i);
			}
		}
		parseRE = new RegExp('(' + ruleSrc.join('|') + ')', i);
	};
	api.addBlock = function (rules) {
		var ruleArray = [];
		for (var rule in rules) {
			if (rules.hasOwnProperty(rule)) {
				var s = rules[rule].source;
				ruleArray.push(s);

				ruleMap[rule] = new RegExp('^(' + s + ')$', i);
			}
		}
		parseBlockRE = new RegExp('(' + ruleArray.join('|') + ')', i);
	};
	api.tokenize = function (input) {

//		console.log(parseBlockRE);
		input = input.replace('\r', '');
		var res = [],
			blocks = input.split(parseBlockRE),
			blockNum = blocks.length,
			i;

		for (i = 0; i < blockNum; i++) {
//			console.log('block: ', blocks[i]);
			var items = blocks[i].split(parseRE);
//			console.log('inline: ', items);
			//res = res.concat(items);
			for (var j = 0; j < items.length; j++) {
				if (items[j] != '') {
					res.push(items[j]);
				}
			}
		}

		return res;
	};
	api.identify = function (token) {
		for (var rule in ruleMap) {
			if (ruleMap.hasOwnProperty(rule)) {
				if (ruleMap[rule].test(token)) {
					return rule;
				}
			}
		}
	};

	api.add(rules);
	api.addBlock(blockRules);

	return api;
}


// generic syntax parser
var markdownParser = new Parser({
	header:    /#{1,6} [^\n]*(?:\n[ \t]*)*\n/,
	header2:   /[^\n]+\n[ \t]*[=-]{2,}(?:\n[ \t]*)*\n/,
	fence:     /```[\s\S]*?```\n/,
	emptyLine: /(?:\n[ \t]*)+\n/
}, {
	quote:      /(?:^|\n)[ ]{0,3}>[ \t]*/,// перенести к блокам
	list:       /(?:^|\n)[ ]{0,3}(?:[+\-\*]|\d+\.)[ \t]+/,// перенести к блокам
	latex:      /\$\$[\s\S]*?\$\$/,
	link:       /\[.+?\][\(\[].*?[\)\]]/,
	italic:     /\s_[^_]+_|\*[\s\S]*?\S\*/,
	bold:       /\s__[\s\S]*?\S__|\*\*[\s\S]*?\S\*\*/,
	strike:     /~~.+?~~/,
	sup:        /\^.+?\^/,
	sub:        /~.+?~/,
	code:       /`.+?`(?!`)/
});
