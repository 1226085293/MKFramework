import * as cc from "cc";
import { EDITOR } from "cc/env";
import global_event from "../../@config/global_event";
import mk_instance_base from "../mk_instance_base";
import mk_logger from "../mk_logger";
import mk_bundle from "./mk_bundle";
import mk_game from "../mk_game";
import global_config from "../../@config/global_config";

namespace _mk_asset {
	/**
	 * loadRemote 配置类型
	 * - 3.6: cc.__private._cocos_core_asset_manager_shared__IRemoteOptions
	 * - 3.8: cc.__private._cocos_asset_asset_manager_shared__IRequest;
	 */
	export type load_remote_option_type = cc.__private._cocos_asset_asset_manager_shared__IRequest;
	/**
	 * loadAny 请求类型
	 * - 3.6: cc.__private._cocos_core_asset_manager_shared__IRequest
	 * - 3.8: cc.__private._cocos_asset_asset_manager_shared__IRequest;
	 */
	export type load_any_request_type = cc.__private._cocos_asset_asset_manager_shared__IRequest;

	/** 全局配置 */
	export interface global_config {
		/** 缓存生命时长 */
		cache_lifetime_ms_n: number;
	}

	/** 释放信息 */
	export class release_info {
		constructor(init_?: Partial<release_info>) {
			Object.assign(this, init_);
		}

		/** 添加时间 */
		join_time_ms_n = Date.now();
		/** 资源 */
		asset!: cc.Asset;
	}
}

/**
 * 资源管理器
 * - 资源默认引用为 2，引用为 1 时将在 global_config.resources.cache_lifetime_ms_n 时间后自动释放
 * - 统一加载接口为 get、get_dir
 */
class mk_asset extends mk_instance_base {
	constructor() {
		super();

		if (EDITOR) {
			return;
		}

		// 重载 decRef 函数
		{
			/** 当前对象 */
			// eslint-disable-next-line @typescript-eslint/no-this-alias
			const self = this;
			/** decRef 原函数 */
			const origin_f = cc.Asset.prototype.decRef;

			cc.Asset.prototype.decRef = function (this: cc.Asset, ...args_as: any[]) {
				const result = origin_f.call(this, ...args_as);

				// 跳过外部资源
				if (!self._asset_manage_map.has(this.nativeUrl || this._uuid)) {
					return result;
				}

				// 重启期间直接销毁
				if (mk_game.restarting_b) {
					// 等待场景关闭后释放资源
					Promise.all(global_event.request(global_event.key.wait_close_scene)).then((v) => {
						mk_asset.instance().release(this);
					});

					return result;
				}

				// 加载后默认引用加 2 防止资源自动释放
				if (this.refCount === 1) {
					self._asset_release_map.set(
						this.nativeUrl || this._uuid,
						new _mk_asset.release_info({
							asset: this,
						})
					);
				}

				return result;
			};
		}

		// 定时自动释放资源
		this._release_timer = setInterval(this._auto_release_asset.bind(this), mk_asset.config.cache_lifetime_ms_n);

		// 事件监听
		setTimeout(() => {
			global_event.once(global_event.key.restart, this._event_restart, mk_asset.instance());
		}, 0);
	}

	/* --------------- static --------------- */
	/** 全局配置 */
	static config: _mk_asset.global_config = {
		cache_lifetime_ms_n: global_config.asset.cache_lifetime_ms_n,
	};

