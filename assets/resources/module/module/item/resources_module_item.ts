import * as cc from "cc";
import { _decorator } from "cc";
import mk from "mk";

const { ccclass, property } = _decorator;

@ccclass("resources_module_item")
export class resources_module_item extends mk.view_base {
	/* --------------- static --------------- */
	/* --------------- 属性 --------------- */
	/* --------------- public --------------- */
	data = {
		/** 描述 */
		desc_s: "",
		/** 视图 */
		view: null as cc.Constructor<mk.view_base> | Function | null,
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
		if (this.data.view instanceof Function) {
			(this.data.view as Function)();
		} else if (this.data.view) {
			mk.ui_manage.open(this.data.view);
		}
	}
	/* ------------------------------- 功能 ------------------------------- */
	/* ------------------------------- 网络事件 ------------------------------- */
	/* ------------------------------- 自定义事件 ------------------------------- */
}
