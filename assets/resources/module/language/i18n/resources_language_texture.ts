import mk from "mk";
import * as cc from "cc";
import { resources_language } from "../resources_language";

export default new mk.language_.texture_data(cc.js.getClassName(resources_language), {
	示例: {
		en_us: "db://assets/resources/module/language/texture/en",
		zh_cn: "db://assets/resources/module/language/texture/cn",
	},
});
