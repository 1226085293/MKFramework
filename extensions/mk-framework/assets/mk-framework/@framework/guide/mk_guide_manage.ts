import mk_event_target from "../mk_event_target";
import mk_logger from "../mk_logger";
import mk_task_pipeline from "../task/mk_task_pipeline";
import mk_guide_step_base from "./mk_guide_step_base";
import mk_bundle from "../resources/mk_bundle";

/**
 * 引导管理器
 * @noInheritDoc
 * @remarks
 *
 * - 支持多实例
 *
 * - 支持任意步骤的(插入/删除)
 *
 * - 支持(暂停/完成)引导
 *
 * - 支持任意步骤跳转后的状态还原(操作单元)
 *
 * - 引导步骤脚本分离，支持组件式挂载
 */
class mk_guide_manage {
	constructor(init_: mk_guide_manage_.init_config) {
		// 初始化数据
		this._log = new mk_logger(init_.name_s ?? "guide_manage");
		this._init_config = init_;

		if (this._init_config.current_step_n !== undefined) {
			this._step_n = this._init_config.current_step_n;
		}
	}

	/* --------------- public --------------- */
	/** 事件 */
	event = new mk_event_target<mk_guide_manage_.event_protocol>();
	/** 步骤表 */
	step_map = new Map<number, mk_guide_step_base>();
	/** 暂停状态 */
	get pause_b(): boolean {
		return this._pause_b;
	}

	set pause_b(value_b_) {
		this._set_pause_b(value_b_);
	}

	/** 完成状态 */
	get finish_b(): boolean {
		return this._step_n === this._init_config.end_step_n;
	}

	/** 结束步骤 */
	get end_step_n(): number {
		return this._init_config.end_step_n ?? 0;
	}

	/* --------------- private --------------- */
	/** 日志 */
	private _log!: mk_logger;
	/** 初始化配置 */
	private _init_config!: mk_guide_manage_.init_config;
	/** 暂停状态 */
	private _pause_b = false;
	/** 上次步骤序号 */
	private _pre_step_n?: number;
	/** 当前步骤序号 */
	private _step_n!: number;
	/** 任务管线 */
	private _task_pipeline = new mk_task_pipeline();
	/** 步骤预加载任务表 */
	private _step_preload_map = new Map<number, null | Promise<any>>();
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 注册步骤
	 * @param step_ 步骤实例
	 */
	regis(step_: mk_guide_step_base | mk_guide_step_base[]): void {
		if (Array.isArray(step_)) {
			step_.forEach((v) => {
				v.guide_manage = this;
				this.step_map.set(v.step_n, v);
			});
		} else {
			step_.guide_manage = this;
			this.step_map.set(step_.step_n, step_);
		}
	}

	/**
	 * 运行引导
	 * @remarks
	 * 自动取消暂停状态，且更新当前步骤视图
	 */
	run(): Promise<void> {
		return this._task_pipeline.add(async () => {
			if (this._pre_step_n === this._step_n) {
				return;
			}

			/** 上次引导步骤 */
			const pre_step = this._pre_step_n === undefined ? null : this.step_map.get(this._pre_step_n);
			/** 当前引导步骤 */
			const current_step = this.step_map.get(this._step_n);
			/** 跳转状态 */
			const jump_b = !pre_step?.next_step_ns?.includes(this._step_n);

			// 步骤未注册
			if (!current_step) {
				this._log.error(`步骤 ${this._step_n} 未注册`);
				this.pause_b = true;

				return;
			}

			// 初始步骤数据
			if (this._pre_step_n === undefined && !current_step.step_update_data && !this._update_step_data()) {
				return;
			}

			/** 下次引导步骤 */
			const next_step_as =
				!current_step.next_step_ns || current_step.next_step_ns.length > 1
					? null
					: current_step.next_step_ns.map((v_n) => this.step_map.get(v_n));

			// 恢复暂停
			this.pause_b = false;

			// 加载步骤事件
			this._log.log("执行步骤", current_step.step_n, current_step.describe_s ?? "");
			await Promise.all(this.event.request(this.event.key.loading_step));

			// 执行下步预加载
			next_step_as?.forEach((v) => {
				if (!v?.pre_load) {
					return;
				}

				this._step_preload_map.set(v.step_n, v.pre_load() ?? null);
			});

			// 加载场景
			if (current_step.scene_s?.includes(".")) {
				const bundle_s = current_step.scene_s.split(".")[0];
				const scene_s = current_step.scene_s.split(".")[1];

				if (mk_bundle.bundle_s !== bundle_s || mk_bundle.scene_s !== scene_s) {
					await mk_bundle.load_scene(scene_s, {
						bundle_s: bundle_s,
					});
				}
			}

			// (加载/卸载/重置)操作
			if (this._init_config.operate_tab) {
				/** 当前步骤操作 */
				const current_operate_ss = current_step.operate_ss;
				/** 上次步骤操作 */
				const pre_operate_ss = pre_step?.operate_ss ?? ([] as any as typeof current_operate_ss);

				for (const v_s of pre_operate_ss) {
					// 重置操作，当前步骤和上次步骤都存在的操作
					if (current_operate_ss.includes(v_s)) {
						await this._init_config.operate_tab[v_s].reset?.();
						current_step.operate_tab[v_s] = pre_step?.operate_tab[v_s];
					}
					// 卸载操作，上次步骤存在，当前步骤不存在的操作
					else {
						await this._init_config.operate_tab[v_s].unload?.();
					}
				}

				// 加载操作，当前步骤存在，上次步骤不存在的操作
				for (const v_s of current_operate_ss.filter((v) => !pre_operate_ss.includes(v))) {
					current_step.operate_tab[v_s] = await this._init_config.operate_tab[v_s].load();
				}
			}

			// 确认预加载完成
			{
				await (this._step_preload_map.get(current_step.step_n) ?? null);
				this._step_preload_map.delete(current_step.step_n);
			}

			// 卸载步骤
			if (pre_step) {
				// 执行上个步骤 unload
				await pre_step.unload?.();
				// 卸载步骤事件
				await Promise.all(this.event.request(this.event.key.after_unload_step, pre_step));
			}

			// 更新上个步骤
			this._pre_step_n = current_step.step_n;
			// 执行步骤 load
			await current_step.load(jump_b);
			// 加载步骤完成事件
			await Promise.all(this.event.request(this.event.key.loading_step_complete));
		});
	}

