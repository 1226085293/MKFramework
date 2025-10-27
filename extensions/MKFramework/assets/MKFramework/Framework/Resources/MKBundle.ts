import MKInstanceBase from "../MKInstanceBase";
import MKLogger, { mkLog } from "../MKLogger";
import MKEventTarget from "../MKEventTarget";
import { EDITOR, PREVIEW } from "cc/env";
import MKStatusTask from "../Task/MKStatusTask";
/** @weak */
import type { MKDataSharer_ } from "../MKDataSharer";
import mkToolFunc from "../@Private/Tool/MKToolFunc";
import MKRelease, { MKRelease_ } from "./MKRelease";
import { game, Game, director, Director, Scene, AssetManager, assetManager, js, Component, NodePool } from "cc";

namespace _MKBundle {
	export interface EventProtocol {
		/** bundle 准备切换事件（准备从此 Bundle 场景切换到其他 Bundle 场景，先于 loadBundle 触发） */
		bundleReadySwitch(event: {
			/** 当前 bundle  */
			currBundleStr: string;
			/** 下个 bundle  */
			nextBundleStr: string;
		});
		/** bundle 切换前事件（从此 Bundle 场景切换到其他 Bundle 场景前） */
		beforeBundleSwitch(event: {
			/** 当前 bundle  */
			currBundleStr: string;
			/** 下个 bundle  */
			nextBundleStr: string;
		}): void;
		/** bundle 切换后事件（从此 Bundle 场景切换到其他 Bundle 场景后） */
		afterBundleSwitch(event: {
			/** 当前 bundle  */
			currBundleStr: string;
			/** 上个 bundle  */
			preBundleStr: string;
		}): void;
		/** 场景切换前事件 */
		beforeSceneSwitch(event: {
			/** 当前场景 */
			currSceneStr: string;
			/** 下个场景 */
			nextSceneStr: string;
		}): void;
		/** 场景切换后事件 */
		afterSceneSwitch(event: {
			/** 当前场景 */
			currSceneStr: string;
			/** 上个场景 */
			preSceneStr: string;
		}): void;
	}
}

/**
 * Bundle 管理器
 * @noInheritDoc
 * @remarks
 *
 * - 封装(加载/预加载)场景为 loadScene
 *
 * - 支持(远程/本地) bundle
 *
 * - 支持 bundle 热更
 *
 * - 封装(bundle/scene)切换事件
 *
 * - 支持 bundle 管理器，用于子游戏管理
 */
export class MKBundle extends MKInstanceBase {
	constructor() {
		super();

		if (EDITOR && !window["cc"].GAME_VIEW) {
			this._setBundleStr("main");
			this._engineInitTask.finish(true);
			this._initTask.finish(true);

			return;
		}

		// 引擎初始化事件
		game.once(Game.EVENT_GAME_INITED, () => {
			this._engineInitTask.finish(true);
		});

		// 模块初始化事件
		director.once(
			Director.EVENT_BEFORE_SCENE_LAUNCH,
			async (scene: Scene) => {
				// 编辑器预览模式会触发两次 EVENT_BEFORE_SCENE_LAUNCH，首次场景数据无效
				if (window["cc"].GAME_VIEW) {
					await new Promise<void>((resolveFunc) => {
						director.once(Director.EVENT_BEFORE_SCENE_LAUNCH, resolveFunc);
					});
				}

				// init
				await this.bundleMap.get("main")?.manage?.init?.();
				// open
				this._setBundleStr("main");
				this._sceneStr = scene.name ?? "";
				this._initTask.finish(true);
			},
			this
		);
	}

	/* --------------- public --------------- */
	/** 事件 */
	event = new MKEventTarget<_MKBundle.EventProtocol>();
	/** bundle列表 */
	bundleMap = new Map<string, MKBundle_.BundleData>();

	/** 当前场景bundle */
	get preBundleStr(): string | undefined {
		return this._preBundleStr;
	}

	/** 当前场景名 */
	get preSceneStr(): string {
		return this._preSceneStr;
	}

	/** 切换场景状态 */
	get isSwitchScene(): boolean {
		return this._isSwitchScene;
	}

	/** 当前场景bundle */
	get bundleStr(): string {
		return this._bundleStr;
	}

	/** 当前场景名 */
	get sceneStr(): string {
		return this._sceneStr;
	}

