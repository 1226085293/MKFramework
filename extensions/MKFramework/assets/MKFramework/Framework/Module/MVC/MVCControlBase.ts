import MKTool from "../../@Private/Tool/MKTool";
import MKMonitor from "../../MKMonitor";
import MKUIManage from "../../MKUIManage";
import MKStatusTask from "../../Task/MKStatusTask";
import MVCModelBase from "./MVCModelBase";
import MVCViewBase from "./MVCViewBase";

namespace _MVCControlBase {
	/** 递归只读 */
	export type TypeRecursiveReadonly<T> = {
		readonly [P in keyof T]: T[P] extends Function ? T[P] : TypeRecursiveReadonly<T[P]>;
	};

	/** 函数属性的键 */
	type TypeFunctionKeys<T> = {
		// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
		[P in keyof T]: T[P] extends Function | void ? P : P extends "event" ? P : never;
	}[keyof T];

	/** 视图类型（防止直接操作视图对象属性） */
	export type TypeView<T> = Omit<Pick<T, TypeFunctionKeys<T>>, Exclude<keyof MVCViewBase, "event">>;
}

abstract class MVCControlBase<CT extends MVCModelBase = MVCModelBase, CT2 extends MVCViewBase<CT> = MVCViewBase<CT>> {
	// @ts-ignore
	constructor() {
		MKTool.func.runParentFunc(this, ["open", "close"]);
		// 等待初始化属性完成
		setTimeout(async () => {
			await this._closeTask.task;
			if (this.open) {
				await this.open();
			}

			this._openTask.finish(true);
		}, 0);
	}
	/* --------------- public --------------- */
	get model(): _MVCControlBase.TypeRecursiveReadonly<Omit<CT, "open" | "close">> {
		return this._model as any;
	}
	/* --------------- protected --------------- */
	protected _model!: CT;
	protected _view!: _MVCControlBase.TypeView<CT2>;
	/* --------------- private --------------- */
	private _openTask = new MKStatusTask(false);
	private _closeTask = new MKStatusTask(true);
	/* ------------------------------- segmentation ------------------------------- */
	/**  */
	close(isExternalCall_?: boolean): void;
	async close(isExternalCall_ = true): Promise<void> {
		await this._openTask.task;
		this._closeTask.finish(false);
		if (isExternalCall_) {
			await this.close(false);
			await this._lastClose();

			throw "中断";
		}

		// 关闭 model
		if (this._model?.close) {
			await this._model.close();
		}

		// 关闭 view
		if (this._view) {
			await MKUIManage.close(this._view as unknown as MVCViewBase);
		}

		// 取消数据监听事件
		{
			const task = MKMonitor.clear(this);

			if (task) {
				await task;
			}
		}
	}

	protected open?(): void;

	private async _lastClose(): Promise<void> {
		this._openTask.finish(false);
		this._closeTask.finish(true);
	}
}

export default MVCControlBase;
