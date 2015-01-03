<?php
/**
 * Library functions
 *
 * @copyright 2015 Roman Parpalak
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @package   S2 Latex Service
 * @link      http://tex.s2cms.ru
 */

class Lib
{
	/**
	 * Execute a command and kill it if the timeout limit fired to prevent long php execution
	 *
	 * @see http://stackoverflow.com/questions/2603912/php-set-timeout-for-script-with-system-call-set-time-limit-not-working
	 *
	 * @param string $cmd Command to exec (you should use 2>&1 at the end to pipe all output)
	 * @param integer $timeout
	 * @throws Exception
	 * @return string Returns command output
	 */
	static function ExecWaitTimeout($cmd, $timeout = 8)
	{
		$descriptorspec = array(
			0 => array("pipe", "r"),
			1 => array("pipe", "w"),
			2 => array("pipe", "w")
		);
		$pipes = array();

		$timeout += time();

		$process = proc_open($cmd, $descriptorspec, $pipes);
		if (!is_resource($process))
			throw new Exception("proc_open failed on: " . $cmd);

		$output = '';

		$status = array();
		$kill_status = '';

		do {
			usleep(10);
			$timeleft = $timeout - time();
			$read = array($pipes[1]);
			$write = NULL;
			$exeptions = NULL;
			stream_select($read, $write, $exeptions, $timeleft);

			if (!empty($read))
				$output .= fread($pipes[1], 8192);

			if ($timeout - time() <= 0)
			{
				$status = proc_get_status($process);
				$kill_status = 'Trying to kill';
				$ppid = $status['pid'];
				$pids = preg_split('/\s+/', `ps -o pid --no-heading --ppid $ppid`);
				foreach ($pids as $pid)
					if (is_numeric($pid))
					{
//					echo "Killing $pid\n";
						posix_kill($pid, 9); //9 is the SIGKILL signal
						$kill_status = 'Killed';
					}

				break;
			}
		} while (!feof($pipes[1]));

		if (empty($status))
			$status = proc_get_status($process);

		if ($kill_status)
			$status['status_kill'] = $kill_status;

		fclose($pipes[1]);
		fclose($pipes[2]);

		proc_close($process);

		return array($output, $status);
	}
}
