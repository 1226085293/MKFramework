import mk from "mk";
import ToolCodecUtf8 from "./ToolCodecUtf8";

namespace _ToolCodecBase64 {
	/** 字符库 */
	export const libStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	/** 编解码器 */
	export const codec = {
		utf8: new ToolCodecUtf8(),
	};
}

/** 编解码器-unicode_codec */
class ToolCodecBase64 extends mk.CodecBase {
	constructor(option_?: ToolCodecBase64_.Config) {
		super(option_);
	}

	/* --------------- protected --------------- */
	protected _config!: ToolCodecBase64_.Config;
	/* --------------- private --------------- */
	private _utf8Codec = _ToolCodecBase64.codec.utf8;
	/* ------------------------------- 功能 ------------------------------- */
	/** 编码 */
	encode(dataStr_: string): string {
		let resultStr = "";
		let tempNum: number, temp2Num: number, temp3Num: number, temp4Num: number, temp5Num: number, temp6Num: number, temp7Num: number;

		dataStr_ = this._utf8Codec.encode(dataStr_);
		for (let kNum = 0; kNum < dataStr_.length; ) {
			tempNum = dataStr_.charCodeAt(kNum++);
			temp2Num = dataStr_.charCodeAt(kNum++);
			temp3Num = dataStr_.charCodeAt(kNum++);
			temp4Num = tempNum >> 2;
			temp5Num = ((tempNum & 3) << 4) | (temp2Num >> 4);
			temp6Num = ((temp2Num & 15) << 2) | (temp3Num >> 6);
			temp7Num = temp3Num & 63;
			if (isNaN(temp2Num)) {
				temp6Num = temp7Num = 64;
			} else if (isNaN(temp3Num)) {
				temp7Num = 64;
			}

			resultStr +=
				_ToolCodecBase64.libStr.charAt(temp4Num) +
				_ToolCodecBase64.libStr.charAt(temp5Num) +
				_ToolCodecBase64.libStr.charAt(temp6Num) +
				_ToolCodecBase64.libStr.charAt(temp7Num);
		}

		return resultStr;
	}

	/** 解码 */
	decode(dataStr_: string): string {
		let resultStr = "";
		let tempNum: number, temp2Num: number, temp3Num: number, temp4Num: number, temp5Num: number, temp6Num: number, temp7Num: number;

		// eslint-disable-next-line no-useless-escape
		dataStr_ = dataStr_.replace(/[^A-Za-z0-9\+\/\=]/g, "");
		for (let kNum = 0; kNum < dataStr_.length; ) {
			temp4Num = _ToolCodecBase64.libStr.indexOf(dataStr_.charAt(kNum++));
			temp5Num = _ToolCodecBase64.libStr.indexOf(dataStr_.charAt(kNum++));
			temp6Num = _ToolCodecBase64.libStr.indexOf(dataStr_.charAt(kNum++));
			temp7Num = _ToolCodecBase64.libStr.indexOf(dataStr_.charAt(kNum++));
			tempNum = (temp4Num << 2) | (temp5Num >> 4);
			temp2Num = ((temp5Num & 15) << 4) | (temp6Num >> 2);
			temp3Num = ((temp6Num & 3) << 6) | temp7Num;
			resultStr = resultStr + String.fromCharCode(tempNum);
			if (temp6Num != 64) {
				resultStr = resultStr + String.fromCharCode(temp2Num);
			}

			if (temp7Num != 64) {
				resultStr = resultStr + String.fromCharCode(temp3Num);
			}
		}

		return this._utf8Codec.decode(resultStr);
	}
}

export namespace ToolCodecBase64_ {
	export class Config extends mk.CodecBase_.Config {}
}

export default ToolCodecBase64;
