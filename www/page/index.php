<?php
/**
 * @copyright (C) 2015-2016 Roman Parpalak
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @package   Markdown & LaTeX Editor
 * @link      http://tex.s2cms.ru/page/
 */

@include 'config.php';

$formats = [
	'html'    => 'preview',
	'src'     => 'html',
	'htmltex' => 'html+tex',
	'habr'    => 'habr',
//	'debug' => 'debug',
];

?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Markdown & LaTeX Online Editor</title>
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="icon" type="image/png" href="/favicon.png" />

<?php if (defined('USE_MINIFICATION') && USE_MINIFICATION): ?>
	<link rel="stylesheet" href="/page/dist/css/style.min.css?<?php include 'dist/css/style.min.css.md5'; ?>">
<?php else: ?>
	<link rel="stylesheet" href="/page/dist/css/TextareaDecorator.css">
	<link rel="stylesheet" href="/page/src/css/editor.css">
	<link rel="stylesheet" href="/page/lib/highlight.js/solarized-light.css">
<?php endif; ?>
</head>
<body>
<div class="header">
	<div class="header-item menu">
		<a class="link" href="/">&larr; Equations for web</a>
	</div>
	<h1 class="header-item title">&nbsp;&middot;&nbsp;Markdown & LaTeX Editor</h1>
	<div class="header-item copyright">
		&copy; 2016
		<script>
			var mailto = "roman%"+"40written.ru";
			document.write('<a class="link" title="Drop me a line" href="mailto:'+unescape(mailto)+'">Roman Parpalak</a>');
		</script>
	</div>
</div>
<div class="container full-height" id="container-block">
	<div class="half-width full-height" id="source-block">
		<div class="toolbar left">
			<input type="file" id="fileElem" style="display:none">
			<button class="toolbar-button _upload-source" title="Upload">⇑</button>
		</div>
		<div class="toolbar right">
			<button class="toolbar-button _download-source" title="Download">⇓</button>
		</div><!--
		--><textarea class="source full-height"></textarea><!--
	--></div><!--
	--><div class="half-width full-height" id="result-block">
		<div class="toolbar right">
			<button class="toolbar-button _download-result" title="Download">⇓</button>
		</div>
		<div class="demo-control">
<?php

$selected = true;

foreach ($formats as $class => $name)
{
?>
			<input
				class="control-input"
				id="id_<?php echo $class; ?>"
				type="radio"
				name="source_type"
				<?php $selected ? print 'checked="checked"' : null; ?>
			>
			<label for="id_<?php echo $class; ?>" data-result-as="<?php echo $class; ?>" class="control-item"><?php echo $name; ?></label>
<?php
	$selected = false;
}
?>
		</div>
		<div class="result-html full-height"></div>
		<pre class="result-src full-height"><code class="result-src-content full-height"></code></pre>
		<pre class="result-htmltex full-height"><code class="result-htmltex-content full-height"></code></pre>
		<pre class="result-habr full-height"><code class="result-habr-content full-height"></code></pre>
		<pre class="result-debug full-height"><code class="result-debug-content full-height"></code></pre>
	</div><!--
--></div>
<script>
	(function () {
		try {
			var data = localStorage.getItem("editor_content");
		}
		catch (e) {}
		document.getElementsByClassName('source')[0].value = data || <?php echo json_encode(file_get_contents('sample.md'), JSON_UNESCAPED_UNICODE); ?>;
	}());
</script>
<?php if (defined('USE_MINIFICATION') && USE_MINIFICATION): ?>
	<script src="/page/dist/js/vendors.min.js?<?php include 'dist/js/vendors.min.js.md5'; ?>"></script>
	<script src="/page/dist/js/scripts.min.js?<?php include 'dist/js/scripts.min.js.md5'; ?>"></script>
<?php else: ?>
	<script src="/page/dist/js/markdown-it.min.js"></script>
	<script src="/page/dist/js/markdown-it-sub.min.js"></script>
	<script src="/page/dist/js/markdown-it-sup.min.js"></script>
	<script src="/page/dist/js/FileSaver.js"></script>
	<script src="/page/dist/js/TextareaDecorator.js"></script>
	<script src="/page/lib/highlight.js/highlight.pack.js"></script>

	<script src="/page/src/js/utils.js"></script>
	<script src="/page/src/js/markdown-it-s2-tex.js"></script>
	<script src="/page/src/js/parser.js"></script>
	<script src="/page/src/js/editor.js"></script>
<?php endif; ?>
</body>
</html>
