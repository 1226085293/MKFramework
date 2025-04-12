import mk from "mk";
import tool from "../../../../../tool/tool";

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

export default mvc_model_base;
