import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { spawnShellScript } from '../util/Shell';
import { PaccViewModel } from '../ExtensionViewModel';

const mkdir = promisify(fs.mkdir);

export class Pacc
{
	projectFile = "";
	buildDirectory = "";
	workspaceDirectory = "";
	outputChannel?: vscode.OutputChannel;

	constructor()
	{
	}

	setProjectFile(projectFile : string)
	{
		this.projectFile = projectFile;
	}

	async buildProject()
	{
		this.outputChannel?.show();

		this.log(`# Building project "${this.projectFile}"`);

		const scriptFile = path.resolve(this.workspaceDirectory, this.projectFile); 

		mkdir(this.buildDirectory, { recursive: true }).then(
		() => {		
			this.runCppBuild([ "build", scriptFile ],
				(code, signal) => {
					if (code !== 0) {
						this.log(`# Build failed (code: ${code}, signal: ${signal})`);
					}
					else {
						this.log(`# Build succeeded.`);
					}
					return Promise.resolve();
				});
		});
	}

	async discoverProjects() : Promise<string[]> {

		this.outputChannel?.show();

		this.log(`# Discovering projects in "${this.projectFile}"`);

		const scriptFile = path.resolve(this.workspaceDirectory, this.projectFile); 

		return new Promise(
			(resolve, reject) => {
				this.runCppBuild(["discover", scriptFile],
					(code, signal) =>  {
						let projects : string[] = [ this.projectFile ];
						
						if (code !== 0) {
							this.log(`# Project discovery failed (code: ${code}, signal: ${signal})`);
						}
						else {

							projects = Pacc.loadProjectsFromFile(path.join(this.buildDirectory, 'meta', 'discover.json')).map((p : any) => p.name);
							
							this.log(`# Discovered ${projects.length} projects.`);
						}
						resolve(projects);
					});
			}
		);
	}

	runCppBuild(params : string[],
				onClosed : (code : number, signal : NodeJS.Signals) => void)
	{
		const proc = spawnShellScript("cpp-build", params, { cwd: this.buildDirectory });

		proc.stdout.on("data", (str : string) => { this.log(`[cpp-build | Info]: ${str}`); });
		proc.stderr.on("data", (str : string) => { this.log(`[cpp-build | Error]: ${str}`); });
		proc.on("error", (err) => { vscode.window.showErrorMessage(`Failed to run CppBuild, details:\n${err}`); });
		proc.on("close", onClosed);
	}

	private static loadProjectsFromFile(file : string)
	{
		try {
			return JSON.parse(fs.readFileSync(file).toString());
		}
		catch(e) {
			return [];
		}
	}

	private log(msg : string) {
		this.outputChannel?.appendLine(msg);
	}
}

