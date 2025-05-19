import * as cc from "cc";
import mk from "mk";
// import asin from "@stdlib/math-base-special-asin";
// import atan2 from "@stdlib/math-base-special-atan2";
// import cos from "@stdlib/math-base-special-cos";
// import exp from "@stdlib/math-base-special-exp";
// import pow from "@stdlib/math-base-special-pow";
// import sin from "@stdlib/math-base-special-sin";
// import sqrt from "@stdlib/math-base-special-sqrt";

/** 帧管理器 */
class tool_frame_manage implements cc.ISchedulable {
	/** 逻辑帧帧数/秒(和服务器同步) */
	readonly logic_frame_speed_n = 30;
	/** 预留逻辑帧（防止消息延迟） */
	readonly reserved_logic_frame_n = 5;
	/** 渲染帧速率 */
	render_speed_ms_n = 0;
	/** 渲染单元表 */
	render_unit_as: tool_frame_manage_.render_unit[] = [];
	/** 本地逻辑帧 */
	logic_frame_n = -1;
	/** 当前渲染帧 */
	render_frame_n = -1;
	/** 暂停渲染 */
	pause_render_b = false;
	id?: string;
	uuid?: string;
	/** 帧日志 */
	get frame_log_s(): string {
		return this._frame_log_ss.join("\n");
	}
	/** 初始化状态 */
	private _init_b = false;
	/** 目标逻辑帧（服务器） */
	private _target_frame_n = -1;
	/** 开始渲染 */
	private _render_b = false;
	/** 同步状态（追帧） */
	private _sync_state_b = false;
	/** 原始数据 */
	private _original_data_tab: any = {};
	/** 步骤任务 */
	private _step_task_map = new Map<number, Function[]>();
	/** 上次渲染时间 */
	private _previos_render_timestamp_n = 0;
	/** 渲染帧倍率 */
	private _render_frame_rate_n = -1;
	/** 渲染随机表 */
	private _random_count_tab: Record<number, number> = {};
	/** 随机数种子 */
	private _random_seed_n = -1;
	/** 帧日志 */
	private _frame_log_ss: string[] = [];
	/** 日志 */
	private _log = new mk.logger("tool_frame_manage");
	/* ------------------------------- segmentation ------------------------------- */
	open(): void {
		if (this._init_b) {
			return;
		}

		this.render_speed_ms_n = 1000 / Number(cc.game.frameRate);
		this._render_frame_rate_n = 1000 / this.logic_frame_speed_n / this.render_speed_ms_n;
		this._init_b = true;
		this._replace_math(true);
		this.render_unit_as.forEach((v) => {
			v.init?.();
		});

		cc.Scheduler.enableForTarget(this);
		cc.director.getScheduler().scheduleUpdate(this, -999, false);

		this._log.log("初始化完成");
	}

	update(dt: number): void {
		this._render();
	}

	close(): void {
		if (!this._init_b) {
			return;
		}

		this._init_b = false;

		this._replace_math(false);
		this.render_unit_as.forEach((v) => {
			v.destroy?.();
		});

		this.render_unit_as = [];

		cc.director.getScheduler().unscheduleUpdate(this);
		this.logic_frame_n = -1;
		this.render_frame_n = -1;
		this.pause_render_b = false;
		this._target_frame_n = -1;
		this._render_b = false;
		this._sync_state_b = false;
		this._step_task_map.clear();
		this._previos_render_timestamp_n = 0;
		this._random_count_tab = {};
		this._random_seed_n = -1;
		this._frame_log_ss = [];
	}

	/**
	 * 步进
	 * @param logic_frame_n_ 当前服务器逻辑帧
	 */
	step(logic_frame_n_: number): void {
		// this._log.log(`服务器逻辑帧：${logic_frame_n_}, 本地逻辑帧：${this.logic_frame_n}, 本地渲染帧：${this.render_frame_n}, 时间: ${Date.now()}`);

		this._target_frame_n = logic_frame_n_;

		// 预留逻辑帧
		if (this.logic_frame_n + this.reserved_logic_frame_n > this._target_frame_n) {
			return;
		}

		// 当前帧非下一帧，追帧
		if (this.logic_frame_n + 1 < this._target_frame_n - this.reserved_logic_frame_n) {
			this._sync_state_b = true;

			const target_frame_n = this._target_frame_n - this.reserved_logic_frame_n;

			while (this.logic_frame_n !== target_frame_n) {
				this._render();
			}

			this._sync_state_b = false;
		}

		this._start_render();
	}

	/** 帧日志 */
	log(...args_as_: any[]): void {
		this._frame_log_ss.push(
			`渲染帧: ${this.render_frame_n}, 逻辑帧: ${this.logic_frame_n}, 日志：${args_as_
				.map((v) => {
					if (typeof v === "object") {
						return v.info_s ?? JSON.stringify(v);
					} else {
						return String(v);
					}
				})
				.join(",")}`
		);
	}

