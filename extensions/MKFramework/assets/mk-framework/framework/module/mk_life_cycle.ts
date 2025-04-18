import * as cc from "cc";
import { EDITOR } from "cc/env";
import mk_dynamic_module from "../mk_dynamic_module";
import mk_logger from "../mk_logger";
import mk_monitor from "../mk_monitor";
import mk_status_task from "../task/mk_status_task";
import mk_layer from "./mk_layer";
import mk_tool from "../@private/tool/mk_tool";
import { mk_audio, mk_audio_ } from "../audio/mk_audio_export";
import mk_release, { mk_release_ } from "../mk_release";
import { mk_asset_ } from "../resources/mk_asset";
import global_config from "../../config/global_config";
const ui_manage = mk_dynamic_module.default(import("../mk_ui_manage"));
const { ccclass, property } = cc._decorator;

export namespace _mk_life_cycle {
	/** 运行状态 */
	export enum run_state {
		/** 等待打开 */
		wait_open = 1,
		/** 打开中 */
		opening = 2,
		/** 打开 */
		open = 4,
		/** 关闭中 */
		closing = 8,
		/** 关闭 */
		close = 16,
	}

	/** 递归 open 配置 */
	export interface recursive_open_config {
		/** 递归目标节点 */
		target: cc.Node;
		/** 激活状态 */
		active_b: boolean;
	}

	/** 递归 close 配置 */
	export interface recursive_close_config {
		/** 递归目标节点 */
		target: cc.Node;
		/** 激活状态 */
		active_b: boolean;
		/** 父模块配置 */
		parent_config: close_config;
	}

	/** create 配置 */
	export interface create_config {
		/** 静态模块 */
		static_b: boolean;
	}

	/** open 配置 */
	export interface open_config {
		/** 首次 */
		first_b?: boolean;
		/** 初始化数据 */
		init?: any;
	}

	/** close 配置 */
	export interface close_config {
		/** 首次调用 */
		first_b?: boolean;
		/** 销毁动态子节点 */
		destroy_children_b?: boolean;
		/** 强制关闭（无需等待模块 open 完成） */
		force_b?: boolean;
	}
}

/**
 * 生命周期
 * @noInheritDoc
 * @remarks
 * 用于模块生命周期控制，注意所有生命周期函数 onLoad、open ... 等都会自动执行父类函数再执行子类函数，不必手动 super.xxx 调用
 */
@ccclass
export class mk_life_cycle extends mk_layer implements mk_asset_.type_follow_release_object {
	constructor(...args: any[]) {
		// @ts-ignore
		super(...args);
		if (EDITOR) {
			return;
		}

		// 设置父类自启函数
		mk_tool.func.run_parent_func(this, [
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
			"late_close",
		] as (keyof mk_life_cycle)[]);

		// 设置函数超时警告
		mk_tool.func.timeout_warning<mk_life_cycle>(global_config.view.blocking_warning_time_ms_n, this, [
			"_open",
			"_close",
			"create",
			"init",
			"open",
			"close",
			"late_close",
		] as (keyof mk_life_cycle)[]);
	}

	/* --------------- public --------------- */
	/** 初始化数据 */
	init_data?: any;
	/**
	 * 视图数据
	 * @remarks
	 * 如果是 class 类型数据会在 close 后自动重置，根据 this._reset_data_b 控制
	 */
	data?: any;

	/**
	 * 有效状态
	 * @remarks
	 * 表示模块未在(关闭/关闭中)状态
	 */
	get valid_b(): boolean {
		return (
			this.isValid &&
			(this._state & (_mk_life_cycle.run_state.wait_open | _mk_life_cycle.run_state.opening | _mk_life_cycle.run_state.open)) !== 0
		);
	}

	/** 静态模块 */
	get static_b(): boolean {
		return this._static_b;
	}

	/** 设置模块配置 */
	set config(config_: _mk_life_cycle.create_config) {
		if (config_.static_b !== undefined) {
			this._static_b = config_.static_b;
		}
	}

	/* --------------- protected --------------- */
	/** 静态模块 */
	protected _static_b = true;
	/** onLoad 任务 */
	protected _onload_task = new mk_status_task(false);
	/** create 任务 */
	protected _create_task = new mk_status_task(false);
	/** open 任务 */
	protected _open_task = new mk_status_task(false);
	/** 运行状态 */
	protected _state = _mk_life_cycle.run_state.close;
	/**
	 * 释放管理器
	 * @internal
	 */
	protected _release_manage = new mk_release();
	/**
	 * 重置 data
	 * @remarks
	 * close 后重置 this.data，data 必须为 class 类型
	 */
	protected _reset_data_b = true;

	/** 日志 */
	protected get _log(): mk_logger {
		return this._log2 ?? (this._log2 = new mk_logger(cc.js.getClassName(this)));
	}

