import * as cc from "cc";
import mk_view_base from "../mk_view_base";
import mk_tool from "../../@private/tool/mk_tool";
import mk_event_target from "../../mk_event_target";
import mk_monitor from "../../mk_monitor";
import mk_ui_manage from "../../mk_ui_manage";
import mk_status_task from "../../task/mk_status_task";
const { ccclass, property } = cc._decorator;

abstract class mvc_model_base {
	constructor() {
		mk_tool.func.run_parent_func(this, ["open", "close"]);
	}
	protected _view_interface?: {};
	/**
	 * 重置 data
	 * @remarks
	 * close 后重置 this.data，data 必须为 class 类型
	 */
	protected _reset_data_b = true;
	/* ------------------------------- segmentation ------------------------------- */
	static async new<T extends new (...args_as: any[]) => any>(this: T, ...args_as_: ConstructorParameters<T>): Promise<InstanceType<T>> {
		const self = this as any;
		const model = new self(...args_as_) as mvc_model_base;

		if (model.open) {
			await model.open?.();
		}

		return model as any;
	}

	open?(): void;
	close(): void;
	async close(): Promise<void> {
		// 取消数据监听事件
		{
			const task = mk_monitor.clear(this);

			if (task) {
				await task;
			}
		}

		// 重置数据
		if (this._reset_data_b) {
			mk_tool.object.reset(this, true);
		}
	}
}

namespace _mvc_view_base {
	/** 递归只读 */
	type recursive_readonly<T> = {
		readonly [P in keyof T]: T[P] extends Function ? T[P] : recursive_readonly<T[P]>;
	};

	type has_prefix<T extends string, prefix extends string> = T extends `${prefix}${infer rest}` ? T : "";

	/** 排除函数属性的对象键 */
	type non_function_keys<T> = {
		// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
		[P in keyof T]: T[P] extends Function | void ? never : P;
	}[keyof T];

	/** 递归只读且无函数 */
	export type recursive_readonly_and_non_function_keys<T> = recursive_readonly<Pick<T, non_function_keys<T>>>;
}

@ccclass
abstract class mvc_view_base<CT extends mvc_model_base = mvc_model_base> extends mk_view_base {
	protected _model!: _mvc_view_base.recursive_readonly_and_non_function_keys<CT>;
	protected _event!: {};
	/* ------------------------------- segmentation ------------------------------- */
	static async new?<T extends new (...args_as: any[]) => any>(this: T, ...args_as_: ConstructorParameters<T>): Promise<InstanceType<T> | null>;
}

namespace _mvc_control_base {
	/** 递归只读 */
	export type type_recursive_readonly<T> = {
		readonly [P in keyof T]: T[P] extends Function ? T[P] : type_recursive_readonly<T[P]>;
	};

	/** 函数属性的键 */
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

			// if (this._view) {}
			this._open_task.finish(true);
		}, 0);
	}
	/* --------------- public --------------- */
	get model(): _mvc_control_base.type_recursive_readonly<Omit<CT, "open" | "close">> {
		return this._model as any;
	}
	/* --------------- protected --------------- */
	protected _view_t!: cc.Constructor<CT2>;
	protected _model!: CT;
	protected _view_interface?: {};
	protected _event = new mk_event_target<typeof this._view_interface>();
	protected _view_event = new mk_event_target<CT2["_event"]>();
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
	_event!: {
		test(a: number): number;
	};

	test2(): number {
		return 1;
	}
	ctest2(): number {
		return 1;
	}

	get test3(): number {
		return 2;
	}
}

class c extends mvc_control_base<m, v> {
	static inter: {
		tt(): number;
	};

	protected open(): void {
		// this._view_event.on("test");
		this._view.test2();
	}
}