	/* --------------- private --------------- */
	/** 初始化任务 */
	private _initTask = new MKStatusTask(false);
	/** 引擎初始化任务 */
	private _engineInitTask = new MKStatusTask(false);
	/** 日志 */
	private _log = new MKLogger("MKBundle");
	/** 当前场景bundle */
	private _bundleStr!: string;
	/** 当前场景名 */
	private _sceneStr!: string;
	/** 上个场景bundle */
	private _preBundleStr?: string;
	/** 上个场景名 */
	private _preSceneStr!: string;
	/** 切换场景状态 */
	private _isSwitchScene = false;
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 设置 bundle 数据
	 * @param bundleInfo_ bundle 信息
	 */
	set(bundleInfo_: Omit<MKBundle_.BundleData, "manage">): void {
		let bundleData = this.bundleMap.get(bundleInfo_.bundleStr);

		// 更新旧数据
		if (bundleData) {
			Object.assign(bundleData, bundleInfo_);
		}
		// 添加新数据
		else {
			this.bundleMap.set(bundleInfo_.bundleStr, (bundleData = new MKBundle_.BundleData(bundleInfo_)));
		}
	}

	/**
	 * 加载 bundle
	 * @param args_ bundle 名 | 加载配置
	 * @returns
	 */
	async load(args_: string | MKBundle_.LoadConfig): Promise<AssetManager.Bundle | null> {
		/** 加载配置 */
		const loadConfig = typeof args_ === "string" ? new MKBundle_.LoadConfig({ bundleStr: args_ }) : args_;

		if (!loadConfig?.bundleStr) {
			this._log.error("不存在 bundle 名");

			return null;
		}

		/** bundle 信息 */
		const bundleInfo = this.bundleMap.get(loadConfig.bundleStr!) ?? new MKBundle_.BundleInfo(loadConfig);

		await this._engineInitTask.task;

		/** bundle 资源 */
		const bundle = assetManager.getBundle(bundleInfo.bundleStr);

		if (bundle) {
			loadConfig.progressCallbackFunc?.(1, 1);

			return bundle;
		}

		return new Promise<AssetManager.Bundle | null>((resolveFunc) => {
			if (!bundleInfo) {
				return;
			}

			assetManager.loadBundle(
				bundleInfo.originStr ?? bundleInfo.bundleStr,
				{
					version: bundleInfo.versionStr,
					onFileProgress: loadConfig.progressCallbackFunc,
				},
				(error, bundle) => {
					if (error) {
						this._log.error("bundle加载失败", error);
						resolveFunc(null);

						return;
					}

					// 非远程 bundle 需要模拟进度回调
					if (!bundleInfo.originStr) {
						loadConfig.progressCallbackFunc?.(1, 1);
					}

					// 添加bundle信息
					if (!this.bundleMap.has(bundleInfo.bundleStr)) {
						this.bundleMap.set(bundleInfo.bundleStr, bundleInfo);
					}

					resolveFunc(bundle);
				}
			);
		});
	}

	/**
	 * 切换场景
	 * @param sceneStr_ 场景名
	 * @param config_ 切换配置
	 * @returns
	 */
	async loadScene(sceneStr_: string, config_: MKBundle_.SwitchSceneConfig): Promise<boolean> {
		if (!sceneStr_) {
			this._log.error("场景名错误", sceneStr_);

			return false;
		}

		await this._initTask.task;

		const config = new MKBundle_.SwitchSceneConfig(config_);

		const bundleInfo =
			this.bundleMap.get(config.bundleStr) ??
			new MKBundle_.BundleInfo({
				bundleStr: config.bundleStr,
			});

		if (config.bundleStr !== this._bundleStr && !config.isPreload) {
			await Promise.all(
				this.event.request(this.event.key.bundleReadySwitch, {
					currBundleStr: this._bundleStr,
					nextBundleStr: config.bundleStr,
				})
			);
		}

		const bundle = await this.load(bundleInfo);

		if (!bundle) {
			return false;
		}

		/** 预加载状态 */
		let isPreload = false;

		// 预加载
		if (config.progressCallbackFunc) {
			const progressCallbackFunc = config.progressCallbackFunc;

			isPreload = await new Promise<boolean>((resolveFunc) => {
				bundle?.preloadScene(sceneStr_, progressCallbackFunc, (error: Error | null | undefined) => {
					if (error) {
						this._log.error(error);
					}

					resolveFunc(!error);
				});
			});
		} else {
			isPreload = await new Promise<boolean>((resolveFunc) => {
				bundle?.preloadScene(sceneStr_, (error: Error) => {
					if (error) {
						this._log.error(error);
					}

					resolveFunc(!error);
				});
			});
		}

		if (config.isPreload || !isPreload) {
			return isPreload;
		}

		// 加载场景
		if (!config.isPreload) {
			this._isSwitchScene = true;
			// 切换 bundle 事件
			if (bundle.name !== this._bundleStr) {
				await Promise.all(
					this.event.request(this.event.key.beforeBundleSwitch, {
						currBundleStr: this._bundleStr,
						nextBundleStr: config.bundleStr,
					})
				);
			}

			// 切换场景事件
			await Promise.all(
				this.event.request(this.event.key.beforeSceneSwitch, {
					currSceneStr: this._sceneStr,
					nextSceneStr: sceneStr_,
				})
			);

			return new Promise<boolean>((resolveFunc) => {
				bundle?.loadScene(sceneStr_, async (error, sceneAsset) => {
					if (error) {
						resolveFunc(false);
						this._log.error(error);

						return;
					}

					/** 管理器 */
					const manage = this.bundleMap.get(bundle.name)?.manage;

					// 初始化
					if (manage) {
						await manage.init?.();
					}

					// 运行场景
					director.runScene(sceneAsset, config?.beforeLoadCallbackFunc, (error, scene) => {
						// 更新数据
						if (!error) {
							this._setBundleStr(bundle.name);
							this._preSceneStr = this.sceneStr;
							this._setSceneStr(sceneStr_);
						} else if (manage) {
							manage.close();
						}

						config.unloadedCallbackFunc?.();
						config.launchedCallbackFunc?.(error, scene);
						resolveFunc(!error);
					});
				});
			}).then((isSuccess) => {
				this._isSwitchScene = false;

				return isSuccess;
			});
		}

		return false;
	}

