import mk from "mk";
import tool_codec_utf8 from "./tool_codec_utf8";

namespace _tool_codec_base64 {
	/** 字符库 */
	export const str_lib_ss = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	/** 编解码器 */
	export const codec = {
		utf8: new tool_codec_utf8(),
	};
}

/** 编解码器-unicode_codec */
class tool_codec_base64 extends mk.codec_base {
	constructor(option_?: tool_codec_base64_.config) {
		super(option_);
	}

	/* --------------- protected --------------- */
	protected _config!: tool_codec_base64_.config;
	/* --------------- private --------------- */
	private _utf8_codec = _tool_codec_base64.codec.utf8;
	/* ------------------------------- 功能 ------------------------------- */
	/** 编码 */
	encode(data_s_: string): string {
		let result_s = "";
		let temp1_n: number, temp2_n: number, temp3_n: number, temp4_n: number, temp5_n: number, temp6_n: number, temp7_n: number;

		data_s_ = this._utf8_codec.encode(data_s_);
		for (let k_n = 0; k_n < data_s_.length; ) {
			temp1_n = data_s_.charCodeAt(k_n++);
			temp2_n = data_s_.charCodeAt(k_n++);
			temp3_n = data_s_.charCodeAt(k_n++);
			temp4_n = temp1_n >> 2;
			temp5_n = ((temp1_n & 3) << 4) | (temp2_n >> 4);
			temp6_n = ((temp2_n & 15) << 2) | (temp3_n >> 6);
			temp7_n = temp3_n & 63;
			if (isNaN(temp2_n)) {
				temp6_n = temp7_n = 64;
			} else if (isNaN(temp3_n)) {
				temp7_n = 64;
			}

			result_s +=
				_tool_codec_base64.str_lib_ss.charAt(temp4_n) +
				_tool_codec_base64.str_lib_ss.charAt(temp5_n) +
				_tool_codec_base64.str_lib_ss.charAt(temp6_n) +
				_tool_codec_base64.str_lib_ss.charAt(temp7_n);
		}

		return result_s;
	}

	/** 解码 */
	decode(data_s_: string): string {
		let result_s = "";
		let temp1_n: number, temp2_n: number, temp3_n: number, temp4_n: number, temp5_n: number, temp6_n: number, temp7_n: number;

		// eslint-disable-next-line no-useless-escape
		data_s_ = data_s_.replace(/[^A-Za-z0-9\+\/\=]/g, "");
		for (let k_n = 0; k_n < data_s_.length; ) {
			temp4_n = _tool_codec_base64.str_lib_ss.indexOf(data_s_.charAt(k_n++));
			temp5_n = _tool_codec_base64.str_lib_ss.indexOf(data_s_.charAt(k_n++));
			temp6_n = _tool_codec_base64.str_lib_ss.indexOf(data_s_.charAt(k_n++));
			temp7_n = _tool_codec_base64.str_lib_ss.indexOf(data_s_.charAt(k_n++));
			temp1_n = (temp4_n << 2) | (temp5_n >> 4);
			temp2_n = ((temp5_n & 15) << 4) | (temp6_n >> 2);
			temp3_n = ((temp6_n & 3) << 6) | temp7_n;
			result_s = result_s + String.fromCharCode(temp1_n);
			if (temp6_n != 64) {
				result_s = result_s + String.fromCharCode(temp2_n);
			}

			if (temp7_n != 64) {
				result_s = result_s + String.fromCharCode(temp3_n);
			}
		}

		return this._utf8_codec.decode(result_s);
	}
}

export namespace tool_codec_base64_ {
	export class config extends mk.codec_base_.config {}
}

export default tool_codec_base64;
