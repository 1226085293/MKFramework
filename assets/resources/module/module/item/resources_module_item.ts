import * as cc from "cc";
import { _decorator } from "cc";

const { ccclass, property } = _decorator;

@ccclass("resources_module_item")
export class resources_module_item extends mk.module.view_base {
	/* --------------- static --------------- */
	/* --------------- 属性 --------------- */
	/* --------------- public --------------- */
	data = {
		/** 描述 */
		desc_s: "",
		/** 视图 */
		view: null as cc.Constructor<mk.module.view_base> | null,
	};

	/* --------------- protected --------------- */
	/* --------------- private --------------- */
	/* ------------------------------- 生命周期 ------------------------------- */
	init(init_?: typeof this.init_data): void {
		Object.assign(this.data, this.init_data);
	}

	// open(): void {}

	// close(): void {}

	/* ------------------------------- 按钮事件 ------------------------------- */
	button_click(): void {
		if (this.data.view) {
			mk.ui_manage.open(this.data.view);
		}
	}
	/* ------------------------------- 功能 ------------------------------- */
	/* ------------------------------- 网络事件 ------------------------------- */
	/* ------------------------------- 自定义事件 ------------------------------- */
}
