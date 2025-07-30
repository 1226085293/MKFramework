import mk from "mk";

/** 编解码器-unicode */
class ToolCodecUnicode extends mk.CodecBase {
	constructor(option_?: ToolCodecUnicode_.Config) {
		super(option_);
	}

	/* --------------- protected --------------- */
	protected _config!: ToolCodecUnicode_.Config;
	/* ------------------------------- 功能 ------------------------------- */
	/** 编码 */
	encode(unicode_: number | string): string {
		let unicodeStr: string;

		if (typeof unicode_ === "number") {
			unicodeStr = unicode_.toString(16);
		} else {
			unicodeStr = unicode_;
		}

		// Unicode显示方式是\u4e00
		unicodeStr = `\\u${unicodeStr}`;
		unicodeStr = unicodeStr.replace(/\\/g, "%");
		// 转为中文
		unicodeStr = decodeURI(unicodeStr);

		// 将其它受影响的转换回原来
		return unicodeStr.replace(/%/g, "\\");
	}

	/** 解码 */
	// decode(data_: ArrayBuffer): any {}
}

export namespace ToolCodecUnicode_ {
	export class Config extends mk.CodecBase_.Config {}
}

export default ToolCodecUnicode;
