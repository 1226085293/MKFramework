import * as cc from "cc";
import mk_logger from "./MKLogger";

/** 编解码器基类 */
abstract class mk_codec_base {
	constructor(option_?: mk_codec_base_.config) {
		if (option_) {
			this._config = option_;
		}
	}

	/* --------------- protected --------------- */
	/** 配置信息 */
	protected _config!: mk_codec_base_.config;

	/** 日志 */
	protected get _log(): mk_logger {
		return this._log2 ?? (this._log2 = new mk_logger(cc.js.getClassName(this)));
	}

	/* --------------- private --------------- */
	/** 日志 */
	private _log2?: mk_logger;
	/* ------------------------------- 功能 ------------------------------- */
	/** 编码 */
	encode(...args_as_: any[]): any {
		return args_as_.length === 1 ? args_as_[0] : args_as_;
	}

	/** 解码 */
	decode(...args_as_: any[]): any {
		return args_as_.length === 1 ? args_as_[0] : args_as_;
	}
}

export namespace mk_codec_base_ {
	/** 配置信息 */
	export class config {
		/** 加密函数 */
		encryption_f?: (data: any) => any;
		/** 解密函数 */
		decrypt_f?: (data: any) => any;
	}
}

export default mk_codec_base;
