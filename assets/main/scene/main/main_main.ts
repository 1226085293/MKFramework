import { _decorator } from "cc";
import mk from "mk";
import { resources_audio } from "../../../resources/module/audio/resources_audio";
import { resources_guide } from "../../../resources/module/guide/resources_guide";
import { resources_language } from "../../../resources/module/language/resources_language";
import { resources_module } from "../../../resources/module/module/resources_module";
import { resources_network } from "../../../resources/module/network/resources_network";
import { resources_main_item } from "../../module/main/item/main_main_item";
import main_bundle from "../../bundle/main_bundle";
const { ccclass, property } = _decorator;

@ccclass("main_main")
export class main_main extends mk.view_base {
	/* --------------- static --------------- */
	/* --------------- 属性 --------------- */
	/* --------------- public --------------- */
	data = {
		view_list_as: [
			{
				label_s: "音频",
				view: resources_audio,
			},
			{
				label_s: "多语言(language)",
				view: resources_language,
			},
			{
				label_s: "模块管理",
				view: resources_module,
			},
			{
				label_s: "网络",
				view: resources_network,
			},
			{
				label_s: "引导",
				view: resources_guide,
			},
		] as typeof resources_main_item.prototype.data[],
	};

	/* ------------------------------- 生命周期 ------------------------------- */
	create(): void {
		mk.ui_manage.regis(resources_audio, "db://assets/resources/module/audio/resources_audio.prefab", main_bundle);
		mk.ui_manage.regis(resources_language, "db://assets/resources/module/language/resources_language.prefab", main_bundle);
		mk.ui_manage.regis(resources_module, "db://assets/resources/module/module/resources_module.prefab", main_bundle);
		mk.ui_manage.regis(resources_network, "db://assets/resources/module/network/resources_network.prefab", main_bundle);
		mk.ui_manage.regis(resources_guide, "db://assets/resources/module/guide/resources_guide.prefab", main_bundle);
	}
}
