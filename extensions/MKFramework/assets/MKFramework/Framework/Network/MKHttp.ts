import MKInstanceBase from "../MKInstanceBase";
import MKCodecBase from "../MKCodecBase";
import * as cc from "cc";

/**
 * http 模块
 * @noInheritDoc
 * @remarks
 *
 * - post/get 支持
 *
 * - 支持任意类型的返回数据解析
 *
 * - 支持自定义编解码器
 */
export class MKHttp extends MKInstanceBase {
	/* ------------------------------- 功能 ------------------------------- */
	/** GET */
	async get(urlStr_: string, config_: Partial<MKHttp_.Config>): Promise<any> {
		return await this._open("GET", urlStr_, config_);
	}

	/** POST */
	async post(urlStr_: string, config_: Partial<MKHttp_.Config>): Promise<any> {
		return await this._open("POST", urlStr_, config_);
	}

	/** 通用方法 */
	private async _open(typeStr_: "GET" | "POST", urlStr_: string, config_?: Partial<MKHttp_.Config>): Promise<any> {
		const xmlHttp = new XMLHttpRequest();
		let config = new MKHttp_.Config(config_);

		// 初始化数据
		{
			config = Object.assign(new MKHttp_.Config(), config);
			xmlHttp.timeout = config.timeoutNum!;
			if (config.returnType) {
				xmlHttp.responseType = config.returnType;
			}
		}

		return await new Promise<any>((resolveFunc) => {
			/** 超时定时器 */
			const timeoutTimer = setTimeout(() => {
				resolveFunc(null);
			}, config.timeoutNum);

			xmlHttp.onreadystatechange = async () => {
				if (xmlHttp.readyState === 4 && xmlHttp.status >= 200 && xmlHttp.status < 400) {
					let result: any;

					switch (xmlHttp.responseType) {
						// response 是一个以 DOMString 对象表示的文本
						case "":
						case "text": {
							result = xmlHttp.response;
							break;
						}

						// response 是一个包含二进制数据的 JavaScript ArrayBuffer
						case "arraybuffer": {
							const buffer = new Uint8Array(xmlHttp.response);
							let data = "";

							for (let kNum = 0; kNum < buffer.byteLength; kNum++) {
								data += String.fromCharCode(buffer[kNum]);
							}

							result = "data:image/png;base64," + window.btoa(data);
							break;
						}

						// response 是一个包含二进制数据的 Blob 对象
						case "blob": {
							result = await new Promise<any>((resolve2Func) => {
								const read = new FileReader();

								read.onload = () => {
									resolve2Func(result);
								};

								read.readAsDataURL(xmlHttp.response);
							});

							break;
						}

						// response 是一个 HTML Document 或 XML XMLDocument，这取决于接收到的数据的 MIME 类型
						case "document": {
							result = xmlHttp.response;
							break;
						}

						// response 是一个 JavaScript 对象。这个对象是通过将接收到的数据类型视为 JSON 解析得到的
						case "json": {
							result = xmlHttp.response;
							break;
						}
					}

					clearTimeout(timeoutTimer);
					resolveFunc(result);
				}
			};

			xmlHttp.open(typeStr_, urlStr_, true);
			// 设置标头
			{
				if (cc.sys.isNative) {
					xmlHttp.setRequestHeader("Accept-Encoding", "gzip,deflate");
				}

				if (config.header) {
					for (const kStr in config.header) {
						xmlHttp.setRequestHeader(kStr, config.header[kStr]);
					}
				}
			}

			// open 回调
			if (config.openCallbackFunc) {
				config.openCallbackFunc(xmlHttp);
			}

			xmlHttp.send(config.body);
		});
	}
}

export namespace MKHttp_ {
	/** 配置信息 */
	export class Config {
		constructor(init_?: Partial<Config>) {
			Object.assign(this, init_);
		}

		/** 超时时间(ms) */
		timeoutNum = 5000;
		/** 返回数据类型 */
		returnType?: XMLHttpRequestResponseType;
		/** 编解码器 */
		codec?: MKCodecBase;
		/** 内容 */
		body?: Document | Blob | BufferSource | FormData | URLSearchParams | string;
		/** 标头 */
		header?: Record<string, string>;
		/**
		 * open 后回调
		 * @remarks
		 * 可在函数内注册回调，设置请求数据
		 */
		openCallbackFunc?: (http: XMLHttpRequest) => void;
	}
}

const mkHttp = MKHttp.instance();

export default mkHttp;
