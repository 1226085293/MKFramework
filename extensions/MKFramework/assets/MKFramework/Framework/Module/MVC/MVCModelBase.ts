import MKTool from "../../@Private/Tool/MKTool";
import MKMonitor from "../../MKMonitor";

abstract class MVCModelBase {
	constructor() {
		// 父类自启函数
		MKTool.func.runParentFunc(this, ["open", "close"]);
	}
	/**
	 * 重置 data
	 * @remarks
	 * close 后重置 this.data，data 必须为 class 类型
	 */
	protected _isResetData = true;
	/* ------------------------------- segmentation ------------------------------- */
	/** 创建模型实例 */
	static async new<T extends new (...argsList: any[]) => any>(this: T, ...argsList_: ConstructorParameters<T>): Promise<InstanceType<T>> {
		const self = this as any;
		const model = new self(...argsList_) as MVCModelBase;

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
			const task = MKMonitor.clear(this);

			if (task) {
				await task;
			}
		}

		// 重置数据
		if (this._isResetData) {
			MKTool.object.reset(this, true);
		}
	}
}

export default MVCModelBase;
