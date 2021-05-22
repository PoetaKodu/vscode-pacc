import * as vscode from 'vscode';
import { TextEncoder } from 'util';
import * as path from "path";
import * as fs from "fs";

export class NewProjectWizardWebviewHandler implements vscode.Disposable
{
	projectCreated : vscode.EventEmitter<string>;

	extensionPath?: string;

	private webview? : vscode.WebviewPanel;
	private htmlContent? : string;

	constructor()
	{
		this.projectCreated = new vscode.EventEmitter<string>();
	}

	setup(webview : vscode.WebviewPanel)
	{
		this.webview = webview;

		webview.webview.html = this.getContent();
		webview.webview.onDidReceiveMessage((e: any) => this.handleMessage(e));
	}

	handleMessage(event : any)
	{
		vscode.window.showInformationMessage(`Created project: ${event.projectName}`);
		const fs = vscode.workspace.fs;
		const wksRoot = vscode.workspace.rootPath || "";
		const uri = (str : string, prependFile = false) => vscode.Uri.file( (prependFile ? "file://" : "") + path.resolve(wksRoot, str) );

		const enc = new TextEncoder();

		const buildFileContents = JSON.stringify({
			name: event.projectName,
			type: "application",
			files: [ "src/main.cpp" ]
		}, undefined, "\t");
		const mainCppContent = "#include <iostream>\n\nint main() {\n\tstd::cout << \"Hello, World!\" << std::endl;\n}\n";
		
		fs.writeFile(uri(`${event.projectName}.build.json`), enc.encode(buildFileContents));
		fs.createDirectory(uri("./src"));
		fs.writeFile(uri("src/main.cpp"), enc.encode(mainCppContent)).then(
			() => {
				vscode.workspace.openTextDocument(uri("src/main.cpp")).then( t => vscode.window.showTextDocument(t) );
				vscode.window.showInformationMessage("Done");
				this.webview?.dispose();
			},
			() => {
				vscode.window.showInformationMessage("Failed");
			}
		);
		this.projectCreated.fire(`${event.projectName}.build.json`);
	}

	dispose() {
		// none
	}

	getContent() : string
	{
		if (!this.htmlContent)
		{
			this.htmlContent = fs.readFileSync( path.join(this.extensionPath!, "static", "views", "NewProjectWizard.html" ) ).toString();
		}
		return this.htmlContent!;
	}
}