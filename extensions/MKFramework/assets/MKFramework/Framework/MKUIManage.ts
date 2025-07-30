import * as cc from "cc";
import GlobalEvent from "../Config/GlobalEvent";
import MKInstanceBase from "./MKInstanceBase";
import MKLogger from "./MKLogger";
import MKViewBase from "./Module/MKViewBase";
import MKObjectPool from "./MKObjectPool";
import MKAsset, { MKAsset_ } from "./Resources/MKAsset";
import MKStatusTask from "./Task/MKStatusTask";
import MKTool from "./@Private/Tool/MKTool";
import { MKRelease_ } from "./MKRelease";
import MKEventTarget from "./MKEventTarget";

namespace _MKUIManage {
	/** 模块类型 */
	// @ts-ignore
	export type TypeModule<T extends cc.Constructor<MKViewBase>> = T["prototype"]["typeStr"] | "default";

	/** 注册资源类型 */
	export type TypeRegisSource<T extends cc.Constructor<MKViewBase>> =
		| cc.Prefab
		| string
		| cc.Node
		| (T extends cc.Constructor<MKViewBase> ? Record<TypeModule<T>, cc.Prefab | string | cc.Node> : never);

	export interface EventProtocol {
		/** open 模块成功后 */
		open<T extends MKUIManage_.TypeOpenKey, T2 = T["prototype"]>(key_: T, module_: T2): void;
		/** close 模块成功后 */
		close<T extends MKUIManage_.TypeOpenKey, T2 = T["prototype"]>(key_: T, module_: T2): void;
	}
}

/**
 * 模块管理器
 * @noInheritDoc
 * @remarks
 *
 * - 支持模块(注册/打开/获取/关闭/取消注册)
 *
 * - 内置模块对象池
 *
 * - 模块栈
 *
 * - 全屏 UI 展示优化
 */
export class MKUIManage extends MKInstanceBase {
	constructor() {
		super();

		// 事件监听
		GlobalEvent.on(GlobalEvent.key.restart, this._eventRestart, this);
	}

