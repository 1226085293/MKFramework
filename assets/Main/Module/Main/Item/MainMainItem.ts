import { _decorator } from "cc";
import * as cc from "cc";
import mk from "mk";
import { MainMain } from "../../../Scene/Main/MainMain";
const { ccclass, property } = _decorator;

@ccclass("MainMainItem")
export class MainMainItem extends mk.StaticViewBase {
	/* --------------- 属性 --------------- */
	@property({ displayName: "文本", type: cc.Node })
	labelNode: cc.Node = null!;
	/* --------------- public --------------- */
	initData!: typeof MainMainItem.prototype.data;
	data = new (class {
		/** 列表文本 */
		labelStr = "";
		/** 打开视图 */
		view: cc.Constructor<mk.ViewBase> | (() => any) | null = null;
	})();

	/* ------------------------------- 生命周期 ------------------------------- */
	init(init_?: typeof this.initData): void {
		Object.assign(this.data, this.initData);

		if (mk.languageManage.labelDataTab[cc.js.getClassName(MainMain)]?.[this.initData.labelStr]) {
			this.labelNode.getComponent(mk.language.Label)!.markStr = this.data.labelStr;
		}
		// 不存在多语言则删除组件
		else {
			this.labelNode.getComponent(cc.Label)!.string = this.data.labelStr;
			this.labelNode.getComponent(mk.language.Label)!.destroy();
		}
	}
	/* ------------------------------- 按钮事件 ------------------------------- */
	/** 按钮-点击 */
	async buttonClick(): Promise<void> {
		if (!this.data.view) {
			return;
		}

		if (cc.js.getSuper(this.data.view) === mk.ViewBase) {
			mk.uiManage.open(this.data.view as any);
		} else {
			(this.data.view as any)();
		}
	}
}
