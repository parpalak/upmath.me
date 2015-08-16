<title>Test output</title>
<style>
	body {
		background: #ffe;
		font: 1em sans-serif;
	}
	img {
		border: 1px solid #999;
		image-rendering: pixelated;
	}
	.block {
		display: inline-block;
		vertical-align: top;
		margin: 0 1em 1em 0;
	}
</style>
<?php
/**
 * @copyright (C) 2015 Roman Parpalak
 */

/**
 * @param $file
 */
function outHTML ($file)
{
	echo '<div class="block">' . $file . '<br><img src="' . $file . '" /></div>';
}

foreach (glob('*.svg') as $file) {
	outHTML($file);
}

foreach (glob('*.png') as $file) {
	outHTML($file);
}
