import MKTool from "../../@Private/Tool/MKTool";
import mk_monitor from "../../MKMonitor";

abstract class mvc_model_base {
	constructor() {
		// 父类自启函数
		MKTool.func.runParentFunc(this, ["open", "close"]);
	}
	/**
	 * 重置 data
	 * @remarks
	 * close 后重置 this.data，data 必须为 class 类型
	 */
	protected _reset_data_b = true;
	/* ------------------------------- segmentation ------------------------------- */
	/** 创建模型实例 */
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
			MKTool.object.reset(this, true);
		}
	}
}

export default mvc_model_base;
