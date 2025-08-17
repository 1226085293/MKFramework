import mk from "mk";
import * as cc from "cc";
import { ResourcesLanguage } from "../ResourcesLanguage";

export default new mk.Language_.TextureData(cc.js.getClassName(ResourcesLanguage), {
	示例: {
		enUs: "db://assets/resources/Module/Language/Texture/en",
		zhCn: "db://assets/resources/Module/Language/Texture/cn",
	},
});
