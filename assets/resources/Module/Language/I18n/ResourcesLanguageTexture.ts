import mk from "mk";
import * as cc from "cc";
import { ResourcesLanguage } from "../ResourcesLanguage";

export default new mk.Language_.TextureData(cc.js.getClassName(ResourcesLanguage), {
	示例: {
		enUs: "db://assets/resources/module/language/texture/en",
		zhCn: "db://assets/resources/module/language/texture/cn",
	},
});
