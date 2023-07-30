/* eslint-disable @typescript-eslint/naming-convention */
import mk from "mk";
import * as cc from "cc";
import { main_main } from "../main_main";

export default new mk.language_.label_data(cc.js.getClassName(main_main), {
	音频: {
		zh_cn: "音频",
		en_us: "audio",
	},
	"模块(UI)": {
		zh_cn: "模块(UI)",
		en_us: "module(UI)",
	},
	网络: {
		zh_cn: "网络",
		en_us: "network",
	},
	引导: {
		zh_cn: "引导",
		en_us: "guide",
	},
	热更: {
		zh_cn: "热更",
		en_us: "hot update",
	},
});
