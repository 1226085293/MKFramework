import mk_codec_base, { mk_codec_base_ } from "../../@framework/mk_codec_base";

/** 编解码器-utf8_codec */
class tool_codec_utf8 extends mk_codec_base {
	constructor(option_?: tool_codec_utf8_.config) {
		super(option_);
	}

	/* --------------- protected --------------- */
	protected config!: tool_codec_utf8_.config;
	/* ------------------------------- 功能 ------------------------------- */
	/** 编码 */
	encode(data_s_: string): string {
		data_s_ = data_s_.replace(/\r\n/g, "\n");
		let result_s = "";
		let curr_n: number;

		for (let k_n = 0; k_n < data_s_.length; k_n++) {
			curr_n = data_s_.charCodeAt(k_n);
			if (curr_n < 128) {
				result_s += String.fromCharCode(curr_n);
			} else if (curr_n > 127 && curr_n < 2048) {
				result_s += String.fromCharCode((curr_n >> 6) | 192);
				result_s += String.fromCharCode((curr_n & 63) | 128);
			} else {
				result_s += String.fromCharCode((curr_n >> 12) | 224);
				result_s += String.fromCharCode(((curr_n >> 6) & 63) | 128);
				result_s += String.fromCharCode((curr_n & 63) | 128);
			}
		}
		return result_s;
	}

	/** 解码 */
	decode(data_s_: string): string {
		let result_s = "";
		let temp1_n = 0,
			temp2_n = 0,
			temp3_n = 0;

		for (let k_n = 0; k_n < data_s_.length; ) {
			temp1_n = data_s_.charCodeAt(k_n);
			if (temp1_n < 128) {
				result_s += String.fromCharCode(temp1_n);
				++k_n;
			} else if (temp1_n > 191 && temp1_n < 224) {
				temp3_n = data_s_.charCodeAt(k_n + 1);
				result_s += String.fromCharCode(((temp1_n & 31) << 6) | (temp3_n & 63));
				k_n += 2;
			} else {
				temp3_n = data_s_.charCodeAt(k_n + 1);
				temp2_n = data_s_.charCodeAt(k_n + 2);
				result_s += String.fromCharCode(((temp1_n & 15) << 12) | ((temp3_n & 63) << 6) | (temp2_n & 63));
				k_n += 3;
			}
		}
		return result_s;
	}
}

export namespace tool_codec_utf8_ {
	export class config extends mk_codec_base_.config {}
}

export default tool_codec_utf8;
