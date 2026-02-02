import { EDITOR } from "cc/env";
import mkDynamicModule from "../MKDynamicModule";
import MKLogger from "../MKLogger";
/** @weak */
import mkMonitor from "../MKMonitor";
import MKStatusTask from "../Task/MKStatusTask";
import MKLayer from "./MKLayer";
/** @weak */
import mkAudio from "../Audio/MKAudio";
import MKRelease, { MKRelease_ } from "../Resources/MKRelease";
import GlobalConfig from "../../Config/GlobalConfig";
import { _decorator, js, CCClass, isValid, Node, Asset } from "cc";
import mkToolFunc from "../@Private/Tool/MKToolFunc";
import mkToolObject from "../@Private/Tool/MKToolObject";
import MKAudioUnit from "../Audio/MKAudioUnit";
// @weak-start-include-MKUIManage
const uiManage = mkDynamicModule.default(import("../MKUIManage"));
// @weak-end
const { ccclass, property } = _decorator;

export namespace _MKLifeCycle {
	/** 运行状态 */
	export enum RunState {
		/** 等待打开 */
		WaitOpen = 1,
		/** 打开中 */
		Opening = 2,
		/** 打开 */
		Open = 4,
		/** 关闭中 */
		Closing = 8,
		/** 关闭 */
		Close = 16,
	}

	/** 递归 open 配置 */
	export interface RecursiveOpenConfig {
		/** 递归目标节点 */
		target: Node;
		/** 激活状态 */
		isActive: boolean;
	}

	/** 递归 close 配置 */
	export interface RecursiveCloseConfig {
		/** 递归目标节点 */
		target: Node;
		/** 激活状态 */
		isActive: boolean;
		/** 父模块配置 */
		parentConfig: CloseConfig;
	}

	/** create 配置 */
	export interface CreateConfig {
		/** 静态模块 */
		isStatic: boolean;
	}

	/** open 配置 */
	export interface OpenConfig {
		/** 首次 */
		isFirst?: boolean;
		/** 初始化数据 */
		init?: any;
	}

	/** close 配置 */
	export interface CloseConfig {
		/** 首次调用 */
		isFirst?: boolean;
		/** 销毁动态子节点 */
		isDestroyChildren?: boolean;
	}

	export interface OpenShareData {
		/** 有效计数 */
		validCountNum: number;
		/** 来源组件 uuid */
		originUuidStr: string;
	}

	export interface OpenData {
		/** 当前计数 */
		currentCountNum: number;
		/** 共享数据 */
		shareData: OpenShareData;
	}
}

/**
 * 生命周期
 * @noInheritDoc
 * @remarks
 * 用于模块生命周期控制，注意所有生命周期函数 onLoad、open ... 等都会自动执行父类函数再执行子类函数，不必手动 super.xxx 调用
 */
@ccclass
export class MKLifeCycle extends MKLayer implements MKRelease_.TypeFollowReleaseObject<Asset> {
	constructor(...argsList: any[]) {
		// @ts-ignore
		super(...argsList);
		if (EDITOR && !window["cc"].GAME_VIEW) {
			return;
		}

		// 设置父类自启函数
		mkToolFunc.runParentFunc(this, [
			"onLoad",
			"start",
			"update",
			"lateUpdate",
			"onEnable",
			"onDisable",
			"onDestroy",
			"create",
			"init",
			"open",
			"close",
			"lateClose",
		] as (keyof MKLifeCycle)[]);

		// 设置函数超时警告
		mkToolFunc.timeoutWarning<MKLifeCycle>(GlobalConfig.View.blockingWarningTimeMsNum, this, [
			"_open",
			"_close",
			"create",
			"init",
			"open",
			"close",
			"lateClose",
		] as (keyof MKLifeCycle)[]);
	}

