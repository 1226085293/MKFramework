import * as cc from "cc";
import { _decorator } from "cc";
import mk from "mk";

const { ccclass, property } = _decorator;

@ccclass("ResourcesModuleItem")
export class ResourcesModuleItem extends mk.ViewBase {
	/* --------------- 属性 --------------- */
	@property({ displayName: "名字", type: cc.Node })
	nameNode: cc.Node = null!;
	/* --------------- public --------------- */
	initData!: typeof ResourcesModuleItem.prototype.data;
	data = {
		/** 描述 */
		nameStr: "",
		/** 视图 */
		view: null as cc.Constructor<mk.ViewBase> | Function | null,
	};

	/* ------------------------------- 生命周期 ------------------------------- */
	init(init_?: typeof this.initData): void {
		Object.assign(this.data, this.initData);

		mk.N(this.nameNode).label.string = this.data.nameStr;
	}

	// open(): void {}

	// close(): void {}

	/* ------------------------------- 按钮事件 ------------------------------- */
	clickSelf(): void {
		if (cc.js.getSuper(this.data.view as any) === mk.ViewBase) {
			mk.uiManage.open(this.data.view as any);
		} else {
			(this.data.view as any)();
		}
	}
}
