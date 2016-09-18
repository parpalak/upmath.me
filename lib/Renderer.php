<?php
/**
 * @copyright 2014-2016 Roman Parpalak
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @package   S2 Latex Service
 * @link      http://tex.s2cms.ru
 */

namespace S2\Tex;

use Psr\Log\LoggerInterface;
use Symfony\Component\Process\Exception\ProcessTimedOutException;
use Symfony\Component\Process\Process;

/**
 * Class Renderer
 *
 * Runs Latex CLI.
 */
class Renderer implements RendererInterface
{
	const SVG_PRECISION = 5;

	/**
	 * @var TemplaterInterface
	 */
	private $templater;

	/**
	 * @var LoggerInterface
	 */
	private $logger;

	/**
	 * @var string
	 */
	protected $tmpDir;

	/**
	 * @var bool
	 */
	private $isDebug = false;

	private $latexCommand;
	private $pngCommand;
	private $svgCommand;
	private $svg2pngCommand;

	/**
	 * @var string
	 */
	private $svg = '';

	/**
	 * @var string
	 */
	private $png = '';

	/**
	 * Renderer constructor.
	 *
	 * @param TemplaterInterface $templater
	 * @param string             $tmpDir
	 * @param string             $latexCommand
	 * @param string             $svgCommand
	 * @param null               $pngCommand
	 */
	public function __construct(
		TemplaterInterface $templater,
		$tmpDir,
		$latexCommand,
		$svgCommand,
		$pngCommand = null
	) {
		$this->templater = $templater;

		$this->tmpDir = $tmpDir;

		$this->latexCommand = $latexCommand;
		$this->svgCommand   = $svgCommand;
		$this->pngCommand   = $pngCommand;
	}

	/**
	 * @param bool $isDebug
	 *
	 * @return $this
	 */
	public function setIsDebug($isDebug)
	{
		$this->isDebug = $isDebug;

		return $this;
	}

	/**
	 * @param LoggerInterface $logger
	 *
	 * @return $this
	 */
	public function setLogger(LoggerInterface $logger)
	{
		$this->logger = $logger;

		return $this;
	}

	/**
	 * @param string $formula
	 *
	 * @throws \Exception
	 */
	private function validateFormula($formula)
	{
		foreach (['\\write', '\\input', '\\usepackage', '\\special'] as $disabledCommand) {
			if (strpos($formula, $disabledCommand) !== false) {
				if ($this->logger !== null) {
					$this->logger->error(sprintf('Forbidden command "%s": ', $disabledCommand), [$formula]);
					$this->logger->error('Server vars: ', $_SERVER);
				}
				throw new \Exception('Forbidden commands.');
			}
		}
	}

