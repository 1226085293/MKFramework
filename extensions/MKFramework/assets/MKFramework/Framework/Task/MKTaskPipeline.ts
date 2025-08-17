import MKEventTarget from "../MKEventTarget";
import { mkLog } from "../MKLogger";
import MKStatusTask from "./MKStatusTask";

namespace _MKTaskPipeline {
	/** 事件协议 */
	export interface EventProtocol {
		/** 执行完成 */
		completed(): void;
	}

	/** 任务数据 */
	export interface TaskData {
		/** 执行函数 */
		taskFunc: Function;
		/** 状态任务 */
		task: MKStatusTask;
	}
}

/**
 * 任务管线
 * @remarks
 * 顺序执行任务
 */
class MKTaskPipeline {
	/* --------------- public --------------- */
	/** 事件 */
	event = new MKEventTarget<_MKTaskPipeline.EventProtocol>();
	/** 执行间隔（毫秒） */
	intervalMsNum = 0;
	/** 暂停状态 */
	get isPause(): boolean {
		return this._isPause;
	}

	set isPause(value_) {
		this._isPause = value_;

		// 执行任务
		if (!value_ && !this._isRun) {
			this._run();
		}
	}

	/* --------------- private --------------- */
	/** 执行状态 */
	private _isRun = false;
	/** 暂停状态 */
	private _isPause = false;
	/** 任务列表 */
	private _taskList: _MKTaskPipeline.TaskData[] = [];
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 添加任务
	 * @param taskFunc_ 任务函数
	 * @returns 当前任务 Promise
	 */
	async add(taskFunc_: Function): Promise<void> {
		/** 任务 */
		const task = new MKStatusTask(false);

		// 添加到任务列表
		this._taskList.push({
			taskFunc: taskFunc_,
			task: task,
		});

		// 执行任务
		if (!this.isPause && !this._isRun) {
			this._run();
		}

		return task.task;
	}

	/**
	 * 清空任务
	 * @param isFinish_ 完成所清空的任务
	 */
	clear(isFinish_: boolean): void {
		const taskList = this._taskList.splice(0, this._taskList.length);

		if (isFinish_) {
			taskList.forEach((v) => {
				v.task.finish(true);
			});
		}
	}

	/** 执行任务 */
	private async _run(): Promise<void> {
		this._isRun = true;
		while (this._taskList.length) {
			/** 当前任务 */
			const task = this._taskList.shift()!;
			/** 任务返回 */
			let taskResult: any;
			/** 当前时间 */
			const currentTimeMsNum = Date.now();
			/** 完成时间 */
			let finishTimeMsNum = currentTimeMsNum;

			// 完成任务
			try {
				taskResult = task.taskFunc();

				// Promise 类型等待返回，防止异步任务
				if (taskResult instanceof Promise) {
					taskResult = await taskResult;
				}

				finishTimeMsNum = Date.now();
			} catch (error) {
				finishTimeMsNum = currentTimeMsNum;
				mkLog.error("任务执行失败，跳过", error, task.taskFunc);
			}

			task.task.finish(true, taskResult);

			// 等待指定时间
			if (this.intervalMsNum && finishTimeMsNum - currentTimeMsNum < this.intervalMsNum) {
				await new Promise((resolveFunc) => setTimeout(resolveFunc, this.intervalMsNum - (finishTimeMsNum - currentTimeMsNum)));
			}

			// 已经暂停
			if (this._isPause) {
				break;
			}
		}

		this._isRun = false;
		this.event.emit(this.event.key.completed);
	}
}

export default MKTaskPipeline;
