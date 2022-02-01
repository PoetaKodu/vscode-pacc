import { Uri } from "vscode";
export const NewProjectWizardContent = (toolkitUri : Uri) => /*html*/ `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width,initial-scale=1.0">
		<script type="module" src="${toolkitUri}"></script>
		<title>Hello World!</title>
	</head>
	<body>
		<h1>Hello World!</h1>
		
		<vscode-button>Button Text</vscode-button>
	</body>
	</html>
`;