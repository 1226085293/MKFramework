import * as cc from "cc";
import { _decorator } from "cc";
import mk from "mk";

const { ccclass, property } = _decorator;

@ccclass("ResourcesModuleItem")
export class ResourcesModuleItem extends mk.ViewBase {
	/* --------------- public --------------- */
	data = {
		/** 描述 */
		descStr: "",
		/** 视图 */
		view: null as cc.Constructor<mk.ViewBase> | Function | null,
	};

	/* ------------------------------- 生命周期 ------------------------------- */
	init(init_?: typeof this.initData): void {
		Object.assign(this.data, this.initData);
	}

	// open(): void {}

	// close(): void {}

	/* ------------------------------- 按钮事件 ------------------------------- */
	buttonClick(): void {
		if (this.data.view instanceof Function) {
			(this.data.view as Function)();
		} else if (this.data.view) {
			mk.uiManage.open(this.data.view);
		}
	}
}
