// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { ProjectTreeProvider, ProjectTreeItem } from './views/Projects';
import { NewProjectWizardWebviewHandler } from './views/NewProjectWizard';

import { Pacc } from './pacc/Pacc';
import { PaccViewModel } from './ExtensionViewModel';
import * as path from 'path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-pacc" is now active!');

	const vm = new PaccViewModel;
	vm.newProjectWizard = new NewProjectWizardWebviewHandler();
	vm.newProjectWizard.extensionPath = context.extensionPath;

	const pacc = new Pacc;
	vm.model = pacc;

	const updateWorkspaceFolders = () => {
		if (vscode.workspace.rootPath)
		{
			pacc.buildDirectory = path.join(vscode.workspace.rootPath, "build");
			pacc.workspaceDirectory = vscode.workspace.rootPath;
			vscode.window.showInformationMessage("Workspace folders updated.");
		}
		else
		{
			vscode.window.showInformationMessage("No workspace open.");
		}
	};
	updateWorkspaceFolders();

	vscode.workspace.onDidChangeWorkspaceFolders(ev => updateWorkspaceFolders());

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(
		vscode.commands.registerCommand('pacc.openNewProjectWizard', () => {
			// Create and show a new webview
			const panel = vscode.window.createWebviewPanel(
				'newProjectWizard', // Identifies the type of the webview. Used internally
				'New Project', // Title of the panel displayed to the user
				vscode.ViewColumn.One, // Editor column to show the new webview panel in.
				{
					enableScripts: true,
					localResourceRoots: [
						vscode.Uri.file(path.join(context.extensionPath, 'static', 'views'))
					]
				} // Webview options. More on these later.
			);

			vm.newProjectWizard!.setup(panel);

			context.subscriptions.push(vm.newProjectWizard!);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('pacc.buildProject',
			(element : ProjectTreeItem) => {
				vscode.window.showInformationMessage(`Building project "${element.label!}"`);
				vm.model!.buildProject();
			}
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('pacc.loadRootProject',
			(uri : vscode.Uri) => {
				const projectName = path.relative(vm.model!.workspaceDirectory, uri.fsPath);
				vscode.window.showInformationMessage(`Loading root project "${projectName}"\nPath: ${uri.fsPath} \nWorkspace: ${vm.model!.workspaceDirectory}`);
				vm.model!.setProjectFile(projectName);
				vm.model!.discoverProjects().then(
					(projects) => {
						vm.projectTree!.projects = [ ...projects ];
						vm.projectTree!.refresh();
					}
				);

				
			}
		)
	);
	
	

	pacc.outputChannel = vscode.window.createOutputChannel("Pacc");
	context.subscriptions.push(pacc.outputChannel);

	const projectTree = new ProjectTreeProvider();
	vm.projectTree = projectTree;

	vscode.window.createTreeView('paccProjectView', {
		treeDataProvider: projectTree
	});

	vm.setup();
}

// this method is called when your extension is deactivated
export function deactivate() { }
