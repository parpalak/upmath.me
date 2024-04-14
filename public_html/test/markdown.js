
QUnit.test("Paragraphs", function (assert) {
	assert.deepEqual(
		mdParser.tokenize('ABC\n123'),
		[{
			token: 'ABC\n123',
			line : 0,
			block: 'paragraph'
		}], "Line break");
	assert.deepEqual(
		mdParser.tokenize('ABC\n\n123'),
		[
			{
				block: "paragraph",
				line : 0,
				token: "ABC\n"
			},
			{
				block: "empty",
				line : 0,
				token: "\n"
			},
			{
				block: "paragraph",
				line : 2,
				token: "123"
			}
		], "Empty line");
	assert.deepEqual(
		mdParser.tokenize('ABC\n \n123'),
		[
			{
				block: "paragraph",
				line : 0,
				token: "ABC\n"
			},
			{
				block: "empty",
				line : 0,
				token: " \n"
			},
			{
				block: "paragraph",
				line : 2,
				token: "123"
			}
		], "Empty line with whitespaces");
});

QUnit.test("Fence", function (assert) {
	assert.deepEqual(
		mdParser.tokenize('``` js\nfunction a () {\n\treturn 1;\n}\n\nconsole.log(a());\n```\nmy code'),
		[
			{
			    block: "fence",
				line : 0,
			    token: "``` js\n\
function a () {\n\
	return 1;\n\
}\n\
\n\
console.log(a());\n\
```\n\
"
				},
			{
				block: "paragraph",
				line : 7,
				token: "my code"
			}
		],
		"Fence multiline no empty line after"
	);
	assert.deepEqual(
		mdParser.tokenize('``` js\nfunction a () {\n\treturn 1;\n}\n\nconsole.log(a());\n```\n\nmy code'),
		[
			{
				block: "fence",
				line : 0,
				token: "``` js\n\
function a () {\n\
	return 1;\n\
}\n\
\n\
console.log(a());\n\
```\n"
			},
			{
				block: "empty",
				line : 0,
				token: "\n"
			},
			{
				block: "paragraph",
				line : 8,
				token: "my code"
			}
		],
		"Fence multiline"
	);
	assert.deepEqual(
		mdParser.tokenize('```aaa\n\nbbb\n\nccc'),
		[
			{
				block: "fence",
				line : 0,
				token: '```aaa\n\nbbb\n\nccc'
			}
		],
		"Fence unfinished"
	);
});

QUnit.test("Blocks", function (assert) {
	assert.deepEqual(
		mdParser.tokenize('[1]: aa\n---'),
		[
			{
				block: "reference",
				line : 0,
				token: "[1]: aa\n"
			},
			{
				block: "rule",
				line : 1,
				token: "---"
			}
		],
		"Links 1"
	);
	assert.deepEqual(
		mdParser.tokenize('***'),
		[
			{
				block: "rule",
				line : 0,
				token: "***"
			}
		],
		"Rule"
	);
	assert.deepEqual(
		mdParser.tokenize('[a b]: aa\n123'),
		[
			{
				block: "reference",
				line : 0,
				token: "[a b]: aa\n"
			},
			{
				block: "paragraph",
				line : 1,
				token: "123"
			}
		],
		"Links 2"
	);

	assert.deepEqual(
		mdParser.tokenize('- ab\n- cd'),
		[
			{
				block: "list-mark",
				line : 0,
				token: "- "
			},
			{
				block: "list",
				line : 0,
				token: "ab\n"
			},
			{
				block: "list-mark",
				line : 1,
				token: "- "
			},
			{
				block: "list",
				line : 0, // ?
				token: "cd"
			}
		],
		"List 1"
	);
	assert.deepEqual(
		mdParser.tokenize('- ab\ncd'),
		[
			{
				block: "list-mark",
				line : 0,
				token: "- "
			},
			{
				block: "list",
				line : 0,
				token: "ab\ncd"
			}
		],
		"List 2"
	);
});

