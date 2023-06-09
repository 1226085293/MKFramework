namespace _mk_obj_pool {
	/** 配置 */
	export class config<CT> {
		constructor(init_?: config<CT>) {
			Object.assign(this, init_);
		}

		/** 返回新对象 */
		create_f!: () => CT | Promise<CT>;
		/**
		 * 重置对象
		 * @remarks
		 * 在 create_f 后以及 put 时调用
		 */
		reset_f?: (obj: CT, create_b: boolean) => CT | Promise<CT>;
		/** 释放回调 */
		clear_f?: (obj_as: CT[]) => void | Promise<void>;
		/**
		 * 剩余对象池数量不足时扩充数量
		 * @defaultValue 32
		 */
		fill_n? = 32;
		/**
		 * 最大保留数量
		 * @remarks
		 * 可节省内存占用，-1为不启用
		 * @defaultValue
		 * -1
		 */
		max_hold_n? = -1;
		/**
		 * 初始化扩充数量
		 * @defaultValue
		 * 0
		 */
		init_fill_n? = 0;
	}
	/** 同步模块 */
	export namespace sync {
		/** 配置 */
		export class config<CT> {
			constructor(init_?: config<CT>) {
				Object.assign(this, init_);
			}

			/** 返回新对象 */
			create_f!: () => CT;
			/**
			 * 重置对象
			 * @remarks
			 * 在 create_f 后以及 put 时调用
			 */
			reset_f?: (obj: CT, create_b: boolean) => CT;
			/** 释放回调 */
			clear_f?: (obj_as: CT[]) => void;
			/**
			 * 剩余对象池数量不足时扩充数量
			 * @defaultValue 32
			 */
			fill_n? = 32;
			/**
			 * 最大保留数量
			 * @remarks
			 * 可节省内存占用，-1为不启用
			 * @defaultValue
			 * -1
			 */
			max_hold_n? = -1;
			/**
			 * 初始化扩充数量
			 * @defaultValue
			 * 0
			 */
			init_fill_n? = 0;
		}
	}
}

/** 对象池（异步） */
class mk_obj_pool<CT> {
	constructor(init_: _mk_obj_pool.config<CT>) {
		this._init_data = new _mk_obj_pool.config(init_);
		if (this._init_data.init_fill_n! > 0) {
			this._add(this._init_data.init_fill_n);
		}
	}

	/* --------------- private --------------- */
	/** 对象存储列表 */
	private _obj_as: CT[] = [];
	/** 初始化数据 */
	private _init_data!: _mk_obj_pool.config<CT>;
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 导入对象
	 * @param obj_ 添加对象
	 * @returns
	 */
	async put(obj_: any): Promise<void> {
		if (!obj_) {
			return;
		}

		this._obj_as.push(this._init_data.reset_f ? await this._init_data.reset_f(obj_, false) : obj_);
		// 检查保留数量
		if (this._init_data.max_hold_n !== -1 && this._obj_as.length > this._init_data.max_hold_n!) {
			this._del(0, this._obj_as.length - this._init_data.max_hold_n!);
		}
	}

	/** 获取对象 */
	async get(): Promise<CT> {
		// 检查容量
		if (!this._obj_as.length) {
			await this._add();
		}

		return this._obj_as.pop()!;
	}

	/** 清空数据 */
	async clear(): Promise<void> {
		const obj_as = this._obj_as.splice(0, this._obj_as.length);

		if (obj_as.length) {
			await this._init_data.clear_f?.(obj_as);
		}
	}

	/** 添加对象 */
	private async _add(fill_n_ = this._init_data.fill_n!): Promise<void> {
		if (this._init_data.reset_f) {
			for (let k_n = 0; k_n < fill_n_; ++k_n) {
				this._obj_as.push(await this._init_data.reset_f(await this._init_data.create_f(), true));
			}
		} else {
			for (let k_n = 0; k_n < fill_n_; ++k_n) {
				this._obj_as.push(await this._init_data.create_f());
			}
		}
	}

	/** 删除对象 */
	private _del(start_n_: number, end_n_: number): void {
		const obj_as = this._obj_as.splice(start_n_, end_n_ - start_n_);

		if (obj_as.length) {
			this._init_data.clear_f?.(obj_as);
		}
	}
}

namespace mk_obj_pool {
	/** 对象池（同步） */
	export class sync<CT> {
		constructor(init_?: _mk_obj_pool.sync.config<CT>) {
			this._init_data = new _mk_obj_pool.sync.config(init_);
			if (this._init_data.init_fill_n! > 0) {
				this._add(this._init_data.init_fill_n);
			}
		}

		/* --------------- private --------------- */
		/** 对象存储列表 */
		private _obj_as: CT[] = [];
		/** 初始化数据 */
		private _init_data!: _mk_obj_pool.sync.config<CT>;
		/* ------------------------------- 功能 ------------------------------- */
		/** 导入对象 */
		put(obj_: CT): void {
			if (!obj_) {
				return;
			}

			this._obj_as.push(this._init_data.reset_f ? this._init_data.reset_f(obj_, false) : obj_);
			// 检查保留数量
			if (this._init_data.max_hold_n !== -1 && this._obj_as.length > this._init_data.max_hold_n!) {
				this._del(0, this._obj_as.length - this._init_data.max_hold_n!);
			}
		}

		/** 获取对象 */
		get(): CT {
			// 检查容量
			if (!this._obj_as.length) {
				this._add();
			}

			return this._obj_as.pop()!;
		}

		/** 清空数据 */
		clear(): void {
			const obj_as = this._obj_as.splice(0, this._obj_as.length);

			if (obj_as.length) {
				this._init_data.clear_f?.(obj_as);
			}
		}

		/** 添加对象 */
		private _add(fill_n_ = this._init_data.fill_n!): void {
			if (this._init_data.reset_f) {
				for (let k_n = 0; k_n < fill_n_; ++k_n) {
					this._obj_as.push(this._init_data.reset_f(this._init_data.create_f(), true));
				}
			} else {
				for (let k_n = 0; k_n < fill_n_; ++k_n) {
					this._obj_as.push(this._init_data.create_f());
				}
			}
		}

		/** 删除对象 */
		private _del(start_n_: number, end_n_: number): void {
			const obj_as = this._obj_as.splice(start_n_, end_n_ - start_n_);

			if (obj_as.length) {
				this._init_data.clear_f?.(obj_as);
			}
		}
	}
}

export namespace mk_obj_pool_ {}

export default mk_obj_pool;
