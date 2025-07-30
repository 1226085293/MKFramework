import { DEBUG } from "cc/env";
import mk from "mk";
import protobufjs from "protobufjs/minimal.js";
import GlobalConfig from "global_config";

/** 编解码器 - protobufjs(静态) */
class ToolCodecProtoStatic extends mk.CodecBase {
	constructor(proto_: any, option_?: Partial<ToolCodecProtoStatic_.Config>) {
		super();
		this._config = new ToolCodecProtoStatic_.Config(option_);

		// 注册消息类型
		this._regis_message(proto_, this._config.name_s);
	}

	/* --------------- protected --------------- */
	protected _config: ToolCodecProtoStatic_.Config;
	/* --------------- private --------------- */
	/** 消息类型表 */
	private _messMap = new Map<number, protobufjs.Type>();
	/** 消息路径表 */
	private _messPathMap = new Map<any, string>();
	/* ------------------------------- 功能 ------------------------------- */
	/** 编码 */
	encode(data_: any): ArrayBuffer | null {
		const mess = this._messMap.get(data_[GlobalConfig.Network.protoHeadKeyTab.__id]);

		if (!mess) {
			this._log.error("未找到消息号为" + data_[GlobalConfig.Network.protoHeadKeyTab.__id] + "的已注册消息!");

			return null;
		}

		// 添加消息头
		data_[GlobalConfig.Network.protoHeadKeyTab.__id] = data_.__proto__[GlobalConfig.Network.protoHeadKeyTab.__id];

		// 校验数据
		if (this._config.isSendVerify && mess.verify(data_)) {
			this._log.error("发送数据校验未通过", this._messPathMap.get(mess), data_);

			return null;
		}

		/** 消息数据 */
		const data = mess.encode(data_).finish();

		return this._config.encryptionFunc?.(data) ?? data;
	}

	/** 解码 */
	decode(data_: ArrayBuffer): GlobalConfig.Network.ProtoHead | null {
		/** 消息体 */
		const dataUint8List = new Uint8Array(data_);
		/** 消息号 */
		const idNum = protobufjs.Reader.create(dataUint8List).skipType(0).uint32();
		/** 消息 */
		const mess = this._messMap.get(idNum);

		if (!mess) {
			this._log.error("未找到消息号为" + idNum + "的已注册消息!");

			return null;
		}

		const data = this._config.decryptFunc?.(mess.decode(dataUint8List)) ?? mess.decode(dataUint8List);

		if (this._config.isRecvVerify && mess.verify(data)) {
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
		const messIdNum = mess_["prototype"][GlobalConfig.Network.protoHeadKeyTab.__id];

		// 不存在消息号或不存在消息ID默认值
		if ((messIdNum ?? null) === null) {
			return false;
		}

		/** 相同消息 */
		const sameMess = this._messMap.get(messIdNum);

		if (sameMess) {
			this._log.error(`${this._messPathMap.get(mess_)} 与 ${this._messPathMap.get(sameMess)} 消息号相同!`);

			return false;
		}

		return true;
	}

	/** 注册消息 */
	private _regis_message(messTab_: any, pathStr_: string): void {
		for (const kStr in messTab_) {
			const mess = messTab_[kStr];

			switch (typeof mess) {
				case "object":
					{
						this._regis_message(mess, `${pathStr_}.${kStr}`);
					}

					break;
				case "function":
					{
						/** 消息号 */
						const idNum = mess.prototype[GlobalConfig.Network.protoHeadKeyTab.__id];

						// 添加路径信息
						this._messPathMap.set(mess, `${pathStr_}.${kStr}`);

						if (this._regis_message_check(mess)) {
							this._messMap.set(idNum, mess);
						} else {
							this._messPathMap.delete(mess);
						}
					}

					break;
			}
		}
	}
}

export namespace ToolCodecProtoStatic_ {
	export class Config extends mk.CodecBase_.Config {
		constructor(init_?: Partial<Config>) {
			super();
			Object.assign(this, init_);
		}

		/** 发送校验 */
		isSendVerify = DEBUG;
		/** 接收校验 */
		isRecvVerify = DEBUG;
		/** 协议名 */
		name_s = "root";
	}
}

export default ToolCodecProtoStatic;