	/* --------------- public --------------- */
	/** 事件 */
	event = new MKEventTarget<_MKUIManage.EventProtocol>();
	/**
	 * 获取模块注册数据
	 * @remarks
	 * open 未注册模块时会使用此函数获取注册数据自动注册
	 */
	getRegisDataFunc?: <T extends cc.Constructor<MKViewBase>>(key: T) => MKUIManage_.RegisData<T>;
	/* --------------- private --------------- */
	/** 日志 */
	private _log = new MKLogger("MKUIManage");
	/** 模块注册表 */
	private _uiRegisMap = new Map<any, MKUIManage_.RegisData<any>>();
	/**
	 * 模块注册任务表
	 * @remarks
	 * 用于 open 时等待注册
	 */
	private _uiRegisTaskMap = new Map<any, MKStatusTask>();
	/**
	 * 模块加载表
	 * @remarks
	 * 用于检测重复加载
	 */
	private _uiLoadMap = new Map<any, MKStatusTask>();
	/** 模块对象池 */
	private _uiPoolMap = new Map<any, Map<string, MKObjectPool<cc.Node>>>();
	/** 隐藏模块列表长度 */
	private _uiHiddenLengthN = 0;
	/** 模块隐藏集合 */
	private _uiHiddenSet = new Set<MKViewBase>();
	/** 当前展示模块列表 */
	private _uiShowList: MKViewBase[] = [];
	/** 当前模块表 */
	private _uiMap = new Map<any, MKViewBase[]>();
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 注册模块
	 * @param key_ 模块键
	 * @param source_ 模块来源
	 * @param target_ 跟随释放对象
	 * @param config_ 模块配置
	 * @returns
	 */
	async regis<T extends cc.Constructor<MKViewBase>>(
		key_: T,
		source_: _MKUIManage.TypeRegisSource<T>,
		target_: MKRelease_.TypeFollowReleaseObject<MKRelease_.TypeReleaseCallBack> | null,
		config_?: Partial<MKUIManage_.RegisConfig<T>>
	): Promise<void> {
		/** 模块注册任务 */
		let uiRegisTask = this._uiRegisTaskMap.get(key_);

		// 等待模块注册
		if (uiRegisTask) {
			return uiRegisTask.task;
		}

		// 如果已经注册
		if (this._uiRegisMap.has(key_)) {
			return;
		}

		// 跟随对象释放
		target_?.followRelease(async () => {
			await this.unregis(key_);
		});

		/** 注册数据 */
		const regisData = new MKUIManage_.RegisData<T>({
			...config_,
			source: source_,
		});

		uiRegisTask = new MKStatusTask(false);
		// 添加注册任务
		this._uiRegisTaskMap.set(key_, uiRegisTask);
		// 更新注册配置
		this._uiRegisMap.set(key_, regisData);

		/** 节点池 */
		const objectPoolMap = new Map<string, MKObjectPool<cc.Node>>();

		/** 退出回调 */
		const exitCallbackFunc = async (isSuccess: boolean): Promise<void> => {
			if (!isSuccess) {
				await this.unregis(key_);
			}

			// 删除注册任务
			this._uiRegisTaskMap.delete(key_);
			// 完成注册任务
			uiRegisTask!.finish(true);
		};

		/** 来源表 */
		const sourceTab: Record<string, string | cc.Prefab | cc.Node | undefined> = Object.create(null);
		/** 来源失效计数 */
		let sourceInvalidCountNum = 0;

		// 初始化来源表
		{
			// 资源路径/节点
			if (typeof source_ !== "object" || source_ instanceof cc.Node) {
				sourceTab["default"] = source_;
			}
			// 资源表
			else {
				Object.assign(sourceTab, source_);
			}
		}

		// 初始化对象池
		for (const kStr in sourceTab) {
			let source: cc.Prefab | cc.Node | null = null;
			const v = sourceTab[kStr];

			if (!v) {
				continue;
			}

			// 资源路径
			if (typeof v === "string" && regisData.poolInitFillNum > 0) {
				source = await MKAsset.get(v, cc.Prefab, null, regisData.loadConfig);
			}

			// 预制体/节点
			if (typeof v !== "string" && v?.isValid) {
				source = v;
			}

			if (!source?.isValid && !(typeof v === "string" && regisData.poolInitFillNum === 0)) {
				this._log.error(`${kStr} 类型资源失效`, v);
				sourceInvalidCountNum++;
				continue;
			}

			/** 对象池 */
			const objectPool = new MKObjectPool<cc.Node>({
				createFunc: async () => {
					// 不存在预制体开始加载
					if (!source && typeof v === "string") {
						source = (await MKAsset.get(v, cc.Prefab, null, regisData.loadConfig))!;
					}

					if (!source?.isValid) {
						this._log.error(`${kStr} 类型资源失效`, v);

						return null;
					}

					return cc.instantiate(source as any);
				},
				clearFunc: async (objectList) => {
					objectList.forEach((v) => {
						v.destroy();
					});
				},
				destroyFunc: () => {
					// 动态加载的资源手动销毁
					if (typeof v === "string" && source?.isValid) {
						(source as cc.Prefab).decRef();
					}
				},
				maxHoldNum: regisData.poolMaxHoldNum,
				minHoldNum: regisData.poolMinHoldNum,
				initFillNum: regisData.poolInitFillNum,
			});

			// 初始化对象池
			await objectPool.initTask.task;
			objectPoolMap.set(kStr, objectPool);
		}

		// 如果全部类型资源都失效
		if (sourceInvalidCountNum !== 0 && sourceInvalidCountNum === Object.keys(sourceTab).length) {
			return await exitCallbackFunc(false);
		}

		// 设置模块池
		this._uiPoolMap.set(key_, objectPoolMap);

		return await exitCallbackFunc(true);
	}

