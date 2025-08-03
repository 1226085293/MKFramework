import { _decorator } from "cc";
import GlobalConfig from "global_config";
import mk from "mk";
// eslint-disable-next-line unused-imports/no-unused-imports
import Decorator from "../../../Decorator/Decorator";

const { ccclass, property } = _decorator;

@ccclass("ResourcesLanguage")
@Decorator.type.description("多语言模块")
export class ResourcesLanguage extends mk.ViewBase {
	/* ------------------------------- 生命周期 ------------------------------- */
	// init(init_?: typeof this.init_data): void {}
	// open(): void {}
	// close(): void {}

	/* ------------------------------- 按钮事件 ------------------------------- */
	clickChinese(): void {
		mk.languageManage.typeStr = GlobalConfig.Language.types.zhCn;
	}

	clickEnglish(): void {
		mk.languageManage.typeStr = GlobalConfig.Language.types.enUs;
	}
}
