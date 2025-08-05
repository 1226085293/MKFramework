import { EDITOR } from "cc/env";
import GlobalEvent from "../../Config/GlobalEvent";
import MKInstanceBase from "../MKInstanceBase";
import MKLogger from "../MKLogger";
import mkBundle from "./MKBundle";
import mkGame from "../MKGame";
import GlobalConfig from "../../Config/GlobalConfig";
import { MKRelease_ } from "../MKRelease";
import { Asset, Constructor, SpriteFrame, Texture2D, assetManager, dynamicAtlasManager } from "cc";

namespace _MKAsset {
	/** loadRemote 配置类型 */
	export interface LoadRemoteOptionType extends Record<string, any> {
		uuid?: string;
		url?: string;
		path?: string;
		dir?: string;
		scene?: string;
		ext?: string;
	}

	/** loadAny 配置类型 */
	export interface LoadAnyRequestType extends Record<string, any> {
		uuid?: string;
		url?: string;
		path?: string;
		dir?: string;
		scene?: string;
	}

	/** 释放信息 */
	export class ReleaseInfo {
		constructor(init_?: Partial<ReleaseInfo>) {
			Object.assign(this, init_);
		}

		/** 添加时间 */
		joinTimeMsNum = Date.now();
		/** 资源 */
		asset!: Asset;
	}
}

/**
 * 资源管理器
 * @noInheritDoc
 * @remarks
 *
 * - 统一加载接口为 get、getDir
 *
 * - 支持 EDITOR 环境加载资源
 *
 * - 加载图片无需后缀，通过类型自动添加
 *
 * - 加载路径扩展，例：db://xxx.prefab
 *
 * - 资源默认引用为 2，引用为 1 时将在 GlobalConfig.Resources.cacheLifetimeMsNum 时间后自动释放
 *
 * - 增加强制性资源跟随释放对象
 *
 * - （3.8.6 已修复）修复了释放后立即加载同一资源导致加载的资源是已释放后的问题
 *
 * - （3.8.6 已修复）修复同时加载同一资源多次导致返回的资源对象不一致（对象不一致会导致引用计数不一致）
 */
export class MKAsset extends MKInstanceBase {
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
			const originFunc = Asset.prototype.decRef;

