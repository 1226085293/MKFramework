import Nodes from "./ResourcesModuleUIStackDemoNodes";
import { _decorator } from "cc";
import mk from "mk";
const { ccclass, property } = _decorator;

@ccclass("ResourcesModuleUIStackDemo")
export class ResourcesModuleUIStackDemo extends mk.ViewBase {
	/* --------------- public --------------- */
	nodes!: Nodes;
	initData!: number;
	/* ------------------------------- 生命周期 ------------------------------- */
	onLoad() {
		this.nodes = new Nodes(this.node);
	}

	// create(): void { }
	init(data_?: typeof this.initData): void {
		mk.N(this.nodes.number).label.string = this.initData + "";
	}

	// open(): void {}
	// close(): void {}
}