	/**
	 * 设置当前步骤
	 * @param step_n_ 步骤
	 * @param init_data_ 初始化数据
	 * @remarks
	 *
	 * - 暂停状态：更新步骤数据
	 *
	 * - 正常状态：更新步骤数据，执行步骤生命周期
	 */
	set_step(step_n_: number, init_data_?: any): Promise<void> {
		return this._task_pipeline.add(async () => {
			if (this._step_n === step_n_) {
				return;
			}

			// 切换前事件
			await Promise.all(this.event.request(this.event.key.before_switch, step_n_));

			// 更新步骤
			this._step_n = step_n_;

			/** 当前引导步骤 */
			const current_step = this.step_map.get(this._step_n);

			// 更新初始化数据
			if (current_step) {
				current_step.init_data = init_data_;
			}

			this._log.log("切换到步骤", this._step_n, current_step?.describe_s ?? "");

			// 更新步骤数据
			if (!this._update_step_data() && this._step_n !== this._init_config.end_step_n) {
				return;
			}

			// 步骤完成
			if (this._step_n === this._init_config.end_step_n) {
				this.finish();

				return;
			}

			// 运行
			if (!this.pause_b) {
				this.run();
			}
		});
	}

	/** 获取步骤 */
	get_step(): number {
		return this._step_n;
	}

	/** 完成引导 */
	finish(): void {
		this._log.log("引导完成");
		this.pause_b = true;
		this.event.emit(this.event.key.finish);
	}

	/** 更新步骤数据 */
	private _update_step_data(): boolean {
		/** 当前引导步骤 */
		const current_step = this.step_map.get(this._step_n);
		/** 步骤数据 */
		const step_data = !this._init_config.step_update_callback_f ? true : this._init_config.step_update_callback_f(this._step_n);

		// 引导中断
		if ((step_data ?? null) === null) {
			this._pause_b = true;
			this.event.emit(this.event.key.break);
			this._log.warn(`当前步骤 ${this._step_n} 数据错误，引导中断`);

			return false;
		}

		// 更新步骤数据
		if (current_step) {
			current_step.step_update_data = step_data;
		} else {
			this._pause_b = true;
			this.event.emit(this.event.key.break);
			this._log.warn(`当前步骤 ${this._step_n} 未注册，引导中断`);

			return false;
		}

		return true;
	}

	/* ------------------------------- get/set ------------------------------- */
	private _set_pause_b(value_b_: boolean): void {
		if (this._pause_b === value_b_) {
			return;
		}

		this._pause_b = value_b_;

		// (暂停/恢复)事件
		this.event.emit(this._pause_b ? this.event.key.pause : this.event.key.resume);
	}
}

export namespace mk_guide_manage_ {
	/** 事件协议 */
	export interface event_protocol {
		/** 暂停 */
		pause(): void;
		/** 恢复 */
		resume(): void;
		/**
		 * 切换步骤前
		 * @param next_step_n 下个步骤
		 * @remarks
		 * set_step 时执行
		 */
		before_switch(next_step_n: number): void;
		/**
		 * 加载步骤
		 * @remarks
		 * 加载步骤(场景/操作)前调用
		 */
		loading_step(): void;
		/**
		 * 卸载步骤后
		 * @param step 卸载的步骤
		 */
		after_unload_step(step: mk_guide_step_base): void;
		/**
		 * 加载步骤完成
		 * @remarks
		 * 步骤 load 执行后调用
		 */
		loading_step_complete(): void;
		/** 中断 */
		break(): void;
		/** 完成 */
		finish(): void;
	}

	/** 操作单元 */
	export interface operate_cell {
		/** 加载 */
		load: () => any;
		/** 卸载 */
		unload?: () => any;
		/**
		 * 重置
		 * @remarks
		 * 上下步骤都存在当前操作时调用
		 */
		reset?: () => any;
	}

	/** 初始化配置 */
	export interface init_config {
		/** 当前步骤 */
		current_step_n?: number;
		/** 结束步骤 */
		end_step_n?: number;
		/** 操作表 */
		operate_tab?: Record<string, operate_cell>;
		/**
		 * 引导名
		 * @remarks
		 * 用于日志输出
		 */
		name_s?: string;
		/**
		 * 步骤更新回调
		 * @param step_n
		 * @returns null/undefined：更新失败，中断引导
		 * @remarks
		 * - 默认返回 true
		 *
		 * - 可在此内更新服务端数据并请求奖励
		 *
		 * - 步骤可使用 this.step_update_data 获取返回数据
		 */
		step_update_callback_f?(step_n: number): any;
	}
}

export default mk_guide_manage;
