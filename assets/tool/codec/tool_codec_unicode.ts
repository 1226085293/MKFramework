import mk_codec_base, { mk_codec_base_ } from "../../@framework/mk_codec_base";

/** 编解码器-unicode_codec */
class tool_codec_unicode extends mk_codec_base {
	constructor(option_?: tool_codec_unicode_.config) {
		super(option_);
	}

	/* --------------- protected --------------- */
	protected config!: tool_codec_unicode_.config;
	/* ------------------------------- 功能 ------------------------------- */
	/** 编码 */
	encode(unicode_: number | string): string {
		let unicode_s: string;

		if (typeof unicode_ === "number") {
			unicode_s = unicode_.toString(16);
		} else {
			unicode_s = unicode_;
		}

		// Unicode显示方式是\u4e00
		unicode_s = `\\u${unicode_s}`;
		unicode_s = unicode_s.replace(/\\/g, "%");
		// 转为中文
		unicode_s = decodeURI(unicode_s);

		// 将其它受影响的转换回原来
		return unicode_s.replace(/%/g, "\\");
	}

	/** 解码 */
	// decode(data_: ArrayBuffer): any {}
}

export namespace tool_codec_unicode_ {
	export class config extends mk_codec_base_.config {}
}

export default tool_codec_unicode;
