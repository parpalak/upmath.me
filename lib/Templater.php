<?php
/**
 * Makes latex documents containing a formula.
 *
 * @copyright 2015 Roman Parpalak
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @package   S2 Latex Service
 * @link      http://tex.s2cms.ru
 */

class Templater implements TemplaterInterface
{
	private $dir;

	public function __construct ($dir)
	{
		$this->dir = $dir;
	}

	/**
	 * @inheritdoc
	 */
	function run ($formula)
	{
		$math_mode = true;
		$extra_packages = array();

		$test_env = array(
			'eqnarray'		=>	'eqnarray',
//		    'tikzpicture'	=>	'tikz',
		);

		foreach ($test_env as $command => $env)
			if (strpos($formula, '\\begin{'.$command.'}') !== false || strpos($formula, '\\begin{'.$command.'*}') !== false)
			{
				$math_mode = false;
				$extra_packages[] = $env;
			}

		if (strpos($formula, '\\begin{align}') !== false || strpos($formula, '\\begin{align*}') !== false)
			$math_mode = false;

		if (substr($formula, 0, 7) == '\\inline')
			$formula = '\\textstyle '.substr($formula, 7);

		$tpl = $math_mode ? 'displayformula' : 'common';

		ob_start();
		include  $this->dir . $tpl . '.php';
		return ob_get_clean();
	}
}
