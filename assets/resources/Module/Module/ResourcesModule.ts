import { _decorator } from "cc";
import mk from "mk";
import { ResourcesModuleLayerControl } from "./LayerControl/ResourcesModuleLayerControl";
import { ResourcesModuleLifeCycle } from "./LifeCycle/ResourcesModuleLifeCycle";
import { ResourcesModuleShowAlone } from "./ShowAlone/ResourcesModuleShowAlone";
import { ResourcesModuleUIStack } from "./UIStack/ResourcesModuleUIStack";
import { ResourcesModuleWindow } from "./Window/ResourcesModuleWindow";
import resources_module_mvc from "./MVC/ResourcesModuleMVC";

const { ccclass, property } = _decorator;

@ccclass("ResourcesModule")
export class ResourcesModule extends mk.ViewBase {
	/* --------------- static --------------- */
	/* --------------- 属性 --------------- */
	/* --------------- public --------------- */
	data = {
		functionList: [
			{
				nameStr: "生命周期",
				view: ResourcesModuleLifeCycle,
			},
			{
				nameStr: "独立展示",
				view: ResourcesModuleShowAlone,
			},
			{
				nameStr: "层级控制",
				view: ResourcesModuleLayerControl,
			},
			{
				nameStr: "UI 栈",
				view: ResourcesModuleUIStack,
			},
			{
				nameStr: "弹窗",
				view: ResourcesModuleWindow,
			},
			{
				nameStr: "MVC",
				view: () => {
					const mvc = new resources_module_mvc();
				},
			},
		],
	};

	/* --------------- protected --------------- */
	/* --------------- private --------------- */
	/* ------------------------------- 生命周期 ------------------------------- */
	// init(init_?: typeof this.init_data): void {}
	open(): void {
		mk.uiManage.regis(ResourcesModuleLifeCycle, "db://assets/resources/Module/Module/LifeCycle/ResourcesModuleLifeCycle.prefab", this);
		mk.uiManage.regis(ResourcesModuleShowAlone, "db://assets/resources/Module/Module/ShowAlone/ResourcesModuleShowAlone.prefab", this);
		mk.uiManage.regis(ResourcesModuleLayerControl, "db://assets/resources/Module/Module/LayerControl/ResourcesModuleLayerControl.prefab", this);
		mk.uiManage.regis(ResourcesModuleUIStack, "db://assets/resources/Module/Module/UIStack/ResourcesModuleUIStack.prefab", this);
		mk.uiManage.regis(ResourcesModuleWindow, "db://assets/resources/Module/Module/Window/ResourcesModuleWindow.prefab", this);
	}

	// close(): void {}

	/* ------------------------------- 按钮事件 ------------------------------- */
	buttonClose(): void {
		this.close({
			isDestroy: false,
		});
	}
	/* ------------------------------- 功能 ------------------------------- */
	/* ------------------------------- 网络事件 ------------------------------- */
	/* ------------------------------- 自定义事件 ------------------------------- */
}
