import { DEBUG } from "cc/env";
import mk from "mk";
import protobufjs from "protobufjs/minimal.js";
import GlobalConfig from "global_config";

/** 编解码器 - protobufjs(静态) */
class ToolCodecProtoStaticCommon extends mk.CodecBase {
	constructor(option_?: Partial<ToolCodecProtoStaticCommon_.Config>) {
		super();
		this._config = new ToolCodecProtoStaticCommon_.Config(option_);
	}

	/* --------------- public --------------- */
	/** 消息序列号 */
	sequenceNum = 0;
	/* --------------- protected --------------- */
	protected _config: ToolCodecProtoStaticCommon_.Config;
	/* --------------- private --------------- */
	/** 消息类型表 */
	private _clientIdMessageMap = new Map<number, protobufjs.Type>();
	/** 消息类型表 */
	private _serverIdMessageMap = new Map<number, protobufjs.Type>();
	/** 消息类型表 */
	private _keyMessageMap = new Map<string, protobufjs.Type>();
	/** 依赖数据 */
	private _dependent!: {
		/** 封装包 */
		package: { create: any; encode: any; decode: any };
		/** 消息 ID */
		messageIdTab: Record<string | number, string | number>;
	};
	/* ------------------------------- 功能 ------------------------------- */
	/** 编码 */
	encode(data_: any): ArrayBuffer | null {
		const messageIdNum = this._getMessageId(data_.constructor);
		const message = this._keyMessageMap.get(data_.constructor.getTypeUrl(""));

		if (!message) {
			this._log.error("未找到消息路径为" + data_.constructor.getTypeUrl("") + "的已注册消息!");

			return null;
		}

		// 校验数据
		if (this._config.isSendVerify && message.verify(data_)) {
			this._log.error("发送数据校验未通过", message.verify(data_), messageIdNum, data_);

			return null;
		}

		/** 消息数据 */
		const data = this._dependent.package
			.encode(
				this._dependent.package.create({
					id: messageIdNum,
					sequence: data_["__sequenceNum"] ?? this.sequenceNum++,
					data: message.encode(data_).finish(),
				})
			)
			.finish();

		return this._config.encryptionFunc?.(data) ?? data;
	}

	/** 解码 */
	decode(data_: ArrayBuffer): GlobalConfig.Network.ProtoHead | null {
		/** 消息体 */
		const dataUint8List = new Uint8Array(data_);
		const message = this._dependent.package.decode(dataUint8List) as unknown as { id: number; sequence: number; data: Uint8Array };
		const messageClass = this._serverIdMessageMap.get(message.id);

		if (!messageClass) {
			this._log.error("未找到消息号为" + message.id + "的已注册消息!");

			return null;
		}

		const messageData = messageClass.decode(message.data);

		if (this._config.isRecvVerify && messageClass.verify(messageData)) {
			this._log.error("接收包数据校验未通过, 请联系服务端协调!", messageClass.verify(messageData));

			return null;
		}

		messageData["__sequenceNum"] = message.sequence;

		return messageData;
	}

	init(proto_: any, dependent_: typeof this._dependent): void {
		this._dependent = dependent_;
		// 注册消息类型
		this._regisMessage(proto_, this._config.nameStr);
	}

	private _getMessageId(class_: any): number {
		const messageKeyStr: string = class_.getTypeUrl("");
		let messageNameStr = messageKeyStr.slice(messageKeyStr.lastIndexOf(".") + 1);

		if (["C", "S", "B"].some((vStr) => messageNameStr.endsWith(vStr))) {
			messageNameStr = messageNameStr.slice(0, -1);
		}

		const messageIdNum = this._dependent.messageIdTab[messageNameStr];

		return messageIdNum as number;
	}

	/** 注册消息 */
	private _regisMessage(messTab_: any, pathStr_: string): void {
		for (const kStr in messTab_) {
			const mess = messTab_[kStr];

			switch (typeof mess) {
				case "object":
					{
						this._regisMessage(mess, `${pathStr_}.${kStr}`);
					}

					break;
				case "function":
					{
						const messageIdNum = this._getMessageId(mess);
						const messageKeyStr = mess.getTypeUrl("") as string;

						if (messageIdNum !== undefined) {
							this._keyMessageMap.set(messageKeyStr, mess);

							if (messageKeyStr.endsWith("C")) {
								this._clientIdMessageMap.set(messageIdNum, mess);
							} else if (messageKeyStr.endsWith("S") || messageKeyStr.endsWith("B")) {
								this._serverIdMessageMap.set(messageIdNum, mess);
							}
						}
					}

					break;
			}
		}
	}
}

export namespace ToolCodecProtoStaticCommon_ {
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

export default ToolCodecProtoStaticCommon;
