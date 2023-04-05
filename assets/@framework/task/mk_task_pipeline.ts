import mk_event_target from "../mk_event_target";
import { mk_log } from "../mk_logger";
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

/** 任务管线（顺序执行任务） */
class mk_task_pipeline {
	/* --------------- public --------------- */
	/** 事件 */
	event = new mk_event_target<_mk_task_pipeline.event_protocol>();
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

	/** 执行任务 */
	private async _run(): Promise<void> {
		this._run_b = true;
		while (this._task_as.length) {
			/** 当前任务 */
			const task = this._task_as.shift()!;
			/** 任务返回 */
			let task_result: any;

			// 完成任务
			try {
				task_result = await task.task_f();
			} catch (error) {
				mk_log.error("任务执行失败，跳过", error, task.task_f);
			}
			task.task.finish(true, task_result);

			// 已经暂停
			if (this._pause_b) {
				break;
			}
		}
		this._run_b = false;
	}
}

export default mk_task_pipeline;
