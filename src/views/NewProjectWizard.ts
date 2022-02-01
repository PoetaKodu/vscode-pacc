import * as vscode from 'vscode';
import { TextEncoder } from 'util';
import * as path from "path";
import * as fs from "fs";

import { getUri } from "../util/getUri";
import { NewProjectWizardContent } from './content/NewProjectWizard';

export class NewProjectWizardWebviewHandler implements vscode.Disposable
{
	projectCreated = new vscode.EventEmitter<string>();

	extensionPath?: string;
	extensionUri?: vscode.Uri;

	private webview? : vscode.WebviewPanel;
	private htmlContent? : string;

	constructor()
	{
	}

	setup(webview : vscode.WebviewPanel, extensionUri: vscode.Uri)
	{
		this.webview = webview;
		this.extensionUri = extensionUri;

		webview.webview.html = this.getContent();
		webview.webview.onDidReceiveMessage((e: any) => this.handleMessage(e));
	}

	handleMessage(event : any)
	{
		vscode.window.showInformationMessage(`Created project: ${event.projectName}`);
		const fs = vscode.workspace.fs;
		const wksRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || "";
		const uri = (str : string, prependFile = false) => vscode.Uri.file( (prependFile ? "file://" : "") + path.resolve(wksRoot, str) );

		const enc = new TextEncoder();

		const buildFileContents = JSON.stringify({
			name: event.projectName,
			type: "app",
			files: [ "src/main.cpp" ]
		}, undefined, "\t");
		const mainCppContent = "#include <iostream>\n\nint main() {\n\tstd::cout << \"Hello, World!\" << std::endl;\n}\n";
		
		fs.writeFile(uri(`cpackage.json`), enc.encode(buildFileContents));
		const dir = uri("./src");
		vscode.window.showInformationMessage(dir.fsPath);
		fs.createDirectory(dir);
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
		this.projectCreated.fire(`cpackage.json`);
	}

	dispose() {
		// none
	}

	getContent() : string
	{
		if (!this.htmlContent) {
			const toolkitUri = getUri(this.webview!.webview, this.extensionUri!, [
				"node_modules",
				"@vscode",
				"webview-ui-toolkit",
				"dist",
				"toolkit.js",
			]);

			this.htmlContent = NewProjectWizardContent(toolkitUri);
			// this.htmlContent = fs.readFileSync( path.join(this.extensionPath!, "static", "views", "NewProjectWizard.html" ) ).toString();
		}
		return this.htmlContent!;
	}
}