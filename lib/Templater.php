<?php
/**
 * Makes latex documents containing a formula.
 *
 * @copyright 2015 Roman Parpalak
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @package   S2 Latex Service
 * @link      http://tex.s2cms.ru
 */

namespace Tex;

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
		$extraPackages = [];

		// Check if there are used certain environments and include corresponding packages
		$test_env = [
			'eqnarray'    => 'eqnarray',
			'tikzcd'      => 'tikz-cd',
			'tikzpicture' => 'tikz',
			'align'       => '', // just turns math mode off
		];

		foreach ($test_env as $command => $env) {
			if (strpos($formula, '\\begin{' . $command . '}') !== false || strpos($formula, '\\begin{' . $command . '*}') !== false) {
				$math_mode = false;
				if ($env) {
					$extraPackages[] = new Tpl\Package($env);
				}
			}
		}

		// Check if there are used certain commands and include corresponding packages
		$test_command = [
			'\\addplot' => 'pgfplots',
		];

		foreach ($test_command as $command => $env) {
			if (strpos($formula, $command) !== false) {
				if ($env) {
					$extraPackages[] = new Tpl\Package($env);
				}
			}
		}

		// Custom rules
		if (strpos($formula, '\\xymatrix') !== false || strpos($formula, '\\begin{xy}') !== false) {
			$extraPackages[] = new Tpl\Package('xy', ['all']);
		}

		if (preg_match('#[А-Яа-я]#u', $formula)) {
			$extraPackages[] = new Tpl\Package('inputenc', ['utf8']);
			$extraPackages[] = new Tpl\Package('babel', ['russian']);
		}

		// Other setup
		if (substr($formula, 0, 7) == '\\inline') {
			$formula = '\\textstyle '.substr($formula, 7);
		}

		$tpl = $math_mode ? 'displayformula' : 'common';

		ob_start();
		include  $this->dir . $tpl . '.php';
		return ob_get_clean();
	}
}
