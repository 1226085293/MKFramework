import Nodes from "./ResourcesModuleUIStackNodes";
import { _decorator } from "cc";
import mk from "mk";
import { ResourcesModuleUIStackDemo } from "./UI/ResourcesModuleUIStackDemo";
const { ccclass, property } = _decorator;

@ccclass("ResourcesModuleUIStack")
export class ResourcesModuleUIStack extends mk.ViewBase {
	/* --------------- public --------------- */
	nodes!: Nodes;
	/* ------------------------------- 生命周期 ------------------------------- */
	onLoad() {
		this.nodes = new Nodes(this.node);
	}

	// init(init_?: typeof this.init_data): void {}
	open(): void {
		mk.uiManage.regis(ResourcesModuleUIStackDemo, "db://assets/resources/module/module/ui_stack/ui/resources_module_ui_stack_demo", this, {
			parent: this.nodes.layout,
			isRepeat: true,
		});
	}

	// close(): void {}

	/* ------------------------------- 按钮事件 ------------------------------- */
	buttonOpen(): void {
		mk.uiManage.open(ResourcesModuleUIStackDemo, {
			init: mk.uiManage.get([ResourcesModuleUIStackDemo]).length,
		});
	}

	buttonClose(): void {
		const uiList = mk.uiManage.get();

		if (uiList.length) {
			mk.uiManage.close(uiList[uiList.length - 1]);
		}
	}
}
