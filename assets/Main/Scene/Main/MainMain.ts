import { _decorator } from "cc";
import mk from "mk";
import { ResourcesAudio } from "../../../resources/Module/Audio/ResourcesAudio";
import { ResourcesGuide } from "../../../resources/Module/Guide/ResourcesGuide";
import { ResourcesLanguage } from "../../../resources/Module/Language/ResourcesLanguage";
import { ResourcesModule } from "../../../resources/Module/Module/ResourcesModule";
import { ResourcesNetwork } from "../../../resources/Module/Network/ResourcesNetwork";
import MainBundle from "../../Bundle/MainBundle";
import { MainMainItem } from "../../Module/Main/Item/MainMainItem";
import GlobalConfig from "global_config";
const { ccclass, property } = _decorator;

@ccclass("MainMain")
export class MainMain extends mk.StaticViewBase {
	/* --------------- static --------------- */
	/* --------------- 属性 --------------- */
	/* --------------- public --------------- */
	data = new (class {
		versionStr = GlobalConfig.Constant.versionStr;
		viewListList: typeof MainMainItem.prototype.data[] = [
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
					mk.bundle.loadScene("default", { bundleStr: "hot_update" });
				},
			},
		];
	})();

	/* ------------------------------- 生命周期 ------------------------------- */
	async onLoad() {
		mk.uiManage.regis(ResourcesAudio, "db://assets/resources/module/audio/resources_audio.prefab", MainBundle);
		mk.uiManage.regis(ResourcesLanguage, "db://assets/resources/module/language/resources_language.prefab", MainBundle);
		mk.uiManage.regis(ResourcesModule, "db://assets/resources/module/module/resources_module.prefab", MainBundle);
		mk.uiManage.regis(ResourcesNetwork, "db://assets/resources/module/network/resources_network.prefab", MainBundle);
		mk.uiManage.regis(ResourcesGuide, "db://assets/resources/module/guide/resources_guide.prefab", MainBundle);
	}
}