	/* --------------- private --------------- */
	/** 日志 */
	private _log = new mk_logger("cache");
	/** 管理表 */
	private _asset_manage_map = new Map<string, cc.Asset>();
	/** 释放表 */
	private _asset_release_map = new Map<string, _mk_asset.release_info>();
	/** 释放定时器 */
	private _release_timer: any;
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 获取资源
	 * @param path_s_ 资源路径
	 * @param args2_ 资源类型 | 获取配置
	 * @returns
	 */
	async get<T extends cc.Asset>(path_s_: string, args2_: cc.Constructor<T> | mk_asset_.get_config<T>): Promise<T | null> {
		/** 获取配置 */
		let get_config = args2_ as mk_asset_.get_config<T>;
		/** 远程资源 */
		const remote_b = Boolean(get_config.remote_option);

		// 参数转换
		{
			// 转换配置为对象
			if (typeof args2_ === "function") {
				get_config = {
					type: args2_,
				};
			}

			// 去除无用信息
			if (path_s_.startsWith("db://assets/")) {
				path_s_ = path_s_.slice(12);

				// 补齐 bundle
				if (!EDITOR) {
					get_config.bundle_s = path_s_.slice(0, path_s_.indexOf("/"));
					path_s_ = path_s_.slice(get_config.bundle_s.length + 1);
				}
			}

			// 图片类型后缀
			if (!remote_b) {
				const asset_type = get_config.type as any as typeof cc.Asset;

				if (asset_type === cc.SpriteFrame && !path_s_.endsWith("/spriteFrame")) {
					path_s_ += "/spriteFrame";
				} else if (asset_type === cc.Texture2D && !path_s_.endsWith("/texture")) {
					path_s_ += "/texture";
				}
			}

			// 删除路径后缀
			if (!EDITOR && !remote_b) {
				const index_n = path_s_.lastIndexOf(".");

				if (index_n !== -1) {
					path_s_ = path_s_.slice(0, index_n);
				}
			}
		}

		return new Promise<T | null>(async (resolve_f) => {
			/** 完成回调 */
			const completed_f = (error: Error | null, asset: T): void => {
				if (error) {
					this._log.error(`加载 ${path_s_} 错误`, error);
				}

				if (error || EDITOR) {
					get_config.completed_f?.(error, asset);
					resolve_f(asset);

					return;
				}

				// 资源初始化
				asset = this._asset_init(asset);

				// 执行回调
				get_config.completed_f?.(error, asset);
				resolve_f(asset);
			};

			// 远程
			if (remote_b) {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				cc.assetManager.loadRemote(path_s_, { onFileProgress: get_config.progress_f, ...(get_config.remote_option ?? {}) }, completed_f);
			}
			// 编辑器
			else if (EDITOR) {
				/** 资源配置 */
				let asset_config: _mk_asset.load_any_request_type;

				// 补全加载配置
				{
					if (!get_config.remote_option) {
						get_config.remote_option = {};
					}

					asset_config = get_config.remote_option as any;
					asset_config.bundle = get_config.bundle_s ?? "resources";
					asset_config.type = get_config.type as any;
					// uuid
					{
						path_s_ = "db://assets/" + path_s_;

						let uuid_s = await Editor.Message.request("asset-db", "query-uuid", path_s_);

						if (!uuid_s) {
							this._log.error("获取 uuid 失败", path_s_);
							get_config.completed_f?.(new Error("获取 uuid 失败，" + path_s_), null!);
							resolve_f(null);

							return;
						}

						// 如果是 spriteFrame 添加后缀
						if ((get_config.type as any) === cc.SpriteFrame) {
							uuid_s += "@f9941";
						}

						asset_config.uuid = uuid_s;
					}
				}

				if (get_config.progress_f) {
					cc.assetManager.loadAny(asset_config, get_config.progress_f, completed_f);
				} else {
					cc.assetManager.loadAny(asset_config, completed_f);
				}
			}
			// 本地
			else {
				/** bundle 资源 */
				const bundle_asset = await mk_bundle.load(get_config.bundle_s!);

				if (!bundle_asset) {
					this._log.error("未获取到 bundle 信息");
					get_config.completed_f?.(new Error("未获取到 bundle 信息，" + get_config.bundle_s), null!);
					resolve_f(null);

					return;
				}

				// 获取资源
				const asset = bundle_asset.get(path_s_, get_config.type);

				// 已加载资源
				if (asset) {
					// 模拟回调
					get_config.progress_f?.(1, 1);
					completed_f(null, asset);
				}
				// 加载资源
				else {
					if (get_config.progress_f) {
						bundle_asset.load(path_s_, get_config.type, get_config.progress_f, completed_f);
					} else {
						bundle_asset.load(path_s_, get_config.type, completed_f);
					}
				}
			}
		});
	}

	/** 获取文件夹资源 */
	async get_dir<T extends cc.Asset>(path_s_: string, args2_: cc.Constructor<T> | mk_asset_.get_dir_config<T>): Promise<T[] | null> {
		/** 获取配置 */
		let get_config = args2_ as mk_asset_.get_dir_config<T>;
		/** 资源配置 */
		let asset_config: _mk_asset.load_any_request_type;

		// 参数转换
		{
			// 去除无用信息
			if (path_s_.startsWith("db://assets/")) {
				path_s_ = path_s_.slice(12);
			}

			// 转换配置为对象
			if (typeof args2_ === "function") {
				get_config = {
					type: args2_,
				};
			}

			// 补全加载配置
			{
				if (!get_config.remote_option) {
					get_config.remote_option = {};
				}

				asset_config = get_config.remote_option as any;
				asset_config.bundle = get_config.bundle_s ?? "resources";
				asset_config.type = get_config.type as any;
				asset_config.dir = path_s_;
			}
		}

		return new Promise<T[] | null>(async (resolve_f) => {
			/** 文件夹资源列表 */
			const dir_asset_as: T[] = [];

			/** 完成回调 */
			const completed_f = (error: Error | null): void => {
				if (error) {
					this._log.error(`加载 ${path_s_} 错误`, error);

					// 执行回调
					get_config.completed_f?.(error, []);
					resolve_f(null);
				}

				// 资源初始化
				dir_asset_as.forEach((v, k_n) => {
					dir_asset_as[k_n] = this._asset_init(v);
				});

				// 执行回调
				// let dir_asset_as = [];
				get_config.completed_f?.(error, dir_asset_as);
				resolve_f(dir_asset_as);
			};

			// 编辑器
			if (EDITOR) {
				this._log.error("不支持获取编辑器文件夹资源");
				get_config.completed_f?.(new Error("不支持获取编辑器文件夹资源"), null!);
				resolve_f(null);
			}
			// 本地
			else {
				/** bundle 资源 */
				const bundle_asset = await mk_bundle.load(asset_config.bundle!);

				if (!bundle_asset) {
					this._log.error("未获取到 bundle 信息");
					get_config.completed_f?.(new Error("未获取到 bundle 信息，" + asset_config.bundle), null!);
					resolve_f(null);

					return;
				}

				/** 资源信息列表 */
				const asset_info_as = bundle_asset.getDirWithPath(path_s_, get_config.type);

				// 加载资源
				for (const [k_n, v] of asset_info_as.entries()) {
					const asset = bundle_asset.get(v.path, get_config.type);

					// 已加载资源
					if (asset) {
						dir_asset_as.push(asset);
					}
					// 加载资源
					else {
						/** 成功状态 */
						const success_b = await new Promise<boolean>((resolve_f) => {
							bundle_asset.load(path_s_, get_config.type, (error, asset): void => {
								if (error) {
									completed_f(error);

									return;
								}

								dir_asset_as.push(asset);
								resolve_f(!error);
							});
						});

						if (!success_b) {
							return;
						}
					}

					// 模拟回调
					get_config.progress_f?.(k_n + 1, asset_info_as.length);
				}

				completed_f(null);
			}
		});
	}

