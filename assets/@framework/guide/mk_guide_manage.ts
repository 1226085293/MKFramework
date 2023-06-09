import mk_event_target from "../mk_event_target";
import mk_logger from "../mk_logger";
import mk_task_pipeline from "../task/mk_task_pipeline";
import mk_guide_step_base from "./mk_guide_step_base";
import bundle from "../resources/mk_bundle";

/** 引导管理器 */
class mk_guide_manage {
	constructor(init_: mk_guide_manage_.init_config) {
		// 初始化数据
		this._log = new mk_logger(init_.name_s ?? "guide_manage");
		this._init_config = init_;
	}

	/* --------------- public --------------- */
	/** 事件 */
	event = new mk_event_target<mk_guide_manage_.event_protocol>();
	/** 暂停状态 */
	get pause_b(): boolean {
		return this._pause_b;
	}

	set pause_b(value_b_) {
		this._set_pause_b(value_b_);
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
	/** 步骤表 */
	private _step_map = new Map<number, mk_guide_step_base>();
	/** 步骤预加载任务表 */
	private _step_preload_map = new Map<number, Promise<any>>();
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 注册步骤
	 * @param step_ 步骤实例
	 */
	regis_step(step_: mk_guide_step_base | mk_guide_step_base[]): void {
		if (Array.isArray(step_)) {
			step_.forEach((v) => {
				v.guide_manage = this;
				this._step_map.set(v.step_n, v);
			});
		} else {
			step_.guide_manage = this;
			this._step_map.set(step_.step_n, step_);
		}
	}

	/** 运行（执行后恢复暂停状态，且更新当前步骤视图） */
	run(): Promise<void> {
		return this._task_pipeline.add(async () => {
			if (this._pre_step_n === this._step_n) {
				return;
			}

			/** 上次引导步骤 */
			const pre_step = this._pre_step_n === undefined ? null : this._step_map.get(this._pre_step_n);
			/** 当前引导步骤 */
			const current_step = this._step_map.get(this._step_n);

			// 步骤未注册
			if (!current_step) {
				this._log.error(`步骤 ${this._step_n} 未注册`);
				this.pause_b = true;

				return;
			}

			/** 下次引导步骤 */
			const next_step = typeof current_step.next_step_n !== "number" ? null : this._step_map.get(current_step.next_step_n);

			// 恢复暂停
			this.pause_b = false;

			// 加载步骤事件
			this._log.log("执行步骤", current_step.step_n, current_step.describe_s ?? "");
			await Promise.all(this.event.request(this.event.key.loading_step));

			// 执行下步预加载
			if (next_step?.pre_load) {
				const result = next_step?.pre_load?.();

				if (result instanceof Promise) {
					this._step_preload_map.set(next_step.step_n, result);
				}
			}

			// 加载场景
			{
				const bundle_s = current_step.scene_s.split(".")[0];
				const scene_s = current_step.scene_s.split(".")[1];

				if (bundle.bundle_s !== bundle_s || bundle.scene_s !== scene_s) {
					await bundle.load_scene(scene_s, {
						bundle_s: bundle_s,
					});
				}
			}

			// （加载/卸载/重置）操作
			if (this._init_config.operate_tab) {
				/** 当前步骤操作 */
				const current_operate_ss = current_step.operate_ss;
				/** 上次步骤操作 */
				const pre_operate_ss = pre_step?.operate_ss ?? ([] as any as typeof current_operate_ss);

				for (const v_s of pre_operate_ss) {
					// 重置操作（当前步骤和上次步骤都存在的操作）
					if (current_operate_ss.includes(v_s)) {
						await this._init_config.operate_tab[v_s].reset?.();
						current_step.operate_tab[v_s] = pre_step?.operate_tab[v_s];
					}
					// 卸载操作（上次步骤存在，当前步骤不存在的操作）
					else {
						await this._init_config.operate_tab[v_s].unload?.();
					}
				}

				// 加载操作（当前步骤存在，上次步骤不存在的操作）
				for (const v_s of current_operate_ss.filter((v) => !pre_operate_ss.includes(v))) {
					current_step.operate_tab[v_s] = await this._init_config.operate_tab[v_s].load();
				}
			}

			// 确认预加载完成
			{
				const preload_task = this._step_preload_map.get(current_step.step_n);

				if (preload_task) {
					await preload_task;
					this._step_preload_map.delete(current_step.step_n);
				}
			}

			// 更新上个步骤
			this._pre_step_n = current_step.step_n;

			// 执行步骤 load
			await current_step.load();

			// 加载步骤完成事件
			await Promise.all(this.event.request(this.event.key.loading_step_complete));
		});
	}

	/**
	 * 设置当前步骤（暂停状态只更新步骤数据，不会执行步骤生命周期）
	 * @param step_n_ 步骤
	 * @param init_data_ 初始化数据
	 */
	set_step(step_n_: number, init_data_?: any): Promise<void> {
		return this._task_pipeline.add(async () => {
			if (this._step_n === step_n_) {
				return;
			}

			// 更新步骤
			this._step_n = step_n_;

			/** 当前引导步骤 */
			const current_step = this._step_map.get(this._step_n);

			// 更新初始化数据
			if (current_step) {
				current_step.init_data = init_data_;
			}

			// 切换事件
			this._log.log("切换到步骤", this._step_n, current_step?.describe_s ?? "");
			this.event.emit(this.event.key.switch);

			// 请求数据
			{
				const result = this._init_config.step_update_callback_f(this._step_n);

				// 引导中断
				if ((result ?? null) === null) {
					this._pause_b = true;
					this.event.emit(this.event.key.break);
					this._log.warn("引导中断");

					return;
				}

				// 更新步骤数据
				if (current_step) {
					current_step.step_update_data = result;
				}
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

	/* ------------------------------- get/set ------------------------------- */
	private _set_pause_b(value_b_: boolean): void {
		if (this._pause_b === value_b_) {
			return;
		}

		this._pause_b = value_b_;

		// 暂停 | 恢复事件
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
		/** 切换步骤（set_step 时执行） */
		switch(): void;
		/** 加载步骤（可在此处打开常驻节点遮罩） */
		loading_step(): void;
		/** 加载步骤结束（可在此处关闭常驻节点遮罩） */
		loading_step_complete(): void;
		/** 中断 */
		break(): void;
		/** 完成 */
		finish(): void;
	}

	export interface operate_cell {
		/** 加载 */
		load: () => any;
		/** 卸载 */
		unload?: () => any;
		/** 重置（上下步骤都存在当前操作时调用） */
		reset?: () => any;
	}

	/** 初始化配置 */
	export interface init_config {
		/** 结束步骤 */
		end_step_n?: number;
		/** 操作表 */
		operate_tab?: Record<string, operate_cell>;
		/** 引导名（用于打印） */
		name_s?: string;
		/**
		 * 步骤更新回调
		 * - 可在此内更新服务端数据并请求奖励
		 * - 返回空（null | undefined）代表更新失败，中断引导
		 * - 步骤可使用 this._server_data 获取返回数据
		 */
		/**
		 *
		 * @param step_n
		 * @returns 为空（null | undefined）代表更新失败中断引导，不为空则
		 */
		step_update_callback_f(step_n: number): any;
	}
}

export default mk_guide_manage;
