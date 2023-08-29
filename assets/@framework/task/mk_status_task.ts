/**
 * 状态任务(类型安全)
 * @remarks
 * 封装 promise，防止重复调用 resolve 函数报错以及添加超时功能，可重复使用
 */
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
class mk_status_task<CT = void> {
	/**
	 * @param finish_b_ 完成状态
	 * @param init_config_ 初始化配置
	 */
	constructor(finish_b_: boolean, init_config_?: mk_status_task_.init_config<CT>) {
		this._finish_b = finish_b_;
		this._init_config = init_config_;

		if (this._finish_b) {
			this.task = new Promise<void>((resolve_f) => {
				resolve_f();
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
	 * - true：任务结束
	 * - false：任务进行中
	 */
	get finish_b(): boolean {
		return this._finish_b;
	}

	/* --------------- private --------------- */
	/** 完成状态 */
	private _finish_b = false;
	/** 完成回调 */
	private _finish_f: ((data: CT) => void) | null = null;
	/** 初始化配置 */
	private _init_config?: mk_status_task_.init_config<CT>;
	/** 超时倒计时 */
	private _timeout_timer: any;
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 完成任务
	 * @param finish_b_ 完成状态
	 */
	finish<T extends false>(finish_b_: T): void;
	/**
	 * 完成任务
	 * @param finish_b_ 完成状态
	 * @param data_ 完成数据
	 */
	finish<T extends true>(finish_b_: T, data_: CT): void;
	finish<T extends true | false>(finish_b_: T, data_?: CT): void {
		if (this._finish_b === finish_b_) {
			return;
		}

		if (finish_b_) {
			this._finish_f?.(data_!);
		} else {
			this._reset();
		}
	}

	/** 重置 */
	private _reset(): void {
		this._finish_b = false;
		this.task = new Promise<CT>((resolve_f) => {
			this._finish_f = (data) => {
				resolve_f(data);
				this._finish_b = true;
				this._finish_f = null;

				// 清理定时器
				if (this._timeout_timer) {
					clearTimeout(this._timeout_timer);
					this._timeout_timer = null;
				}
			};
		});

		// 超时定时器
		if (this._init_config?.timeout_ms_n !== undefined) {
			this._timeout_timer = setTimeout(() => {
				this._timeout_timer = null;
				this.finish(true, this._init_config!.timeout_return!);
			}, this._init_config.timeout_ms_n);
		}
	}
}

export namespace mk_status_task_ {
	/** 初始化配置 */
	export interface init_config<T> {
		/** 超时时间 */
		timeout_ms_n?: number;
		/** 超时返回数据 */
		timeout_return?: T;
	}
}

export default mk_status_task;
