import * as cproc from 'child_process';

export function spawnShellScript(shellScript : string, params : string[], options : cproc.SpawnOptionsWithoutStdio | undefined)
{
	if (process.platform === "win32")
	{
		return cproc.spawn("cmd", ["/c", shellScript, ...params], options);
	}
	else
	{
		return cproc.spawn("/bin/sh", [shellScript, ...params], options);
	}
}