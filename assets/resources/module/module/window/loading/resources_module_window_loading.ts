import { _decorator } from "cc";
import mk from "mk";
import tool from "../../../../../tool/tool";
const { ccclass, property } = _decorator;

@ccclass("resources_module_window_loading")
export class resources_module_window_loading extends mk.view_base {
	// 初始化视图
	// create(): void {}
	// 有数据初始化
	// init(init_?: typeof this.init_data): void {}
	// 无数据初始化
	open(): void {
		this.scheduleOnce(() => {
			tool.loading.close(resources_module_window_loading);
		}, 2);
	}
	// 模块关闭
	// close(): void {}
}
