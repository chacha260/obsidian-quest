import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { Dashboard } from "./components/Dashboard";
import { QuestPluginInterface } from "./types";

export const VIEW_TYPE_DASHBOARD = "quest-dashboard-view";

export class DashboardView extends ItemView {
  root: ReactDOM.Root | null = null;
  plugin: QuestPluginInterface;

  constructor(leaf: WorkspaceLeaf, plugin: QuestPluginInterface) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_DASHBOARD;
  }

  getDisplayText() {
    return "冒険の書";
  }
  
  getIcon() {
    return "sword";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("quest-dashboard-wrapper");

    this.root = ReactDOM.createRoot(container);
    this.root.render(
      <React.StrictMode>
        <Dashboard plugin={this.plugin} />
      </React.StrictMode>
    );
  }

  async onClose() {
    this.root?.unmount();
  }
}