QUnit.test("Heading", function (assert) {
	assert.deepEqual(
		mdParser.tokenize('# Heading\n\ntext'),
		[
			{token: '# Heading\n', line: 0, block: 'header'},
			{token: '\n',          line: 0, block: 'empty'},
			{token: 'text',        line: 2, block: 'paragraph'}
		],
		"Heading hashed 1"
	);
	assert.deepEqual(
		mdParser.tokenize('# Heading\ntext'),
		[
			{token: '# Heading\n', line: 0, block: 'header'},
			{token: 'text',        line: 1, block: 'paragraph'}
		],
		"Heading hashed 2"
	);
	assert.deepEqual(
		mdParser.tokenize('hello world\n===========\ntext'),
		[
			{token: 'hello world\n===========\n', line: 0, block: 'header2'},
			{token: 'text',                       line: 2, block: 'paragraph'}
		],
		"Heading underlined 1"
	);
	assert.deepEqual(
		mdParser.tokenize('hello world\n===========\n\ntext'),
		[
			{token: 'hello world\n===========\n', line: 0, block: 'header2'},
			{token: '\n',                         line: 0, block: 'empty'}, // line?
			{token: 'text',                       line: 3, block: 'paragraph'}
		],
		"Heading underlined 2"
	);
	assert.deepEqual(
		mdParser.tokenize('hello world\n===========\n\n text'),
		[
			{token: 'hello world\n===========\n', line: 0, block: 'header2'},
			{token: '\n',                         line: 0, block: 'empty'},
			{token: ' text',                      line: 3, block: 'paragraph'}
		],
		"Heading underlined 3"
	);
	assert.deepEqual(
		mdParser.tokenize('hello world\n\n===========\n\ntext'),
		[
			{token: 'hello world\n', line: 0, block: 'paragraph'},
			{token: '\n',            line: 0, block: 'empty'},
			{token: '===========\n', line: 2, block: 'paragraph'},
			{token: '\n',            line: 0, block: 'empty'},
			{token: 'text',          line: 2, block: 'paragraph'} // line ?
		],
		"No heading underlined"
	);
});

QUnit.test("Latex", function (assert) {
	assert.deepEqual(
		mdParser.tokenize('$$\nf(x) = \\sin(x)$$ (1)'),
		[
			{
				block: "latexBlock",
				line : 0,
				token: "$$"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "\nf"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "("
			},
			{
				block: "latexBlock",
				line : 0,
				token: "x"
			},
			{
				block: "latexBlock",
				line : 0,
				token: ")"
			},
			{
				block: "latexBlock",
				line : 0,
				token: " = "
			},
			{
				block: "latexBlock",
				line : 0,
				token: "\\sin"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "("
			},
			{
				block: "latexBlock",
				line : 0,
				token: "x"
			},
			{
				block: "latexBlock",
				line : 0,
				token: ")"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "$$"
			},
			{
				block: "latexBlock",
				line : 0,
				token: " (1)"
			}
		],
		"Latex block 1"
	);
	assert.deepEqual(
		mdParser.tokenize(' $$f(x) = \\sin x$$  '),
		[
			{
				block: "latexBlock",
				line : 0,
				token: " "
			},
			{
				block: "latexBlock",
				line : 0,
				token: "$$"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "f"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "("
			},
			{
				block: "latexBlock",
				line : 0,
				token: "x"
			},
			{
				block: "latexBlock",
				line : 0,
				token: ")"
			},
			{
				block: "latexBlock",
				line : 0,
				token: " = "
			},
			{
				block: "latexBlock",
				line : 0,
				token: "\\sin"
			},
			{
				block: "latexBlock",
				line : 0,
				token: " x"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "$$"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "  "
			}
		],
		"Latex block 2"
	);
	assert.deepEqual(
		mdParser.tokenize('$$\nf_x = %comment1\nx%comment2 $$\n(1)'),
		[
			{
				block: "latexBlock",
				line : 0,
				token: "$$"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "\nf"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "_x"
			},
			{
				block: "latexBlock",
				line : 0,
				token: " = "
			},
			{
				block: "latexBlock",
				line : 0,
				token: "%comment1"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "\nx"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "%comment2 "
			},
			{
				block: "latexBlock",
				line : 0,
				token: "$$"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "\n"
			},
			{
				block: "paragraph",
				line : 3,
				token: "(1)"
			}
		],
		"Latex block 3"
	);
	assert.deepEqual(
		mdParser.tokenize('$$P_\\text{скр}={IlEh\\over c^2}={\\mu E\\over c^2},$$'),
		[
			{
				block: "latexBlock",
				line : 0,
				token: "$$"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "P"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "_\\text{скр}"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "="
			},
			{
				block: "latexBlock",
				line : 0,
				token: "{"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "IlEh"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "\\over"
			},
			{
				block: "latexBlock",
				line : 0,
				token: " c"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "^2"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "}"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "="
			},
			{
				block: "latexBlock",
				line : 0,
				token: "{"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "\\mu"
			},
			{
				block: "latexBlock",
				line : 0,
				token: " E"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "\\over"
			},
			{
				block: "latexBlock",
				line : 0,
				token: " c"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "^2"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "}"
			},
			{
				block: "latexBlock",
				line : 0,
				token: ","
			},
			{
				block: "latexBlock",
				line : 0,
				token: "$$"
			}
		],
		"Latex block 4"
	);
	assert.deepEqual(
		mdParser.tokenize('$$f(x) = {dF\\$$'),
		[
			{
				block: "paragraph",
				line : 0,
				token: "$$f(x) = {dF\\$$"
			}
		],
		"No latex"
	);
	assert.deepEqual(
		mdParser.tokenize('$$3$$ (4) \n\n'),
		[
			{
				block: "latexBlock",
				line : 0,
				token: "$$"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "3"
			},
			{
				block: "latexBlock",
				line : 0,
				token: "$$"
			},
			{
				block: "latexBlock",
				line : 0,
				token: " (4) \n"
			},
			{
				block: "empty",
				line : 0,
				token: "\n"
			}
		],
		"Latex reference"
	);
});

