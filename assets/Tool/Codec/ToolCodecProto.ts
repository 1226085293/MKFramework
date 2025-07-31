import * as cc from "cc";
import mk from "mk";
import protobufjs from "protobufjs/light.js";
import GlobalConfig from "global_config";

/** 编解码器-protobufjs(动态) */
class ToolCodecProto extends mk.CodecBase {
	/**
	 * @param args_ json-module 或者 json 文件夹路径
	 * @param option_ 配置
	 * @returns
	 */
	constructor(args_: string, option_?: Partial<ToolCodecProto_.Config>) {
		super();

		/** 路径 */
		let pathStr_: string | undefined;
		/** json 模块 */
		let jsonModule: any;

		// 参数转换
		if (typeof args_ === "string") {
			pathStr_ = args_;
		} else {
			jsonModule = args_;
		}

		this._config = new ToolCodecProto_.Config(option_);

		if (!ToolCodecProto._isInit) {
			ToolCodecProto._isInit = true;

			// 修复此版本 bug
			protobufjs.Root["_configure"](protobufjs.Type, undefined, {});

			// 重载 fetch（从路径获取文件内容，json文件不能加载为 cc.TextAsset，所以必须为 txt）
			protobufjs.Root.prototype.fetch = async (path: string, callbackFunc: protobufjs.FetchCallback) => {
				const asset = await mk.asset.get(path, cc.TextAsset, null);

				if (asset) {
					this._waitReleaseAssetList.push(asset);
				}

				callbackFunc(asset ? null! : new Error(), asset?.text ?? null!);
			};
		}

		this._initTask = new Promise<void>((resolveFunc) => {
			// json 文件
			if (pathStr_) {
				mk.asset.getDir(pathStr_, cc.JsonAsset, null, {
					completedFunc: async (error, assetList) => {
						if (error) {
							mk.error("加载proto文件失败, 请检查路径是否正确!");
							resolveFunc();

							return;
						}

						// 等待释放
						this._waitReleaseAssetList.push(...assetList.filter((v) => v !== null));

						const taskList = assetList.map((v) => {
							if (!v) {
								return Promise.resolve();
							}

							return new Promise<void>((resolve2Func) => {
								protobufjs.load(pathStr_ + "/" + v.name, (error, root) => {
									if (!error) {
										this._readType(this._message, root);
									} else {
										mk.error(error);
									}

									resolve2Func();
								});
							});
						});

						await Promise.all(taskList);

						resolveFunc();
					},
				});
			}
			// json 模块
			else if (jsonModule) {
				this._readType(this._message, jsonModule);
				resolveFunc();
			}
		}).then(() => {
			// 删除资源引用
			this._waitReleaseAssetList.forEach((v) => v.decRef());
		});

		return;
	}

	/* --------------- static --------------- */
	/** 初始化状态 */
	private static _isInit = false;
	/* --------------- protected --------------- */
	protected _config: ToolCodecProto_.Config;
	/* --------------- private --------------- */
	/** 消息 ID 键（在 proto 文件中定义的 id 属性名） */
	private readonly _messageIdKeyStr = "__idNum";
	private _message: Record<string, protobufjs.Root> = Object.create(null);
	private _messageMap = new Map<number, protobufjs.Type>();
	private _initTask: Promise<void>;
	private _waitReleaseAssetList: cc.Asset[] = [];
	/* ------------------------------- 功能 ------------------------------- */
	/** 编码 */
	async encode(data_: { id: string | number; data: any }): Promise<ArrayBuffer | null> {
		await this._initTask;
		/** 消息类型 */
		let message: protobufjs.Type | null | undefined;

		if (typeof data_.id === "number") {
			message = this._messageMap.get(data_.id);
		} else {
			message = await this._findMessage(data_.id);
		}

		if (!message) {
			return null;
		}

		// 将消息号加入消息体
		// eslint-disable-next-line no-self-assign
		data_.data[this._messageIdKeyStr] = message.fieldsById[1].getOption("default");

		// 校验数据
		if (this._config.isSendVerify && message.verify(data_.data)) {
			this._log.error("发送数据校验未通过", message.fullName, data_.data);

			return null;
		}

		/** 消息数据 */
		const data = message.encode(data_.data).finish();

		return this._config.encryptionFunc?.(data) ?? data;
	}

	/** 解码 */
	decode(data_: ArrayBuffer): GlobalConfig.Network.ProtoHead | null {
		/** 消息体 */
		const dataUint8List = new Uint8Array(data_);
		/** 消息号 */
		const idNum = protobufjs.Reader.create(dataUint8List).skipType(0).uint32();
		/** 消息 */
		const message = this._messageMap.get(idNum);

		if (!message) {
			this._log.error("未找到消息号为 " + idNum + " 的已注册消息!");

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
		if (
			// 非有效消息
			!mess_?.fieldsById ||
			mess_.fieldsById[1] === undefined ||
			// 不存在消息ID
			mess_.fieldsById[1]?.name != this._messageIdKeyStr ||
			// 不存在消息ID默认值
			mess_.fieldsById[1].getOption("default") === undefined
		) {
			return false;
		}

		/** 相同消息 */
		const sameMessage = this._messageMap.get(mess_.fieldsById[1].getOption("default"));

		if (sameMessage) {
			mk.error(`${sameMessage.fullName} 与 ${mess_.fullName} 消息 ID 相同!`);

			return false;
		}

		return true;
	}

	/** 读取消息类型对象 */
	private _readType(parent: Record<string, protobufjs.Root>, root_: any): void {
		if (!parent || !root_) {
			return;
		}

		if (root_.nested) {
			root_ = root_.nested;
		}

		for (const kStr in root_) {
			if (!parent[kStr]) {
				parent[kStr] = root_[kStr];
				this._readId(parent[kStr]);
			} else {
				this._readType(parent[kStr].nested as any, root_[kStr].nested);
			}
		}
	}

	/** 读取消息类型对象ID */
	private _readId(args_: { nested?: Record<string, any> }): void {
		if (!args_?.nested) {
			return;
		}

		for (const [kStr, v] of Object.entries(args_.nested)) {
			if (this._regisMessageCheck(v)) {
				this._messageMap.set(v.fieldsById[1].getOption("default"), v);
			} else if (v.nested) {
				this._readId(v);
			}
		}
	}

	/** 查找消息类型 */
	private async _findMessage(messStr_: string): Promise<protobufjs.Type | null> {
		// 安检
		const messStrList = messStr_.split(`.`);

		if (messStrList.length < 2) {
			return null;
		}

		// 查找
		let message: any = this._message;

		await this._initTask;
		for (let kNum = 0; kNum < messStrList.length - 1; ++kNum) {
			if (!message[messStrList[kNum]] || !(message = message[messStrList[kNum]].nested)) {
				mk.error("未找到名为" + messStr_ + "的已注册消息!");

				return null;
			}
		}

		if (!(message = message[messStrList[messStrList.length - 1]])) {
			mk.error("未找到名为" + messStr_ + "的已注册消息!");

			return null;
		}

		return message;
	}
}

export namespace ToolCodecProto_ {
	export class Config extends mk.CodecBase_.Config {
		constructor(init_?: Partial<Config>) {
			super();
			Object.assign(this, init_);
		}

		/** 发送校验 */
		isSendVerify = true;
		/** 接收校验 */
		isRecvVerify = true;
	}
}
export default ToolCodecProto;
