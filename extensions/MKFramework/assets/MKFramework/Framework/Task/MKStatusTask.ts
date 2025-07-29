/**
 * 状态任务（类型安全）
 * @remarks
 * 封装 promise，防止重复调用 resolve 函数报错以及添加超时功能，可重复使用
 */
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
class MKStatusTask<CT = void> {
	/**
	 * @param isFinish_ 完成状态
	 * @param initConfig_ 初始化配置
	 */
	constructor(isFinish_: boolean, initConfig_?: MKStatusTask_.InitConfig<CT>) {
		this._isFinish = isFinish_;
		this._initConfig = initConfig_;

		if (this._isFinish) {
			this.task = new Promise<void>((resolveFunc) => {
				resolveFunc();
			}) as any;
		} else {
			this._reset();
		}
	}

	/* --------------- public --------------- */
	/** 异步任务 */
	task!: Promise<CT>;
	/**
	 * 完成状态
	 * @remarks
	 *
	 * - true：任务结束
	 *
	 * - false：任务进行中
	 */
	get isFinish(): boolean {
		return this._isFinish;
	}

	/* --------------- private --------------- */
	/** 完成状态 */
	private _isFinish = false;
	/** 完成回调 */
	private _finishFunc: ((data: CT) => void) | null = null;
	/** 初始化配置 */
	private _initConfig?: MKStatusTask_.InitConfig<CT>;
	/** 超时倒计时 */
	private _timeoutTimer: any;
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 完成任务
	 * @param isFinish_ 完成状态
	 */
	finish<T extends false>(isFinish_: T): void;
	/**
	 * 完成任务
	 * @param isFinish_ 完成状态
	 * @param data_ 完成数据
	 */
	finish<T extends true>(isFinish_: T, data_: CT): void;
	finish<T extends true | false>(isFinish_: T, data_?: CT): void {
		if (this._isFinish === isFinish_) {
			return;
		}

		if (isFinish_) {
			this._finishFunc?.(data_!);
		} else {
			this._reset();
		}
	}

	/** 重置 */
	private _reset(): void {
		this._isFinish = false;
		this.task = new Promise<CT>((resolveFunc) => {
			this._finishFunc = (data) => {
				resolveFunc(data);
				this._isFinish = true;
				this._finishFunc = null;

				// 清理定时器
				if (this._timeoutTimer) {
					clearTimeout(this._timeoutTimer);
					this._timeoutTimer = null;
				}
			};
		});

		// 超时定时器
		if (this._initConfig?.timeoutMsNum !== undefined && this._initConfig.timeoutMsNum > 0) {
			this._timeoutTimer = setTimeout(() => {
				this._timeoutTimer = null;
				this.finish(true, this._initConfig!.timeoutReturn!);
			}, this._initConfig.timeoutMsNum);
		}
	}
}

export namespace MKStatusTask_ {
	/** 初始化配置 */
	export interface InitConfig<T> {
		/** 超时时间 */
		timeoutMsNum?: number;
		/** 超时返回数据 */
		timeoutReturn?: T;
	}
}

export default MKStatusTask;