	/**
	 * 取消注册模块
	 * @remarks
	 * 注意如果你如果在注册时 target_ 参数不为 null，那么模块资源将跟随 target_ 对象释放，
	 * 除非你想提前释放，否则不用手动调用此接口
	 * @param key_ 模块键
	 * @returns
	 */
	async unregis<T extends cc.Constructor<MKViewBase>>(key_: T): Promise<void> {
		/** 模块注册任务 */
		const uiRegisTask = this._uiRegisTaskMap.get(key_);

		// 等待模块注册
		if (uiRegisTask) {
			await uiRegisTask.task;
		}

		// 未注册
		if (!this._uiRegisMap.has(key_)) {
			return;
		}

		// 清理当前 UI
		await this.close(key_, {
			isAll: true,
			isDestroy: true,
		});

		// 清理当前模块表
		this._uiMap.delete(key_);
		// 清理模块加载表
		this._uiLoadMap.delete(key_);
		// 清理注册表
		this._uiRegisMap.delete(key_);
		// 清理节点池
		{
			const pool = this._uiPoolMap.get(key_);

			if (pool) {
				for (const [kStr, v] of pool) {
					await v.destroy();
				}

				this._uiPoolMap.delete(key_);
			}
		}
	}

	/** 获取所有模块 */
	get(): ReadonlyArray<MKViewBase>;
	/**
	 * 获取指定模块
	 * @param key_ 模块键
	 * @param type_ 模块类型
	 */
	get<T extends MKUIManage_.TypeOpenKey, T2 = _MKUIManage.TypeModule<T>, T3 = T["prototype"]>(key_: T, type_?: T2): T3 | null;
	/**
	 * 获取指定模块列表
	 * @param key_ 模块键列表 [type]
	 * @param type_ 模块类型
	 */
	get<T extends MKUIManage_.TypeOpenKey, T2 = _MKUIManage.TypeModule<T>, T3 = T["prototype"]>(key_: T[], type_?: T2): ReadonlyArray<T3>;
	get<T extends MKUIManage_.TypeOpenKey, T2 = _MKUIManage.TypeModule<T>, T3 = T["prototype"]>(
		key_?: T | T[],
		type_?: T2
	): MKViewBase[] | T3 | T3[] | null {
		// 获取所有模块
		if (!key_) {
			return this._uiShowList.filter((v) => v.valid);
		}
		// 获取 指定模块 | 指定模块列表
		else {
			let uiList = this._uiMap.get(Array.isArray(key_) ? key_[0] : key_)?.filter((v) => v.valid);

			// 筛选类型
			if (type_ && uiList) {
				uiList = uiList.filter((v) => v.typeStr === (type_ as any));
			}

			// 获取模块列表
			if (Array.isArray(key_)) {
				return uiList ?? [];
			}
			// 获取模块
			else {
				return uiList?.length ? (uiList[uiList.length - 1] as any) : null;
			}
		}
	}

