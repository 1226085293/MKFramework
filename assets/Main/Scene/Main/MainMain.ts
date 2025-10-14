import * as cc from "cc";
import { _decorator } from "cc";
import mk from "mk";
import { ResourcesAudio } from "../../../resources/Module/Audio/ResourcesAudio";
import { ResourcesGuide } from "../../../resources/Module/Guide/ResourcesGuide";
import { ResourcesLanguage } from "../../../resources/Module/Language/ResourcesLanguage";
import { ResourcesModule } from "../../../resources/Module/Module/ResourcesModule";
import { ResourcesNetwork } from "../../../resources/Module/Network/ResourcesNetwork";
import MainBundle from "../../Bundle/MainBundle";
import tool from "db://assets/Tool/Tool";
import { MainMainItem } from "../../Module/Main/Item/MainMainItem";
const { ccclass, property } = _decorator;

@ccclass("MainMain")
export class MainMain extends mk.StaticViewBase {
	/* --------------- 属性 --------------- */
	@property({ displayName: "列表", type: cc.Node })
	listNode: cc.Node = null!;

	/* ------------------------------- 生命周期 ------------------------------- */
	protected open(): void {
		mk.uiManage.regis(ResourcesAudio, "db://assets/resources/Module/Audio/ResourcesAudio.prefab", MainBundle);
		mk.uiManage.regis(ResourcesLanguage, "db://assets/resources/Module/Language/ResourcesLanguage.prefab", MainBundle);
		mk.uiManage.regis(ResourcesModule, "db://assets/resources/Module/Module/ResourcesModule.prefab", MainBundle);
		mk.uiManage.regis(ResourcesNetwork, "db://assets/resources/Module/Network/ResourcesNetwork.prefab", MainBundle);
		mk.uiManage.regis(ResourcesGuide, "db://assets/resources/Module/Guide/ResourcesGuide.prefab", MainBundle);

		const dataList: MainMainItem["initData"][] = [
			{
				labelStr: "音频",
				view: ResourcesAudio,
			},
			{
				labelStr: "多语言\n(language)",
				view: ResourcesLanguage,
			},
			{
				labelStr: "模块(UI)",
				view: ResourcesModule,
			},
			{
				labelStr: "网络",
				view: ResourcesNetwork,
			},
			{
				labelStr: "引导",
				view: ResourcesGuide,
			},
			{
				labelStr: "热更",
				view: () => {
					mk.bundle.loadScene("HotUpdate", { bundleStr: "HotUpdate" });
				},
			},
		];

		tool.node.synchronizedChildNodeNumber(this.listNode, dataList.length);
		dataList.forEach((v, kNum) => {
			const node = this.listNode.children[kNum];

			node.getComponent(MainMainItem)!.init(v);
		});
	}
}
