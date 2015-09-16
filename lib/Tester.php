<?php
/**
 * Test infrastructure.
 *
 * @copyright 2015 Roman Parpalak
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @package   S2 Latex Service
 * @link      http://tex.s2cms.ru
 */

namespace Tex;

class Tester
{
	private $srcTemplate = 'src/*.tex';
	private $outDir = '../www/test_out/';

	/**
	 * @var RendererInterface
	 */
	private $renderer;

	public function __construct(RendererInterface $renderer, $srcTpl, $outDir)
	{
		$this->renderer = $renderer;
		$this->srcTemplate = $srcTpl;
		$this->outDir = $outDir;
	}

	function run ()
	{
		$this->clearOutDir();

		foreach (glob($this->srcTemplate) as $testFile) {
			$source = file_get_contents($testFile);
			$start = microtime(1);

			$this->renderer->run($source);
			$this->saveResultFile($testFile, 'svg', $this->renderer->getSVG());
			$this->saveResultFile($testFile, 'png', $this->renderer->getPNG());

			printf("| %-30s| %-8s|\n", $testFile, round(microtime(1) - $start, 4));
		}
	}

	/**
	 * @param $testFile
	 * @param $extension
	 * @param $content
	 */
	private function saveResultFile ($testFile, $extension, $content)
	{
		file_put_contents($this->outDir . basename($testFile, '.tex') . '.' . $extension, $content);
	}

	private function clearOutDir ()
	{
		foreach (glob($this->outDir . '*.png') as $outFile) {
			unlink($outFile);
		}

		foreach (glob($this->outDir . '*.svg') as $outFile) {
			unlink($outFile);
		}
	}
}
