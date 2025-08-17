import mkToolFunc from "../../@Private/Tool/MKToolFunc";
import mkToolObject from "../../@Private/Tool/MKToolObject";
/** @weak */
import mkMonitor from "../../MKMonitor";

abstract class MVCModelBase {
	constructor() {
		// 父类自启函数
		mkToolFunc.runParentFunc(this, ["open", "close"]);
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

	/** 打开回调
	 * @remarks
	 * 执行当前类静态函数 new 时调用
	 */
	open?(): void;

	/** 关闭回调
	 * @remarks
	 * 在 Control 关闭时被调用
	 */
	close(): void;
	async close(): Promise<void> {
		// @weak-start-include-MKMonitor
		// 取消数据监听事件
		{
			const task = mkMonitor.clear(this);

			if (task) {
				await task;
			}
		}
		// @weak-end

		// 重置数据
		if (this._isResetData) {
			mkToolObject.reset(this, true);
		}
	}
}

export default MVCModelBase;
