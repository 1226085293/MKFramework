import { _decorator } from "cc";
import mk from "mk";
const { ccclass, property } = _decorator;

@ccclass("ResourcesModuleWindowItem")
export class ResourcesModuleWindowItem extends mk.ViewBase {
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
	}
	// 无数据初始化
	// open(): void {}
	// 模块关闭
	close(): void {
		console.log("close");
	}
	/* ------------------------------- 按钮事件 ------------------------------- */
	buttonSelf(): void {
		this.data.clickFunc();
	}
}