			Asset.prototype.decRef = function (this: Asset, ...argsList: any[]) {
				const result = originFunc.call(this, ...argsList);

				// 跳过未纳入管理资源
				if (!self._joinTimeMsN.has(this.nativeUrl || this._uuid)) {
					return result;
				}

				// 重启期间直接销毁
				if (mkGame.isRestarting) {
					// 等待场景关闭后释放资源
					Promise.all(GlobalEvent.request(GlobalEvent.key.waitCloseScene)).then((v) => {
						MKAsset.instance().release(this);
					});

					return result;
				}

				// 引用为 1 时自动释放
				if (this.refCount === 1) {
					self._assetReleaseMap.set(
						this.nativeUrl || this._uuid,
						new _MKAsset.ReleaseInfo({
							asset: this,
						})
					);

					// 缓存生命时长为 0 立即释放
					if (GlobalConfig.Asset.config.cacheLifetimeMsNum === 0) {
						self._autoReleaseAsset();
					}
				}

				return result;
			};
		}

		// 定时自动释放资源
		if (MKAsset._config.cacheLifetimeMsNum !== 0) {
			this._releaseTimer = setInterval(this._autoReleaseAsset.bind(this), MKAsset._config.cacheLifetimeMsNum);
		}

		// 事件监听
		setTimeout(() => {
			GlobalEvent.once(GlobalEvent.key.restart, this._onRestart, MKAsset.instance());
		}, 0);
	}

	/* --------------- static --------------- */
	/** 全局配置 */
	private static _config = GlobalConfig.Asset.config;

	/* --------------- private --------------- */
	/** 日志 */
	private _log = new MKLogger("MKAsset");
	/** 管理表 */
	private _joinTimeMsN = new Map<string, Asset>();
	/** 释放表 */
	private _assetReleaseMap = new Map<string, _MKAsset.ReleaseInfo>();
	/** 释放定时器 */
	private _releaseTimer: any;
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 获取资源
	 * @param pathStr_ 资源路径
	 * @param type_ 资源类型
	 * @param target_ 跟随释放对象
	 * @param config_ 获取配置
	 * @returns
	 */
	get<T extends Asset>(
		pathStr_: string,
		type_: Constructor<T>,
		target_: MKAsset_.TypeFollowReleaseObject | null,
		config_?: MKAsset_.GetConfig<T>
	): Promise<T | null> {
		/** 获取配置 */
		const getConfig = config_ ?? {};
		/** 远程资源 */
		const isRemote = Boolean(getConfig.remoteOption);

		// 参数补齐
		getConfig.retryNum = getConfig.retryNum ?? GlobalConfig.Asset.config.retryCountOnLoadFailureNum;

		// 参数转换
		{
			// 去除无用信息
			if (pathStr_.startsWith("db://assets/")) {
				pathStr_ = pathStr_.slice(12);

				// 裁剪 pathStr_, 补齐 bundle 名
				if (!EDITOR && pathStr_.includes("/")) {
					const dirStr = pathStr_.slice(0, pathStr_.indexOf("/"));

					pathStr_ = pathStr_.slice(dirStr.length + 1);
					getConfig.bundleStr = getConfig.bundleStr || dirStr;
				}
			}

			// 删除路径后缀
			if (!EDITOR && !isRemote) {
				const indexNum = pathStr_.lastIndexOf(".");

				if (indexNum !== -1) {
					pathStr_ = pathStr_.slice(0, indexNum);
				}
			}

			// 图片类型后缀
			if (!isRemote) {
				const assetType = type_ as any;

				if (assetType === SpriteFrame && !pathStr_.endsWith("/spriteFrame")) {
					pathStr_ += "/spriteFrame";
				} else if (assetType === Texture2D && !pathStr_.endsWith("/texture")) {
					pathStr_ += "/texture";
				}
			}
		}

		// 填充 bundle 名
		if (EDITOR) {
			getConfig.bundleStr = getConfig.bundleStr || "resources";
		} else {
			getConfig.bundleStr = getConfig.bundleStr || (mkBundle.bundleStr !== "main" ? mkBundle.bundleStr : "resources");
		}

		return new Promise<T | null>(async (resolveFunc) => {
			if (!pathStr_) {
				return null;
			}

			/** 完成回调 */
			const completedFunc = async (error: Error | null, asset: T): Promise<void> => {
				if (error) {
					this._log.error(`get ${pathStr_} 错误`, error);
				} else {
					this._log.debug(`get ${pathStr_} 完成`);
				}

				if (EDITOR) {
					getConfig.completedFunc?.(error, asset);
					resolveFunc(asset);

					return;
				}

				if (error) {
					// 加载失败
					if (getConfig.retryNum! <= 0) {
						getConfig.completedFunc?.(error, asset);
						resolveFunc(asset);
					}
					// 重试
					else {
						this._log.warn(`重新加载 get ${pathStr_} 错误，剩余重试次数 ${getConfig.retryNum}`);
						getConfig.retryNum!--;
						resolveFunc(await this.get(pathStr_, type_, target_, getConfig));
					}

					return;
				}

				// 资源初始化
				asset = this._assetInit(asset);
				// 执行回调
				getConfig.completedFunc?.(error, asset);
				// 跟随释放
				target_?.followRelease(asset);
				resolveFunc(asset);
			};

			// 远程
			if (isRemote) {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				assetManager.loadRemote(
					pathStr_,
					{
						// eslint-disable-next-line @typescript-eslint/naming-convention
						onFileProgress: getConfig.progressFunc,
						...(getConfig.remoteOption ?? {}),
					},
					completedFunc
				);
			}
			// 编辑器
			else if (EDITOR) {
				/** 资源配置 */
				let assetConfig: _MKAsset.LoadAnyRequestType;

				// 补全加载配置
				{
					if (!getConfig.remoteOption) {
						getConfig.remoteOption = {};
					}

					assetConfig = getConfig.remoteOption;
					assetConfig.bundle = getConfig.bundleStr;
					assetConfig.type = type_;
					// uuid
					{
						pathStr_ = "db://assets/" + pathStr_;

						// @ts-ignore
						let uuidStr = await Editor.Message.request("asset-db", "query-uuid", pathStr_);

						if (!uuidStr) {
							this._log.error("获取 uuid 失败", pathStr_);
							getConfig.completedFunc?.(new Error("获取 uuid 失败，" + pathStr_), null!);
							resolveFunc(null);

							return;
						}

						// 如果是 spriteFrame 添加后缀
						if ((type_ as any) === SpriteFrame) {
							uuidStr += "@f9941";
						}

						assetConfig.uuid = uuidStr;
					}
				}

				if (getConfig.progressFunc) {
					assetManager.loadAny(assetConfig, getConfig.progressFunc, completedFunc);
				} else {
					assetManager.loadAny(assetConfig, completedFunc);
				}
			}
			// 本地
			else {
				/** bundle 资源 */
				const bundleAsset = await mkBundle.load(getConfig.bundleStr!);

				if (!bundleAsset) {
					this._log.error("未获取到 bundle 信息");
					getConfig.completedFunc?.(new Error("未获取到 bundle 信息，" + getConfig.bundleStr), null!);
					resolveFunc(null);

					return;
				}

				// 获取资源
				const asset = bundleAsset.get(pathStr_, type_);

				// 已加载资源
				if (asset) {
					// 模拟回调
					getConfig.progressFunc?.(1, 1);
					completedFunc(null, asset);
				}
				// 加载资源
				else {
					if (getConfig.progressFunc) {
						bundleAsset.load(pathStr_, type_, getConfig.progressFunc, completedFunc);
					} else {
						bundleAsset.load(pathStr_, type_, completedFunc);
					}
				}
			}
		});
	}

	/**
	 * 获取文件夹资源
	 * @param pathStr_ 资源路径
	 * @param type_ 资源类型
	 * @param target_ 跟随释放对象
	 * @param config_ 获取配置
	 * @returns
	 */
	getDir<T extends Asset>(
		pathStr_: string,
		type_: Constructor<T>,
		target_: MKAsset_.TypeFollowReleaseObject | null,
		config_?: MKAsset_.GetDirConfig<T>
	): Promise<T[] | null> {
		/** 获取配置 */
		const getConfig = config_ ?? {};
		/** 资源配置 */
		let assetConfig: _MKAsset.LoadAnyRequestType;

		// 参数补齐
		getConfig.retryNum = getConfig.retryNum ?? GlobalConfig.Asset.config.retryCountOnLoadFailureNum;

		// 参数转换
		{
			// 去除无用信息
			if (pathStr_.startsWith("db://assets/")) {
				pathStr_ = pathStr_.slice(12);

				// 裁剪 pathStr_, 补齐 bundle 名
				if (!EDITOR) {
					const dirStr = pathStr_.slice(0, pathStr_.indexOf("/"));

					pathStr_ = pathStr_.slice(dirStr.length + 1);
					getConfig.bundleStr = getConfig.bundleStr || dirStr;
				}
			}

			// 补全加载配置
			{
				if (!getConfig.remoteOption) {
					getConfig.remoteOption = {};
				}

				assetConfig = getConfig.remoteOption as any;
				assetConfig.bundle = getConfig.bundleStr || (mkBundle.bundleStr !== "main" ? mkBundle.bundleStr : "resources");
				assetConfig.type = type_;
				assetConfig.dir = pathStr_;
			}
		}

		return new Promise<T[] | null>(async (resolveFunc) => {
			/** 文件夹资源列表 */
			const dirAssetList: T[] = [];

			if (!pathStr_) {
				return dirAssetList;
			}

			/** 完成回调 */
			const completedFunc = (errorList: Error[] | null): void => {
				// 资源初始化
				dirAssetList.forEach((v, kNum) => {
					dirAssetList[kNum] = this._assetInit(v);
				});

				// 执行回调
				getConfig.completedFunc?.(errorList, dirAssetList);

				// 跟随释放
				if (target_?.followRelease) {
					dirAssetList.forEach((v) => {
						target_.followRelease(v);
					});
				}

				resolveFunc(dirAssetList);
			};

			// 编辑器
			if (EDITOR) {
				this._log.error("不支持获取编辑器文件夹资源");
				getConfig.completedFunc?.([new Error("不支持获取编辑器文件夹资源")], null!);
				resolveFunc(null);
			}
			// 本地
			else {
				/** bundle 资源 */
				const bundleAsset = await mkBundle.load(assetConfig.bundle!);

				if (!bundleAsset) {
					this._log.error("未获取到 bundle 信息");
					getConfig.completedFunc?.([new Error("未获取到 bundle 信息，" + assetConfig.bundle)], null!);
					resolveFunc(null);

					return;
				}

				/** 资源信息列表 */
				const assetInfoList = bundleAsset.getDirWithPath(pathStr_, type_);
				/** 错误列表 */
				const errorList: Error[] = [];

				// 加载资源
				for (const [kNum, v] of assetInfoList.entries()) {
					const asset = bundleAsset.get(v.path, type_);

					// 已加载资源
					if (asset) {
						dirAssetList.push(asset);
					}
					// 加载资源
					else {
						const loadFunc = (retryNum = getConfig.retryNum!): Promise<boolean> => {
							return new Promise<boolean>((resolveFunc) => {
								bundleAsset.load(v.path, type_, async (error, asset): Promise<void> => {
									if (error) {
										this._log.error(`get ${v.path} 错误`, error);
										// 加载失败
										if (retryNum === 0) {
											errorList.push(error);
											resolveFunc(false);
										}
										// 重试
										else {
											this._log.warn(`重新加载 get ${v.path} 错误，剩余重试次数 ${retryNum}`);
											resolveFunc(await loadFunc(retryNum - 1));
										}

										return;
									}

									dirAssetList.push(asset);
									resolveFunc(true);
								});
							});
						};

						// 加载资源
						await loadFunc();
					}

					// 模拟回调
					getConfig.progressFunc?.(kNum + 1, assetInfoList.length);
				}

				completedFunc(!errorList.length ? null : errorList);
			}
		});
	}

	/**
	 * 释放资源
	 * @param asset_ 释放的资源
	 */
	release(asset_: Asset | Asset[]): void {
		const assetList: Asset[] = Array.isArray(asset_) ? asset_ : [asset_];

		assetList.forEach((v) => {
			if (!v.isValid) {
				return;
			}

			// 释放动态图集中的资源
			if (dynamicAtlasManager?.enabled) {
				if (v instanceof SpriteFrame) {
					dynamicAtlasManager.deleteAtlasSpriteFrame(v);
				} else if (v instanceof Texture2D) {
					dynamicAtlasManager.deleteAtlasTexture(v);
				}
			}

			// 更新引用计数
			for (let kNum = 0; kNum < v.refCount; kNum++) {
				v.decRef(false);
			}

			// 释放资源，禁止自动释放，否则会出现释放后立即加载当前资源导致加载返回资源是已释放后的
			assetManager.releaseAsset(v);
			// 更新资源管理表
			this._joinTimeMsN.delete(v.nativeUrl || v._uuid);

			this._log.debug("释放资源", v.name, v.nativeUrl, v._uuid);
		});
	}

	/** 资源初始化 */
	private _assetInit<T extends Asset>(asset_: T): T {
		/** 已加载资源 */
		const loadedAsset = this._joinTimeMsN.get(asset_.nativeUrl || asset_._uuid) as T;

		// 如果资源已经加载，则返回的资源是一个新资源，此时引用计数和前一个对象不一致，需要替换
		// 如果资源无效，则加载的资源绕过了框架释放，例如使用 bundle.releaseAll
		if (loadedAsset?.isValid) {
			// 引用计数更新
			loadedAsset.addRef();

			return loadedAsset;
		} else {
			// 引用计数更新
			asset_.addRef();
			asset_.addRef();

			this._joinTimeMsN.set(asset_.nativeUrl || asset_._uuid, asset_);

			return asset_;
		}
	}

	/**
	 * 自动释放资源
	 * @param isForce_ 强制
	 * @returns
	 */
	private _autoReleaseAsset(isForce_ = false): void {
		/** 当前时间 */
		const currentTimeMsNum = Date.now();

		if (isForce_) {
			const assetsList: Asset[] = [];

			this._assetReleaseMap.forEach((v) => {
				// 已经被释放或增加了引用计数
				if (!v.asset.isValid || v.asset.refCount !== 1) {
					return;
				}

				assetsList.push(v.asset);
			});

			// 清理释放表
			this._assetReleaseMap.clear();
			// 释放资源
			this.release(assetsList);
		} else {
			for (const [kStr, v] of this._assetReleaseMap.entries()) {
				// 当前及之后的资源没超过生命时长
				if (currentTimeMsNum - v.joinTimeMsNum < MKAsset._config.cacheLifetimeMsNum) {
					break;
				}

				this._assetReleaseMap.delete(kStr);

				// 已经被释放或增加了引用计数
				if (!v.asset.isValid || v.asset.refCount !== 1) {
					return;
				}

				// 释放资源
				this.release(v.asset);
			}
		}
	}

	/* ------------------------------- 全局事件 ------------------------------- */
	private async _onRestart(): Promise<void> {
		// 等待场景关闭
		await Promise.all(GlobalEvent.request(GlobalEvent.key.waitCloseScene));
		// 立即释放资源
		this._autoReleaseAsset(true);
		// 清理定时器
		clearInterval(this._releaseTimer);
		// 释放 bundle 资源
		assetManager.bundles.forEach((v) => {
			if (v["releaseUnusedAssets"]) {
				v["releaseUnusedAssets"]();
			} else {
				v.releaseAll();
			}
		});
	}
}

