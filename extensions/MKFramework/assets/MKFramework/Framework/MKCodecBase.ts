import * as cc from "cc";
import MKLogger from "./MKLogger";

/** 编解码器基类 */
abstract class MKCodecBase {
	constructor(option_?: MKCodecBase_.Config) {
		if (option_) {
			this._config = option_;
		}
	}

	/* --------------- protected --------------- */
	/** 配置信息 */
	protected _config!: MKCodecBase_.Config;

	/** 日志 */
	protected get _log(): MKLogger {
		return this._log2 ?? (this._log2 = new MKLogger(cc.js.getClassName(this)));
	}

	/* --------------- private --------------- */
	/** 日志 */
	private _log2?: MKLogger;
	/* ------------------------------- 功能 ------------------------------- */
	/** 编码 */
	encode(...argsList_: any[]): any {
		return argsList_.length === 1 ? argsList_[0] : argsList_;
	}

	/** 解码 */
	decode(...argsList_: any[]): any {
		return argsList_.length === 1 ? argsList_[0] : argsList_;
	}
}

export namespace MKCodecBase_ {
	/** 配置信息 */
	export class Config {
		/** 加密函数 */
		encryptionFunc?: (data: any) => any;
		/** 解密函数 */
		decryptFunc?: (data: any) => any;
	}
}

export default MKCodecBase;