	/**
	 * 打开模块
	 * @param key_ 模块键，必须经过 {@link regis} 接口注册过
	 * @param config_ 打开配置
	 * @returns
	 */
	async open<T extends MKUIManage_.TypeOpenKey, T2 = T["prototype"]>(key_: T, config_?: MKUIManage_.OpenConfig<T>): Promise<T2 | null> {
		if (!key_) {
			this._log.error("参数错误");

			return null;
		}

		/** 模块注册任务 */
		const uiRegisTask = this._uiRegisTaskMap.get(key_);

		// 等待模块注册
		if (uiRegisTask) {
			await uiRegisTask.task;
		}

		/** 注册数据 */
		let regisData = this._uiRegisMap.get(key_);

		// 自动注册
		if (!regisData && this.getRegisDataFunc) {
			regisData = await this.getRegisDataFunc(key_);

			if (regisData) {
				await this.regis(key_, regisData.source, regisData.target, regisData);
			}
		}

		// 安检
		if (!regisData) {
			this._log.error(cc.js.getClassName(key_), "模块未注册");

			return null;
		}

		config_ = new MKUIManage_.OpenConfig(config_);

		/** 父节点 */
		const parentData = config_.parent !== undefined ? config_.parent : regisData.parent;
		let parent = parentData instanceof Function ? parentData() : parentData;

		if (parent && !parent.isValid) {
			parent = null;
			this._log.warn("父节点无效", key_, parent);
		}

		// 检测重复加载
		{
			let task = this._uiLoadMap.get(key_);

			// 首次加载
			if (!task) {
				this._uiLoadMap.set(key_, (task = new MKStatusTask(false)));
			}
			// 再次加载
			else {
				if (
					// 禁止重复加载
					!regisData.isRepeat &&
					// 存在打开的模块
					(this.get([key_]).length !== 0 ||
						// 正在打开中
						!task.isFinish)
				) {
					this._log.debug("模块重复加载");

					return null;
				}

				task.finish(false);
			}
		}

		// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
		/** 退出回调 */
		const exitCallbackFunc = (isSuccess: boolean): T2 | null => {
			// 更新加载状态
			this._uiLoadMap.get(key_)?.finish(true);

			return isSuccess ? (viewComp as any) : null;
		};

		/** 注册任务 */
		const regisTask = this._uiRegisTaskMap.get(key_);
		/** 视图组件 */
		let viewComp: MKViewBase;

		// 等待模块注册
		if (regisTask && !regisTask.isFinish) {
			await regisTask.task;
		}

		// 加载模块
		{
			/** 模块池 */
			const uiPool = this._uiPoolMap.get(key_)!;
			/** 节点池 */
			const nodePool = uiPool.get(config_.type as any);

			if (!nodePool) {
				this._log.error("模块类型错误");

				return exitCallbackFunc(false);
			}

			const node = await nodePool.get();

			if (!node) {
				this._log.warn("对象池资源为空");

				return exitCallbackFunc(false);
			}

			const comp = node.getComponent(key_) ?? node.addComponent(key_);

			if (!comp) {
				this._log.error("节点未挂载视图组件");
				node.destroy();

				return exitCallbackFunc(false);
			}

			if (!this._uiRegisMap.has(key_)) {
				this._log.warn("已取消注册");
				node.destroy();

				return exitCallbackFunc(false);
			}

			node.active = true;
			viewComp = comp;
		}

		// 更新单独展示
		if (viewComp.isShowAlone) {
			this._uiShowList.slice(this._uiHiddenLengthN, this._uiShowList.length).forEach((v) => {
				if (v.valid && v.node.active) {
					this._uiHiddenSet.add(v);
					v.node.active = false;
				}
			});

			this._uiHiddenLengthN = this._uiShowList.length;
		}

		// 更新管理器数据
		{
			this._uiShowList.push(viewComp);
			let uiList = this._uiMap.get(key_);

			if (!uiList) {
				this._uiMap.set(key_, (uiList = []));
			}

			uiList.push(viewComp);
		}

		// 启动模块
		{
			// 模块配置
			viewComp.config = {
				isStatic: false,
				typeStr: config_.type as string,
			};

			// 加入父节点
			if (parent?.isValid) {
				parent.addChild(viewComp.node);
			}

			// 生命周期
			{
				const openTask = viewComp._open({
					init: config_.init,
					isFirst: true,
				});

				if (parent?.isValid) {
					await openTask;
				}
			}
		}

		// 模块已被关闭
		if (!viewComp.valid) {
			this._log.warn(`模块 ${cc.js.getClassName(viewComp)} 在 open 内被关闭`);

			return exitCallbackFunc(false);
		}

		// 模块已取消注册
		if (!this._uiRegisMap.has(key_)) {
			this._log.warn("已取消注册");
			exitCallbackFunc(false);
			await this.close(viewComp, {
				isAll: true,
				isDestroy: true,
			});

			return null;
		}

		// 事件通知
		this.event.emit(this.event.key.open, key_, viewComp);

		return exitCallbackFunc(true);
	}

