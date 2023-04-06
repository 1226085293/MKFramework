import nodes from "./resources_module_ui_stack_demo_nodes";
import { _decorator } from "cc";
const { ccclass, property } = _decorator;

@ccclass("resources_module_ui_stack_demo")
export class resources_module_ui_stack_demo extends mk.module.view_base {
	/* --------------- static --------------- */
	/* --------------- 属性 --------------- */
	/* --------------- public --------------- */
	nodes!: nodes;
	init_data!: number;
	/* --------------- protected --------------- */
	/* --------------- private --------------- */
	/* ------------------------------- 生命周期 ------------------------------- */
	onLoad() {
		this.nodes = new nodes(this.node);
	}

	// create(): void { }
	init(init_?: typeof this.init_data): void {
		this.nodes.number.label.string = this.init_data + "";
	}
	// open(): void {}

	// close(): void {}

	/* ------------------------------- 按钮事件 ------------------------------- */
	/* ------------------------------- 功能 ------------------------------- */
	/* ------------------------------- 网络事件 ------------------------------- */
	/* ------------------------------- 自定义事件 ------------------------------- */
}
