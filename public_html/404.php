<?php
/**
 * @copyright (C) 2020-2024 Roman Parpalak
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @package   Markdown & LaTeX Editor
 * @link      https://upmath.me/
 */

@include '../config.php';

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Upmath: Markdown & LaTeX Online Editor</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="shortcut icon" type="image/png" href="/favicon.png">

<?php if (defined('USE_MINIFICATION') && USE_MINIFICATION): ?>
    <link rel="stylesheet" href="/dist/css/style.min.css?<?php include 'dist/css/style.min.css.md5'; ?>">
<?php else: ?>
    <link rel="stylesheet" href="/src/css/editor.css">
<?php endif; ?>

    <link rel="preconnect" href="//i.upmath.me" crossorigin>
</head>
<body class="e404">
    <div class="page-header">
		<a href="/"><h1 class="title">Markdown & LaTeX Editor</h1></a>
    </div>
	<div class="e404-body">
		<p class="e404-text">404</p>
		<p>Page not found.</p>
		<p><a href="/" style="color: currentColor;">Go to the main page</a> and write a cool math text.</p>
	</div>
</body>
</html>
