import { _decorator } from "cc";
import global_config from "../../../@config/global_config";
import mk from "mk";
// eslint-disable-next-line unused-imports/no-unused-imports
import decorator from "../../../decorator/decorator";

const { ccclass, property } = _decorator;

@ccclass("resources_language")
@decorator.type.description("多语言模块")
export class resources_language extends mk.view_base {
	/* --------------- static --------------- */
	/* --------------- 属性 --------------- */
	/* --------------- public --------------- */
	/* --------------- protected --------------- */
	/* --------------- private --------------- */
	/* ------------------------------- 生命周期 ------------------------------- */
	// init(init_?: typeof this.init_data): void {}
	// open(): void {}
	// close(): void {}

	/* ------------------------------- 按钮事件 ------------------------------- */
	button_close(): void {
		mk.ui_manage.close(this);
	}

	button_chinese(): void {
		mk.language_manage.type_s = global_config.language.type.zh_cn;
	}

	button_english(): void {
		mk.language_manage.type_s = global_config.language.type.en_us;
	}
	/* ------------------------------- 功能 ------------------------------- */
	/* ------------------------------- 网络事件 ------------------------------- */
	/* ------------------------------- 自定义事件 ------------------------------- */
}