	/**
	 * 重新加载 bundle
	 * @param bundleInfo_ bundle 信息
	 * @returns
	 */
	async reload(bundleInfo_: ConstructorParameters<typeof MKBundle_.ReloadBundleInfo>[0]): Promise<AssetManager.Bundle | null> {
		if (PREVIEW) {
			this._log.error("不支持预览模式重载 bundle");

			return null;
		}

		if (!bundleInfo_.versionStr) {
			this._log.error("不存在版本号");

			return null;
		}

		await this._engineInitTask.task;

		if (this.bundleStr === bundleInfo_.bundleStr) {
			await new Promise<void>((resolveFunc) => {
				this.event.once(this.event.key.bundleReadySwitch, () => resolveFunc(), this);
			});

			director.getScene()!.destroyAllChildren();
			director.getScene()!.removeAllChildren();
		}

		/** bundle 脚本表 */
		const bundleScriptTab: Record<string, any> = {};
		/** js 系统 */
		const systemJs = window["System"];
		/** 脚本缓存表 */
		const scriptCacheTab: Record<string, any> = systemJs[Reflect.ownKeys(systemJs).find((v) => typeof v === "symbol")!];

		// 更新 bundle 信息
		this.set(bundleInfo_);

		// 初始化 bundle 脚本表
		Object.keys(scriptCacheTab).forEach((vStr) => {
			const current = scriptCacheTab[vStr] as { d: any[]; id: string };
			const parent = scriptCacheTab[vStr].p;

			if (!parent?.d || current.id !== parent.id) {
				return;
			}

			const nameStr = parent.id.slice((parent.id as string).lastIndexOf("/") + 1);

			bundleScriptTab[nameStr] = parent;
		});

		const bundleRoot = bundleScriptTab[bundleInfo_.bundleStr]?.d[0];

		// 清理脚本缓存
		{
			if (scriptCacheTab[`virtual:///prerequisite-imports/${bundleInfo_.bundleStr}`]) {
				systemJs.delete(scriptCacheTab[`virtual:///prerequisite-imports/${bundleInfo_.bundleStr}`].id);
				delete scriptCacheTab[`virtual:///prerequisite-imports/${bundleInfo_.bundleStr}`];
			}

			if (bundleRoot) {
				bundleRoot.d.forEach((v: { id: string }) => {
					systemJs.delete(v.id);
				});

				systemJs.delete(bundleRoot.id);
				systemJs.delete(bundleRoot.p.id);
			}
		}

		// 清理 ccclass
		{
			// 清理导出的 ccclass
			if (bundleRoot) {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				bundleRoot.d.forEach((v: { id: string; C: any }) => {
					if (!v.C) {
						return;
					}

					for (const k2Str in v.C) {
						if (js.isChildClassOf(v.C[k2Str], Component)) {
							js.unregisterClass(v.C[k2Str]);
						}
					}
				});
			}

			// 清理名称匹配的 ccclass
			const reg = bundleInfo_.ccclassRegexp ?? new RegExp(`${bundleInfo_.bundleStr}(_|/)`);

			Object.keys((js as any)._registeredClassNames || (js as any)._nameToClass)
				.filter((vStr) => vStr.match(reg) !== null)
				.forEach((vStr) => {
					js.unregisterClass(js.getClassByName(vStr));
				});
		}

		const bundle = assetManager.getBundle(bundleInfo_.bundleStr);

		// 清理 bundle 资源
		if (bundle) {
			if (bundleInfo_.bundleStr !== "main") {
				bundle.releaseAll();
			}

			assetManager.removeBundle(bundle);
		}

		// 更新版本号
		{
			if (!assetManager.downloader.bundleVers) {
				assetManager.downloader.bundleVers = {};
			}

			assetManager.downloader.bundleVers[bundleInfo_.bundleStr] = bundleInfo_.versionStr;
		}

		// 加载 bundle
		return this.load(bundleInfo_);
	}

