import * as cc from "cc";
import mk from "mk";
import protobufjs from "protobufjs/light.js";
import global_config from "../../@config/global_config";

/** 编解码器-protobufjs(动态) */
class codec_proto extends mk.codec_base {
	/**
	 * @param args_ json-module 或者 json 文件夹路径
	 * @param option_ 配置
	 * @returns
	 */
	constructor(args_: string, option_?: Partial<codec_proto_.config>) {
		super();

		/** 路径 */
		let path_s_: string | undefined;
		/** json 模块 */
		let json_module: any;

		// 参数转换
		if (typeof args_ === "string") {
			path_s_ = args_;
		} else {
			json_module = args_;
		}

		this._config = new codec_proto_.config(option_);

		if (!codec_proto._init_b) {
			codec_proto._init_b = true;

			// 修复此版本 bug
			protobufjs.Root["_configure"](protobufjs.Type, undefined, {});

			// 重载 fetch（从路径获取文件内容，json文件不能加载为 cc.TextAsset，所以必须为 txt）
			protobufjs.Root.prototype.fetch = async (path: string, callback_f: protobufjs.FetchCallback) => {
				const asset_info = await mk.asset.get(path, cc.TextAsset);

				callback_f(asset_info ? null! : new Error(), asset_info?.text ?? null!);
			};
		}

		this._init_task = new Promise<void>((resolve_f) => {
			// json 文件
			if (path_s_) {
				mk.asset.get_dir(path_s_, {
					type: cc.JsonAsset,
					completed_f: (error, asset_as) => {
						if (error) {
							mk.log.error("加载proto文件失败, 请检查路径是否正确!");
							return;
						}
						let count_n = 0;

						for (const v of asset_as) {
							protobufjs.load(path_s_ + "/" + v.name, (error, root) => {
								if (!error) {
									this._read_type(this._mess, root);
								} else {
									mk.log.warn(error);
								}
								++count_n;
							});
						}
						resolve_f();
					},
				});
			}
			// json 模块
			else if (json_module) {
				this._read_type(this._mess, json_module);
				resolve_f();
			}
		});
		return;
	}

	/* --------------- static --------------- */
	/** 初始化状态 */
	private static _init_b = false;
	/* --------------- protected --------------- */
	protected _config: codec_proto_.config;
	/* --------------- private --------------- */
	private _mess: Record<string, protobufjs.Root> = Object.create(null);
	private _mess_map = new Map<number, protobufjs.Type>();
	private _init_task: Promise<void>;
	/* -------------------------------segmentation------------------------------- */
	/* ------------------------------- 功能 ------------------------------- */
	/** 编码 */
	async encode(data_: { id: string | number; data: any }): Promise<ArrayBuffer | null> {
		await this._init_task;
		/** 消息类型 */
		let mess: protobufjs.Type | null | undefined;

		if (typeof data_.id === "number") {
			mess = this._mess_map.get(data_.id);
		} else {
			mess = await this._find_mess(data_.id);
		}

		if (!mess) {
			return null;
		}

		// 将消息号加入消息体
		// eslint-disable-next-line no-self-assign
		data_.data[global_config.network.proto_head_key_tab.__id] = mess.fieldsById[1].getOption("default");

		// 校验数据
		if (this._config.send_verify_b && mess.verify(data_.data)) {
			this._log.error("发送数据校验未通过", mess.fullName, data_.data);
			return null;
		}

		/** 消息数据 */
		const data = mess.encode(data_.data).finish();

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
			this._log.error("未找到消息号为 " + id_n + " 的已注册消息!");
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
		if (
			// 非有效消息
			!mess_?.fieldsById ||
			mess_.fieldsById[1] === undefined ||
			// 不存在消息ID
			mess_.fieldsById[1]?.name != global_config.network.proto_head_key_tab.__id ||
			// 不存在消息ID默认值
			mess_.fieldsById[1].getOption("default") === undefined
		) {
			return false;
		}

		/** 相同消息 */
		const same_mess = this._mess_map.get(mess_.fieldsById[1].getOption("default"));

		if (same_mess) {
			mk.log.error(`${same_mess.fullName} 与 ${mess_.fullName} 消息 ID 相同!`);
			return false;
		}
		return true;
	}

	/** 读取消息类型对象 */
	private _read_type(parent: Record<string, protobufjs.Root>, root_: any): void {
		if (!parent || !root_) {
			return;
		}
		if (root_.nested) {
			root_ = root_.nested;
		}
		for (const k_s in root_) {
			if (!parent[k_s]) {
				parent[k_s] = root_[k_s];
				this._read_id(parent[k_s]);
			} else {
				this._read_type(parent[k_s].nested as any, root_[k_s].nested);
			}
		}
	}

	/** 读取消息类型对象ID */
	private _read_id(args_: { nested?: Record<string, any> }): void {
		if (!args_?.nested) {
			return;
		}
		for (const [k_s, v] of Object.entries(args_.nested)) {
			if (this._regis_message_check(v)) {
				this._mess_map.set(v.fieldsById[1].getOption("default"), v);
			} else if (v.nested) {
				this._read_id(v);
			}
		}
	}

	/** 查找消息类型 */
	private async _find_mess(mess_s_: string): Promise<protobufjs.Type | null> {
		// 安检
		const mess_ss = mess_s_.split(`.`);

		if (mess_ss.length < 2) {
			return null;
		}
		// 查找
		let mess: any = this._mess;

		await this._init_task;
		for (let k_n = 0; k_n < mess_ss.length - 1; ++k_n) {
			if (!mess[mess_ss[k_n]] || !(mess = mess[mess_ss[k_n]].nested)) {
				mk.log.error("未找到名为" + mess_s_ + "的已注册消息!");
				return null;
			}
		}
		if (!(mess = mess[mess_ss[mess_ss.length - 1]])) {
			mk.log.error("未找到名为" + mess_s_ + "的已注册消息!");
			return null;
		}
		return mess;
	}
}

export namespace codec_proto_ {
	export class config extends mk.codec_base_.config {
		constructor(init_?: Partial<config>) {
			super();
			Object.assign(this, init_);
		}

		/** 发送校验 */
		send_verify_b = true;
		/** 接收校验 */
		recv_verify_b = true;
	}
}
export default codec_proto;
