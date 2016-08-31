<?php
/**
 * @copyright 2015-2016 Roman Parpalak
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @package   S2 Latex Service
 * @link      http://tex.s2cms.ru
 */

namespace S2\Tex\Tpl;

/**
 * Class Package
 */
class Package implements PackageInterface
{
	/**
	 * @var string[]
	 */
	protected $options = [];

	/**
	 * @var string
	 */
	private $package;

	/**
	 * @param string   $package
	 * @param string[] $options
	 */
	public function __construct($package, array $options = [])
	{
		$this->package = $package;
		$this->options = $options;
	}

	/**
	 * @return string
	 */
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
