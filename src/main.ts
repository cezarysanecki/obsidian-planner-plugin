import { Plugin } from "obsidian";

export default class PlannerPlugin extends Plugin {
	async onload() {
		console.log("Planner Navigator: loaded");
	}

	onunload() {
		console.log("Planner Navigator: unloaded");
	}
}