	/* --------------- public --------------- */
	/** 初始化数据 */
	initData?: any;
	/**
	 * 视图数据
	 * @remarks
	 * 如果是 class 类型数据会在 close 后自动重置，根据 this._isResetData 控制
	 */
	data?: any;
	/**
	 * 事件对象列表
	 * @internal
	 * @remarks
	 * 模块关闭后自动清理事件
	 */
	eventTargetList: { targetOff?(target: any): any }[] = [];

	/**
	 * 有效状态
	 * @remarks
	 * 表示模块未在(关闭/关闭中)状态
	 */
	get valid(): boolean {
		return this.isValid && (this._state & (_MKLifeCycle.RunState.WaitOpen | _MKLifeCycle.RunState.Opening | _MKLifeCycle.RunState.Open)) !== 0;
	}

	/** 静态模块 */
	get isStatic(): boolean {
		return this._isStatic;
	}

	/** 设置模块配置 */
	set config(config_: _MKLifeCycle.CreateConfig) {
		if (config_.isStatic !== undefined) {
			this._isStatic = config_.isStatic;
		}
	}

	/* --------------- protected --------------- */
	/** 静态模块 */
	protected _isStatic = true;
	/** onLoad 任务 */
	protected _onLoadTask = new MKStatusTask(false);
	/** start 任务 */
	protected _startTask = new MKStatusTask(false);
	/** 子模块 open 任务 */
	protected _childrenOpenTask = new MKStatusTask(false);
	/** open 任务 */
	protected _openTask = new MKStatusTask(false);
	/** 运行状态 */
	protected _state = _MKLifeCycle.RunState.Close;
	/**
	 * 释放管理器
	 * @internal
	 */
	protected _releaseManage = new MKRelease();
	/**
	 * 重置 data
	 * @remarks
	 * close 后重置 this.data，data 必须为 class 类型
	 */
	protected _isResetData = true;

	/** 日志 */
	protected get _log(): MKLogger {
		return this._log2 ?? (this._log2 = new MKLogger(js.getClassName(this)));
	}

	/* --------------- private --------------- */
	/** 日志 */
	private _log2!: MKLogger;
	/** 初始化计数（防止 onLoad 前多次初始化调用多次 init） */
	private _waitInitNum = 0;
	/** open 信息 */
	private _openData: _MKLifeCycle.OpenData = {
		currentCountNum: 0,
		shareData: {
			validCountNum: 1,
			originUuidStr: "",
		},
	};
	/** 当前任务 */
	private _currentTask: any = null;
	/** create 任务 */
	private _createTask: any = null;
	/** 原始 update 函数 */
	private _originalUpdateFunc: typeof this.update | null = null;
	/** 原始 lateUpdate 函数 */
	private _originalLateUpdateFunc: typeof this.lateUpdate | null = null;
	/* ------------------------------- 生命周期 ------------------------------- */
	protected onLoad(): void {
		/** 参数表 */
		const attrTab = CCClass.Attr.getClassAttrs(this["__proto__"].constructor);
		/** 参数键列表 */
		const attrKeyStrList = Object.keys(attrTab);

		// @weak-start-include-MKAudio
		// 初始化音频单元
		attrKeyStrList.forEach((vStr) => {
			if (!vStr.endsWith("$_$ctor")) {
				return;
			}

			/** 属性名 */
			const nameStr = vStr.slice(0, -7);

			// 初始化音频单元
			if (this[nameStr] instanceof MKAudioUnit) {
				this[nameStr]._followReleaseTarget = this;
				mkAudio._add(this[nameStr]);
			}
		});
		// @weak-end

		// 静态模块 create
		if (this.isStatic) {
			// 状态更新
			if (this._state !== _MKLifeCycle.RunState.Opening) {
				this._state = _MKLifeCycle.RunState.WaitOpen;
			}
		}

		if (this.update) {
			this._originalUpdateFunc = this.update;
			this.update = () => null;
		}

		if (this.lateUpdate) {
			this._originalLateUpdateFunc = this.lateUpdate;
			this.lateUpdate = () => null;
		}

		this._onLoadTask.finish(true);
	}

