import mk from "mk";
import mvc_model_base from "./mvc_model_base";
import mvc_view_base from "./mvc_view_base";
import tool from "../../../../../tool/tool";

type RecursiveReadonly<T> = {
	readonly [P in keyof T]: RecursiveReadonly<T[P]>;
};

class mvc_control_base {
	constructor() {
		this.open?.();
		tool.func.run_parent_func(this, ["open", "close"]);
	}

	protected _model?: mvc_model_base;
	protected _view?: mvc_view_base;

	protected open?(): void;
	close(): void {
		mk.monitor.clear(this);
		this._model?.close();
		if (this._view) {
			mk.ui_manage.close(this._view);
		}
	}
}

export default mvc_control_base;