	/* --------------- private --------------- */
	/** 日志 */
	private _log2!: mk_logger;
	/** 初始化计数（防止 onLoad 前多次初始化调用多次 init） */
	private _wait_init_n = 0;
	/* ------------------------------- 生命周期 ------------------------------- */
	protected onLoad(): void;
	protected async onLoad(): Promise<void> {
		this._onload_task.finish(true);

		/** 参数表 */
		const attr_tab = cc.CCClass.Attr.getClassAttrs(this["__proto__"].constructor);
		/** 参数键列表 */
		const attr_key_ss = Object.keys(attr_tab);

		// 初始化音频单元
		attr_key_ss.forEach((v_s) => {
			if (!v_s.endsWith("$_$ctor")) {
				return;
			}

			/** 属性名 */
			const name_s = v_s.slice(0, -7);

			// 初始化音频单元
			if (this[name_s] instanceof mk_audio_._unit) {
				mk_audio._add(this[name_s]);
			}
		});

		// 静态模块 create
		if (this.static_b) {
			// 状态更新
			if (this._state !== _mk_life_cycle.run_state.opening) {
				this._state = _mk_life_cycle.run_state.wait_open;
			}
			// 生命周期
			if (this.create) {
				await this.create();
			}

			this._create_task.finish(true);
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
	// eslint-disable-next-line @typescript-eslint/naming-convention
	protected create?(): void;

	/**
	 * 初始化
	 * @param data_ 初始化数据
	 * @remarks
	 * 所有依赖 init_data 初始化的逻辑都应在此进行
	 *
	 * - 静态模块：onLoad 后调用，外部自行调用，常用于更新 item 或者静态模块
	 *
	 * - 动态模块：onLoad 后，open 前且存在初始化数据时被调用
	 */
	// @ts-ignore
	init(data_?: any): void;
	async init(data_?: any): Promise<void> {
		this._wait_init_n++;
		if (!this._onload_task.finish_b) {
			await this._onload_task.task;
		}

		if (--this._wait_init_n !== 0) {
			throw "中断";
		}

		this.init_data = data_;
	}

	/**
	 * 打开
	 * @protected
	 * @remarks
	 * onLoad，init 后执行，在此处执行无需 init_data 支持的模块初始化操作
	 *
	 * open 顺序: 子 -> 父
	 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	protected open?(): void;
	protected async open?(): Promise<void> {
		if (!this._onload_task.finish_b) {
			await this._onload_task.task;
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
	 * 在子模块 close 和 late_close 后执行
	 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	protected late_close?(): void;
	// eslint-disable-next-line @typescript-eslint/naming-convention
	protected async late_close?(): Promise<void> {
		// 取消所有定时器
		this.unscheduleAllCallbacks();
		// 取消数据监听事件
		{
			const task = mk_monitor.clear(this);

			if (task) {
				await task;
			}
		}

		// 释放资源
		await this._release_manage.release_all();
		// 重置数据
		if (this.data && this._reset_data_b) {
			mk_tool.object.reset(this.data, true);
		}
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 驱动生命周期运行（用于动态添加的组件） */
	async drive(): Promise<void> {
		// 递归 open
		return this._open({ first_b: true });
	}

	follow_release<T = mk_release_.type_release_param_type & mk_audio_._unit>(object_: T): T {
		if (!object_) {
			return object_;
		}

		if (!this.node.active) {
			this._log.warn("节点已隐藏，资源可能不会跟随释放");

			return object_;
		}

		// 添加释放对象
		if (object_ instanceof mk_audio_._unit) {
			if (object_.clip) {
				// 如果模块已经关闭则直接释放
				if (this._state === _mk_life_cycle.run_state.close) {
					this._log.debug("在模块关闭后跟随释放资源会被立即释放");
					mk_release.release(object_.clip);
				} else {
					this._release_manage.add(object_.clip);
				}
			}
		} else {
			// 如果模块已经关闭则直接释放
			if (this._state === _mk_life_cycle.run_state.close) {
				this._log.debug("在模块关闭后跟随释放资源会被立即释放");
				mk_release.release(object_ as any);
			} else {
				this._release_manage.add(object_ as any);
			}
		}

		return object_;
	}

	cancel_release<T = mk_release_.type_release_param_type & mk_audio_._unit>(object_: T): void {
		if (!object_) {
			return;
		}

		// 删除释放对象
		if (object_ instanceof mk_audio_._unit) {
			if (object_.clip) {
				this._release_manage.delete(object_.clip);
			}
		} else {
			this._release_manage.delete(object_ as any);
		}

		return;
	}

	/**
	 * 打开模块
	 * @param config_ 关闭配置
	 * @returns
	 * @internal
	 */
	async _open(config_?: _mk_life_cycle.open_config): Promise<void> {
		// 状态安检
		if (this._state & (_mk_life_cycle.run_state.opening | _mk_life_cycle.run_state.open)) {
			return;
		}

		// 状态更新
		this._state = _mk_life_cycle.run_state.opening;

		// create
		if (this.static_b) {
			await this._create_task.task;
		} else {
			if (this.create) {
				await this.create();
			}

			this._create_task.finish(true);
		}

		// 已销毁或已关闭
		if (!this.isValid || this._state !== _mk_life_cycle.run_state.opening) {
			return;
		}

		/** 配置 */
		const config = config_ ?? Object.create(null);

		// 生命周期
		if (config.first_b) {
			await this._recursive_open({
				target: this.node,
				active_b: this.node.active,
			});

			// 已销毁或已关闭
			if (!this.isValid || this._state !== _mk_life_cycle.run_state.opening) {
				return;
			}
		}

		if (config.init !== undefined) {
			await this.init(config.init);

			// 已销毁或已关闭
			if (!this.isValid || this._state !== _mk_life_cycle.run_state.opening) {
				return;
			}
		}

		if (this.open) {
			await this.open();

			// 已销毁或已关闭
			if (!this.isValid || this._state !== _mk_life_cycle.run_state.opening) {
				return;
			}
		}

		// 状态更新
		this._state = _mk_life_cycle.run_state.open;
		this._open_task.finish(true);
	}

	/**
	 * 关闭模块
	 * @param config_ 关闭配置
	 * @returns
	 * @internal
	 */
	async _close(config_?: _mk_life_cycle.close_config): Promise<void> {
		// 状态安检
		if (
			// 允许隐藏的模块执行 close
			this._onload_task.finish_b &&
			// 不在 close 中
			this._state & (_mk_life_cycle.run_state.closing | _mk_life_cycle.run_state.close)
		) {
			return;
		}

		/** 配置参数 */
		const config = config_ ?? (Object.create(null) as _mk_life_cycle.close_config);

		// 等待模块 open 完成
		if (!config.force_b && !this._open_task.finish_b) {
			await this._open_task.task;
		}

		// 已销毁
		if (!this.isValid) {
			return;
		}

		// 状态更新
		this._state = _mk_life_cycle.run_state.closing;

		// 生命周期
		{
			if (this.close) {
				await this.close();

				// 已销毁
				if (!this.isValid) {
					return;
				}
			}

			if (config.first_b) {
				await this._recursive_close({
					target: this.node,
					active_b: this.node.active,
					parent_config: config,
				});

				// 已销毁
				if (!this.isValid) {
					return;
				}
			}

			if (this.late_close) {
				await this.late_close();

				// 已销毁
				if (!this.isValid) {
					return;
				}
			}
		}

		// 状态更新
		this._state = _mk_life_cycle.run_state.close;

		// 销毁自己
		if (!this.static_b && !config.first_b) {
			// 销毁
			if (config.destroy_children_b) {
				this.node.destroy();
			}
			// 回收
			else {
				ui_manage.close(this.node);

				return;
			}
		}

		// 重置状态
		this._open_task?.finish(false);
	}

	/** 递归 open */
	private async _recursive_open(config_: _mk_life_cycle.recursive_open_config): Promise<void> {
		if (!config_.target?.isValid) {
			return;
		}

		const active_b = config_.target.active;

		for (const v of config_.target.children) {
			await this._recursive_open({
				target: v,
				active_b: config_.active_b && active_b,
			});
		}

		if (!config_.target?.isValid) {
			return;
		}

		/** 配置数据 */
		const open_config: _mk_life_cycle.open_config = Object.create(null);
		/** 静态组件 */
		const static_comp_as = config_.target.getComponents(mk_life_cycle).filter((v) => v.static_b);

		for (const v of static_comp_as) {
			// 跳过当前ui组件
			if (v.enabled && v.uuid !== this.uuid && cc.isValid(v, true)) {
				if (active_b && config_.active_b) {
					await v._open(open_config);
				} else {
					v._open(open_config);
				}
			}
		}
	}

	/** 递归 close */
	private async _recursive_close(config_: _mk_life_cycle.recursive_close_config): Promise<void> {
		if (!config_.target?.isValid) {
			return;
		}

		/** 配置数据 */
		const close_config: _mk_life_cycle.close_config = {
			...config_.parent_config,
			first_b: false,
		};

		/** 上级激活状态 */
		const active_b = config_.target.active;
		/** 模块列表 */
		const comp_as = config_.target.getComponents(mk_life_cycle);

		for (const v of comp_as) {
			// 跳过当前ui组件
			if (v.enabled && v.uuid !== this.uuid && cc.isValid(v, true)) {
				if (active_b && config_.active_b) {
					await v._close(close_config);
				} else {
					v._close(close_config);
				}
			}
		}

		// slice 防止中途删除子节点
		for (const v of config_.target.children.slice(0)) {
			await this._recursive_close({
				target: v,
				active_b: config_.active_b && active_b,
				parent_config: close_config,
			});
		}
	}
}

export default mk_life_cycle;
