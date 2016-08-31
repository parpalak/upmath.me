<?php
/**
 * @copyright 2014-2016 Roman Parpalak
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @package   S2 Latex Service
 * @link      http://tex.s2cms.ru
 */

namespace S2\Tex;

/**
 * Class Processor
 *
 * Processes requested URL and caches the result.
 * Uses cache if possible.
 */
class Processor
{
	/**
	 * @var string
	 */
	protected $cacheFailDir;

	/**
	 * @var string
	 */
	protected $cacheSuccessDir;

	private   $ext, $formula, $svg = '', $png = '', $curCacheName, $cacheExists = false, $modifiedAt;

	private $error;
	private $renderer;
	private $svgCommands = [];
	private $pngCommands = [];

	/**
	 * Processor constructor.
	 *
	 * @param RendererInterface $renderer
	 * @param string            $cacheSuccessDir
	 * @param string            $cacheFailDir
	 */
	public function __construct(RendererInterface $renderer, $cacheSuccessDir, $cacheFailDir)
	{
		$this->renderer        = $renderer;
		$this->cacheFailDir    = $cacheFailDir;
		$this->cacheSuccessDir = $cacheSuccessDir;
	}

	/**
	 * @param string $uri
	 *
	 * @throws \Exception
	 */
	public function parseURI($uri)
	{
		$a = explode('/', $uri, 3);
		if (count($a) < 3 || $a[1] !== 'svg' && $a[1] !== 'png') {
			throw new \Exception('Incorrect output format has been requested. Expected SVG or PNG.');
		}

		$this->ext     = $a[1];
		$this->formula = rawurldecode($a[2]);
		$this->formula = trim($this->formula);

		$this->curCacheName = $this->cachePathFromURI($this->ext);
		$this->cacheExists  = file_exists($this->curCacheName);
	}

	/**
	 * @param $command
	 *
	 * @return $this
	 */
	public function addSVGCommand($command)
	{
		$this->svgCommands[] = $command;

		return $this;
	}

	/**
	 * @param $command
	 *
	 * @return $this
	 */
	public function addPNGCommand($command)
	{
		$this->pngCommands[] = $command;

		return $this;
	}

	/**
	 * @return bool
	 */
	public function prepareContent()
	{
		if ($this->cacheExists) {
			$this->modifiedAt = filemtime($this->curCacheName);

			// TODO remove the hack
			$this->png = $this->svg = file_get_contents($this->curCacheName);

			return true;
		}

		try {
			$this->modifiedAt = time();
			$this->renderer->run($this->formula);
			$this->svg = $this->renderer->getSVG();
			$this->png = $this->renderer->getPNG();
		}
		catch (\Exception $e) {
			$this->error = $e->getMessage();
		}

		return !$this->error;
	}

	/**
	 * @return string
	 */
	public function getError()
	{
		return $this->error;
	}

	public function echoContent()
	{
		if ($this->error) {
			return;
		}

		$content = '';
		if ($this->ext == 'svg') {
			header('Content-Type: image/svg+xml');
			$content = $this->svg;
		}
		elseif ($this->ext == 'png') {
			header('Content-Type: image/png');
			$content = $this->png;
		}

		header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $this->modifiedAt) . ' GMT');
		header('Content-Length: ' . strlen($content));

		echo $content;
	}

	public function saveContent()
	{
		if ($this->cacheExists) {
			return;
		}

		// Disconnecting from web-server
		flush();
		fastcgi_finish_request();

		// Generating cache

		// Caching PNG
		$pngCacheName = $this->cachePathFromURI('png');
		self::filePut($pngCacheName, $this->error ? $_SERVER['HTTP_REFERER'] . ' png: ' . $this->formula : $this->png);

		// Caching SVG
		$svgCacheName = $this->cachePathFromURI('svg');
		self::filePut($svgCacheName, $this->error ? $_SERVER['HTTP_REFERER'] . ' svg: ' . $this->formula . ' ' . $this->svg : $this->svg);

		if (!$this->error) {
			// Optimizing SVG
			foreach ($this->svgCommands as $command) {
				shell_exec(sprintf($command, $svgCacheName));
			}

			// Optimizing PNG
			foreach ($this->pngCommands as $command) {
				shell_exec(sprintf($command, $pngCacheName));
			}
		}
	}

	/**
	 * Wrapper for file_put_contents()
	 *
	 * 1. Creates parent directories if they do not exist.
	 * 2. Uses atomic rename operation to avoid using partial content and race conditions.
	 *
	 * @param $filename
	 * @param $content
	 */
	private static function filePut($filename, $content)
	{
		$dir = dirname($filename);
		if (!file_exists($dir)) {
			mkdir($dir, 0777, true);
		}

		$tmpFilename = $filename . '.temp';

		file_put_contents($tmpFilename, $content);

		if (!@rename($tmpFilename, $filename)) {
			@unlink($filename);
			@rename($tmpFilename, $filename);
		}
	}

	/**
	 * Returns the cached path.
	 * This algorithm should be used by a web-server to process the cache files as a static content.
	 *
	 * @param string $ext
	 *
	 * @return string
	 */
	private function cachePathFromURI($ext)
	{
		$hash      = md5($this->formula);
		$prefixDir = $this->error ? $this->cacheFailDir : $this->cacheSuccessDir;

		return $prefixDir . substr($hash, 0, 2) . '/' . substr($hash, 2, 2) . '/' . substr($hash, 4) . '.' . $ext;
	}
}
