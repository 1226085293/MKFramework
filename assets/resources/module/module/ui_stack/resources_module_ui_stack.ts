import nodes from "./resources_module_ui_stack_nodes";
import { _decorator } from "cc";
import mk from "mk";
import { resources_module_ui_stack_demo } from "./ui/resources_module_ui_stack_demo";
const { ccclass, property } = _decorator;

@ccclass("resources_module_ui_stack")
export class resources_module_ui_stack extends mk.view_base {
	/* --------------- static --------------- */
	/* --------------- 属性 --------------- */
	/* --------------- public --------------- */
	nodes!: nodes;
	/* --------------- protected --------------- */
	/* --------------- private --------------- */
	/* ------------------------------- 生命周期 ------------------------------- */
	onLoad() {
		this.nodes = new nodes(this.node);

		mk.ui_manage.regis(resources_module_ui_stack_demo, "db://assets/resources/module/module/ui_stack/ui/resources_module_ui_stack_demo", this, {
			parent: this.nodes.layout,
		});
	}

	// init(init_?: typeof this.init_data): void {}
	// open(): void {}

	// close(): void {}

	/* ------------------------------- 按钮事件 ------------------------------- */
	button_open(): void {
		mk.ui_manage.open(resources_module_ui_stack_demo, {
			init: mk.ui_manage.get([resources_module_ui_stack_demo]).length,
		});
	}

	button_close(): void {
		const ui_as = mk.ui_manage.get();

		if (ui_as.length) {
			mk.ui_manage.close(ui_as[ui_as.length - 1]);
		}
	}
	/* ------------------------------- 功能 ------------------------------- */
	/* ------------------------------- 网络事件 ------------------------------- */
	/* ------------------------------- 自定义事件 ------------------------------- */
}
