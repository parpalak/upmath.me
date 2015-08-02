<?php
/**
 * Russian interface
 *
 * @copyright 2015 Roman Parpalak
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @package   S2 Latex Service
 * @link      http://tex.s2cms.ru
 */

return [
	'title'            => 'Картинки для веба из формул на латехе',
	'header'           => 'Картинки для&nbsp;веба из&nbsp;формул на&nbsp;латехе',
	'equation editor'  => 'Редактор формул',
	'formula in latex' => 'Формула на латехе',
	'image URL'        => 'Адрес&nbsp;картинки:&nbsp;',
	'examples'         => 'Примеры',
	'examples info'         => 'Слева &mdash; образцы кода на латехе, справа &mdash; результат.',
	'add to editor'    => 'Добавить в редактор',
	'link-s2'          => '&larr; Движок S2',
	'link-faq'         => 'Вопросы и ответы',
	'link-install'     => 'Установка на сайты',
	'samples'          => [
		'integrals' => 'Интегралы, корни и рамки',
		'limits'    => 'Пределы и суммы',
		'chains'    => 'Цепные дроби',
		'matrices'  => 'Матрицы',
		'align'     => 'Многострочные формулы в окружении <code>align</code>',
		'picture'   => 'Картинки в окружении <code>picture</code>',
		'xy-pics'   => 'Диаграммы <code>xy-pic</code>',
	],
	'faq section' => '
			<h2>Вопросы и ответы</h2>

			<h3>Что такое &laquo;латех&raquo;?</h3>
			<p>Латех &mdash; это система компьютерной верстки сложных документов. Широко используется в&nbsp;науке, стандарт <nobr>де-факто</nobr> в&nbsp;математических и&nbsp;физических журналах. <a href="http://ru.wikipedia.org/wiki/LaTeX">Подробности&nbsp;&mdash; в&nbsp;википедии</a>.</p>

			<h3>Что делает этот сайт?</h3>
			<p>
				Сайт превращает математические формулы на&nbsp;латехе в&nbsp;готовые для веба картинки.
				Их не&nbsp;нужно создавать в&nbsp;графическом редакторе и&nbsp;загружать куда&nbsp;бы то ни было.
				Добавляйте картинки к&nbsp;обсуждениям в&nbsp;блогах и&nbsp;форумах или&nbsp;пересылайте ссылки в&nbsp;личной переписке.
			</p>

			<h3>Сколько это стоит?</h3>
			<p>При разумном использовании нисколько. Разумность использования определяется просто: если вы мешаете другим пользователям, ваш поток запросов будет заблокирован.</p>

			<h3>Есть гарантия, что сервис не&nbsp;перестанет работать?</h3>
			<p>Нет. Но я сам использую его на&nbsp;своих сайтах и&nbsp;не&nbsp;собираюсь закрывать.</p>

			<h3>Как формулы превращаются в&nbsp;картинки?</h3>
			<p>
				На&nbsp;сервере установлен <a href="http://ru.wikipedia.org/wiki/TeX_Live">Tex Live</a>.
				Он работает <a href="http://written.ru/articles/technologies/site_building/latex_for_web">в&nbsp;связке с&nbsp;современными веб-технологиями</a>.
			</p>

			<h3>Как подключать пакеты латеха? Я хочу картинки с химическими формулами и нотами!</h3>
			<p>При создании картинок подключается минимальный набор пакетов. Если какого-то пакета вам не хватает, напишите мне письмо. Не забудьте объяснить, как пакет пригодится другим пользователям.</p>

			<h3>Все формулы нужно набирать в этом редакторе?</h3>
			<p>Если у&nbsp;вас несколько формул, удобнее всего воспользоваться редактором на этой странице. Сайты с&nbsp;математическими текстами могут использовать сервис напрямую.</p>
	',
	'embedding section 1' => '
			<h2>Встраивание математических формул на&nbsp;сайты</h2>

			<p>
				Авторы математических текстов могут включать формулы на&nbsp;латехе сразу в&nbsp;код страниц.
				Чтобы при&nbsp;загрузке сайта формулы заменялись картинками, их нужно писать в&nbsp;двойных долларах: <code><span>$$</span>...$$</code>, и&nbsp;в&nbsp;исходном коде страниц подключать скрипт
			</p>
	',
	'embedding section 2' => '
			<p>Пример html-кода и&nbsp;получающийся результат:</p>
	',
	'embedding section 3' => '
			<p>В современных браузерах скрипт загружает векторные картинки в&nbsp;формате SVG и&nbsp;выравнивает базовые линии формул и&nbsp;окружающего текста:</p>

			<p align="center"><img src="/i/baseline.png" alt="" width="400" height="230" class="screenshot" /></p>

			<p>
				На этом сервисе работает <a href="http://susy.written.ru/">блог о&nbsp;теоретической физике</a>.
				Если вы хотите сделать похожий сайт с&nbsp;математическими текстами, и&nbsp;не&nbsp;знаете, с&nbsp;чего начать,
				вам может пригодиться <a href="//s2cms.ru/">движок S2</a>.
				Он <a href="//s2cms.ru/extension/s2_latex">умеет подключаться</a> к&nbsp;этому сервису без&nbsp;дополнительной настройки.
			</p>
	',
	'copyright section' => <<<TEXT
				&copy; <a href="http://written.ru/">Роман Парпалак</a>, 2014.
				<script>var mailto="roman%"+"40written.ru";document.write('Пишите: <a href="mailto:'+unescape(mailto)+'">' + unescape(mailto) + '</a>.');</script>
				&nbsp; &nbsp;
				<div class="social-likes social-likes_flat" data-zeroes="yes" data-url="http://tex.s2cms.ru/">
					<div class="twitter" data-via="r_parpalak" title="Поделиться ссылкой в Твитере">&nbsp;</div>
					<div class="facebook" title="Поделиться ссылкой на Фейсбуке">&nbsp;</div>
					<div class="vkontakte" title="Поделиться ссылкой во Вконтакте">&nbsp;</div>
				</div>
TEXT
	,
];
