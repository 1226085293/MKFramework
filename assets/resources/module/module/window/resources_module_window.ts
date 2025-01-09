import { _decorator } from "cc";
import mk from "mk";
import { resources_module_window_item } from "./item/resources_module_window_item";
import { resources_module_window_normal } from "./normal/resources_module_window_normal";
import { resources_module_window_full_screen } from "./full_screen/resources_module_window_full_screen";
import { resources_module_window_tips } from "./tips/resources_module_window_tips";
import { resources_module_window_loading } from "./loading/resources_module_window_loading";
import tool from "../../../../tool/tool";
const { ccclass, property } = _decorator;

@ccclass("resources_module_window")
export class resources_module_window extends mk.view_base {
	data = new (class {
		list_as: typeof resources_module_window_item.prototype.init_data[] = [];
	})();
	// 初始化视图
	// create(): void {}
	// 有数据初始化
	// init(init_?: typeof this.init_data): void {}
	// 无数据初始化
	open(): void {
		mk.ui_manage.regis(
			resources_module_window_normal,
			"db://assets/resources/module/module/window/normal/resources_module_window_normal.prefab",
			this
		);

		mk.ui_manage.regis(
			resources_module_window_full_screen,
			"db://assets/resources/module/module/window/full_screen/resources_module_window_full_screen.prefab",
			this
		);

		mk.ui_manage.regis(resources_module_window_tips, "db://assets/resources/module/module/window/tips/resources_module_window_tips.prefab", this);
		mk.ui_manage.regis(
			resources_module_window_loading,
			"db://assets/resources/module/module/window/loading/resources_module_window_loading.prefab",
			this
		);

		this.data.list_as.push({
			name_s: "弹窗",
			click_f: () => {
				mk.ui_manage.open(resources_module_window_normal);
			},
		});

		this.data.list_as.push({
			name_s: "全屏弹窗",
			click_f: () => {
				mk.ui_manage.open(resources_module_window_full_screen);
			},
		});

		this.data.list_as.push({
			name_s: "tips",
			click_f: () => {
				mk.ui_manage.open(resources_module_window_tips);
			},
		});

		this.data.list_as.push({
			name_s: "loading",
			click_f: () => {
				tool.loading.open(resources_module_window_loading);
				setTimeout(() => {
					tool.loading.close(resources_module_window_loading);
				}, 2000);
			},
		});
	}
	// 模块关闭
	// close(): void {}
}
