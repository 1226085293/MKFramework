import mk_tool from "../../@private/tool/mk_tool";
import mk_event_target from "../../mk_event_target";
import mk_monitor from "../../mk_monitor";
import mk_ui_manage from "../../mk_ui_manage";
import mk_status_task from "../../task/mk_status_task";
import mvc_model_base from "./mvc_model_base";
import mvc_view_base from "./mvc_view_base";

namespace _mvc_control_base {
	/** 递归只读 */
	export type type_recursive_readonly<T> = {
		readonly [P in keyof T]: T[P] extends Function ? T[P] : type_recursive_readonly<T[P]>;
	};

	/** 排除函数属性的对象键 */
	type type_function_keys<T> = {
		// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
		[P in keyof T]: T[P] extends Function | void ? P : never;
	}[keyof T];

	/** 视图类型（防止直接操作视图对象属性） */
	export type type_view<T> = Omit<Pick<T, type_function_keys<T>>, keyof mvc_view_base>;
}

abstract class mvc_control_base<CT extends mvc_model_base = mvc_model_base, CT2 extends mvc_view_base<CT> = mvc_view_base<CT>> {
	// @ts-ignore
	constructor() {
		mk_tool.func.run_parent_func(this, ["open", "close"]);
		// 等待初始化属性完成
		setTimeout(async () => {
			await this._close_task.task;
			if (this.open) {
				await this.open();
			}

			this._open_task.finish(true);
		}, 0);
	}
	/* --------------- public --------------- */
	get model(): _mvc_control_base.type_recursive_readonly<Omit<CT, "open" | "close">> {
		return this._model as any;
	}
	/* --------------- protected --------------- */
	protected _model!: CT;
	protected _view_interface?: {};
	protected _event = new mk_event_target<typeof this._view_interface>();
	protected _view!: _mvc_control_base.type_view<CT2>;
	/* --------------- private --------------- */
	private _open_task = new mk_status_task(false);
	private _close_task = new mk_status_task(true);
	/* ------------------------------- segmentation ------------------------------- */
	close(external_call_b?: boolean): void;
	async close(external_call_b = true): Promise<void> {
		await this._open_task.task;
		this._close_task.finish(false);
		if (external_call_b) {
			await this.close(false);
			await this._last_close();

			throw "中断";
		}

		// 关闭 model
		if (this._model?.close) {
			await this._model.close();
		}

		// 关闭 view
		if (this._view) {
			await mk_ui_manage.close(this._view as unknown as mvc_view_base);
		}

		// 取消数据监听事件
		{
			const task = mk_monitor.clear(this);

			if (task) {
				await task;
			}
		}
	}

	protected open?(): void;

	private async _last_close(): Promise<void> {
		this._open_task.finish(false);
		this._close_task.finish(true);
	}
}

class m extends mvc_model_base {
	_view_interface!: {
		tt(): number;
	};
}

class v extends mvc_view_base<m> {
	test = 0;

	test2(): number {
		return 1;
	}
	get test3(): number {
		return 2;
	}
}

class c extends mvc_control_base<m, v> {
	protected open(): void {
		this._view.test2();
	}
}

export default mvc_control_base;
