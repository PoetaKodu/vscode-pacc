import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ProjectInfo } from '../pacc/Pacc';
import { info } from 'console';

const makeDep = (project : ProjectInfo) => {
	return new ProjectTreeItem(project, (project.children ?? []).length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None);
};

export class ProjectTreeProvider implements vscode.TreeDataProvider<ProjectTreeItem> {

	projects : ProjectInfo[] = [];	

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
			return Promise.resolve(element.info.children.map(makeDep));	
		}
		else {
			return Promise.resolve(this.projects.map(makeDep));
		}
	}
}

export class ProjectTreeItem extends vscode.TreeItem {

	constructor(
		public readonly info : ProjectInfo,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super(info.name, collapsibleState);

		let isWorkspace = (info.children ?? []).length > 0;

		this.tooltip = `${this.info.name} (${this.info.type})`;
		this.description = this.info.type;	
		this.contextValue = isWorkspace ? "workspace" : "project";
		this.iconPath = new vscode.ThemeIcon(isWorkspace ? "package" : "project");
	}
}