	/**
	 * 添加任务
	 * @param logic_frame_n_ 逻辑帧
	 * @param task_f_ 任务
	 */
	add_task(logic_frame_n_: number, task_f_: Function): void {
		let task_as = this._step_task_map.get(logic_frame_n_);

		if (!task_as) {
			this._step_task_map.set(logic_frame_n_, (task_as = []));
		}

		task_as.push(task_f_);
	}

	/**
	 * 不重复随机，Math.random 在不同平台调用次数不一致所以保证相同帧结果一致
	 * @returns
	 */
	random(): number {
		const random_count_n = this._random_count_tab[this.render_frame_n] ?? 0;
		const x_n = Math.sin(this.render_frame_n) * (10000 + this._random_seed_n + random_count_n);

		this._random_count_tab[this.render_frame_n] = random_count_n + 1;

		return x_n - Math.floor(x_n);
	}

	/** 设置随机数种子 */
	set_random_seed(random_seed_n_: number): void {
		this._random_seed_n = random_seed_n_;
	}

	/** 开始渲染 */
	private _start_render(): void {
		if (this._render_b) {
			return;
		}

		// 开始渲染
		this._render_b = true;
	}

	/** 停止渲染 */
	private _stop_render(): void {
		this._render_b = false;
		this._previos_render_timestamp_n = 0;
	}

	/** 渲染函数 */
	private _render(): void {
		if (!this._render_b && !this._sync_state_b) {
			return;
		}

		if (this.pause_render_b && !this._sync_state_b) {
			return;
		}

		// 渲染帧超过逻辑帧，停止渲染
		++this.render_frame_n;
		if (this.render_frame_n + 1 >= (this._target_frame_n + 1) * this._render_frame_rate_n) {
			--this.render_frame_n;
			this._stop_render();

			// this._log.log(`停止渲染: 本地逻辑帧：${this.logic_frame_n}, 本地渲染帧：${this.render_frame_n}`);

			return;
		}

		/** 上一帧 */
		const previous_logic_frame_n = this.logic_frame_n;

		// 更新逻辑帧
		this.logic_frame_n = Math.floor((this.render_frame_n + 1) / this._render_frame_rate_n);

		// 执行当前帧逻辑
		if (previous_logic_frame_n !== this.logic_frame_n) {
			for (let k_n = previous_logic_frame_n + 1, len_n = this.logic_frame_n; k_n <= len_n; ++k_n) {
				/** 对应逻辑帧任务 */
				const task_as = this._step_task_map.get(k_n);

				task_as?.forEach((v_f) => v_f());
				this._step_task_map.delete(k_n);
			}
		}

		// 手动模拟步进
		this._render_step();
	}

	/** 渲染步进 */
	private _render_step(): void {
		const real_dt_n = this._previos_render_timestamp_n ? Date.now() - this._previos_render_timestamp_n : 0;

		this.render_unit_as.forEach((v) => {
			v.update(this.render_speed_ms_n * 0.001, real_dt_n * 0.001);
		});

		this._previos_render_timestamp_n = Date.now();
	}

	/**
	 * 替换数学库实现，实现不同平台相同结果
	 * @remark
	 * 根据 https://262.ecma-international.org/6.0/#sec-function-properties-of-the-math-object 规则，以下函数结果根据平台自行实现或参考模板实现，所以可能结果不一致
	 * acos, acosh, asin, asinh, atan, atanh, atan2, cbrt, cos, cosh, exp, expm1, hypot, log, log1p, log2, log10, pow, random, sin, sinh, sqrt, tan, tanh
	 */
	private _replace_math(replace_b_: boolean): void {
		// box2d：asin, atan2, cos, exp, pow, sin, sqrt, random

		const math_tab: Record<string, Function> = {
			// asin,
			// atan2,
			// cos,
			// exp,
			// pow,
			// sin,
			// sqrt,
		};

		if (replace_b_) {
			this._original_data_tab["random"] = Math.random;
			Math.random = () => {
				const x_n = Math.sin(this.render_frame_n) * (10000 + this._random_seed_n);

				return x_n - Math.floor(x_n);
			};

			for (const k_s in math_tab) {
				const new_value_f = math_tab[k_s];

				if (this._original_data_tab[k_s]) {
					return;
				}

				this._original_data_tab[k_s] = Math[k_s];

				if (new_value_f) {
					Math[k_s] = new_value_f;
				}
			}
		} else {
			Math.random = this._original_data_tab["random"];
			delete this._original_data_tab["random"];

			for (const k_s in math_tab) {
				Math[k_s] = this._original_data_tab[k_s];
				delete this._original_data_tab[k_s];
			}
		}
	}
}

export namespace tool_frame_manage_ {
	/** 渲染单元 */
	export abstract class render_unit {
		/** 初始化 */
		init?(): any;
		/** 更新 */
		abstract update(dt_n_: number, real_dt_n_: number): any;
		/** 销毁 */
		destroy?(): any;
	}
}

export default new tool_frame_manage();
