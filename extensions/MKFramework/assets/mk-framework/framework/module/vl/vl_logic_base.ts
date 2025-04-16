import mk_tool from "../../@private/tool/mk_tool";
import mk_event_target from "../../mk_event_target";
import mk_monitor from "../../mk_monitor";
import mk_ui_manage from "../../mk_ui_manage";
import mk_status_task from "../../task/mk_status_task";
import vl_view_base from "./vl_view_base";

namespace _vl_logic_base {
	/** 递归只读 */
	export type recursive_readonly<T> = {
		readonly [P in keyof T]: T[P] extends Function ? T[P] : recursive_readonly<T[P]>;
	};
}

abstract class vl_logic_base {
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
	get data(): _vl_logic_base.recursive_readonly<Omit<typeof this._data, "open" | "close">> {
		return this._data as any;
	}
	/* --------------- protected --------------- */
	protected _data!: any;
	protected _view?: vl_view_base;
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

		// 取消数据监听事件
		{
			const task = mk_monitor.clear(this);

			if (task) {
				await task;
			}
		}

		// 关闭视图模块
		if (this._view) {
			await mk_ui_manage.close(this._view);
		}
	}

	protected open?(): void;

	private async _last_close(): Promise<void> {
		if (this._data) {
			mk_tool.object.reset(this._data, true);
		}

		this._open_task.finish(false);
		this._close_task.finish(true);
	}
}

class logic extends vl_logic_base {
	/** 更新视图事件 */
	static event_protocol: {
		update(data_n_: number): void;
	};
}

class view extends vl_view_base {
	event_protocol!: {
		update(data_n_: number): void;
	};

	open(): void {
		this.event.key.update;
	}
}

export default vl_logic_base;