	/* ------------------------------- get/set ------------------------------- */
	private async _setBundleStr(valueStr_: string): Promise<void> {
		this._preBundleStr = this._bundleStr;
		this._bundleStr = valueStr_;

		// bundle 切换事件通知
		if (this._bundleStr !== this._preBundleStr) {
			// 执行 bundle 生命周期
			{
				/** 上个 bundle */
				const preBundleInfo = this.bundleMap.get(this._preBundleStr);
				/** 当前 bundle */
				const bundleInfo = this.bundleMap.get(this._bundleStr);

				// 销毁上个 bundle
				preBundleInfo?.manage?.close();
				// 加载当前 bundle
				if (bundleInfo?.manage) {
					await bundleInfo.manage.open();
				}
			}

			this.event.emit(this.event.key.afterBundleSwitch, {
				currBundleStr: this._bundleStr,
				preBundleStr: this._preBundleStr,
			});
		}
	}

	private _setSceneStr(valueStr_: string): void {
		this._preSceneStr = this._sceneStr;
		this._sceneStr = valueStr_;

		// 场景切换事件通知
		if (this._sceneStr !== this._preSceneStr) {
			this.event.emit(this.event.key.afterSceneSwitch, {
				currSceneStr: this._sceneStr,
				preSceneStr: this._preSceneStr,
			});
		}
	}
}

export namespace MKBundle_ {
	/** bundle 信息 */
	export class BundleInfo {
		constructor(init_: BundleInfo) {
			Object.assign(this, init_);
		}

		/**
		 * bundle名
		 * @remarks
		 * getBundle 时使用
		 */
		bundleStr!: string;
		/** 版本 */
		versionStr?: string;
		/**
		 * 资源路径
		 * @defaultValue
		 * this.bundleStr
		 * @remarks
		 * loadBundle 时使用，不存在时将使用 bundleStr 进行 loadBundle
		 */
		originStr?: string;
	}

	/**
	 * bundle 数据
	 * @noInheritDoc
	 */
	export class BundleData extends BundleInfo {
		constructor(init_: BundleData) {
			super(init_);
			Object.assign(this, init_);
		}

		/** bundle 管理器 */
		manage?: BundleManageBase;
	}

	/** load 配置 */
	export class LoadConfig extends BundleInfo {
		constructor(init_: LoadConfig) {
			super(init_);
			Object.assign(this, init_);
		}

		/** 加载回调 */
		progressCallbackFunc?: (currentNum: number, totalNum: number) => void;
	}

	/** 重载 bundle 信息 */
	export class ReloadBundleInfo extends LoadConfig {
		constructor(init_: Omit<ReloadBundleInfo, "versionStr" | "originStr"> & Required<Pick<ReloadBundleInfo, "versionStr" | "originStr">>) {
			super(init_);
			Object.assign(this, init_);
		}
		/** 匹配 ccclass 名称正则表达式 */
		ccclassRegexp?: RegExp;
	}

	/** switchScene 配置 */
	export class SwitchSceneConfig {
		constructor(init_?: Partial<SwitchSceneConfig>) {
			Object.assign(this, init_);
		}

		/**
		 * bundle名
		 * @remarks
		 * getBundle 时使用
		 */
		bundleStr!: string;
		/** 预加载 */
		isPreload?: boolean;
		/**
		 * 加载进度回调
		 * @param finishNum 完成数量
		 * @param total 总数量
		 * @param item 当前项目
		 */
		progressCallbackFunc?(finishNum: number, total: number, item?: AssetManager.RequestItem): void;
		/** 加载前调用的函数 */
		beforeLoadCallbackFunc?: Director.OnBeforeLoadScene;
		/** 启动后调用的函数 */
		launchedCallbackFunc?: Director.OnSceneLaunched;
		/** 场景卸载后回调 */
		unloadedCallbackFunc?: Director.OnUnload;
	}

