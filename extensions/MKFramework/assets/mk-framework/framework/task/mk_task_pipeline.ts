import mk_event_target from "../mk_event_target";
import { mkLog } from "../MKLogger";
import mk_status_task from "./mk_status_task";

namespace _mk_task_pipeline {
	/** 事件协议 */
	export interface event_protocol {
		/** 执行完成 */
		completed(): void;
	}

	/** 任务数据 */
	export interface task_data {
		/** 执行函数 */
		task_f: Function;
		/** 状态任务 */
		task: mk_status_task;
	}
}

/**
 * 任务管线
 * @remarks
 * 顺序执行任务
 */
class mk_task_pipeline {
	/* --------------- public --------------- */
	/** 事件 */
	event = new mk_event_target<_mk_task_pipeline.event_protocol>();
	/** 执行间隔（毫秒） */
	interval_ms_n = 0;
	/** 暂停状态 */
	get pause_b(): boolean {
		return this._pause_b;
	}

	set pause_b(value_b_) {
		this._pause_b = value_b_;

		// 执行任务
		if (!value_b_ && !this._run_b) {
			this._run();
		}
	}

	/* --------------- private --------------- */
	/** 执行状态 */
	private _run_b = false;
	/** 暂停状态 */
	private _pause_b = false;
	/** 任务列表 */
	private _task_as: _mk_task_pipeline.task_data[] = [];
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 添加任务
	 * @param task_f_ 任务函数
	 * @returns 当前任务 Promise
	 */
	async add(task_f_: Function): Promise<void> {
		/** 任务 */
		const task = new mk_status_task(false);

		// 添加到任务列表
		this._task_as.push({
			task_f: task_f_,
			task: task,
		});

		// 执行任务
		if (!this.pause_b && !this._run_b) {
			this._run();
		}

		return task.task;
	}

	/**
	 * 清空任务
	 * @param finish_b_ 完成所清空的任务
	 */
	clear(finish_b_: boolean): void {
		const task_as = this._task_as.splice(0, this._task_as.length);

		if (finish_b_) {
			task_as.forEach((v) => {
				v.task.finish(true);
			});
		}
	}

	/** 执行任务 */
	private async _run(): Promise<void> {
		this._run_b = true;
		while (this._task_as.length) {
			/** 当前任务 */
			const task = this._task_as.shift()!;
			/** 任务返回 */
			let task_result: any;
			/** 当前时间 */
			const current_time_ms_n = Date.now();
			/** 完成时间 */
			let finish_time_ms_n = current_time_ms_n;

			// 完成任务
			try {
				task_result = task.task_f();

				// Promise 类型等待返回，防止异步任务
				if (task_result instanceof Promise) {
					task_result = await task_result;
				}

				finish_time_ms_n = Date.now();
			} catch (error) {
				finish_time_ms_n = current_time_ms_n;
				mkLog.error("任务执行失败，跳过", error, task.task_f);
			}

			task.task.finish(true, task_result);

			// 等待指定时间
			if (this.interval_ms_n && finish_time_ms_n - current_time_ms_n < this.interval_ms_n) {
				await new Promise((resolve_f) => setTimeout(resolve_f, this.interval_ms_n - (finish_time_ms_n - current_time_ms_n)));
			}

			// 已经暂停
			if (this._pause_b) {
				break;
			}
		}

		this._run_b = false;
		this.event.emit(this.event.key.completed);
	}
}

export default mk_task_pipeline;
