<?php
/**
 * Test infrastructure.
 *
 * @copyright 2015-2016 Roman Parpalak
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @package   S2 Latex Service
 * @link      http://tex.s2cms.ru
 */

namespace S2\Tex;

/**
 * Class Tester
 */
class Tester
{
	private $srcTemplate = 'src/*.tex';
	private $outDir      = '../www/test_out/';

	/**
	 * @var RendererInterface
	 */
	private $renderer;

	/**
	 * Tester constructor.
	 *
	 * @param RendererInterface $renderer
	 * @param string            $srcTpl
	 * @param string            $outDir
	 */
	public function __construct(RendererInterface $renderer, $srcTpl, $outDir)
	{
		$this->renderer    = $renderer;
		$this->srcTemplate = $srcTpl;
		$this->outDir      = $outDir;
	}

	public function run()
	{
		$this->clearOutDir();

		foreach (glob($this->srcTemplate) as $testFilename) {
			$source = file_get_contents($testFilename);
			$start  = microtime(1);

			$this->renderer->run($source);
			$this->saveResultFile($testFilename, 'svg', $this->renderer->getSVG());
			$this->saveResultFile($testFilename, 'png', $this->renderer->getPNG());

			printf("| %-30s| %-8s|\n", $testFilename, round(microtime(1) - $start, 4));
		}
	}

	/**
	 * @param string $testFilename
	 * @param string $extension
	 * @param string $content
	 */
	private function saveResultFile($testFilename, $extension, $content)
	{
		file_put_contents($this->outDir . basename($testFilename, '.tex') . '.' . $extension, $content);
	}

	private function clearOutDir()
	{
		foreach (glob($this->outDir . '*.png') as $outFile) {
			unlink($outFile);
		}

		foreach (glob($this->outDir . '*.svg') as $outFile) {
			unlink($outFile);
		}
	}
}