export namespace MKAsset_ {
	/** 加载文件夹配置 */
	export interface GetDirConfig<T extends Asset> extends Omit<GetConfig<T>, "completedFunc"> {
		/** 完成回调 */
		completedFunc?: (error: Error[] | null, asset: (T | null)[]) => void;
	}

	/** 加载配置 */
	export interface GetConfig<T extends Asset = Asset> {
		/**
		 * bundle 名
		 * @defaultValue
		 * 编辑器：resources，运行时：mk.bundle.bundleStr(当前场景所属 bundle)
		 */
		bundleStr?: string;
		/** 进度回调 */
		progressFunc?: (
			/** 当前进度 */
			currentNum: number,
			/** 总进度 */
			totalNum: number
		) => void;

		/** 完成回调 */
		completedFunc?: (error: Error | null, asset: T) => void;
		/** 远程配置，存在配置则为远程资源 */
		remoteOption?: _MKAsset.LoadRemoteOptionType;
		/**
		 * 失败重试次数
		 * @defaultValue GlobalConfig.Asset.Config.retryCountOnLoadFailureNum
		 */
		retryNum?: number;
	}

	/** 跟随释放对象 */
	export type TypeFollowReleaseObject = MKRelease_.TypeFollowReleaseObject<Asset>;
}

const mkAsset = MKAsset.instance();

export default mkAsset;

// ...需要增加远程图片释放时释放对应的合图
