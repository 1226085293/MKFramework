import { _decorator } from "cc";
import { resources_module_layer_control } from "./layer_control/resources_module_layer_control";
import { resources_module_life_cycle } from "./life_cycle/resources_module_life_cycle";
import { resources_module_show_alone } from "./show_alone/resources_module_show_alone";
import { resources_module_ui_stack } from "./ui_stack/resources_module_ui_stack";

const { ccclass, property } = _decorator;

@ccclass("resources_module")
export class resources_module extends mk.module.view_base {
	/* --------------- static --------------- */
	/* --------------- 属性 --------------- */
	/* --------------- public --------------- */
	data = {
		function_as: [
			{
				desc_s: "生命周期",
				view: resources_module_life_cycle,
			},
			{
				desc_s: "独立展示",
				view: resources_module_show_alone,
			},
			{
				desc_s: "层级控制",
				view: resources_module_layer_control,
			},
			{
				desc_s: "UI 栈",
				view: resources_module_ui_stack,
			},
		],
	};

	/* --------------- protected --------------- */
	/* --------------- private --------------- */
	/* ------------------------------- 生命周期 ------------------------------- */
	async create(): Promise<void> {
		mk.ui_manage.regis(resources_module_life_cycle, "db://assets/resources/module/module/life_cycle/resources_module_life_cycle.prefab");
		mk.ui_manage.regis(resources_module_show_alone, "db://assets/resources/module/module/show_alone/resources_module_show_alone.prefab");
		mk.ui_manage.regis(resources_module_layer_control, "db://assets/resources/module/module/layer_control/resources_module_layer_control.prefab");
		mk.ui_manage.regis(resources_module_ui_stack, "db://assets/resources/module/module/ui_stack/resources_module_ui_stack.prefab");
	}

	// init(init_?: typeof this.init_data): void {}
	// async open(): Promise<void> {}

	// close(): void {}

	/* ------------------------------- 按钮事件 ------------------------------- */
	button_close(): void {
		this.close({
			destroy_b: true,
		});
	}
	/* ------------------------------- 功能 ------------------------------- */
	/* ------------------------------- 网络事件 ------------------------------- */
	/* ------------------------------- 自定义事件 ------------------------------- */
}
