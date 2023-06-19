import * as cc from "cc";
import { EDITOR } from "cc/env";
import global_config from "../../@config/global_config";
import dynamic_module from "../mk_dynamic_module";
import mk_logger from "../mk_logger";
import monitor from "../mk_monitor";
import mk_status_task from "../task/mk_status_task";
import mk_layer from "./mk_layer";
import mk_tool from "../@private/tool/mk_tool";
const ui_manage = dynamic_module.default(import("../mk_ui_manage"));
const { ccclass, property } = cc._decorator;

export namespace _mk_life_cycle {
	/** 运行状态 */
	export enum run_state {
		/** 打开中 */
		opening = 1,
		/** 打开 */
		open = 2,
		/** 关闭中 */
		closing = 4,
		/** 关闭 */
		close = 8,
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
 * - 用于模块生命周期控制
 * - open: 子 -> 父
 * - close: 父 -> 子
 */
@ccclass
export class mk_life_cycle extends mk_layer {
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
	 * 事件对象列表
	 * @readonly
	 * @remarks
	 * 模块关闭后自动清理事件
	 */
	event_target_as: { targetOff(target: any): any }[] | { target_off(target: any): any }[] = [];

	/** open状态 */
	get open_b(): boolean {
		return this.isValid && this._state === _mk_life_cycle.run_state.open;
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

		// 静态模块 create
		if (this.static_b) {
			this.create?.();
		}
	}

	/* ------------------------------- 自定义生命周期 ------------------------------- */
	/**
	 * 创建
	 * @param config_ 创建配置
	 * @remarks
	 * 可在此处初始化视图状态
	 * - 静态模块：onLoad 时调用
	 * - 动态模块：addChild 后调用
	 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	protected create?(): void | Promise<void>;

	/**
	 * 初始化
	 * @param data_ 初始化数据
	 * @remarks
	 * 所有依赖 init_data 初始化的逻辑都应在此进行
	 * - 静态模块：外部自行调用，常用于更新 item 或者静态模块
	 * - 动态模块：onLoad 后，open 前调用
	 */
	// @ts-ignore
	init(data_?: any): void | Promise<void>;
	async init(data_?: any): Promise<void> {
		await this._load_task.task;
		this.init_data = data_;
	}

	/**
	 * 打开
	 * @protected
	 * @remarks
	 * init 后执行，在此处执行无需 init_data 支持的模块初始化操作
	 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	protected open?(): void | Promise<void>;

	/**
	 * 关闭
	 * @remarks
	 * 内部调用：生命周期
	 * 外部调用：自动回收模块
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
		// 取消所有定时器
		this.unscheduleAllCallbacks();
		// 取消数据监听事件
		monitor.clear(this);

		// 清理事件
		this.event_target_as.splice(0, this.event_target_as.length).forEach((v) => {
			if (v.targetOff) {
				v.targetOff(this);
			} else {
				v.target_off(this);
			}
		});
	}

	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 打开模块
	 * @param config_ 关闭配置
	 * @returns
	 * @internal
	 */
	async _open(config_?: _mk_life_cycle.open_config): Promise<void> {
		// 动态模块 create
		if (!this.static_b && this.create) {
			await this.create();
		}

		// 状态安检
		if (mk_tool.byte.get_bit(this._state, _mk_life_cycle.run_state.opening | _mk_life_cycle.run_state.open)) {
			return;
		}

		// 参数安检
		if (!config_) {
			config_ = Object.create(null);
		}

		// 状态更新
		this._state = _mk_life_cycle.run_state.opening;
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

		await this._open_task.task;

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
			}

			return;
		}

		// 重置数据
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
