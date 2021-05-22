import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class ProjectTreeProvider implements vscode.TreeDataProvider<ProjectTreeItem> {

	projects : string[] = [];	

	private toDep(project : string)
	{
		return new ProjectTreeItem(project, project);
	}

	private _onDidChangeTreeData = new vscode.EventEmitter<ProjectTreeItem | undefined>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  
	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: ProjectTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: ProjectTreeItem): Thenable<ProjectTreeItem[]>
	{
		if (element) {
			return Promise.resolve([]);	
		}
		else {
			return Promise.resolve(this.projects.map(e => this.toDep(e)));
		}
	}
}

export class ProjectTreeItem extends vscode.TreeItem {

	constructor(
		public readonly name: string,
		private scriptFile: string
	) {
		super(name, vscode.TreeItemCollapsibleState.None);

		this.tooltip = `${this.name} (${this.scriptFile})`;
		this.description = this.scriptFile;
	}


	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};
}