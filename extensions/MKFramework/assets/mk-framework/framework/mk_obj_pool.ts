import { mk_log } from "./mk_logger";
import mk_task from "./task/mk_task";

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
		/** 销毁回调 */
		destroy_f?: () => void | Promise<void>;
		/**
		 * 最小保留数量
		 * @remarks
		 * 池内对象小于此数量时扩充
		 */
		min_hold_n? = 1;
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
			/** 销毁回调 */
			destroy_f?: () => void;
			/**
			 * 最小保留数量
			 * @remarks
			 * 池内对象小于此数量时扩充
			 */
			min_hold_n? = 1;
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

/** 异步对象池 */
class mk_obj_pool<CT> {
	constructor(init_: _mk_obj_pool.config<CT>) {
		this.config = new _mk_obj_pool.config(init_);
		if (this.config.init_fill_n! > 0) {
			this._add(this.config.init_fill_n).then(() => {
				this.init_task.finish(true);
			});
		}
	}

	/* --------------- public --------------- */
	/** 初始化数据 */
	config!: _mk_obj_pool.config<CT>;
	/** 初始化任务 */
	init_task = new mk_task.status(false);
	/** 有效状态 */
	get valid_b(): boolean {
		return this._valid_b;
	}

	/* --------------- private --------------- */
	/** 有效状态 */
	private _valid_b = true;
	/** 对象存储列表 */
	private _obj_as: CT[] = [];
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 导入对象
	 * @param obj_ 添加对象
	 * @returns
	 */
	async put(obj_: any): Promise<void> {
		if (!this._valid_b) {
			mk_log.warn("对象池失效");

			this.config.clear_f?.([obj_]);

			return;
		}

		if (!obj_) {
			return;
		}

		this._obj_as.push(this.config.reset_f ? await this.config.reset_f(obj_, false) : obj_);
		// 检查保留数量
		if (this.config.max_hold_n !== -1 && this._obj_as.length > this.config.max_hold_n!) {
			this._del(0, this._obj_as.length - this.config.max_hold_n!);
		}

		// 失效直接销毁
		if (!this._valid_b) {
			await this.clear();
		}
	}

	/** 同步获取对象 */
	get_sync(): CT | null {
		if (!this._valid_b) {
			mk_log.warn("对象池失效");

			return null!;
		}

		// 扩充
		if (this._obj_as.length - 1 < this.config.min_hold_n!) {
			this._add(this.config.min_hold_n! - this._obj_as.length + 1);
		}

		// 检查容量
		if (!this._obj_as.length) {
			return null!;
		}

		return this._obj_as.pop()!;
	}

	/** 获取对象 */
	async get(): Promise<CT> {
		if (!this._valid_b) {
			mk_log.warn("对象池失效");

			return null!;
		}

		// 扩充
		if (this._obj_as.length - 1 < this.config.min_hold_n!) {
			await this._add(this.config.min_hold_n! - this._obj_as.length + 1);
		}

		if (!this._valid_b) {
			mk_log.warn("对象池失效");
			this.clear();

			return null!;
		}

		return this._obj_as.pop()!;
	}

	/** 清空数据 */
	async clear(): Promise<void> {
		const obj_as = this._obj_as.splice(0, this._obj_as.length);

		if (obj_as.length) {
			await this.config.clear_f?.(obj_as);
		}
	}

	/**
	 * 销毁对象池
	 * @remarks
	 * 销毁后将无法 get/put
	 */
	async destroy(): Promise<void> {
		this._valid_b = false;
		await this.clear();
		await this.config.destroy_f?.();
	}

	/** 添加对象 */
	private async _add(fill_n_ = this.config.min_hold_n! - this._obj_as.length): Promise<void> {
		if (this.config.reset_f) {
			for (let k_n = 0; k_n < fill_n_; ++k_n) {
				this._obj_as.push(await this.config.reset_f(await this.config.create_f(), true));
			}
		} else {
			for (let k_n = 0; k_n < fill_n_; ++k_n) {
				this._obj_as.push(await this.config.create_f());
			}
		}
	}

	/** 删除对象 */
	private _del(start_n_: number, end_n_: number): void {
		const obj_as = this._obj_as.splice(start_n_, end_n_ - start_n_);

		if (obj_as.length) {
			this.config.clear_f?.(obj_as);
		}
	}
}

namespace mk_obj_pool {
	/** 同步对象池 */
	export class sync<CT> {
		constructor(init_?: _mk_obj_pool.sync.config<CT>) {
			this.config = new _mk_obj_pool.sync.config(init_);
			if (this.config.init_fill_n! > 0) {
				this._add(this.config.init_fill_n);
			}
		}

		/* --------------- public --------------- */
		/** 初始化数据 */
		config!: _mk_obj_pool.sync.config<CT>;
		/** 有效状态 */
		get valid_b(): boolean {
			return this._valid_b;
		}

		/* --------------- private --------------- */
		/** 有效状态 */
		private _valid_b = true;
		/** 对象存储列表 */
		private _obj_as: CT[] = [];
		/* ------------------------------- 功能 ------------------------------- */
		/** 导入对象 */
		put(obj_: CT): void {
			if (!this._valid_b) {
				mk_log.warn("对象池失效");

				this.config.clear_f?.([obj_]);

				return;
			}

			if (!obj_) {
				return;
			}

			this._obj_as.push(this.config.reset_f ? this.config.reset_f(obj_, false) : obj_);
			// 检查保留数量
			if (this.config.max_hold_n !== -1 && this._obj_as.length > this.config.max_hold_n!) {
				this._del(0, this._obj_as.length - this.config.max_hold_n!);
			}
		}

		/** 获取对象 */
		get(): CT {
			if (!this._valid_b) {
				mk_log.warn("对象池失效");

				return null!;
			}

			// 扩充
			if (this._obj_as.length - 1 < this.config.min_hold_n!) {
				this._add(this.config.min_hold_n! - this._obj_as.length + 1);
			}

			// 检查容量
			if (!this._obj_as.length) {
				this._add(1);
			}

			return this._obj_as.pop()!;
		}

		/** 清空数据 */
		clear(): void {
			const obj_as = this._obj_as.splice(0, this._obj_as.length);

			if (obj_as.length) {
				this.config.clear_f?.(obj_as);
			}
		}

		/**
		 * 销毁对象池
		 * @remarks
		 * 销毁后将无法 get/put
		 */
		destroy(): void {
			this._valid_b = false;
			this.clear();
			this.config.destroy_f?.();
		}

		/** 添加对象 */
		private _add(fill_n_ = this.config.min_hold_n! - this._obj_as.length): void {
			if (this.config.reset_f) {
				for (let k_n = 0; k_n < fill_n_; ++k_n) {
					this._obj_as.push(this.config.reset_f(this.config.create_f(), true));
				}
			} else {
				for (let k_n = 0; k_n < fill_n_; ++k_n) {
					this._obj_as.push(this.config.create_f());
				}
			}
		}

		/** 删除对象 */
		private _del(start_n_: number, end_n_: number): void {
			const obj_as = this._obj_as.splice(start_n_, end_n_ - start_n_);

			if (obj_as.length) {
				this.config.clear_f?.(obj_as);
			}
		}
	}
}

export namespace mk_obj_pool_ {}

export default mk_obj_pool;