	/**
	 * @param string $formula
	 *
	 * @return null|void
	 * @throws \Exception
	 */
	public function run($formula)
	{
		$this->validateFormula($formula);

		$tmpName = tempnam(TMP_DIR, '');

		$formulaObj = $this->templater->run($formula);
		$texSource  = $formulaObj->getText();
		$this->echoDebug(htmlspecialchars($texSource));

		// Latex
		file_put_contents($tmpName, $texSource);

		// See https://github.com/symfony/symfony/issues/5030 for 'exec' hack
		$process = new Process('exec ' . $this->latexCommand . ' ' . $tmpName . ' 2>&1');
		$process->setTimeout(8);

		try {
			$exitCode = $process->run();
		}
		catch (\Exception $e) {
			if ($this->logger !== null) {
				$message = $e instanceof ProcessTimedOutException ? 'Latex has been interrupted by a timeout' : 'Cannot run Latex';
				$this->logger->error($message, [
					'message' => $e->getMessage(),
					'command' => $process->getCommandLine(),
					'source'  => $texSource,
				]);
			}
			$this->dumpDebug($texSource);
			$this->cleanupTempFiles($tmpName);
			throw $e;
		}

		if ($this->isDebug) {
			echo '<pre>';
			readfile($tmpName . '.log');
			var_dump('exitcode', $exitCode);
			echo '</pre>';
		}

		if (!file_exists($tmpName . '.dvi')) {
			// Ohe has to figure out why the process was killed and why no dvi-file is created.
			if ($this->logger !== null) {
				$this->logger->error('Latex finished incorrectly', [
					'command'                   => $process->getCommandLine(),
					'exit_code'                 => $process->getExitCode(),
					'exit_code_text'            => $process->getExitCodeText(),
					"file_exists($tmpName.dvi)" => file_exists($tmpName . '.dvi'),
				]);
				$this->logger->error('source', [$texSource]);
				$this->logger->error('trace (' . $tmpName . '.log)', [file_get_contents($tmpName . '.log')]);
			}

			$this->dumpDebug($this);
			$this->cleanupTempFiles($tmpName);
			throw new \Exception('Invalid formula');
		}

		// DVI -> SVG
		$cmd       = sprintf($this->svgCommand, $tmpName);
		$svgOutput = shell_exec($cmd);

		$this->dumpDebug($cmd);
		$this->dumpDebug($svgOutput);

		$this->setSvgContent(file_get_contents($tmpName . '.svg'), $formulaObj->hasBaseline());

		if ($this->svg2pngCommand) {
			// SVG -> PNG
			ob_start();
			passthru(sprintf($this->svg2pngCommand, $tmpName));
			$this->png = ob_get_clean();
		}
		elseif ($this->pngCommand) {
			// DVI -> PNG
			exec(sprintf($this->pngCommand, $tmpName));
			$this->png = file_get_contents($tmpName . '.png');
		}

		// Cleaning up
		$this->cleanupTempFiles($tmpName);
	}

	public function getSVG()
	{
		return $this->svg;
	}

	public function getPNG()
	{
		return $this->png;
	}

	/**
	 * @param string $tmp_name
	 */
	private function cleanupTempFiles($tmp_name)
	{
		foreach (['', '.log', '.aux', '.dvi', '.svg', '.png'] as $ext) {
			@unlink($tmp_name . $ext);
		}
	}

	/**
	 * @param string $command
	 *
	 * @return $this
	 */
	public function setSVG2PNGCommand($command)
	{
		$this->svg2pngCommand = $command;

		return $this;
	}

	/**
	 * @param $output
	 */
	private function dumpDebug($output)
	{
		if ($this->isDebug) {
			echo '<pre>';
			var_dump($output);
			echo '</pre>';
		}
	}

	/**
	 * @param $output
	 */
	private function echoDebug($output)
	{
		if ($this->isDebug) {
			echo '<pre>';
			echo $output;
			echo '</pre>';
		}
	}

	/**
	 * @param string $svg
	 * @param bool   $hasBaseline
	 */
	private function setSvgContent($svg, $hasBaseline)
	{
		// $svg = '...<!--start 19.8752 31.3399 -->...';

		//                                    x        y
		$hasStart = preg_match('#<!--start ([\d.]+) ([\d.]+) -->#', $svg, $matchStart);
		//                                  x        y        w        h
		$hasBbox = preg_match('#<!--bbox ([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) -->#', $svg, $matchBbox);

		if ($hasStart && $hasBbox) {
			// SVG contains info about image size and baseline position.
			$rawHeight = $matchBbox[4];
			$rawWidth  = $matchBbox[3];
			$rawY      = $matchBbox[2];

			$rawStartY = $matchStart[2];

			// Typically $rawY < $rawStartY
			$rawDepth = $hasBaseline ? min(0, $rawY - $rawStartY) + $rawHeight : $rawHeight * 0.5;

			// Taking into account OUTER_SCALE since coordinates are in the internal scale.
			$depth  = round(OUTER_SCALE * $rawDepth, self::SVG_PRECISION);
			$height = round(OUTER_SCALE * $rawHeight, self::SVG_PRECISION);
			$width  = round(OUTER_SCALE * $rawWidth, self::SVG_PRECISION);

			// Embedding script providing that info to the parent.
			$script = '<script type="text/ecmascript">if(window.parent.postMessage)window.parent.postMessage("' . $depth . '|' . $width . '|' . $height . '|"+window.location,"*");</script>' . "\n";
			$svg    = str_replace('</svg>', $script . '</svg>', $svg);
		}

		$this->svg = $svg;
	}
}
