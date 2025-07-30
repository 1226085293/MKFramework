import mk from "mk";

/** 编解码器-utf8 */
class ToolCodecUtf8 extends mk.CodecBase {
	constructor(option_?: ToolCodecUtf8_.Config) {
		super(option_);
	}

	/* --------------- protected --------------- */
	protected _config!: ToolCodecUtf8_.Config;
	/* ------------------------------- 功能 ------------------------------- */
	/** 编码 */
	encode(dataStr_: string): string {
		dataStr_ = dataStr_.replace(/\r\n/g, "\n");
		let resultStr = "";
		let currNum: number;

		for (let kNum = 0; kNum < dataStr_.length; kNum++) {
			currNum = dataStr_.charCodeAt(kNum);
			if (currNum < 128) {
				resultStr += String.fromCharCode(currNum);
			} else if (currNum > 127 && currNum < 2048) {
				resultStr += String.fromCharCode((currNum >> 6) | 192);
				resultStr += String.fromCharCode((currNum & 63) | 128);
			} else {
				resultStr += String.fromCharCode((currNum >> 12) | 224);
				resultStr += String.fromCharCode(((currNum >> 6) & 63) | 128);
				resultStr += String.fromCharCode((currNum & 63) | 128);
			}
		}

		return resultStr;
	}

	/** 解码 */
	decode(dataStr_: string): string {
		let resultStr = "";

		let temp1Num = 0,
			temp2Num = 0,
			temp3Num = 0;

		for (let kNum = 0; kNum < dataStr_.length; ) {
			temp1Num = dataStr_.charCodeAt(kNum);
			if (temp1Num < 128) {
				resultStr += String.fromCharCode(temp1Num);
				++kNum;
			} else if (temp1Num > 191 && temp1Num < 224) {
				temp3Num = dataStr_.charCodeAt(kNum + 1);
				resultStr += String.fromCharCode(((temp1Num & 31) << 6) | (temp3Num & 63));
				kNum += 2;
			} else {
				temp3Num = dataStr_.charCodeAt(kNum + 1);
				temp2Num = dataStr_.charCodeAt(kNum + 2);
				resultStr += String.fromCharCode(((temp1Num & 15) << 12) | ((temp3Num & 63) << 6) | (temp2Num & 63));
				kNum += 3;
			}
		}

		return resultStr;
	}
}

export namespace ToolCodecUtf8_ {
	export class Config extends mk.CodecBase_.Config {}
}

export default ToolCodecUtf8;
