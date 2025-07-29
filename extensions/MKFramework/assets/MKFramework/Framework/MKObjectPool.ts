import { mkLog } from "./MKLogger";
import MKStatusTask from "./Task/MKStatusTask";

namespace _MKObjectPool {
	/** 配置 */
	export class Config<CT> {
		constructor(init_?: Config<CT>) {
			Object.assign(this, init_);
		}

		/** 返回新对象 */
		createFunc!: () => CT | Promise<CT>;
		/**
		 * 重置对象
		 * @remarks
		 * 在 create_f 后以及 put 时调用
		 */
		resetFunc?: (object: CT, create_b: boolean) => CT | Promise<CT>;
		/** 释放回调 */
		clearFunc?: (objectList: CT[]) => void | Promise<void>;
		/** 销毁回调 */
		destroyFunc?: () => void | Promise<void>;
		/**
		 * 最小保留数量
		 * @remarks
		 * 池内对象小于此数量时扩充
		 */
		minHoldNum? = 1;
		/**
		 * 最大保留数量
		 * @remarks
		 * 可节省内存占用，-1为不启用
		 * @defaultValue
		 * -1
		 */
		maxHoldNum? = -1;
		/**
		 * 初始化扩充数量
		 * @defaultValue
		 * 0
		 */
		initFillNum? = 0;
	}

	/** 同步模块 */
	export namespace Sync {
		/** 配置 */
		export class Config<CT> {
			constructor(init_?: Config<CT>) {
				Object.assign(this, init_);
			}

			/** 返回新对象 */
			createFunc!: () => CT;
			/**
			 * 重置对象
			 * @remarks
			 * 在 create_f 后以及 put 时调用
			 */
			resetFunc?: (object: CT, create_b: boolean) => CT;
			/** 释放回调 */
			clearFunc?: (objectList: CT[]) => void;
			/** 销毁回调 */
			destroyFunc?: () => void;
			/**
			 * 最小保留数量
			 * @remarks
			 * 池内对象小于此数量时扩充
			 */
			minHoldNum? = 1;
			/**
			 * 最大保留数量
			 * @remarks
			 * 可节省内存占用，-1为不启用
			 * @defaultValue
			 * -1
			 */
			maxHoldNum? = -1;
			/**
			 * 初始化扩充数量
			 * @defaultValue
			 * 0
			 */
			initFillNum? = 0;
		}
	}
}

/** 异步对象池 */
class MKObjectPool<CT> {
	constructor(init_: _MKObjectPool.Config<CT>) {
		this.config = new _MKObjectPool.Config(init_);
		if (this.config.initFillNum! > 0) {
			this._add(this.config.initFillNum).then(() => {
				this.initTask.finish(true);
			});
		}
	}

	/* --------------- public --------------- */
	/** 初始化数据 */
	config!: _MKObjectPool.Config<CT>;
	/** 初始化任务 */
	initTask = new MKStatusTask(false);
	/** 有效状态 */
	get isValid(): boolean {
		return this._isValid;
	}

	/* --------------- private --------------- */
	/** 有效状态 */
	private _isValid = true;
	/** 对象存储列表 */
	private _objectList: CT[] = [];
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 导入对象
	 * @param object_ 添加对象
	 * @returns
	 */
	async put(object_: any): Promise<void> {
		if (!this._isValid) {
			mkLog.warn("对象池失效");

			this.config.clearFunc?.([object_]);

			return;
		}

		if (!object_) {
			return;
		}

		this._objectList.push(this.config.resetFunc ? await this.config.resetFunc(object_, false) : object_);
		// 检查保留数量
		if (this.config.maxHoldNum !== -1 && this._objectList.length > this.config.maxHoldNum!) {
			this._del(0, this._objectList.length - this.config.maxHoldNum!);
		}

		// 失效直接销毁
		if (!this._isValid) {
			await this.clear();
		}
	}

	/** 同步获取对象 */
	getSync(): CT | null {
		if (!this._isValid) {
			mkLog.warn("对象池失效");

			return null!;
		}

		// 扩充
		if (this._objectList.length - 1 < this.config.minHoldNum!) {
			this._add(this.config.minHoldNum! - this._objectList.length + 1);
		}

		// 检查容量
		if (!this._objectList.length) {
			return null!;
		}

		return this._objectList.pop()!;
	}