	/**
	 * 关闭模块
	 * @param args_ 节点/模块键/模块实例
	 * @param config_ 关闭配置
	 * @returns
	 */
	async close<T extends cc.Constructor<MKViewBase>, T2 extends MKViewBase>(
		args_: cc.Node | T | T2,
		config_?: MKUIManage_.CloseConfig<T>
	): Promise<boolean> {
		if (!args_) {
			this._log.error("参数错误");

			return false;
		}

		const config = new MKUIManage_.CloseConfig(config_);
		let key_: T | undefined;
		let node_: cc.Node | undefined;
		let view_: T2 | undefined;

		// 参数转换
		{
			if (args_ instanceof cc.Node) {
				node_ = args_;
			} else if (args_ instanceof MKViewBase) {
				view_ = args_ as any;
			} else {
				key_ = args_ as T;
			}
		}

		/** 关闭的模块列表 */
		let closeUIList: MKViewBase[];

		// 初始化关闭模块数据
		if (node_) {
			closeUIList = [node_.getComponent(MKViewBase)!].filter((v) => v);
		} else if (view_) {
			closeUIList = [view_];
		} else {
			// 查找模块
			{
				const uiList = this._uiMap.get(key_);

				if (!uiList?.length) {
					return false;
				}

				closeUIList = uiList.slice(0);
			}

			// 筛选关闭的模块
			{
				// 筛选类型
				if (config.type) {
					if (config.isAll) {
						closeUIList = closeUIList.filter((v) => v.typeStr === (config!.type as any));
					} else {
						for (let kNum = closeUIList.length; kNum--; ) {
							if (closeUIList[kNum].typeStr === (config.type as any)) {
								closeUIList = [closeUIList[kNum]];
								break;
							}
						}
					}

					if (!closeUIList.length) {
						return false;
					}
				}

				// 非关闭所有则关闭最后模块
				if (closeUIList.length > 1 && !config.isAll) {
					closeUIList = [closeUIList[closeUIList.length - 1]];
				}
			}
		}

		// 无关闭模块返回
		if (!closeUIList.length) {
			// 关闭节点直接销毁
			if (node_?.isValid && !node_.getComponent(MKViewBase)) {
				node_.removeFromParent();
				node_.destroy();
			}

			return false;
		}

		// 动态模块(视图/数据)更新
		closeUIList.forEach((v) => {
			if (v.isStatic) {
				return;
			}

			// 更新单独展示
			{
				/** 模块列表下标 */
				const uiIndexNum = this._uiShowList.lastIndexOf(v);

				// 恢复隐藏的模块
				if (uiIndexNum === this._uiHiddenLengthN) {
					/** 模块隐藏列表 */
					const uiHiddenList = this._uiShowList.slice(0, this._uiHiddenLengthN);
					/** 新的隐藏模块下标 */
					let newHiddenIndexNum = 0;

					// 查找新的隐藏模块下标
					for (let kNum = uiHiddenList.length; kNum--; ) {
						if (uiHiddenList[kNum].isShowAlone) {
							newHiddenIndexNum = kNum;
							break;
						}
					}

					// 重新展示已经隐藏的模块
					{
						// 激活模块
						this._uiShowList.slice(newHiddenIndexNum, this._uiHiddenLengthN).forEach((v) => {
							// 避免原本 active 为 false 的模块被激活
							if (this._uiHiddenSet.has(v)) {
								v.node.active = true;
								this._uiHiddenSet.delete(v);
							}
						});

						// 更新隐藏模块列表长度
						this._uiHiddenLengthN = newHiddenIndexNum;
					}
				}
				// 关闭了隐藏的模块，更新隐藏模块下标
				else if (uiIndexNum !== -1 && uiIndexNum < this._uiHiddenLengthN) {
					v.node.active = true;
					--this._uiHiddenLengthN;
				}
			}

			// 删除模块数据
			{
				// 删除模块列表数据
				{
					const indexNum = this._uiShowList.indexOf(v);

					if (indexNum !== -1) {
						// 从模块列表移除
						this._uiShowList.splice(indexNum, 1);
					}
				}

				// 删除模块表数据
				{
					const uiList = this._uiMap.get(v.constructor)!;

					// 未纳入管理的模块
					if (!uiList) {
						return;
					}

					const indexNum = uiList.indexOf(v);

					if (indexNum !== -1) {
						// 从模块列表移除
						uiList.splice(indexNum, 1);
					}
				}
			}
		});

		// 生命周期
		for (const v of closeUIList) {
			// 组件已经被销毁
			if (!v.isValid) {
				continue;
			}

			if (cc.director.isPersistRootNode(v.node)) {
				this._log.warn("关闭常驻节点", v);
				cc.director.removePersistRootNode(v.node);
			}

			await v._close?.({
				isFirst: true,
				isDestroyChildren: config.isDestroyChildren,
			});

			// 节点已在生命周期内被销毁
			if (!cc.isValid(v.node, true)) {
				continue;
			}

			// 移除父节点
			v.node.removeFromParent();
			// 事件通知
			this.event.emit(this.event.key.close, v.constructor as any, v);

			// 销毁
			if (config.isDestroy || v.isStatic) {
				v.node.destroy();
			}
			// 回收模块
			else if (v.constructor) {
				/** 模块池 */
				const uiPool = this._uiPoolMap.get(v.constructor);

				if (!uiPool) {
					continue;
				}

				/** 节点池 */
				const nodePool = uiPool?.get(v.typeStr);

				if (!nodePool) {
					this._log.error("回收模块错误，未找到指定节点池类型", v.typeStr);
					continue;
				}

				nodePool.put(v.node);
			}
		}

		return true;
	}

