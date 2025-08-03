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
		mk.uiManage.regis(ResourcesModuleUIStackDemo, "db://assets/resources/Module/Module/UIStack/UI/ResourcesModuleUIStackDemo", this, {
			parent: this.nodes.layout,
			isRepeat: true,
		});
	}

	// close(): void {}

	/* ------------------------------- 按钮事件 ------------------------------- */
	clickOpen(): void {
		mk.uiManage.open(ResourcesModuleUIStackDemo, {
			init: mk.uiManage.get([ResourcesModuleUIStackDemo]).length,
		});
	}

	clickClose(): void {
		const uiList = mk.uiManage.get();

		if (uiList.length) {
			mk.uiManage.close(uiList[uiList.length - 1]);
		}
	}
}
