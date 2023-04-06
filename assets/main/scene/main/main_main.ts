import { _decorator } from "cc";
import mk from "mk";
import { resources_audio } from "../../../resources/module/audio/resources_audio";
import { resources_guide } from "../../../resources/module/guide/resources_guide";
import { resources_language } from "../../../resources/module/language/resources_language";
import { resources_module } from "../../../resources/module/module/resources_module";
import { resources_network_view } from "../../../resources/module/network/resources_network_view";
import { resources_main_item } from "../../module/main/item/main_main_item";
const { ccclass, property } = _decorator;

@ccclass("main_main")
export class main_main extends mk.module.view_base {
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
				view: resources_network_view,
			},
			{
				label_s: "引导",
				view: resources_guide,
			},
		] as typeof resources_main_item.prototype.data[],
	};

	/* ------------------------------- 生命周期 ------------------------------- */
	onLoad(): void {
		mk.ui_manage.regis(resources_audio, "db://assets/resources/module/audio/resources_audio.prefab");
		mk.ui_manage.regis(resources_language, "db://assets/resources/module/language/resources_language.prefab");
		mk.ui_manage.regis(resources_module, "db://assets/resources/module/module/resources_module.prefab");
		mk.ui_manage.regis(resources_network_view, "db://assets/resources/module/network/resources_network.prefab");
		mk.ui_manage.regis(resources_guide, "db://assets/resources/module/guide/resources_guide.prefab");
	}
}
