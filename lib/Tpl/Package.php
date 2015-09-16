<?php
/**
 * @copyright 2015 Roman Parpalak
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @package   S2 Latex Service
 * @link      http://tex.s2cms.ru
 */

namespace Tex\Tpl;

class Package implements PackageInterface
{
	protected $options = [];
	/**
	 * @var string
	 */
	private $package;

	/**
	 * @param string $package
	 * @param array  $options
	 */
	public function __construct($package, array $options = null)
	{
		$this->package = $package;
		if (!empty($options)) {
			$this->options = $options;
		}
	}

	public function getCode()
	{
		return '\\usepackage' . $this->getOptions() . '{' . $this->package . '}';
	}

	/**
	 * @return string
	 */
	private function getOptions ()
	{
		return empty($this->options) ? '' : '[' . implode(',', $this->options) . ']';
	}
}