	/** 获取对象 */
	async get(): Promise<CT> {
		if (!this._isValid) {
			mkLog.warn("对象池失效");

			return null!;
		}

		// 扩充
		if (this._objectList.length - 1 < this.config.minHoldNum!) {
			await this._add(this.config.minHoldNum! - this._objectList.length + 1);
		}

		if (!this._isValid) {
			mkLog.warn("对象池失效");
			this.clear();

			return null!;
		}

		return this._objectList.pop()!;
	}

	/** 清空数据 */
	async clear(): Promise<void> {
		const objectList = this._objectList.splice(0, this._objectList.length);

		if (objectList.length) {
			await this.config.clearFunc?.(objectList);
		}
	}

	/**
	 * 销毁对象池
	 * @remarks
	 * 销毁后将无法 get/put
	 */
	async destroy(): Promise<void> {
		this._isValid = false;
		await this.clear();
		await this.config.destroyFunc?.();
	}

	/** 添加对象 */
	private async _add(fillNum_ = this.config.minHoldNum! - this._objectList.length): Promise<void> {
		if (this.config.resetFunc) {
			for (let kNum = 0; kNum < fillNum_; ++kNum) {
				this._objectList.push(await this.config.resetFunc(await this.config.createFunc(), true));
			}
		} else {
			for (let kNum = 0; kNum < fillNum_; ++kNum) {
				this._objectList.push(await this.config.createFunc());
			}
		}
	}

	/** 删除对象 */
	private _del(startNum_: number, endNum_: number): void {
		const objectList = this._objectList.splice(startNum_, endNum_ - startNum_);

		if (objectList.length) {
			this.config.clearFunc?.(objectList);
		}
	}
}

namespace MKObjectPool {
	/** 同步对象池 */
	export class Sync<CT> {
		constructor(init_?: _MKObjectPool.Sync.Config<CT>) {
			this.config = new _MKObjectPool.Sync.Config(init_);
			if (this.config.initFillNum! > 0) {
				this._add(this.config.initFillNum);
			}
		}

		/* --------------- public --------------- */
		/** 初始化数据 */
		config!: _MKObjectPool.Sync.Config<CT>;
		/** 有效状态 */
		get isValid(): boolean {
			return this._isValid;
		}

		/* --------------- private --------------- */
		/** 有效状态 */
		private _isValid = true;
		/** 对象存储列表 */
		private _objectList: CT[] = [];
		/* ------------------------------- 功能 ------------------------------- */
		/** 导入对象 */
		put(object_: CT): void {
			if (!this._isValid) {
				mkLog.warn("对象池失效");

				this.config.clearFunc?.([object_]);

				return;
			}

			if (!object_) {
				return;
			}

			this._objectList.push(this.config.resetFunc ? this.config.resetFunc(object_, false) : object_);
			// 检查保留数量
			if (this.config.maxHoldNum !== -1 && this._objectList.length > this.config.maxHoldNum!) {
				this._del(0, this._objectList.length - this.config.maxHoldNum!);
			}
		}

		/** 获取对象 */
		get(): CT {
			if (!this._isValid) {
				mkLog.warn("对象池失效");

				return null!;
			}

			// 扩充
			if (this._objectList.length - 1 < this.config.minHoldNum!) {
				this._add(this.config.minHoldNum! - this._objectList.length + 1);
			}

			// 检查容量
			if (!this._objectList.length) {
				this._add(1);
			}

			return this._objectList.pop()!;
		}

		/** 清空数据 */
		clear(): void {
			const objectList = this._objectList.splice(0, this._objectList.length);

			if (objectList.length) {
				this.config.clearFunc?.(objectList);
			}
		}

		/**
		 * 销毁对象池
		 * @remarks
		 * 销毁后将无法 get/put
		 */
		destroy(): void {
			this._isValid = false;
			this.clear();
			this.config.destroyFunc?.();
		}

		/** 添加对象 */
		private _add(fillNum_ = this.config.minHoldNum! - this._objectList.length): void {
			if (this.config.resetFunc) {
				for (let kNum = 0; kNum < fillNum_; ++kNum) {
					this._objectList.push(this.config.resetFunc(this.config.createFunc(), true));
				}
			} else {
				for (let kNum = 0; kNum < fillNum_; ++kNum) {
					this._objectList.push(this.config.createFunc());
				}
			}
		}

		/** 删除对象 */
		private _del(startNum_: number, endNum_: number): void {
			const objectList = this._objectList.splice(startNum_, endNum_ - startNum_);

			if (objectList.length) {
				this.config.clearFunc?.(objectList);
			}
		}
	}
}

export default MKObjectPool;
