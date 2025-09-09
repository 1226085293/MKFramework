import { EDITOR } from "cc/env";
import mkDynamicModule from "../MKDynamicModule";
import MKLogger from "../MKLogger";
/** @weak */
import mkMonitor from "../MKMonitor";
import MKStatusTask from "../Task/MKStatusTask";
import MKLayer from "./MKLayer";
/** @weak */
import { mkAudio, MKAudio_ } from "../Audio/MKAudioExport";
import MKRelease, { MKRelease_ } from "../MKRelease";
import { MKAsset_ } from "../Resources/MKAsset";
import GlobalConfig from "../../Config/GlobalConfig";
import { _decorator, js, CCClass, isValid, Node } from "cc";
import mkToolFunc from "../@Private/Tool/MKToolFunc";
import mkToolObject from "../@Private/Tool/MKToolObject";
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
		/** 强制关闭（无需等待模块 open 完成） */
		isForce?: boolean;
	}
}

/**
 * 生命周期
 * @noInheritDoc
 * @remarks
 * 用于模块生命周期控制，注意所有生命周期函数 onLoad、open ... 等都会自动执行父类函数再执行子类函数，不必手动 super.xxx 调用
 */
@ccclass
export class MKLifeCycle extends MKLayer implements MKAsset_.TypeFollowReleaseObject {
	constructor(...argsList: any[]) {
		// @ts-ignore
		super(...argsList);
		if (EDITOR) {
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
	 * @readonly
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
	/** create 任务 */
	protected _createTask = new MKStatusTask(false);
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
	/* ------------------------------- 生命周期 ------------------------------- */
	protected onLoad(): void;
	protected async onLoad(): Promise<void> {
		this._onLoadTask.finish(true);

		/** 参数表 */
		const attrTab = CCClass.Attr.getClassAttrs(this["__proto__"].constructor);
		/** 参数键列表 */
		const attrKeyStrList = Object.keys(attrTab);

		// @weak-start-include-MKAudioExport
		// 初始化音频单元
		attrKeyStrList.forEach((vStr) => {
			if (!vStr.endsWith("$_$ctor")) {
				return;
			}

			/** 属性名 */
			const nameStr = vStr.slice(0, -7);

			// 初始化音频单元
			if (this[nameStr] instanceof MKAudio_.PrivateUnit) {
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

			// 生命周期
			if (this.create) {
				await this.create();
			}

			this._createTask.finish(true);
		}
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
		if (!this._onLoadTask.isFinish) {
			await this._onLoadTask.task;
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
		if (!this._onLoadTask.isFinish) {
			await this._onLoadTask.task;
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

		// @weak-start-include-MKAudioExport
		// 删除音频单元
		attrKeyStrList.forEach((vStr) => {
			if (!vStr.endsWith("$_$ctor")) {
				return;
			}

			/** 属性名 */
			const nameStr = vStr.slice(0, -7);

			// 清理音频组内的音频单元
			if (this[nameStr] instanceof MKAudio_.PrivateUnit) {
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
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 驱动生命周期运行（用于动态添加的组件） */
	async drive(initData_?: this["initData"]): Promise<void> {
		// 递归 open
		return this._open({ isFirst: true, init: initData_ });
	}

	// @weak-start-content-MKAudioExport
	// @position:/(?<=TypeReleaseParamType)/
	// @import: & MKAudio_.PrivateUnit
	followRelease<T = MKRelease_.TypeReleaseParamType & MKAudio_.PrivateUnit>(object_: T): void {
		// @weak-end
		if (!object_) {
			return;
		}

		if (this.node && !this.node.active) {
			this._log.warn("节点已隐藏，资源可能不会跟随释放");

			return;
		}

		// @weak-start-include-MKAudioExport
		// 添加释放对象
		if (MKAudio_ && object_ instanceof MKAudio_.PrivateUnit) {
			if (object_.clip) {
				// 如果模块已经关闭则直接释放
				if (this._state === _MKLifeCycle.RunState.Close) {
					this._log.debug("在模块关闭后跟随释放资源会被立即释放");
					MKRelease.release(object_.clip);
				} else {
					this._releaseManage.add(object_.clip);
				}
			}
		} else {
			// @weak-end
			// 如果模块已经关闭则直接释放
			if (this._state === _MKLifeCycle.RunState.Close) {
				this._log.debug("在模块关闭后跟随释放资源会被立即释放");
				MKRelease.release(object_ as any);
			} else {
				this._releaseManage.add(object_ as any);
			}
			// @weak-start-include-MKAudioExport
		}
		// @weak-end
	}

	// @weak-start-content-MKAudioExport
	// @import: & MKAudio_.PrivateUnit
	// @position:/(?<=TypeReleaseParamType)/
	cancelRelease<T = MKRelease_.TypeReleaseParamType & MKAudio_.PrivateUnit>(object_: T): void {
		// @weak-end
		if (!object_) {
			return;
		}

		// @weak-start-include-MKAudioExport
		// 删除释放对象
		if (object_ instanceof MKAudio_.PrivateUnit) {
			if (object_.clip) {
				this._releaseManage.delete(object_.clip);
			}
		} else {
			// @weak-end
			this._releaseManage.delete(object_ as any);
			// @weak-start-include-MKAudioExport
		}
		// @weak-end

		return;
	}

	/**
	 * 打开模块
	 * @param config_ 关闭配置
	 * @returns
	 * @internal
	 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	async _open(config_?: _MKLifeCycle.OpenConfig): Promise<void> {
		// 状态安检
		if (this._state & (_MKLifeCycle.RunState.Opening | _MKLifeCycle.RunState.Open)) {
			return;
		}

		// 状态更新
		this._state = _MKLifeCycle.RunState.Opening;

		// create
		if (this.isStatic) {
			await this._createTask.task;
		} else {
			if (this.create) {
				await this.create();
			}

			this._createTask.finish(true);
		}

		// 已销毁或已关闭
		if (!this.isValid || this._state !== _MKLifeCycle.RunState.Opening) {
			return;
		}

		/** 配置 */
		const config: _MKLifeCycle.OpenConfig = config_ ?? Object.create(null);

		// 生命周期
		if (config.isFirst) {
			await this._recursiveOpen({
				target: this.node,
				isActive: this.node.active,
			});

			// 已销毁或已关闭
			if (!this.isValid || this._state !== _MKLifeCycle.RunState.Opening) {
				return;
			}
		}

		if (config.init !== undefined) {
			await this.init(config.init);

			// 已销毁或已关闭
			if (!this.isValid || this._state !== _MKLifeCycle.RunState.Opening) {
				return;
			}
		}

		if (this.open) {
			await this.open();

			// 已销毁或已关闭
			if (!this.isValid || this._state !== _MKLifeCycle.RunState.Opening) {
				return;
			}
		}

		// 状态更新
		this._state = _MKLifeCycle.RunState.Open;
		this._openTask.finish(true);
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
			// 允许隐藏的模块执行 close
			this._onLoadTask.isFinish &&
			// 不在 close 中
			this._state & (_MKLifeCycle.RunState.Closing | _MKLifeCycle.RunState.Close)
		) {
			return;
		}

		/** 配置参数 */
		const config = config_ ?? (Object.create(null) as _MKLifeCycle.CloseConfig);

		// 等待模块 open 完成
		if (!config.isForce && !this._openTask.isFinish) {
			await this._openTask.task;
		}

		// 已销毁
		if (!this.isValid) {
			return;
		}

		// 状态更新
		this._state = _MKLifeCycle.RunState.Closing;

		// 生命周期
		{
			if (this.close) {
				await this.close();

				// 已销毁
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

				// 已销毁
				if (!this.isValid) {
					return;
				}
			}

			if (this.lateClose) {
				await this.lateClose();

				// 已销毁
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
	}

	/** 递归 open */
	private async _recursiveOpen(config_: _MKLifeCycle.RecursiveOpenConfig): Promise<void> {
		if (!config_.target?.isValid) {
			return;
		}

		const isActive = config_.target.active;

		for (const v of config_.target.children) {
			await this._recursiveOpen({
				target: v,
				isActive: config_.isActive && isActive,
			});
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
					await v._open(openConfig);
				} else {
					v._open(openConfig);
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