	/* ------------------------------- 全局事件 ------------------------------- */
	private async _eventRestart(): Promise<void> {
		// 等待场景关闭
		await Promise.all(GlobalEvent.request(GlobalEvent.key.waitCloseScene));

		// 释放对象池
		this._uiPoolMap.forEach((v) => {
			v.forEach((v2) => {
				v2.destroy();
			});
		});

		// 重置数据
		MKTool.object.reset(this, true);
	}
}

export namespace MKUIManage_ {
	/** 模块打开键类型 */
	export type TypeOpenKey = cc.Constructor<MKViewBase> & Function;

	/** 关闭ui配置 */
	export class CloseConfig<CT extends cc.Constructor<MKViewBase>> {
		constructor(init_?: CloseConfig<CT>) {
			Object.assign(this, init_);

			if (this.isDestroy && this.isDestroyChildren === undefined) {
				this.isDestroyChildren = true;
			}
		}

		/** 类型 */
		type?: _MKUIManage.TypeModule<CT>;
		/** 关闭全部指定类型的模块 */
		isAll?: boolean;
		/** 销毁节点 */
		isDestroy?: boolean;
		/**
		 * 销毁动态子节点
		 * @defaultValue
		 * isDestroy
		 */
		isDestroyChildren?: boolean;
	}

	/** 打开ui配置 */
	export class OpenConfig<CT extends MKUIManage_.TypeOpenKey> {
		constructor(init_?: OpenConfig<CT>) {
			Object.assign(this, init_);
		}

		/** 初始化数据 */
		init?: CT["prototype"]["initData"];
		/** 类型 */
		type?: _MKUIManage.TypeModule<CT> = "default";
		/** 父节点 */
		parent?: cc.Node | null;
	}

	/** 模块注册配置 */
	export class RegisConfig<CT extends cc.Constructor<MKViewBase>> {
		constructor(init_?: Partial<RegisConfig<CT>>) {
			if (!init_) {
				return;
			}

			Object.assign(this, init_);

			if (this.poolMinHoldNum === undefined) {
				this.poolMinHoldNum = this.isRepeat ? 8 : 1;
			}
		}

		/**
		 * 可重复打开状态
		 * @defaultValue
		 * false
		 */
		isRepeat = false;
		/**
		 * 默认父节点
		 * @defaultValue
		 * Canvas 节点
		 */
		parent: cc.Scene | cc.Node | (() => cc.Node | null) | undefined = (): cc.Node | null => {
			return cc.director.getScene()?.getComponentInChildren(cc.Canvas)?.node ?? null;
		};
		/** 加载配置 */
		loadConfig?: MKAsset_.GetConfig<cc.Prefab>;
		/**
		 * 对象池数量不足时扩充数量
		 * @defaultValue
		 * this.isRepeat ? 8 : 1
		 */
		poolMinHoldNum!: number;
		/**
		 * 对象池最大保留数量
		 * @defaultValue
		 * -1: 不启用
		 */
		poolMaxHoldNum = -1;
		/**
		 * 对象池初始化扩充数量
		 * @defaultValue
		 * 1
		 */
		poolInitFillNum = 1;
	}

	/**
	 * 模块注册数据
	 * @noInheritDoc
	 */
	export class RegisData<CT extends cc.Constructor<MKViewBase>> extends RegisConfig<CT> {
		constructor(init_?: Partial<RegisData<CT>>) {
			super(init_);
			Object.assign(this, init_);
		}

		/** 来源 */
		source!: _MKUIManage.TypeRegisSource<CT>;
		/** 跟随释放对象 */
		target!: MKRelease_.TypeFollowReleaseObject<MKRelease_.TypeReleaseCallBack>;
	}
}

export default MKUIManage.instance();
