import { DEBUG } from "cc/env";
import mk from "mk";
import protobufjs from "protobufjs/minimal.js";
import GlobalConfig from "GlobalConfig";

/** 编解码器 - protobufjs(静态) */
class ToolCodecProtoStatic extends mk.CodecBase {
	constructor(proto_: any, option_?: Partial<ToolCodecProtoStatic_.Config>) {
		super();
		this._config = new ToolCodecProtoStatic_.Config(option_);

		// 注册消息类型
		this._regisMessage(proto_, this._config.nameStr);
	}

	/* --------------- protected --------------- */
	protected _config: ToolCodecProtoStatic_.Config;
	/* --------------- private --------------- */
	/** 消息 ID 键（在 proto 文件中定义的 id 属性名） */
	private readonly _messageIdKeyStr = "__idNum";
	/** 消息类型表 */
	private _messMap = new Map<number, protobufjs.Type>();
	/** 消息路径表 */
	private _messPathMap = new Map<any, string>();
	/* ------------------------------- 功能 ------------------------------- */
	/** 编码 */
	encode(data_: any): ArrayBuffer | null {
		const message = this._messMap.get(data_[this._messageIdKeyStr]);

		if (!message) {
			this._log.error("未找到消息号为" + data_[this._messageIdKeyStr] + "的已注册消息!");

			return null;
		}

		// 添加消息头
		data_[this._messageIdKeyStr] = data_.__proto__[this._messageIdKeyStr];

		// 校验数据
		if (this._config.isSendVerify && message.verify(data_)) {
			this._log.error("发送数据校验未通过", this._messPathMap.get(message), data_);

			return null;
		}

		/** 消息数据 */
		const data = message.encode(data_).finish();

		return this._config.encryptionFunc?.(data) ?? data;
	}

	/** 解码 */
	decode(data_: ArrayBuffer): GlobalConfig.Network.ProtoHead | null {
		/** 消息体 */
		const dataUint8List = new Uint8Array(data_);
		/** 消息号 */
		const idNum = protobufjs.Reader.create(dataUint8List).skipType(0).uint32();
		/** 消息 */
		const message = this._messMap.get(idNum);

		if (!message) {
			this._log.error("未找到消息号为" + idNum + "的已注册消息!");

			return null;
		}

		const data = this._config.decryptFunc?.(message.decode(dataUint8List)) ?? message.decode(dataUint8List);

		if (this._config.isRecvVerify && message.verify(data)) {
			this._log.error("接收包数据校验未通过, 请联系服务端协调!");

			return null;
		}

		return data;
	}

	/** 消息注册检查 */
	private _regisMessageCheck(mess_: protobufjs.Type): boolean {
		if (!mess_) {
			return false;
		}

		/** 消息号 */
		const messIdNum = mess_["prototype"][this._messageIdKeyStr];

		// 不存在消息号或不存在消息ID默认值
		if ((messIdNum ?? null) === null) {
			return false;
		}

		/** 相同消息 */
		const sameMessage = this._messMap.get(messIdNum);

		if (sameMessage) {
			this._log.error(`${this._messPathMap.get(mess_)} 与 ${this._messPathMap.get(sameMessage)} 消息号相同!`);

			return false;
		}

		return true;
	}

	/** 注册消息 */
	private _regisMessage(messTab_: any, pathStr_: string): void {
		for (const kStr in messTab_) {
			const message = messTab_[kStr];

			switch (typeof message) {
				case "object":
					{
						this._regisMessage(message, `${pathStr_}.${kStr}`);
					}

					break;
				case "function":
					{
						/** 消息号 */
						const idNum = message.prototype[this._messageIdKeyStr];

						// 添加路径信息
						this._messPathMap.set(message, `${pathStr_}.${kStr}`);

						if (this._regisMessageCheck(message)) {
							this._messMap.set(idNum, message);
						} else {
							this._messPathMap.delete(message);
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
		nameStr = "root";
	}
}

export default ToolCodecProtoStatic;
