import mk_tool from "../../@private/tool/mk_tool";
import mk_monitor from "../../mk_monitor";

abstract class mvc_model_base {
	constructor() {
		mk_tool.func.run_parent_func(this, ["open", "close"]);
	}
	/* ------------------------------- segmentation ------------------------------- */
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
		mk_tool.object.reset(this, true);
	}
}

export default mvc_model_base;
