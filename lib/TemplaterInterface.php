<?php
/**
 * Interface for latex doc templates processing.
 *
 * @copyright 2015 Roman Parpalak
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @package   S2 Latex Service
 * @link      http://tex.s2cms.ru
 */

namespace Tex;

interface TemplaterInterface
{
	/**
	 * Inserts a latex formula into appropriate templates.
	 *
	 * @param string $formula in latex
	 * @return string
	 */
	public function run ($formula);
}
