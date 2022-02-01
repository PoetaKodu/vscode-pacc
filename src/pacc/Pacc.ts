import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { spawnShellScript } from '../util/Shell';
import { PaccViewModel } from '../ExtensionViewModel';

const mkdir = promisify(fs.mkdir);

const removeAnsiColorCodes = (str: string) => {
	return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
};

export class ProjectInfo 
{
	public name : string = "";
	public type : string = "unknown";
	public children : ProjectInfo[] = [];
}

export class QueryResult
{
	public name : string = "";
	public projects : ProjectInfo[] = [];
}

export class Pacc
{
	public onProjectsRefresh = new vscode.EventEmitter< ProjectInfo[] >();

	reloadProjects() {
		this.discoverProjects().then(
			(projects) => {
				this.onProjectsRefresh.fire(projects);
			}
		);
	}

	projectFile = "";
	buildDirectory = "";
	workspaceDirectory = "";
	outputChannel?: vscode.OutputChannel;

	setProjectFile(projectFile : string)
	{
		this.projectFile = projectFile;
	}

	async buildProject()
	{
		this.outputChannel?.show();

		this.log(`# Building package "${this.projectFile}"\n`);

		const scriptFile = path.resolve(this.workspaceDirectory, this.projectFile); 

		mkdir(this.buildDirectory, { recursive: true }).then(
		() => {		
			this.runCommand([ "build" ],
				(code, signal) => {
					if (code !== 0) {
						this.log(`# Build failed (code: ${code}, signal: ${signal})\n`);
					}
					else {
						this.log(`# Build succeeded.\n`);
					}
					return Promise.resolve();
				});
		});
	}

	async runProject(projectName = "")
	{
		this.outputChannel?.show();

		this.log(`# Running "${this.projectFile}"\n`);

		return new Promise<void>((resolve) => {
			this.runCommand([ "run", projectName ],
				(code, signal) => {
					resolve();
				}, true);
		});
	}

	async discoverProjects() : Promise<ProjectInfo[]> {

		this.outputChannel?.show();

		this.log(`# Discovering projects in "${this.projectFile}"`);

		const discoverFilePath = path.join(this.buildDirectory, "meta", "discover.json");
		await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.join(this.buildDirectory, "meta")));
		return new Promise(
			(resolve, reject) => {
				this.runCommand(["query", "projects", "-o", discoverFilePath],
					(code, signal) =>  {
						let projects : ProjectInfo[] = [ ];
						
						if (code !== 0) {
							this.log(`# Project discovery failed (code: ${code}, signal: ${signal})\n`);
						}
						else {
							const queryFile = Pacc.loadQueryFile(discoverFilePath);

							projects.push(
								{
									name: queryFile!.name,
									type: "workspace",
									children: queryFile!.projects.map(
										(p : ProjectInfo) => ({
											name: p.name,
											type: p.type || "(unknown)",
										} as ProjectInfo)
									)
								}
							);

							this.log(`# Discovered ${projects.length} projects.\n`);
						}
						resolve(projects);
					});
			}
		);
	}

	runCommand(params : string[],
				onClosed : (code : number, signal : NodeJS.Signals) => void, skipPrefix = false)
	{
		const proc = spawnShellScript("pacc-nightly", params, { cwd: this.workspaceDirectory });

		proc.stdout.on("data", (str : string) => { this.log(skipPrefix ? `${str}` : `[PACC | Info]: ${str}`); });
		proc.stderr.on("data", (str : string) => { this.log(skipPrefix ? `${str}` : `[PACC | Error]: ${str}`); });
		proc.on("error", (err) => { vscode.window.showErrorMessage(`Failed to run PACC, details:\n${err}`); });
		proc.on("close", onClosed);
	}

	private static loadQueryFile(filePath : string) : QueryResult | null
	{
		try {
			return JSON.parse(fs.readFileSync(filePath).toString());
		}
		catch(e) {
			return null;
		}
	}

	private log(msg : string) {
		this.outputChannel?.append(removeAnsiColorCodes(msg));
	}
}

