class lib_log {
	constructor(name_s_: string) {
		this._name_s = name_s_;
		this._head_s = this._name_s;
	}

	/** 打印名 */
	private _name_s: string;
	/** 打印头 */
	private _head_s: string;
	/* ------------------------------- 功能函数 ------------------------------- */
	log(...args_as_: any[]): void {
		console.log(`[${this._head_s}]`, ...args_as_);
	}

	warn(...args_as_: any[]): void {
		console.warn(`[${this._head_s}]`, ...args_as_);
	}

	error(...args_as_: any[]): void {
		console.error(`[${this._head_s}]`, ...args_as_);
	}
}

export default lib_log;