	protected start(): void {
		this._startTask.finish(true);
	}
	/* ------------------------------- 自定义生命周期 ------------------------------- */
	/**
	 * 创建
	 * @param config_ 创建配置
	 * @remarks
	 * 可在此处初始化视图状态
	 *
	 * - 静态模块：onLoad 时调用
	 *
	 * - 动态模块：addChild 后调用
	 */
	protected create?(): void;

	/**
	 * 初始化
	 * @param data_ 初始化数据
	 * @remarks
	 * 所有依赖 initData 初始化的逻辑都应在此进行
	 *
	 * - 静态模块：onLoad 后调用，外部自行调用，常用于更新 item 或者静态模块
	 *
	 * - 动态模块：onLoad 后，open 前且存在初始化数据时被调用
	 */
	// @ts-ignore
	init(data_?: this["initData"]): void;
	async init(data_?: this["initData"]): Promise<void> {
		this._waitInitNum++;
		if (!this._startTask.isFinish) {
			await this._startTask.task;
		}

		if (--this._waitInitNum !== 0) {
			throw "中断";
		}

		this.initData = data_;
	}

	/**
	 * 打开
	 * @protected
	 * @remarks
	 * onLoad，init 后执行，在此处执行无需 initData 支持的模块初始化操作
	 *
	 * open 顺序: 子 -> 父
	 */
	protected open?(): void;
	protected async open?(): Promise<void> {
		if (!this._startTask.isFinish) {
			await this._startTask.task;
		}

		// 恢复原始 update 函数
		if (this._originalUpdateFunc) {
			this.update = this._originalUpdateFunc;
			this._originalUpdateFunc = null;
		}

		// 恢复原始 lateUpdate 函数
		if (this._originalLateUpdateFunc) {
			this.lateUpdate = this._originalLateUpdateFunc;
			this._originalLateUpdateFunc = null;
		}
	}

	/**
	 * 关闭
	 * @remarks
	 * 模块关闭前调用，可被外部调用（回收模块）
	 *
	 *  close 顺序: 父 -> 子
	 */
	close?(): void;

