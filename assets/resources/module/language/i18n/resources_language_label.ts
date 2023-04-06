import * as cc from "cc";
import { resources_language } from "../resources_language";

export default new mk.language_.label_data(cc.js.getClassName(resources_language), {
	示例: {
		en_us: "template-{0}",
		zh_cn: "示例-{0}",
	},
	示例2: {
		en_us: "template2-{1}-{0}",
		zh_cn: "示例2-{0}-{1}",
	},
});
