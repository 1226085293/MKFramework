import mk_instance_base from "../mk_instance_base";
import mk_codec_base from "../mk_codec_base";
import * as cc from "cc";

/** http */
class mk_http extends mk_instance_base {
	/* ------------------------------- 功能 ------------------------------- */
	/** 通用方法 */
	async open(type_s_: "GET" | "POST", url_s_: string, config_?: Partial<mk_http_.config>): Promise<void> {
		const xml_http = new XMLHttpRequest();
		let config = new mk_http_.config(config_);

		// 初始化数据
		{
			config = Object.assign(new mk_http_.config(), config);
			xml_http.timeout = config.timeout_n!;
			if (config.return_type) {
				xml_http.responseType = config.return_type;
			}
		}

		return await new Promise<any>((resolve_f) => {
			/** 超时定时器 */
			const timeout_timer = setTimeout(() => {
				resolve_f(null);
			}, config.timeout_n);

			xml_http.onreadystatechange = async () => {
				if (xml_http.readyState === 4 && xml_http.status >= 200 && xml_http.status < 400) {
					let result: any;

					switch (xml_http.responseType) {
						// response 是一个以 DOMString 对象表示的文本
						case "":
						case "text": {
							result = xml_http.response;
							break;
						}

						// response 是一个包含二进制数据的 JavaScript ArrayBuffer
						case "arraybuffer": {
							const buf = new Uint8Array(xml_http.response);
							let data = "";

							for (let k_n = 0; k_n < buf.byteLength; k_n++) {
								data += String.fromCharCode(buf[k_n]);
							}

							result = "data:image/png;base64," + globalThis.btoa(data);
							break;
						}

						// response 是一个包含二进制数据的 Blob 对象
						case "blob": {
							result = await new Promise<any>((resolve2_f) => {
								const read = new FileReader();

								read.onload = () => {
									resolve2_f(result);
								};

								read.readAsDataURL(xml_http.response);
							});

							break;
						}

						// response 是一个 HTML Document 或 XML XMLDocument，这取决于接收到的数据的 MIME 类型
						case "document": {
							result = xml_http.response;
							break;
						}

						// response 是一个 JavaScript 对象。这个对象是通过将接收到的数据类型视为 JSON 解析得到的
						case "json": {
							result = xml_http.response;
							break;
						}
					}

					clearTimeout(timeout_timer);
					resolve_f(result);
				}
			};

			xml_http.open(type_s_, url_s_, true);
			// 设置标头
			{
				if (cc.sys.isNative) {
					xml_http.setRequestHeader("Accept-Encoding", "gzip,deflate");
				}

				if (config.header) {
					for (const k_s in config.header) {
						xml_http.setRequestHeader(k_s, config.header[k_s]);
					}
				}
			}

			// open 回调
			if (config.open_callback_f) {
				config.open_callback_f(xml_http);
			}

			xml_http.send(config.body);
		});
	}

	/** GET方法 */
	async get(url_s_: string, config_: Partial<mk_http_.config>): Promise<void> {
		return await this.open("GET", url_s_, config_);
	}

	/** POST方法 */
	async post(url_s_: string, config_: Partial<mk_http_.config>): Promise<void> {
		return await this.open("POST", url_s_, config_);
	}
}

export namespace mk_http_ {
	/** 配置信息 */
	export class config {
		constructor(init_?: Partial<config>) {
			Object.assign(this, init_);
		}

		/** 超时时间(ms) */
		timeout_n = 5000;
		/** 返回数据类型 */
		return_type?: XMLHttpRequestResponseType;
		/** 编解码器 */
		codec?: mk_codec_base;
		/** 内容 */
		body?: Document | Blob | BufferSource | FormData | URLSearchParams | string;
		/** 标头 */
		header?: Record<string, string>;
		/**
		 * open 后回调
		 * @remarks
		 * 可在函数内注册回调，设置请求数据
		 */
		open_callback_f?: (http: XMLHttpRequest) => void;
	}
}

export default mk_http.instance();