	/**
	 * 关闭后
	 * @protected
	 * @remarks
	 * 在子模块 close 和 lateClose 后执行
	 */
	protected lateClose?(): void;
	protected async lateClose?(): Promise<void> {
		/** 参数表 */
		const attrTab = CCClass.Attr.getClassAttrs(this["__proto__"].constructor);
		/** 参数键列表 */
		const attrKeyStrList = Object.keys(attrTab);

		// @weak-start-include-MKAudio
		// 删除音频单元
		attrKeyStrList.forEach((vStr) => {
			if (!vStr.endsWith("$_$ctor")) {
				return;
			}

			/** 属性名 */
			const nameStr = vStr.slice(0, -7);

			// 清理音频组内的音频单元
			if (this[nameStr] instanceof MKAudioUnit) {
				mkAudio.getGroup(this[nameStr].type).delAudio(this[nameStr]);
				this[nameStr].groupIdNumList.forEach((v2Num) => {
					mkAudio.getGroup(v2Num).delAudio(this[nameStr]);
				});
			}
		});
		// @weak-end

		// 清理事件
		this.eventTargetList.splice(0, this.eventTargetList.length).forEach((v) => {
			v.targetOff?.(this);
		});

		// 取消所有定时器
		this.unscheduleAllCallbacks();
		// @weak-start-include-MKMonitor
		// 取消数据监听事件
		{
			const task = mkMonitor.clear(this);

			if (task) {
				await task;
			}
		}
		// @weak-end

		// 释放资源
		await this._releaseManage.releaseAll();
		// 重置数据
		if (this.data && this._isResetData) {
			mkToolObject.reset(this.data, true);
		}

		// 重置初始化数据
		this.initData = undefined;
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 驱动生命周期运行（用于动态添加的组件） */
	async drive(initData_?: this["initData"]): Promise<void> {
		// 递归 open
		return this._open({ isFirst: true, init: initData_ });
	}

	followRelease<T = MKRelease_.TypeReleaseParamType>(object_: T): void {
		if (!object_) {
			return;
		}

		if (this.node && !this.node.active) {
			this._log.warn("节点已隐藏，资源可能不会跟随释放");

			return;
		}

		// 如果模块已经关闭则直接释放
		if (this._state === _MKLifeCycle.RunState.Close) {
			this._log.debug("在模块关闭后跟随释放资源会被立即释放");
			MKRelease.release(object_ as any);
		} else {
			// 添加释放对象
			this._releaseManage.add(object_ as any);
		}
	}

	cancelRelease<T = MKRelease_.TypeReleaseParamType>(object_: T): void {
		if (!object_) {
			return;
		}

		// 删除释放对象
		this._releaseManage.delete(object_ as any);

		return;
	}

	/**
	 * 打开模块
	 * @param config_ 关闭配置
	 * @returns
	 * @internal
	 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	async _open(config_?: _MKLifeCycle.OpenConfig, openData_?: _MKLifeCycle.OpenData): Promise<void> {
		try {
			// 状态安检
			if (this._state & (_MKLifeCycle.RunState.Opening | _MKLifeCycle.RunState.Open)) {
				return;
			}

			const currentCountNum = !openData_ ? ++this._openData.currentCountNum : openData_.currentCountNum;

			const checkBreakFunc = (): void => {
				this._currentTask = null;

				// 已销毁或已关闭
				if (!this.isValid || this._state !== _MKLifeCycle.RunState.Opening) {
					throw "中断";
				}

				// 当前任务计数非有效值
				if (currentCountNum !== this._openData.shareData.validCountNum) {
					throw "中断";
				}
			};

			this._openData.currentCountNum = currentCountNum;
			this._openData.shareData = openData_ ? openData_.shareData : this._openData.shareData;

			if (openData_) {
				// 当前任务计数非有效值
				if (currentCountNum !== this._openData.shareData.validCountNum) {
					throw "中断";
				}
			} else {
				this._openData.shareData.originUuidStr = this.uuid;
			}

			// 状态更新
			this._state = _MKLifeCycle.RunState.Opening;

			/** 配置 */
			const config: _MKLifeCycle.OpenConfig = config_ ?? Object.create(null);

			// create
			if (this.isStatic) {
				await this._onLoadTask.task;
				checkBreakFunc();
				if (this.create) {
					this._createTask = this.create();
				}
			} else if (this.create) {
				this._createTask = this.create();
			}

			// 子模块生命周期
			if (config.isFirst) {
				await (this._currentTask = this._recursiveOpen(
					{
						target: this.node,
						isActive: this.node.active,
					},
					{
						currentCountNum: currentCountNum,
						shareData: this._openData.shareData,
					}
				));

				checkBreakFunc();
				this._childrenOpenTask.finish(true);
			}

			// 等待 create 完成
			if (this._createTask instanceof Promise) {
				await this._createTask;
				this._createTask = null;
				checkBreakFunc();
			}

			// init
			if (config.init !== undefined) {
				await (this._currentTask = this.init(config.init));
				checkBreakFunc();
			}

			// open
			if (this.open) {
				await (this._currentTask = this.open());
				checkBreakFunc();
			}

			// 状态更新
			this._state = _MKLifeCycle.RunState.Open;
			this._openTask.finish(true);
		} catch (error) {
			if (error === "中断") {
				return;
			}

			this._log.error(error);
		}
	}

	/**
	 * 关闭模块
	 * @param config_ 关闭配置
	 * @returns
	 * @internal
	 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	async _close(config_?: _MKLifeCycle.CloseConfig): Promise<void> {
		// 状态安检
		if (
			// 已销毁
			!this.isValid ||
			// 不在 close 中
			this._state & (_MKLifeCycle.RunState.Closing | _MKLifeCycle.RunState.Close)
		) {
			return;
		}

		/** 配置参数 */
		const config = config_ ?? (Object.create(null) as _MKLifeCycle.CloseConfig);

		// 状态更新
		this._state = _MKLifeCycle.RunState.Closing;
		// 更新有效标记
		if (this._openData.shareData.originUuidStr === this.uuid) {
			this._openData.shareData.validCountNum++;
		}

		// 等待未完成用户任务
		if (this._currentTask instanceof Promise) {
			await this._currentTask;
			this._currentTask = null;
		}

		// 生命周期
		{
			if (this.close) {
				await this.close();

				if (!this.isValid) {
					return;
				}
			}

			if (config.isFirst) {
				await this._recursiveClose({
					target: this.node,
					isActive: this.node.active,
					parentConfig: config,
				});

				if (!this.isValid) {
					return;
				}
			}

			if (this.lateClose) {
				await this.lateClose();

				if (!this.isValid) {
					return;
				}
			}
		}

		// 状态更新
		this._state = _MKLifeCycle.RunState.Close;

		// 销毁自己
		if (!this.isStatic && !config.isFirst) {
			// 销毁
			if (config.isDestroyChildren) {
				this.node.destroy();
			}
			// 回收
			else {
				// @weak-start-include-MKUIManage
				uiManage.close(this.node);
				// @weak-end

				return;
			}
		}

		// 重置状态
		this._openTask?.finish(false);
		this._childrenOpenTask?.finish(false);
	}

	/** 递归 open */
	private async _recursiveOpen(config_: _MKLifeCycle.RecursiveOpenConfig, openData_: _MKLifeCycle.OpenData): Promise<void> {
		if (openData_.currentCountNum !== openData_.shareData.validCountNum) {
			throw "中断";
		}

		if (!config_.target?.isValid) {
			return;
		}

		const isActive = config_.target.active;

		for (const v of config_.target.children) {
			await this._recursiveOpen(
				{
					target: v,
					isActive: config_.isActive && isActive,
				},
				openData_
			);
		}

		if (!config_.target?.isValid) {
			return;
		}

		/** 配置数据 */
		const openConfig: _MKLifeCycle.OpenConfig = Object.create(null);
		/** 静态组件 */
		const staticCompList = config_.target.getComponents(MKLifeCycle).filter((v) => v.isStatic);

		for (const v of staticCompList) {
			// 跳过当前ui组件
			if (v.enabled && v.uuid !== this.uuid && isValid(v, true)) {
				if (isActive && config_.isActive) {
					await v._open(openConfig, openData_);
				} else {
					v._open(openConfig, openData_);
				}
			}
		}
	}

	/** 递归 close */
	private async _recursiveClose(config_: _MKLifeCycle.RecursiveCloseConfig): Promise<void> {
		if (!config_.target?.isValid) {
			return;
		}

		/** 配置数据 */
		const closeConfig: _MKLifeCycle.CloseConfig = {
			...config_.parentConfig,
			isFirst: false,
		};

		/** 上级激活状态 */
		const isActive = config_.target.active;
		/** 模块列表 */
		const compList = config_.target.getComponents(MKLifeCycle);

		for (const v of compList) {
			// 跳过当前ui组件
			if (v.enabled && v.uuid !== this.uuid && isValid(v, true)) {
				if (isActive && config_.isActive) {
					await v._close(closeConfig);
				} else {
					v._close(closeConfig);
				}
			}
		}

		// slice 防止中途删除子节点
		for (const v of config_.target.children.slice(0)) {
			await this._recursiveClose({
				target: v,
				isActive: config_.isActive && isActive,
				parentConfig: closeConfig,
			});
		}
	}
}

export default MKLifeCycle;
