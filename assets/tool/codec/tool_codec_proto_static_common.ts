import { DEBUG } from "cc/env";
import mk from "mk";
import protobufjs from "protobufjs/minimal.js";
import GlobalConfig from "global_config";

/** 编解码器 - protobufjs(静态) */
class codec_proto_static_common extends mk.codec_base {
	constructor(option_?: Partial<codec_proto_static_common_.config>) {
		super();
		this._config = new codec_proto_static_common_.config(option_);
	}

	/* --------------- public --------------- */
	/** 消息序列号 */
	sequence_n = 0;
	/* --------------- protected --------------- */
	protected _config: codec_proto_static_common_.config;
	/* --------------- private --------------- */
	/** 消息类型表 */
	private _client_id_message_map = new Map<number, protobufjs.Type>();
	/** 消息类型表 */
	private _server_id_message_map = new Map<number, protobufjs.Type>();
	/** 消息类型表 */
	private _key_message_map = new Map<string, protobufjs.Type>();
	/** 依赖数据 */
	private _dependent!: {
		/** 封装包 */
		package: { create: any; encode: any; decode: any };
		/** 消息 ID */
		message_id_tab: Record<string | number, string | number>;
	};
	/* ------------------------------- 功能 ------------------------------- */
	/** 编码 */
	encode(data_: any): ArrayBuffer | null {
		const message_id_n = this._get_message_id(data_.constructor);
		const message = this._key_message_map.get(data_.constructor.getTypeUrl(""));

		if (!message) {
			this._log.error("未找到消息路径为" + data_.constructor.getTypeUrl("") + "的已注册消息!");

			return null;
		}

		// 校验数据
		if (this._config.send_verify_b && message.verify(data_)) {
			this._log.error("发送数据校验未通过", message.verify(data_), message_id_n, data_);

			return null;
		}

		/** 消息数据 */
		const data = this._dependent.package
			.encode(
				this._dependent.package.create({
					id: message_id_n,
					sequence: data_["__sequence_n"] ?? this.sequence_n++,
					data: message.encode(data_).finish(),
				})
			)
			.finish();

		return this._config.encryption_f?.(data) ?? data;
	}

	/** 解码 */
	decode(data_: ArrayBuffer): GlobalConfig.network.proto_head | null {
		/** 消息体 */
		const data_uint8_as = new Uint8Array(data_);
		const message = this._dependent.package.decode(data_uint8_as) as unknown as { id: number; sequence: number; data: Uint8Array };
		const message_class = this._server_id_message_map.get(message.id);

		if (!message_class) {
			this._log.error("未找到消息号为" + message.id + "的已注册消息!");

			return null;
		}

		const message_data = message_class.decode(message.data);

		if (this._config.recv_verify_b && message_class.verify(message_data)) {
			this._log.error("接收包数据校验未通过, 请联系服务端协调!", message_class.verify(message_data));

			return null;
		}

		message_data["__sequence_n"] = message.sequence;

		return message_data;
	}

	init(proto_: any, dependent_: typeof this._dependent): void {
		this._dependent = dependent_;
		// 注册消息类型
		this._regis_message(proto_, this._config.name_s);
	}

	private _get_message_id(class_: any): number {
		const message_key_s: string = class_.getTypeUrl("");
		let message_name_s = message_key_s.slice(message_key_s.lastIndexOf(".") + 1);

		if (["C", "S", "B"].some((v_s) => message_name_s.endsWith(v_s))) {
			message_name_s = message_name_s.slice(0, -1);
		}

		const message_id_n = this._dependent.message_id_tab[message_name_s];

		return message_id_n as number;
	}

	/** 注册消息 */
	private _regis_message(mess_tab_: any, path_s_: string): void {
		for (const k_s in mess_tab_) {
			const mess = mess_tab_[k_s];

			switch (typeof mess) {
				case "object":
					{
						this._regis_message(mess, `${path_s_}.${k_s}`);
					}

					break;
				case "function":
					{
						const message_id_n = this._get_message_id(mess);
						const message_key_s = mess.getTypeUrl("") as string;

						if (message_id_n !== undefined) {
							this._key_message_map.set(message_key_s, mess);

							if (message_key_s.endsWith("C")) {
								this._client_id_message_map.set(message_id_n, mess);
							} else if (message_key_s.endsWith("S") || message_key_s.endsWith("B")) {
								this._server_id_message_map.set(message_id_n, mess);
							}
						}
					}

					break;
			}
		}
	}
}

export namespace codec_proto_static_common_ {
	export class config extends mk.codec_base_.config {
		constructor(init_?: Partial<config>) {
			super();
			Object.assign(this, init_);
		}

		/** 发送校验 */
		send_verify_b = DEBUG;
		/** 接收校验 */
		recv_verify_b = DEBUG;
		/** 协议名 */
		name_s = "root";
	}
}

export default codec_proto_static_common;