QUnit.test("Inline", function (assert) {
	assert.deepEqual(mdParser.tokenize('a*b*'), [
		{
			token: 'a',
			line : 0,
			block: 'paragraph'
		},
		{
			token: '*b*',
			line : 0,
			block: 'paragraph'
		}
	], "Italic 2");
	assert.deepEqual(mdParser.tokenize('**a** b c*t*'), [
		{
			token: '**a**',
			line: 0,
			block: 'paragraph'
		},
		{
			token: ' b c',
			line: 0,
			block: 'paragraph'
		},
		{
			token: '*t*',
			line: 0,
			block: 'paragraph'
		}
	], "Mixed 1");
	assert.deepEqual(mdParser.tokenize('one _thing_ has *em*phasis'),
		[
			{
				block: "paragraph",
				line : 0,
				token: "one"
			},
			{
				block: "paragraph",
				line : 0,
				token: " _thing_"
			},
			{
				block: "paragraph",
				line : 0,
				token: " has "
			},
			{
				block: "paragraph",
				line : 0,
				token: "*em*"
			},
			{
				block: "paragraph",
				line : 0,
				token: "phasis"
			}
		], "Mixed 2");
	assert.deepEqual(mdParser.tokenize('a^b^c'),[
		{
			token: 'a',
			line: 0,
			block: 'paragraph'
		},
		{
			token: '^b^',
			line: 0,
			block: 'paragraph'
		},
		{
			token: 'c',
			line: 0,
			block: 'paragraph'
		}
	], "Superscript");
	assert.deepEqual(mdParser.tokenize('a~b~c'), [
		{
			token: 'a',
			line: 0,
			block: 'paragraph'
		},
		{
			token: '~b~',
			line: 0,
			block: 'paragraph'
		},
		{
			token: 'c',
			line: 0,
			block: 'paragraph'
		}
	], "Subscript");
	assert.deepEqual(mdParser.tokenize('a~~bc~~'), [
		{
			token: 'a',
			line : 0,
			block: 'paragraph'
		},
		{
			token: '~~bc~~',
			line : 0,
			block: 'paragraph'
		}
	], "Strike");
	assert.deepEqual(mdParser.tokenize('a$$bc$$'), [
		{
			token: 'a',
			line: 0,
			block: 'paragraph'
		},
		{
			token: '$$bc$$',
			line: 0,
			block: 'paragraph'
		}
	], "Latex");
	assert.deepEqual(mdParser.tokenize('a$$bc\\$$'), [
		{
			token: 'a$$bc\\$$',
			line : 0,
			block: 'paragraph'
		}
	], "No latex");
	assert.deepEqual(mdParser.tokenize('`1``2`'), [
		{
			block: "paragraph",
			line : 0,
			token: "`1``2`"
		}
	], "Code double");
	assert.deepEqual(mdParser.tokenize('A* B*'), [
		{
			block: "paragraph",
			line : 0,
			token: "A* B*"
		}
	], "No italic");
	assert.deepEqual(mdParser.tokenize('*T*.1 *A*'), [
		{
			block: "paragraph",
			line : 0,
			token: "*T*"
		},
		{
			block: "paragraph",
			line : 0,
			token: ".1 "
		},
		{
			block: "paragraph",
			line : 0,
			token: "*A*"
		}
	], "Double italic");
});