	/**
	 * 释放资源
	 * @param asset_ 释放的资源
	 */
	release(asset_: cc.Asset | cc.Asset[]): void {
		const asset_as: cc.Asset[] = Array.isArray(asset_) ? asset_ : [asset_];

		asset_as.forEach((v) => {
			if (!v.isValid) {
				return;
			}

			// 释放动态图集中的资源
			if (cc.dynamicAtlasManager?.enabled) {
				if (v instanceof cc.SpriteFrame) {
					cc.dynamicAtlasManager.deleteAtlasSpriteFrame(v);
				} else if (v instanceof cc.Texture2D) {
					cc.dynamicAtlasManager.deleteAtlasTexture(v);
				}
			}

			// 更新引用计数
			for (let k_n = 0; k_n < v.refCount; k_n++) {
				v.decRef(false);
			}

			// 释放资源，禁止自动释放，否则会出现释放后立即加载当前资源导致加载返回资源是已释放后的
			cc.assetManager.releaseAsset(v);
			// 更新资源管理表
			this._asset_manage_map.delete(v.nativeUrl || v._uuid);

			this._log.debug("释放资源", v.name, v.nativeUrl, v._uuid);
		});
	}

	/** 资源初始化 */
	private _asset_init<T extends cc.Asset>(asset_: T): T {
		/** 已加载资源 */
		const loaded_asset = this._asset_manage_map.get(asset_.nativeUrl || asset_._uuid) as T;

		// 如果资源已经加载，则返回的资源是一个新资源，此时引用计数和前一个对象不一致，需要替换
		if (loaded_asset) {
			// 引用计数更新
			loaded_asset.addRef();

			return loaded_asset;
		} else {
			// 引用计数更新
			asset_.addRef();
			asset_.addRef();

			this._asset_manage_map.set(asset_.nativeUrl || asset_._uuid, asset_);

			return asset_;
		}
	}

	/**
	 * 自动释放资源
	 * @param force_b_ 强制
	 * @returns
	 */
	private _auto_release_asset(force_b_ = false): void {
		/** 当前时间 */
		const current_time_ms_n = Date.now();

		for (const [k_s, v] of this._asset_release_map.entries()) {
			// 当前及之后的资源没超过生命时长
			if (!force_b_ && current_time_ms_n - v.join_time_ms_n < mk_asset.config.cache_lifetime_ms_n) {
				break;
			}

			this._asset_release_map.delete(k_s);

			// 已经被释放或增加了引用计数
			if (!v.asset.isValid || v.asset.refCount !== 1) {
				return;
			}

			// 释放资源
			this.release(v.asset);
		}
	}

	/* ------------------------------- 全局事件 ------------------------------- */
	private async _event_restart(): Promise<void> {
		// 等待场景关闭
		await Promise.all(global_event.request(global_event.key.wait_close_scene));
		// 立即释放资源
		this._auto_release_asset(true);
		// 清理定时器
		clearInterval(this._release_timer);
		// 释放 bundle 资源
		cc.assetManager.bundles.forEach((v) => {
			if (v["releaseUnusedAssets"]) {
				v["releaseUnusedAssets"]();
			} else {
				v.releaseAll();
			}
		});
	}
}

export namespace mk_asset_ {
	/** 加载文件夹配置 */
	export type get_dir_config<T extends cc.Asset> = get_config<T, T[]>;

	/** 加载配置 */
	export interface get_config<T extends cc.Asset = cc.Asset, T2 = T> {
		/** 资源类型 */
		type: cc.Constructor<T>;
		/**
		 * bundle 名
		 * @defaultValue
		 * resources
		 */
		bundle_s?: string;
		/** 进度回调 */
		progress_f?: (
			/** 当前进度 */
			current_n: number,
			/** 总进度 */
			total_n: number
		) => void;

		/** 完成回调 */
		completed_f?: (error: Error | null, asset: T2) => void;
		/** 远程配置，存在配置则为远程资源 */
		remote_option?: _mk_asset.load_remote_option_type;
	}
}

export default mk_asset.instance();
