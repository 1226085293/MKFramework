import * as cc from "cc";
import { _decorator } from "cc";
import mk from "mk";
const { ccclass, property } = _decorator;

@ccclass("ResourcesModuleWindowItem")
export class ResourcesModuleWindowItem extends mk.ViewBase {
	/* --------------- 属性 --------------- */
	@property({ displayName: "文本", type: cc.Node })
	nameNode: cc.Node = null!;
	/* --------------- 属性 --------------- */
	initData!: typeof this.data;
	data = new (class {
		nameStr = "";
		clickFunc = null! as Function;
	})();
	/* ------------------------------- 生命周期 ------------------------------- */
	// 初始化视图
	// create(): void {}
	// 有数据初始化
	init(init_?: typeof this.initData): void {
		Object.assign(this.data, this.initData);
		mk.N(this.nameNode).label.string = this.data.nameStr;
	}
	// 无数据初始化
	// open(): void {}
	// 模块关闭
	close(): void {
		console.log("close");
	}
	/* ------------------------------- 按钮事件 ------------------------------- */
	clickSelf(): void {
		this.data.clickFunc?.();
	}
}
