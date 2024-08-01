import { _decorator } from "cc";
import mk from "mk";
const { ccclass, property } = _decorator;

@ccclass("resources_module_window_item")
export class resources_module_window_item extends mk.view_base {
	init_data!: typeof this.data;
	data = new (class {
		name_s = "";
		click_f = null! as Function;
	})();
	// 初始化视图
	// create(): void {}
	// 有数据初始化
	init(init_?: typeof this.init_data): void {
		Object.assign(this.data, this.init_data);
	}
	// 无数据初始化
	// open(): void {}
	// 模块关闭
	close(): void {
		console.log("close");
	}
	/* ------------------------------- 按钮事件 ------------------------------- */
	button_self(): void {
		this.data.click_f();
	}
}
