import { _decorator } from "cc";
import mk from "mk";
import { ResourcesModuleWindowItem } from "./Item/ResourcesModuleWindowItem";
import { ResourcesModuleWindowNormal } from "./Normal/ResourcesModuleWindowNormal";
import { ResourcesModuleWindowFullScreen } from "./FullScreen/ResourcesModuleWindowFullScreen";
import { ResourcesModuleWindowTips } from "./Tips/ResourcesModuleWindowTips";
import { ResourcesModuleWindowLoading } from "./Loading/ResourcesModuleWindowLoading";
import tool from "../../../../Tool/tool";
const { ccclass, property } = _decorator;

@ccclass("ResourcesModuleWindow")
export class ResourcesModuleWindow extends mk.ViewBase {
	data = new (class {
		dataList: typeof ResourcesModuleWindowItem.prototype.initData[] = [];
	})();
	// 初始化视图
	// create(): void {}
	// 有数据初始化
	// init(init_?: typeof this.init_data): void {}
	// 无数据初始化
	open(): void {
		mk.uiManage.regis(
			ResourcesModuleWindowNormal,
			"db://assets/resources/module/module/window/normal/resources_module_window_normal.prefab",
			this
		);

		mk.uiManage.regis(
			ResourcesModuleWindowFullScreen,
			"db://assets/resources/module/module/window/full_screen/resources_module_window_full_screen.prefab",
			this
		);

		mk.uiManage.regis(ResourcesModuleWindowTips, "db://assets/resources/module/module/window/tips/resources_module_window_tips.prefab", this);
		mk.uiManage.regis(
			ResourcesModuleWindowLoading,
			"db://assets/resources/module/module/window/loading/resources_module_window_loading.prefab",
			this
		);

		this.data.dataList.push({
			nameStr: "弹窗",
			clickFunc: () => {
				mk.uiManage.open(ResourcesModuleWindowNormal);
			},
		});

		this.data.dataList.push({
			nameStr: "全屏弹窗",
			clickFunc: () => {
				mk.uiManage.open(ResourcesModuleWindowFullScreen);
			},
		});

		this.data.dataList.push({
			nameStr: "tips",
			clickFunc: () => {
				mk.uiManage.open(ResourcesModuleWindowTips);
			},
		});

		this.data.dataList.push({
			nameStr: "loading",
			clickFunc: () => {
				tool.loading.open(ResourcesModuleWindowLoading);
				setTimeout(() => {
					tool.loading.close(ResourcesModuleWindowLoading);
				}, 2000);
			},
		});
	}
	// 模块关闭
	// close(): void {}
}
