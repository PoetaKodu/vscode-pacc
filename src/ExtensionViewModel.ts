import { Pacc } from "./pacc/Pacc";
import { ProjectTreeProvider } from './views/Projects';
import { NewProjectWizardWebviewHandler } from "./views/NewProjectWizard";

export class PaccViewModel
{
	model? : Pacc;

	newProjectWizard? : NewProjectWizardWebviewHandler;
	projectTree? : ProjectTreeProvider;

	setup()
	{
		this.newProjectWizard!.projectCreated.event(
			projectName => {
				this.model!.setProjectFile(projectName);
				this.projectTree!.projects = [ projectName ];
				this.projectTree!.refresh();
			});
	}
}