import * as cc from "cc";
import { _decorator } from "cc";
import mk from "mk";
import { ResourcesModuleLayerControl } from "./LayerControl/ResourcesModuleLayerControl";
import { ResourcesModuleLifeCycle } from "./LifeCycle/ResourcesModuleLifeCycle";
import { ResourcesModuleShowAlone } from "./ShowAlone/ResourcesModuleShowAlone";
import { ResourcesModuleUIStack } from "./UIStack/ResourcesModuleUIStack";
import { ResourcesModuleWindow } from "./Window/ResourcesModuleWindow";
import resources_module_mvc from "./MVC/ResourcesModuleMVC";
import tool from "db://assets/Tool/Tool";
import { ResourcesModuleItem } from "./Item/ResourcesModuleItem";

const { ccclass, property } = _decorator;

@ccclass("ResourcesModule")
export class ResourcesModule extends mk.ViewBase {
	/* --------------- 属性 --------------- */
	@property({ displayName: "列表", type: cc.Node })
	listNode: cc.Node = null!;
	/* --------------- public --------------- */
	data = {
		functionList: [],
	};

	/* ------------------------------- 生命周期 ------------------------------- */
	// init(init_?: typeof this.init_data): void {}
	open(): void {
		mk.uiManage.regis(ResourcesModuleLifeCycle, "db://assets/resources/Module/Module/LifeCycle/ResourcesModuleLifeCycle.prefab", this);
		mk.uiManage.regis(ResourcesModuleShowAlone, "db://assets/resources/Module/Module/ShowAlone/ResourcesModuleShowAlone.prefab", this);
		mk.uiManage.regis(ResourcesModuleLayerControl, "db://assets/resources/Module/Module/LayerControl/ResourcesModuleLayerControl.prefab", this);
		mk.uiManage.regis(ResourcesModuleUIStack, "db://assets/resources/Module/Module/UIStack/ResourcesModuleUIStack.prefab", this);
		mk.uiManage.regis(ResourcesModuleWindow, "db://assets/resources/Module/Module/Window/ResourcesModuleWindow.prefab", this);
		const dataList: ResourcesModuleItem["initData"][] = [
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
		];

		tool.node.synchronizedChildNodeNumber(this.listNode, dataList.length);
		dataList.forEach((v, kNum) => {
			const node = this.listNode.children[kNum];

			node.getComponent(ResourcesModuleItem)!.init(v);
		});
	}

	// close(): void {}
}
