import * as cc from "cc";
import { EDITOR } from "cc/env";
import global_config from "../../@config/global_config";
import mk_dynamic_module from "../mk_dynamic_module";
import mk_logger from "../mk_logger";
import mk_monitor from "../mk_monitor";
import mk_status_task from "../task/mk_status_task";
import mk_layer from "./mk_layer";
import mk_tool from "../@private/tool/mk_tool";
import { mk_audio, mk_audio_ } from "../audio/mk_audio_export";
import mk_release, { mk_release_ } from "../mk_release";
import { mk_asset_ } from "../resources/mk_asset";
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
		/** 销毁动态子节点 */
		destroy_children_b?: boolean;
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
	 * 事件对象列表
	 * @readonly
	 * @remarks
	 * 模块关闭后自动清理事件
	 */
	event_target_as: { targetOff(target: any): any }[] | { target_off(target: any): any }[] = [];

	/**
	 * 有效状态
	 * @remarks
	 * 表示模块未在(关闭/关闭中)状态
	 */
	get valid_b(): boolean {
		return (
			this.isValid &&
			mk_tool.byte.get_bit(
				this._state,
				_mk_life_cycle.run_state.wait_open | _mk_life_cycle.run_state.opening | _mk_life_cycle.run_state.open
			) !== 0
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
	/** load任务 */
	protected _load_task = new mk_status_task(false);
	/** open任务 */
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
	/* ------------------------------- 生命周期 ------------------------------- */
	protected onLoad(): void {
		this._load_task.finish(true);

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
			this._state = _mk_life_cycle.run_state.wait_open;
			// 生命周期
			this.create?.();
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
	protected create?(): void | Promise<void>;

	/**
	 * 初始化
	 * @param data_ 初始化数据
	 * @remarks
	 * 所有依赖 init_data 初始化的逻辑都应在此进行
	 *
	 * - 静态模块：外部自行调用，常用于更新 item 或者静态模块，会等待模块 onLoad
	 *
	 * - 动态模块：onLoad 后，open 前调用
	 */
	// @ts-ignore
	init(data_?: any): void | Promise<void>;
	async init(data_?: any): Promise<void> {
		if (!this._load_task.finish_b) {
			await this._load_task.task;
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
	protected open?(): void | Promise<void>;
	protected async open?(): Promise<void> {
		if (!this._load_task.finish_b) {
			await this._load_task.task;
		}
	}

	/**
	 * 关闭
	 * @remarks
	 * 模块关闭前调用，可被外部调用（回收模块）
	 *
	 *  close 顺序: 父 -> 子
	 */
	close?(): void | Promise<void>;

	/**
	 * 关闭后
	 * @protected
	 * @remarks
	 * 在子模块 close 和 late_close 后执行
	 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	protected late_close?(): void | Promise<void> {
		// 清理事件
		this.event_target_as.splice(0, this.event_target_as.length).forEach((v) => {
			if (v.targetOff) {
				v.targetOff(this);
			} else {
				v.target_off(this);
			}
		});

		// 取消所有定时器
		this.unscheduleAllCallbacks();
		// 取消数据监听事件
		mk_monitor.clear(this);
		// 释放资源
		this._release_manage.release_all();
		// 重置数据
		if (this.data && this._reset_data_b) {
			mk_tool.object.reset(this.data, true);
		}
	}

	/* ------------------------------- 功能 ------------------------------- */
	follow_release<T = mk_release_.type_release_param_type & mk_audio_._unit>(object_: T): T {
		if (!object_) {
			return object_;
		}

		// 添加释放对象
		if (object_ instanceof mk_audio_._unit) {
			if (object_.clip) {
				this._release_manage.add(object_.clip);
			}
		} else {
			this._release_manage.add(object_ as any);
		}

		// 如果模块已经关闭则直接释放
		if (this._state === _mk_life_cycle.run_state.close) {
			this._log.debug("在模块关闭后跟随释放资源会被立即释放");
			this._release_manage.release_all();
		}

		return object_;
	}

	cancel_release<T = mk_release_.type_release_param_type & mk_audio_._unit>(object_: T): T {
		if (!object_) {
			return object_;
		}

		// 添加释放对象
		if (object_ instanceof mk_audio_._unit) {
			if (object_.clip) {
				this._release_manage.release(object_.clip);
			}
		} else {
			this._release_manage.release(object_ as any);
		}

		return object_;
	}

	/**
	 * 打开模块
	 * @param config_ 关闭配置
	 * @returns
	 * @internal
	 */
	async _open(config_?: _mk_life_cycle.open_config): Promise<void> {
		// 状态安检
		if (mk_tool.byte.get_bit(this._state, _mk_life_cycle.run_state.opening | _mk_life_cycle.run_state.open)) {
			return;
		}

		// 状态更新
		this._state = _mk_life_cycle.run_state.opening;

		// 动态模块 create
		if (!this.static_b && this.create) {
			await this.create();
		}

		// 参数安检
		if (!config_) {
			config_ = Object.create(null);
		}

		// 生命周期
		if (config_) {
			if (config_.first_b) {
				await this._recursive_open({
					target: this.node,
					active_b: this.node.active,
				});
			}

			if (config_.init !== undefined) {
				await this.init(config_.init);
			}

			if (this.open) {
				await this.open();
			}
		}

		// 状态更新
		{
			this._state = _mk_life_cycle.run_state.open;
			this._open_task.finish(true);
		}
	}

	/**
	 * 关闭模块
	 * @param config_ 关闭配置
	 * @returns
	 * @internal
	 */
	async _close(config_?: _mk_life_cycle.close_config): Promise<void> {
		// 状态安检
		if (mk_tool.byte.get_bit(this._state, _mk_life_cycle.run_state.closing | _mk_life_cycle.run_state.close)) {
			return;
		}

		if (!this._open_task.finish_b) {
			await this._open_task.task;
		}

		// 节点安检
		if (!this.node) {
			this._log.error("节点已销毁, close 执行失败", this.uuid);

			return;
		}

		/** 配置参数 */
		const config = config_ ?? (Object.create(null) as _mk_life_cycle.close_config);

		// 状态更新
		this._state = _mk_life_cycle.run_state.closing;

		// 生命周期
		{
			if (this.close) {
				await this.close();
			}

			if (config.first_b) {
				await this._recursive_close({
					target: this.node,
					active_b: this.node.active,
					destroy_children_b: config.destroy_children_b,
				});
			}

			if (this.late_close) {
				await this.late_close();
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
		this._open_task.finish(false);
	}

	/** 递归 open */
	private async _recursive_open(config_: _mk_life_cycle.recursive_open_config): Promise<void> {
		if (!config_.target) {
			return;
		}

		const active_b = config_.target.active;

		for (const v of config_.target.children) {
			await this._recursive_open({
				target: v,
				active_b: config_.active_b && active_b,
			});
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
			destroy_children_b: config_.destroy_children_b,
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
				destroy_children_b: config_.destroy_children_b,
			});
		}
	}
}

export default mk_life_cycle;
