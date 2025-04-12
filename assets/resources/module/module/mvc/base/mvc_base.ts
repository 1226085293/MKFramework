import tool from "db://assets/tool/tool";
import mk from "mk";

type RecursiveReadonly<T> = {
	readonly [P in keyof T]: RecursiveReadonly<T[P]>;
};

type NonFunctionKeys<T> = {
	// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
	[P in keyof T]: T[P] extends Function | void ? never : P;
}[keyof T];

class mvc_control_base {
	constructor() {
		this.open?.();
		tool.func.run_parent_func(this, ["open", "close"]);
	}

	protected _view?: mvc_view_base;
	// @ts-ignore
	protected _model?: mvc_model_base;

	protected open?(): void;
	close(): void {
		mk.monitor.clear(this);
		if (this._view) {
			mk.ui_manage.close(this._view);
		}
	}
}

class mvc_model_base {
	constructor() {
		this.open?.();
		tool.func.run_parent_func(this, ["open", "close"]);
	}
	open?(): void;
	close(): void {
		mk.monitor.clear(this);
		tool.object.reset(this, true);
	}
}

class mvc_view_base extends mk.view_base {
	// @ts-ignore
	protected _model?: RecursiveReadonly<Pick<mvc_model_base, NonFunctionKeys<mvc_model_base>>>;
	protected _event = new mk.event_target();
}