var largeText = "# Торможение реликтовым излучением\n\nhttp://susy.page/2014/01/05/CMB_drag\n\nНа втором курсе за неделю перед досрочным экзаменом по теоретической физике Семен Соломонович Герштейн задал мне две задачи. В одной требовалось найти угловое распределение синхротронного излучения электрона, движущегося по окружности. Вторая оказалась интереснее: найти силу торможения со стороны реликтового излучения на площадку, движущуюся перпендикулярно самой себе. Остановимся на ней подробнее. Записей с тех времен у меня не сохранилось, а в литературе опубликованы противоречивые результаты. Хороший повод заново разобраться в задаче.\n\n## Обозначения и соглашения\n\nПод реликтовым излучением мы подразумеваем равновесное тепловое излучение при некоторой температуре *T*. Напомним, что плотность энергии и давление равновесного излучения определяются температурой: *ε* = 4*πσT*^4^/*c*, *P* = *ε*/3.\n\nВ системе отсчета, связанной с реликтовым излучением, оно однородно и изотропно. Относящиеся к ней величины будем обозначать символами без штрихов. Относительно этой системы со скоростью *v* движется площадка (например, диск) с коэффициентом отражения *R*. Штрихами обозначим величины в сопутствующей системе отсчета (связанной с площадкой).\n\nБудем опускать скорость света c в тех формулах, где она легко восстанавливается из соображений размерности.\n\n## Обзор литературы\n\nВ публикациях по этой проблеме нет консенсуса. Например, в письме Андрея Шепелева в УФН под названием \"[Космический микроволновой фон и аристотелевы представления о движении](http://ufn.ru/ru/articles/2005/1/i/)\" приведена формула для давления на площадку $$P=-v\\,(1+v^2/2)\\,\\varepsilon/2$$. Этот ответ, как мы увидим ниже, явно ошибочен. Автор не раскрывает вычислений, поэтому невозможно понять, где ошибка.\n\nВ работе Баласаняна и Мкртчяна \"[Blackbody radiation drag on a relativistically moving mirror](http://arxiv.org/abs/0907.2311)\" вычисляется плотность импульса в системе отсчета, связанной с диском, и она отождествляется с давлением (с точностью до учета отражения). По поводу этой работы у меня есть два замечания. Во-первых, для вычисления плотности импульса авторы предлагают непростой путь. Они интегрируют импульс фотона $$\\vec{k}'$$ по импульсному пространству c функцией распределения\n\n$$n'(\\vec{k}')={1\\over e^{\\gamma(\\omega' +k'_xv)/T}-1}.$$(1)\n\nВ то же время плотность импульса электромагнитного излучения отличается на множитель 1/c^2^ от вектора Поинтинга, проекции которого есть компоненты $$T_{0i}$$ тензора энергии-импульса. Записав преобразование Лоренца для компоненты $$T_{01}$$ тензора\n\n$$T^{\\mu\\nu}=\\begin{pmatrix}\\varepsilon &0&0&0\\\\0&\\varepsilon/3&0&0\\\\0&0&\\varepsilon/3&0\\\\0&0&0&\\varepsilon/3\\end{pmatrix},$$\n\nсразу получаем плотность импульса (см. II том Ландау и Лифшица, §35, формула 35.3)\n\n$$S'_x=-{4\\over 3}\\,\\varepsilon\\,{v\\over 1-v^2}.$$(2)\n\nВо-вторых, неправильно отождествлять проекцию импульса электромагнитной волны, падающей на площадку под углом *θ* к нормали, с давлением, потому что сама площадка находится под углом, и ее эффективная площадь уменьшается. Из-за дополнительного фактора |cos *θ*|, появляющегося под интегралом (см. ниже), формула (2) не является правильным ответом, и использовать ее вообще нельзя.\n\n## Вычисление в сопутствующей системе отсчета\n\nДавление как силу на единицу поверхности определим через импульс, передаваемый диску при отражении или поглощении фотонов за единицу времени:\n\n$$P={F\\over S}={1\\over S}{\\hbar\\Delta k\\over\\Delta t}.$$\n\nЕсли фотоны летят под углом *θ* к нормали, то за время Δ*t* до неподвижной площадки *S* долетят фотоны из объема *S c*Δ*t* |cos *θ*|. Из них доля *R* отразится и доля (1−*R*) поглотится. Каждый поглощенный фотон отдаст импульс $$\\hbar k\\cos\\theta=\\hbar\\omega\\cos\\theta/c$$, а каждый отраженный --- в два раза больше. Собирая всё вместе, получаем в сопутствующей системе отсчета\n\n$$P=\\int{\\hbar\\omega'\\cos\\theta'\\over S\\,c\\Delta t'}\\,(1+R)\\,S\\,c\\Delta t'\\,|\\cos\\theta'|\\,n'(\\vec{k}')\\,d^3k'.$$\n\nНапомним, что частота ω и волновой вектор $$\\vec{k}$$ образуют четырехвектор <nobr>$$(\\omega, \\vec{k})$$.</nobr> Переход к движущейся системе координат осуществляется преобразованиями Лоренца\n\n$$\\omega'={\\omega-k_xv\\over\\sqrt{1-v^2}},\\qquad k_x'={k_x-\\omega v\\over\\sqrt{1-v^2}}.$$\n\nФункция распределения $$n(\\vec{k})$$ в фазовом пространстве инвариантна относительно преобразований Лоренца, так как и элемент фазового объема $$d^3r\\,d^3k$$, и число частиц $$dN=n(\\vec{r},\\vec{k})\\,d^3r\\,d^3k$$ есть инварианты (подробнее см. II том Ландау и Лифшица, §10). Именно поэтому функция распределения в движущейся системе $$n'(\\vec{k'})=n(\\vec{k})$$ есть обычное распределение Бозе --- Эйнштейна (1), в которое подставлена преобразованная частота.\n\nВ итоге давление определяется следующим интегралом\n\n$$P=\\int \\hbar\\omega'\\cos\\theta'\\,(1+R)\\,|\\cos\\theta'|\\,{const\\over exp\\left(\\dfrac{\\hbar\\omega'}{kT}\\,\\dfrac{1+v\\cos\\theta'}{\\sqrt{1-v^2}}\\right)-1}\\,\\omega'^2\\,d\\omega'\\,{d(\\cos\\theta')\\over 2}.$$(3)\n\nВместо того чтобы следить за комбинацией констант, которая в итоге должна свестись к постоянной Стефана-Больцмана *σ*, мы примем условие нормировки в выражении для плотности энергии с той же самой константой:\n\n$$\\varepsilon=\\int \\hbar\\omega\\,{const\\over exp\\left(\\dfrac{\\hbar\\omega}{kT}\\right)-1}\\,\\omega^2\\,d\\omega={4\\pi\\sigma\\over c}T^4.$$\n\nЕще отсюда видно, что (3) можно упростить, проинтегрировав по частотам. Множитель $${\\sqrt{1-v^2}}/{(1+v\\cos\\theta')}$$ перед температурой в экспоненте появится под интегралом в четвертой степени. Дальнейшее вычисление тривиально:\n\n$$P=\\varepsilon\\,(1+R)\\int\\limits_{-1}^{1}\\cos\\theta'\\,|\\cos\\theta'|\\,\\dfrac{(1-v^2)^2}{(1+v\\cos\\theta')^4}\\,{d(\\cos\\theta')\\over 2},$$\n\n$${\\Large\\boxed{P=-\\varepsilon\\,(1+R)\\,\\frac{v\\,(1+v^2/3)}{1-v^2}}.}$$(4)\n\nЧтобы убедиться в правильности результата, вычислим тем же методом давление фотонного газа на одну сторону покоящейся пластины. Зависящий от скорости подынтегральный множитель исчезает, а интеграл в пределах от 0 до 1 равен 1/3. Полное давление есть (1+*R*) *ε*/6. Если пластина всё отражает и ничего не поглощает, давление совпадает с ожидаемой величиной *ε*/3. Если пластина всё поглощает, давление равно *ε*/6 и составляет половину от давления фотонного газа *ε*/3. Вторая половина набегает за счет собственного излучения пластины, которое мы в наших расчетах не учитывали.\n\nФормула (4) не совпадает ни с результатом Шепелева, который утверждает, что ответ сложен, и раскладывает его в ряд, ни с результатом Баласаняна, который ошибочно отождествляет в этой задаче плотность импульса и давление.\n\n## Вычисление в неподвижной системе отсчета\n\n<img align=\"right\" src=\"http://susy.written.ru/_pictures/relativity/relic_disc.png\" alt=\"\" width=\"188\" height=\"288\">\nТот же результат получается и в неподвижной системе отсчета. В ней не нужно иметь дела с функцией распределения фотонов, однако из-за движения площадки геометрические выкладки сложнее.\n\nЧтобы понять, сколько летящих под углом *θ* фотонов с частотой ω попадет за время Δ*t* на площадку AB, нужно ввести понятие \"заметаемого объема\" (объем, фотоны из которого попадут на диск) и умножить его величину на плотность фотонов *n*ω. За это время площадка переместится из положения A~1~B~1~ в положение A~2~B~2~, а фотоны из точек C и D долетят до диска. Таким образом, заметаемый объем соответствует фигуре A~1~B~1~DС, и его величина равна <nobr>*S* |*c*Δ*t* cos *θ* − *v*Δ*t*|</nobr>.\n\nПри отражении фотона от площадки в сопутствующей системе отсчета знак проекции волнового вектора фотона изменяется на противоположный: $$k'_{2x}=-k'_{1x}$$. Найдем соответствующее изменение в неподвижной системе:\n\n$$\\begin{array}{ll}\\Delta k\\!\\!\\!&=k_{1x}-k_{2x}=k_{1x}-\\gamma(k'_{2x}+\\omega'_2v)=k_{1x}+\\gamma(k'_{1x}-\\omega'_1v)=\\\\ &=k_{1x}+\\gamma\\left(\\gamma(k_{1x}-\\omega_1 v)-\\gamma(\\omega_1-k_{1x}v) v\\right)=k_{1x}+\\gamma^2\\left(k_{1x}(1+v^2)-2v\\omega\\right).\\end{array}$$\n\nВыражая проекцию волнового вектора через частоту фотона и азимутальный угол $$k_x=\\omega\\cos\\theta$$, получаем\n\n$$\\Delta k=\\omega\\left[\\cos\\theta\\left(1+{1+v^2\\over 1-v^2}\\right)-2{v\\over 1-v^2}\\right]={2\\omega\\over 1-v^2}\\,(\\cos\\theta-v).$$\n\nЯсно, что двойку в последнем выражении нужно заменить на (1+*R*), чтобы учесть случай произвольного коэффициента отражения *R*. Давление\n\n$$P_\\omega=\\int{\\hbar\\omega\\over S\\,c\\Delta t}\\,{1+R\\over 1-v^2}\\,(\\cos\\theta-v)\\,S|c\\Delta t\\cos\\theta-v\\Delta t|\\,n_\\omega\\,{d(\\cos\\theta)\\over2},$$\n\n$$P_\\omega={n_\\omega\\over 2}\\hbar\\omega\\,{1+R\\over 1-v^2}\\int\\limits_{-1}^{1}dx\\,(x-v)|x-v|.$$\n\nПосле вычисления интеграла и усреднения плотности энергии $$n_\\omega\\hbar\\omega$$ по частотам получается формула (4).\n\t\t\t";

var mdSrc = window.markdownit({
		html:         true,         // Enable HTML tags in source
		xhtmlOut:     false,        // Use '/' to close single tags (<br />)
		breaks:       false,        // Convert '\n' in paragraphs into <br>
		langPrefix:   'language-',  // CSS language prefix for fenced blocks
		linkify:      true,         // autoconvert URL-like texts to links
		typographer:  true,         // Enable smartypants and other sweet transforms
		quotes:       '«»„“'
	})
	.use(markdownitS2Tex)
	.use(markdownitSub)
	.use(markdownitSup)
;

QUnit.test("Time", function (assert) {
	mdParser.tokenize(largeText);
	assert.expect(0);
});

QUnit.test("Time 2", function (assert) {
	mdSrc.parse(largeText, { references: {} });
	assert.expect(0);
});
