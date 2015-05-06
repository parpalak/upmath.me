<?php

include 'samples.php';
@include '../fingerprint.php';
@include '../host.php';

if (!defined('FINGERPRINT')) {
	define('FINGERPRINT', '');
}

if (!defined('TEX_HOST')) {
	define('TEX_HOST', 'tex.s2cms.ru');
}

$service_url = '//' .  TEX_HOST . '/';
$script_url = $service_url.'latex.js';

$lang = $_SERVER['HTTP_HOST'] == 'tex.s2cms.com' ? 'en' : 'ru';
$i18n = include 'lang.' . $lang . '.php';

$lang_links = [
	'ru' => '//tex.s2cms.ru/',
	'en' => '//tex.s2cms.com/',
];

function __ ($key)
{
	global $i18n;
	return isset($i18n[$key]) ? $i18n[$key] : '<span style="color:red;">Missing translation: ' . $key . '</span>';
}

?>
<!DOCTYPE html>
<html>
<meta charset="utf-8">
<title><?php echo __('title'); ?></title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="css/style.min.css?<?php echo FINGERPRINT; ?>">
<script src="latex.js"></script>
<body>
	<div class="section" id="moto">
		<div class="section-content">
			<h1><?php echo __('header'); ?></h1>
			<div class="lang-block">
<?php

foreach ($lang_links as $link_lang => $link_url)
{
	if ($link_lang != $lang)
	{
?>
				<a class="lang-link" href="<?php echo $link_url; ?>"><?php echo $link_lang; ?></a>
<?php
	}
}

?>
			</div>
		</div>
	</div>

	<div class="header sticky">
		<div class="section-content header-content">
			<div class="nav">
				<?php if ($lang == 'ru') { ?><a class="nav-item" href="//s2cms.ru/"><span class="nav-link"><?php echo __('link-s2'); ?></span></a><?php } ?><!--
			 --><a class="nav-item inside" href="#editor"><span class="nav-link"><?php echo __('equation editor'); ?></span></a><!--
			 --><a class="nav-item inside" href="#samples"><span class="nav-link"><?php echo __('examples'); ?></span></a><!--
			 --><a class="nav-item inside" href="#faq"><span class="nav-link"><?php echo __('link-faq'); ?></span></a><!--
			 --><a class="nav-item inside" href="#embedding"><span class="nav-link"><?php echo __('link-install'); ?></span></a>
			</div>
		</div>
	</div>

	<div class="section" id="editor">
		<div class="section-content">
			<h2><?php echo __('equation editor'); ?></h2>
			<form name="editor">
				<p>
					<textarea class="editor-text" name="source" rows="5" placeholder="<?php echo __('formula in latex'); ?>">f(x)</textarea>
					<br />
					<label><input type="radio" name="format" id="svg_radio" value="svg" checked />SVG</label>
					<label><input type="radio" name="format" value="png" />PNG</label>
				</p>
				<p><img id="editor-preview" src="" /></p>
				<table class="url-line">
					<tr>
						<td class="url-cell"><?php echo __('image URL'); ?></td>
						<td class="url-cell" width="100%"><input type="text" class="editor-result" name="result" value="" /></td>
					</tr>
				</table>
			</form>
		</div>
	</div>

	<div class="section" id="samples">
		<div class="section-content">
			<h2><?php echo __('examples'); ?></h2>
			<p><?php echo __('examples info'); ?></p>

<?php
foreach ($samples as $hint => $sample)
{
?>
			<div class="sample-box">
				<h3 class="sample-title"><?php echo $i18n['samples'][$hint]; ?></h3>
				<div class="sample-source"><?php echo htmlspecialchars($sample); ?></div>
				<div class="sample-rendered">$$<?php echo $sample; ?>$$</div>
				<button class="add-formula"><?php echo __('add to editor'); ?></button>
			</div>
<?
}
?>
		</div>
	</div>

	<div class="section" id="faq">
		<div class="section-content">
			<?php echo __('faq section'); ?>
		</div>
	</div>

	<div class="section" id="embedding">
		<div class="section-content">
			<?php echo __('embedding section 1'); ?>

			<pre><code>&lt;script src=&quot;<a href="<?php echo $script_url; ?>"><?php echo $script_url; ?></a>&quot;&gt;&lt;/script&gt;</code></pre>

			<?php echo __('embedding section 2'); ?>
<?php
foreach ($samples_embedding[$lang] as $hint => $sample)
{
	$escaped = str_replace('$$', '<span>$$</span>', htmlspecialchars($sample));
?>
			<div>
				<div class="sample-source sample-box"><?php echo $escaped; ?></div>
				<div class="sample-rendered"><?php echo $sample; ?></div>
			</div>
<?
}
?>
			<?php echo __('embedding section 3'); ?>
		</div>
	</div>

	<div class="section">
		<div class="section-content">
			<div>
				<?php echo __('copyright section'); ?>
			</div>
		</div>
	</div>

	<script src="js/jquery.min.js?<?php echo FINGERPRINT; ?>"></script>
	<script src="js/scripts.min.js?<?php echo FINGERPRINT; ?>"></script>
	<script>
		$(function () {
			initTexEditor('<?php echo $service_url; ?>');
			initTexSite();
		});
	</script>
</body>
</html>
