import * as cc from "cc";
import { _decorator } from "cc";
import mk from "mk";
import { ResourcesModuleWindowNormal } from "./Normal/ResourcesModuleWindowNormal";
import { ResourcesModuleWindowFullScreen } from "./FullScreen/ResourcesModuleWindowFullScreen";
import { ResourcesModuleWindowTips } from "./Tips/ResourcesModuleWindowTips";
import { ResourcesModuleWindowLoading } from "./Loading/ResourcesModuleWindowLoading";
import tool from "../../../../Tool/Tool";
import { ResourcesModuleWindowItem } from "./Item/ResourcesModuleWindowItem";
const { ccclass, property } = _decorator;

@ccclass("ResourcesModuleWindow")
export class ResourcesModuleWindow extends mk.ViewBase {
	/* --------------- 属性 --------------- */
	@property({ displayName: "列表", type: cc.Node })
	listNode: cc.Node = null!;
	/* ------------------------------- 生命周期 ------------------------------- */
	// 初始化视图
	// create(): void {}
	// 有数据初始化
	// init(init_?: typeof this.init_data): void {}
	// 无数据初始化
	open(): void {
		mk.uiManage.regis(ResourcesModuleWindowNormal, "db://assets/resources/Module/Module/Window/Normal/ResourcesModuleWindowNormal.prefab", this);

		mk.uiManage.regis(
			ResourcesModuleWindowFullScreen,
			"db://assets/resources/Module/Module/Window/FullScreen/ResourcesModuleWindowFullScreen.prefab",
			this
		);

		mk.uiManage.regis(ResourcesModuleWindowTips, "db://assets/resources/Module/Module/Window/Tips/ResourcesModuleWindowTips.prefab", this);
		mk.uiManage.regis(
			ResourcesModuleWindowLoading,
			"db://assets/resources/Module/Module/Window/Loading/ResourcesModuleWindowLoading.prefab",
			this
		);

		const dataList: typeof ResourcesModuleWindowItem.prototype.initData[] = [
			{
				nameStr: "弹窗",
				clickFunc: () => {
					mk.uiManage.open(ResourcesModuleWindowNormal);
				},
			},
			{
				nameStr: "全屏弹窗",
				clickFunc: () => {
					mk.uiManage.open(ResourcesModuleWindowFullScreen);
				},
			},
			{
				nameStr: "tips",
				clickFunc: () => {
					mk.uiManage.open(ResourcesModuleWindowTips);
				},
			},
			{
				nameStr: "loading",
				clickFunc: () => {
					tool.loading.open(ResourcesModuleWindowLoading);
					setTimeout(() => {
						tool.loading.close(ResourcesModuleWindowLoading);
					}, 2000);
				},
			},
		];

		tool.node.synchronizedChildNodeNumber(this.listNode, dataList.length);
		dataList.forEach((v, kNum) => {
			const node = this.listNode.children[kNum];

			node.getComponent(ResourcesModuleWindowItem)!.init(v);
		});
	}
	// 模块关闭
	// close(): void {}
}
