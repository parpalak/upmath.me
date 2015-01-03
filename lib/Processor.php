<?php
/**
 * Processes requested URL and caches the result.
 * Uses cache if possible.
 *
 * @copyright 2014-2015 Roman Parpalak
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @package   S2 Latex Service
 * @link      http://tex.s2cms.ru
 */

class Processor
{
	private $ext, $formula, $svg = '', $png = '', $cur_cache_name, $cache_exists = false, $modified_at;
	private $error;
	private $renderer;
	private $svg_commands = array();

	public function __construct (RendererInterface $renderer, $cacheSuccessDir, $cacheFailDir)
	{
		$this->renderer = $renderer;
		$this->cache_fail_dir = $cacheFailDir;
		$this->cache_success_dir = $cacheSuccessDir;
	}

	public function parseURI ($uri)
	{
		$a = explode('/', $uri);
		if (count($a) < 3 || $a[1] !== 'svg' && $a[1] !== 'png')
			throw new Exception('Incorrect output format has been requested. Expected SVG or PNG.');

		$this->ext = $a[1];
		$this->formula = urldecode($a[2]);
		$this->formula = trim($this->formula);

		$this->cur_cache_name = $this->cachePathFromURI($this->ext);
		$this->cache_exists = file_exists($this->cur_cache_name);
	}

	public function addSVGCommand ($command)
	{
		$this->svg_commands[] = $command;
	}

	public function getContent ()
	{
		if ($this->cache_exists)
		{
			$this->modified_at = filemtime($this->cur_cache_name);
			$this->png = $this->svg = file_get_contents($this->cur_cache_name);

			return true;
		}

		try
		{
			$this->modified_at = time();
			$this->renderer->run($this->formula);
			$this->svg = $this->renderer->getSVG();
			$this->png = $this->renderer->getPNG();
		}
		catch (Exception $e)
		{
			$this->error = $e->getMessage();
		}

		return !$this->error;
	}

	public function getError ()
	{
		return $this->error;
	}

	public function echoContent ()
	{
		if ($this->error)
			return;

		$content = '';
		if ($this->ext == 'svg')
		{
			header('Content-Type: image/svg+xml');
			$content = $this->svg;
		}
		elseif ($this->ext == 'png')
		{
			header('Content-Type: image/png');
			$content = $this->png;
		}

		header('Last-Modified: '.gmdate('D, d M Y H:i:s', $this->modified_at).' GMT');
		header('Content-Length: '.strlen($content));

		echo $content;
	}

	public function saveContent ()
	{
		// Disconnecting from web-server
		flush();
		fastcgi_finish_request();

		// Generating cache

		// Caching PNG
		$png_cache_name = $this->cachePathFromURI('png');
		self::file_put($png_cache_name, $this->error ? $_SERVER['HTTP_REFERER'] . ' png: '.$this->formula : $this->png);

		// Caching SVG
		$svg_cache_name = $this->cachePathFromURI('svg');
		self::file_put($svg_cache_name, $this->error ? $_SERVER['HTTP_REFERER'] . ' svg: '.$this->formula . ' ' . $this->svg : $this->svg);

		// Optimizing SVG
		if (!$this->error)
			foreach ($this->svg_commands as $command)
				exec(sprintf($command, $svg_cache_name));
	}

	private static function file_put ($filename, $content)
	{
		$dir = dirname($filename);
		if (!file_exists($dir))
			mkdir($dir, 0777, true);

		file_put_contents($filename, $content);
	}

	private function cachePathFromURI ($ext)
	{
		$hash = md5($this->formula);
		return ($this->error ? $this->cache_fail_dir : $this->cache_success_dir) . substr($hash, 0, 2) . '/' . substr($hash, 2, 2) . '/' . substr($hash, 4) . '.' . $ext;
	}
}
