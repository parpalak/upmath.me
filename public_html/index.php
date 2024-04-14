<?php
/**
 * @copyright (C) 2015-2024 Roman Parpalak
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @package   Markdown & LaTeX Editor
 * @link      https://upmath.me/
 */

@include '../config.php';

header('Link: <//i.upmath.me>; rel=dns-prefetch');

$formats = [
	'html'    => ['preview', 'Example of rendered HTML'],
	'src'     => ['html', 'HTML with img-equations'],
	'htmltex' => ['html-tex', 'HTML with raw LaTeX equations'],
	'md'      => ['md', 'Markdown with img-equations'],
	'habr'    => ['H', 'A kind of HTML markup for habr.com'],
//	'debug' => 'debug',
];

?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Upmath: Markdown & LaTeX Online Editor</title>
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="keywords" content="LaTeX, Markdown, equations, markdown latex online editor, tikz, latex online">
	<meta name="description" content="Upmath helps writing math texts for the web. It converts Markdown syntax to HTML, and LaTeX equations to SVG images.">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="preconnect" href="//fonts.gstatic.com" crossorigin>
	<link rel="shortcut icon" type="image/png" href="/favicon.png">

<?php if (defined('USE_MINIFICATION') && USE_MINIFICATION): ?>
	<link rel="stylesheet" href="/dist/css/style.min.css?<?php include 'dist/css/style.min.css.md5'; ?>">
<?php else: ?>
	<link rel="stylesheet" href="/dist/css/TextareaDecorator.css">
	<link rel="stylesheet" href="/src/css/editor.css">
	<link rel="stylesheet" href="/lib/highlight.js/solarized-light.css">
<?php endif; ?>

	<link rel="preconnect" href="//i.upmath.me" crossorigin>
	<link rel="prefetch" href="/i/latex.jpg" as=image>
</head>

<body>
	<div class="header">
		<div class="header-item">
			<div class="menu-container" tabindex="2">
				<input type="file" id="fileElem" style="display:none">
			</div>
			<h1 class="title">Markdown & LaTeX Editor</h1>
			<div id="storage-warning">
				Cannot save this text to browser local storage.<br>It will be lost on page refresh.
			</div>
		</div>
		<div class="header-item header-item-right">
			<div class="demo-control">
				<?php

				$selected = true;

				foreach ($formats as $class => [$name, $title]) {
					?><input
							class="control-input"
							id="id_<?php echo $class; ?>"
							type="radio"
							name="source_type"
						<?php $selected ? print 'checked="checked"' : null; ?>
					><label
						class="control-item"
						for="id_<?php echo $class; ?>"
						title="<?php echo htmlspecialchars($title); ?>"
						data-result-as="<?php echo $class; ?>"
						tabindex="4"
					><?php echo $name; ?></label><?php
					$selected = false;
				}
				?>
				<button class="toolbar-button _download-result" title="Download result" tabindex="4">⇓</button>
			</div>
			<div class="copyright">
				&copy; 2015–2024<br>
				<a class="link" id="mailto-link" title="Drop me a line" href="#" tabindex="4">Roman Parpalak</a>
				<script>
					document.getElementById('mailto-link').href = "mailto:roman%"+"40parpalak.com";
				</script>
			</div>
		</div>
	</div>
	<div class="container full-height" id="container-block"><!--
		--><div class="half-width full-height source-wrap" id="source-block"><textarea id="editor-source" class="source full-height" tabindex="1"></textarea></div><!--
		--><div class="slider full-height" id="slider"></div><!--
		--><div class="half-width full-height" id="result-block">
			<div class="result-html full-height"></div>
			<pre class="result-src full-height"><code class="result-src-content"></code></pre>
		</div><!--
	--></div>
	<dialog id="versionsDialog">
		<div class="version-list">
			<h2 class="version-list-title">Recent versions</h2>
			<div id="versionsList" class="version-list-items">
			</div>
		</div>
		<div class="version-preview">
			<div id="versionSelectedText"></div>
			<button id="versionRestoreButton">Restore this version</button>
			<button id="versionCloseButton">Close</button>
		</div>
	</dialog>
	<script>
		instructionText = <?php echo json_encode(file_get_contents('sample.md'), JSON_UNESCAPED_UNICODE); ?>;
		if(/iPhone|iPad|iPod/i.test(navigator.userAgent)){
			textareas = document.getElementsByTagName('textarea');
			for(var i = 0; i < textareas.length; i++){
				textareas[i].style['padding-left'] = '13px';
				textareas[i].style['padding-right'] = '13px';
			}
		}
	</script>
<?php if (defined('USE_MINIFICATION') && USE_MINIFICATION): ?>
	<script src="/dist/js/vendors.min.js?<?php include 'dist/js/vendors.min.js.md5'; ?>"></script>
	<script src="/dist/js/scripts.min.js?<?php include 'dist/js/scripts.min.js.md5'; ?>"></script>
<?php else: ?>
	<script src="/dist/js/markdown-it.min.js"></script>
	<script src="/dist/js/markdown-it-sub.min.js"></script>
	<script src="/dist/js/markdown-it-sup.min.js"></script>
	<script src="/dist/js/FileSaver.min.js"></script>
	<script src="/dist/js/draggabilly.pkgd.min.js"></script>
	<script src="/dist/js/TextareaDecorator.js"></script>
	<script src="/lib/highlight.js/highlight.pack.js"></script>

	<script src="/src/js/utils.js"></script>
	<script src="/src/js/markdown-it-s2-tex.js"></script>
	<script src="/src/js/parser.js"></script>
	<script src="/src/js/editor.js"></script>
	<script src="/src/js/menu.js"></script>
	<script src="/src/js/document_storage.js"></script>
	<script src="/src/js/history_manager.js"></script>
<?php endif; ?>
</body>
</html>
