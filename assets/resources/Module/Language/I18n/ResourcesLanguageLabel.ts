import mk from "mk";
import * as cc from "cc";
import { ResourcesLanguage } from "../ResourcesLanguage";

export default new mk.Language_.LabelData(cc.js.getClassName(ResourcesLanguage), {
	示例: {
		enUs: "template-{0}",
		zhCn: "示例-{0}",
	},
	示例2: {
		enUs: "template2-{1}-{0}",
		zhCn: "示例2-{0}-{1}",
	},
});
