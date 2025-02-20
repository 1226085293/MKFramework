import { pinyin } from "pinyin-pro";
import * as varname from "varname";
import plugin_config from "../plugin_config";

export default function (node_name_str_: string): string {
	node_name_str_ = node_name_str_.match(/(?!\d)([\w\u4e00-\u9fa5]+)/g)?.[0] ?? "";
	// 引用
	if (node_name_str_.length) {
		// 包含中文字符转拼音
		if (node_name_str_.match(/[\u4e00-\u9fa5]/g)?.[0]) {
			let pinyin_ss = pinyin(node_name_str_, {
				toneType: "none",
				type: "array",
			});

			node_name_str_ = pinyin_ss.map((v_s, k_n) => (!k_n ? v_s : v_s[0].toUpperCase() + v_s.slice(1))).join("");
		} else {
			node_name_str_ = node_name_str_[0].toLowerCase() + node_name_str_.slice(1);
		}
	}
	// 不引用
	else {
		node_name_str_ = "";
	}

	return plugin_config.code_style_s === "驼峰" ? varname.camelback(node_name_str_) : varname.underscore(node_name_str_);
}
