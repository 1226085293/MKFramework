import tool from "db://assets/tool/tool";
import mk from "mk";

type RecursiveReadonly<T> = {
	readonly [P in keyof T]: T[P] extends Function ? T[P] : RecursiveReadonly<T[P]>;
};

type NonFunctionKeys<T> = {
	// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
	[P in keyof T]: T[P] extends Function | void ? never : P;
}[keyof T];

type RecursiveReadonlyAndNonFunctionKeys<T> = RecursiveReadonly<Pick<T, NonFunctionKeys<T>>>;

class mvc_model_base {
	constructor() {
		tool.func.run_parent_func(this, ["open", "close"]);
	}
	/* ------------------------------- segmentation ------------------------------- */
	open?(): void;
	close(): void;
	async close(): Promise<void> {
		// 取消数据监听事件
		{
			const task = mk.monitor.clear(this);

			if (task) {
				await task;
			}
		}

		// 重置数据
		tool.object.reset(this, true);
	}
}

class mvc_view_base<CT extends mvc_model_base = mvc_model_base> extends mk.view_base {
	protected _event = new mk.event_target();
	protected _model!: RecursiveReadonlyAndNonFunctionKeys<CT>;
}

abstract class mvc_control_base<CT extends mvc_model_base = mvc_model_base, CT2 extends mvc_view_base<CT> = mvc_view_base<CT>> {
	constructor() {
		tool.func.run_parent_func(this, ["open", "close"]);
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
	get model(): RecursiveReadonly<Omit<CT, "open" | "close">> {
		return this._model as any;
	}
	/* --------------- protected --------------- */
	protected _model!: CT;
	protected _view!: CT2;
	/* --------------- private --------------- */
	private _open_task = new mk.task.status(false);
	private _close_task = new mk.task.status(true);
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
			const task = mk.monitor.clear(this);

			if (task) {
				await task;
			}
		}

		// 关闭视图模块
		if (this._view) {
			await mk.ui_manage.close(this._view);
		}
	}

	protected open?(): void;
	protected async open?(): Promise<void> {
		if (this._model?.open) {
			await this._model.open?.();
		}
	}

	private async _last_close(): Promise<void> {
		await this._model.close();
		this._open_task.finish(false);
		this._close_task.finish(true);
	}
}

class m extends mvc_model_base {
	a = 0;
	b = {
		c: {
			d: 1,
		},
	};

	open(): void {
		console.log("model-open");
	}

	close(): void {
		console.log("model-close");
	}
}

class v extends mvc_view_base<m> {
	protected open(): void | Promise<void> {
		const a = this._model.b.c;

		console.log("view-open");
	}

	close(): void {
		console.log("view-close");
	}
}
class c extends mvc_control_base<m, v> {
	protected _model = new m();

	protected open(): void {
		console.log("control-open");
	}

	close(): void {
		console.log("control-close");
	}
}

const cc = new c();

cc.close();
