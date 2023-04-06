import { DEBUG } from "cc/env";
import protobufjs from "protobufjs/minimal.js";
import global_config from "../../@config/global_config";

/** 编解码器 - protobufjs(静态) */
class codec_proto_static extends mk.codec_base {
	constructor(proto_: any, option_?: Partial<codec_proto_static_.config>) {
		super();
		this._config = new codec_proto_static_.config(option_);

		// 注册消息类型
		this._regis_message(proto_, this._config.name_s);
	}

	/* --------------- protected --------------- */
	protected _config: codec_proto_static_.config;
	/* --------------- private --------------- */
	/** 消息类型表 */
	private _mess_map = new Map<number, protobufjs.Type>();
	/** 消息路径表 */
	private _mess_path_map = new Map<any, string>();
	/* ------------------------------- 功能 ------------------------------- */
	/** 编码 */
	encode(data_: any): ArrayBuffer | null {
		const mess = this._mess_map.get(data_[global_config.network.proto_head_key_tab.__id]);

		if (!mess) {
			this._log.error("未找到消息号为" + data_[global_config.network.proto_head_key_tab.__id] + "的已注册消息!");
			return null;
		}

		// 添加消息头
		data_[global_config.network.proto_head_key_tab.__id] = data_.__proto__[global_config.network.proto_head_key_tab.__id];

		// 校验数据
		if (this._config.send_verify_b && mess.verify(data_)) {
			this._log.error("发送数据校验未通过", this._mess_path_map.get(mess), data_);
			return null;
		}

		/** 消息数据 */
		const data = mess.encode(data_).finish();

		return this._config.encryption_f?.(data) ?? data;
	}

	/** 解码 */
	decode(data_: ArrayBuffer): global_config.network.proto_head | null {
		/** 消息体 */
		const data_uint8_as = new Uint8Array(data_);
		/** 消息号 */
		const id_n = protobufjs.Reader.create(data_uint8_as).skipType(0).uint32();
		/** 消息 */
		const mess = this._mess_map.get(id_n);

		if (!mess) {
			this._log.error("未找到消息号为" + id_n + "的已注册消息!");
			return null;
		}

		const data = this._config.decrypt_f?.(mess.decode(data_uint8_as)) ?? mess.decode(data_uint8_as);

		if (this._config.recv_verify_b && mess.verify(data)) {
			this._log.error("接收包数据校验未通过, 请联系服务端协调!");
			return null;
		}

		return data;
	}

	/** 消息注册检查 */
	private _regis_message_check(mess_: protobufjs.Type): boolean {
		if (!mess_) {
			return false;
		}
		/** 消息号 */
		const mess_id_n = mess_["prototype"][global_config.network.proto_head_key_tab.__id];

		// 不存在消息号或不存在消息ID默认值
		if ((mess_id_n ?? null) === null) {
			return false;
		}

		/** 相同消息 */
		const same_mess = this._mess_map.get(mess_id_n);

		if (same_mess) {
			this._log.error(`${this._mess_path_map.get(mess_)} 与 ${this._mess_path_map.get(same_mess)} 消息号相同!`);
			return false;
		}
		return true;
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
						/** 消息号 */
						const id_n = mess.prototype[global_config.network.proto_head_key_tab.__id];

						// 添加路径信息
						this._mess_path_map.set(mess, `${path_s_}.${k_s}`);

						if (this._regis_message_check(mess)) {
							this._mess_map.set(id_n, mess);
						} else {
							this._mess_path_map.delete(mess);
						}
					}

					break;
			}
		}
	}
}

export namespace codec_proto_static_ {
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

export default codec_proto_static;
