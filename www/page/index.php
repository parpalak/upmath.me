<?php
/**
 * @copyright (C) 2015 Roman Parpalak
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @package   Markdown & LaTeX Editor
 * @link      http://tex.s2cms.ru/page/
 */

@include 'config.php';

?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Markdown & LaTeX Editor</title>
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/highlight.js/8.5.0/styles/solarized_light.min.css">

<?php if (defined('USE_MINIFICATION') && USE_MINIFICATION): ?>
	<link rel="stylesheet" href="/page/dist/css/style.min.css?<?php include 'dist/css/style.min.css.md5'; ?>">
<?php else: ?>
	<link rel="stylesheet" href="/page/dist/css/TextareaDecorator.css">
	<link rel="stylesheet" href="/page/src/css/editor.css">
<?php endif; ?>
</head>
<body>
<h1 class="header">
	Markdown & LaTeX Editor
</h1>
<div class="container full-height">
	<div class="half-width full-height">
		<div class="toolbar left">
			<input type="file" id="fileElem" style="display:none">
			<button class="toolbar-button _upload-source" title="Upload">⇑</button>
		</div>
		<div class="toolbar right">
			<button class="toolbar-button _download-source" title="Download">⇓</button>
		</div><!--
		--><textarea class="source full-height"><?php include 'sample.md'; ?></textarea><!--
	--></div><!--
	--><div class="half-width full-height">
		<div class="toolbar right">
			<button class="toolbar-button _download-result" title="Download">⇓</button>
		</div>
		<div class="demo-control">
			<button class="control-item" data-result-as="html">preview</button>
			<button class="control-item" data-result-as="src">source</button>
			<button class="control-item" data-result-as="habr">habr</button>
<!--			<button class="control-item" data-result-as="debug">debug</button>-->
		</div>
		<div class="result-html full-height"></div>
		<pre class="result-src full-height"><code class="result-src-content full-height"></code></pre>
		<pre class="result-habr full-height"><code class="result-habr-content full-height"></code></pre>
		<pre class="result-debug full-height"><code class="result-debug-content full-height"></code></pre>
	</div><!--
--></div>
<div class="copyright">
	&copy; 2015
	<script>
		var mailto = "roman%"+"40written.ru";
		document.write('<a title="Drop me a line" href="mailto:'+unescape(mailto)+'">Roman Parpalak</a>');
	</script>
</div>
<script src="//cdnjs.cloudflare.com/ajax/libs/es5-shim/4.0.5/es5-shim.min.js"></script>
<script src="/js/jquery.min.js"></script>
<script src="//cdn.jsdelivr.net/highlight.js/8.5.0/highlight.min.js"></script>
<?php if (defined('USE_MINIFICATION') && USE_MINIFICATION): ?>
	<script src="/page/dist/js/vendors.min.js?<?php include 'dist/js/vendors.min.js.md5'; ?>"></script>
	<script src="/page/dist/js/scripts.min.js?<?php include 'dist/js/scripts.min.js.md5'; ?>"></script>
<?php else: ?>
	<script src="/page/dist/js/markdown-it.min.js"></script>
	<script src="/page/dist/js/markdown-it-sub.min.js"></script>
	<script src="/page/dist/js/markdown-it-sup.min.js"></script>
	<script src="/page/dist/js/FileSaver.js"></script>
	<script src="/page/dist/js/TextareaDecorator.js"></script>

	<script src="/page/src/js/utils.js"></script>
	<script src="/page/src/js/markdown-it-s2-tex.js"></script>
	<script src="/page/src/js/parser.js"></script>
	<script src="/page/src/js/editor.js"></script>
	<script src="/page/src/js/interface.js"></script>
<?php endif; ?>
</body>
</html>
