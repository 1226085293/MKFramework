/* eslint-disable @typescript-eslint/naming-convention */
import mk from "mk";
import * as cc from "cc";
import { MainMain } from "../MainMain";

export default new mk.Language_.LabelData(cc.js.getClassName(MainMain), {
	音频: {
		zhCn: "音频",
		enUs: "audio",
	},
	"模块(UI)": {
		zhCn: "模块\n(UI)",
		enUs: "module\n(UI)",
	},
	网络: {
		zhCn: "网络",
		enUs: "network",
	},
	引导: {
		zhCn: "引导",
		enUs: "guide",
	},
	热更: {
		zhCn: "热更",
		enUs: "hot update",
	},
});