	/**
	 * bundle 管理器基类
	 * @noInheritDoc
	 * @remarks
	 * 注意生命周期函数 init、open、close 会自动执行父类函数再执行子类函数，不必手动 super.xxx 调用
	 */
	export abstract class BundleManageBase implements MKRelease_.TypeFollowReleaseObject {
		constructor() {
			// 添加至 bundle 数据
			setTimeout(async () => {
				if (EDITOR && !window["cc"].GAME_VIEW && this.nameStr === MKBundle.instance().bundleStr) {
					await this.init?.();
					this.open();
				}

				MKBundle.instance().set({
					bundleStr: this.nameStr,
					manage: this,
				} as any);
			}, 0);

			if (EDITOR && !window["cc"].GAME_VIEW) {
				return;
			}

			// 对象池
			this.nodePoolTab = new Proxy(js.createMap(true), {
				get: (target_, key_) => {
					if (!target_[key_]) {
						target_[key_] = new NodePool(key_ as string);
					}

					return target_[key_];
				},
			}) as any;

			// 自动执行生命周期
			mkToolFunc.runParentFunc(this, ["init", "open", "close"]);
		}

		/* --------------- public --------------- */
		/** bundle 名 */
		abstract nameStr: string;
		/** 管理器有效状态 */
		isValid = false;
		/** 节点池表 */
		nodePoolTab!: Record<string, NodePool>;
		/** 事件对象 */
		event?: MKEventTarget<any>;
		/** 数据共享器 */
		// @weak-start-include-MKDataSharer
		data?: MKDataSharer_.Api<any>;
		// @weak-end
		/**
		 * 事件对象列表
		 * @internal
		 */
		eventTargetList: { targetOff?(target: any): any }[] = [];
		/* --------------- protected --------------- */
		/** 释放管理器 */
		protected _releaseManage = new MKRelease();
		/* ------------------------------- 生命周期 ------------------------------- */
		/**
		 * 初始化
		 * @remarks
		 * 从其他 bundle 的场景切换到此 bundle 的场景之前调用
		 */
		init?(): void | Promise<void> {
			if (
				// 编辑器模式下只能运行 main bundle 的生命周期
				(EDITOR && !window["cc"].GAME_VIEW && this.nameStr !== "main") ||
				// bundle 已经加载
				this.isValid
			) {
				throw "中断";
			}

			this.isValid = true;
		}

		/**
		 * 打开回调
		 * @remarks
		 * 从其他 bundle 的场景切换到此 bundle 的场景时调用
		 */
		open(): void | Promise<void> {
			// 编辑器模式下只能运行 main bundle 的生命周期
			if (EDITOR && !window["cc"].GAME_VIEW && this.nameStr !== "main") {
				throw "中断";
			}
		}

		/**
		 * 关闭回调
		 * @remarks
		 * 从此 bundle 的场景切换到其他 bundle 的场景时调用
		 */
		close(): void | Promise<void> {
			if (!this.isValid) {
				mkLog.error("bundle 已经卸载");
				throw "中断";
			}

			if (this.nameStr === "main") {
				throw "中断";
			}

			this.isValid = false;

			// 清理事件
			this.event?.clear();
			this.eventTargetList.splice(0, this.eventTargetList.length).forEach((v) => {
				v.targetOff?.(this);
			});

			// 清理数据
			// @weak-start-include-MKDataSharer
			this.data?.reset();
			// @weak-end

			// 清理对象池
			for (const kStr in this.nodePoolTab) {
				if (Object.prototype.hasOwnProperty.call(this.nodePoolTab, kStr)) {
					this.nodePoolTab[kStr].clear();
					delete this.nodePoolTab[kStr];
				}
			}

			// 释放对象
			this._releaseManage.releaseAll();
		}

		/* ------------------------------- 功能 ------------------------------- */
		followRelease<T = MKRelease_.TypeReleaseParamType>(object_: T): T {
			if (!object_) {
				return object_;
			}

			// 添加释放对象
			this._releaseManage.add(object_ as any);

			// 如果管理器已经关闭则直接释放
			if (!this.isValid) {
				this._releaseManage.releaseAll();
			}

			return object_;
		}

		cancelRelease<T = MKRelease_.TypeReleaseParamType>(object_: T): void {
			if (!object_) {
				return;
			}

			// 添加释放对象
			this._releaseManage.delete(object_ as any);

			return;
		}
	}
}

const mkBundle = MKBundle.instance();

export default mkBundle;

// ...需要在 main bundle reload 时执行 MainBundleManage.close
