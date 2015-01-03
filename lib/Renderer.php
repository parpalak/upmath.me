<?php
/**
 * Runs Latex CLI.
 *
 * @copyright 2014-2015 Roman Parpalak
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @package   S2 Latex Service
 * @link      http://tex.s2cms.ru
 */

class Renderer implements RendererInterface
{
	/**
	 * @var TemplaterInterface
	 */
	private $templater;
	private $is_debug = false, $log_dir = null;
	private $svg = '', $png = '';

	public function __construct (TemplaterInterface $templater, $tmpDir, $latexCommand, $svgCommand, $pngCommand)
	{
		$this->templater = $templater;
		$this->tmp_dir = $tmpDir;
		$this->latex_command = $latexCommand;
		$this->svg_command = $svgCommand;
		$this->png_command = $pngCommand;
	}

	public function setDebug ($isDebug)
	{
		$this->is_debug = $isDebug;
	}

	public function setLogDir ($dir)
	{
		$this->log_dir = $dir;
	}

	public function run ($formula)
	{
		$tmp_name = tempnam(TMP_DIR, '');

		$tex_source = $this->templater->run($formula);

		if ($this->is_debug)
			echo '<pre>', htmlspecialchars($tex_source), '</pre>';

		// Latex
		file_put_contents($tmp_name, $tex_source);
		try
		{
			list($out, $status) = Lib::ExecWaitTimeout($this->latex_command . ' ' . $tmp_name . ' 2>&1');
			if ($this->is_debug)
			{
				echo '<pre>';
				readfile($tmp_name . '.log');
				var_dump($status);
				echo '</pre>';
			}
		}
		catch (Exception $e)
		{
			if ($this->log_dir !== null)
			{
				$logger = new Katzgrau\KLogger\Logger($this->log_dir);
				$logger->error('Cannot run Latex', array($e->getMessage()));
				$logger->error('source', array($tex_source));
			}
			throw $e;
		}

		$latex_error = !file_exists($tmp_name . '.dvi') /*|| $status['exitcode'] !== 0*/;

		if (!file_exists($tmp_name . '.dvi') || isset($status['status_kill']))
		{
			// Ohe has to figure out why the process was killed and why no dvi-file is created.
			if ($this->log_dir !== null)
			{
				$logger = new Katzgrau\KLogger\Logger($this->log_dir);
				$logger->error('Latex finished incorrectly');
				$logger->error('status', $status + array("file_exists($tmp_name.dvi)" => file_exists($tmp_name . '.dvi')));
				$logger->error('source', array($tex_source));
				$logger->error('trace', array(file_get_contents($tmp_name.'.log')));
			}
		}

		if ($latex_error)
		{
			if ($this->is_debug)
			{
				echo '<pre>';
				var_dump($this);
				echo '</pre>';
			}

			$this->cleanupTempFiles($tmp_name);
			throw new Exception('Invalid formula');
		}

		// DVI -> SVG
		ob_start();
		passthru(sprintf($this->svg_command, $tmp_name));
		$svg = ob_get_clean();

		// $svg = '...<!--start 19.8752 31.3399 -->...';
		preg_match('#<!--start ([\d.]+) ([\d.]+) -->#', $svg, $match_start);
		preg_match('#<!--bbox ([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) -->#', $svg, $match_bbox);
		$depth = OUTER_SCALE * (- $match_start[2] + $match_bbox[2] + $match_bbox[4]);
		$height = OUTER_SCALE * $match_bbox[4];
		$width = OUTER_SCALE * $match_bbox[3];

		$script = '<script type="text/ecmascript">if(window.parent.postMessage)window.parent.postMessage("'.$depth.'|'.$width.'|'.$height.'|"+window.location,"*");</script>'."\n";
		$this->svg = str_replace('<defs>', $script . '<defs>', $svg);

		// DVI -> PNG
		exec(sprintf($this->png_command, $tmp_name, $tmp_name));
		$this->png = file_get_contents($tmp_name . '.png');

		// Cleaning up
		$this->cleanupTempFiles($tmp_name);
	}

	public function getSVG ()
	{
		return $this->svg;
	}

	public function getPNG ()
	{
		return $this->png;
	}

	/**
	 * @param string $tmp_name
	 */
	private function cleanupTempFiles ($tmp_name)
	{
		foreach (array('', '.log', '.aux', '.dvi', '.png') as $ext)
			@unlink($tmp_name . $ext);
	}
}
