import { Plugin } from 'obsidian';
import { PlannerNavigatorView, PLANNER_VIEW_TYPE } from './PlannerNavigatorView';

export default class PlannerPlugin extends Plugin {

	async onload() {
		console.log('Planner Navigator: loaded');

		this.registerView(
			PLANNER_VIEW_TYPE,
			(leaf) => new PlannerNavigatorView(leaf)
		);

		this.addRibbonIcon('calendar-days', 'Planner Navigator', () => {
			this.activateView();
		});
	}

	onunload() {
		console.log('Planner Navigator: unloaded');
	}

	private async activateView(): Promise<void> {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType(PLANNER_VIEW_TYPE)[0];
		if (!leaf) {
			const rightLeaf = workspace.getRightLeaf(false);
			leaf = rightLeaf ?? workspace.getLeaf(true);
			await leaf.setViewState({ type: PLANNER_VIEW_TYPE, active: true });
		}

		workspace.revealLeaf(leaf);
	}
}
