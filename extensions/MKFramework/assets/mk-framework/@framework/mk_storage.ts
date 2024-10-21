import * as cc from "cc";
import mk_codec_base from "./mk_codec_base";
import mk_task_pipeline from "./task/mk_task_pipeline";

/**
 * 存储器（类型安全）
 * @noInheritDoc
 * @remarks
 * 注意：在未设置 name_s(存储器名) 之前，存储数据将不会被存储在硬盘，而是在内存中
 */
class mk_storage<CT extends Object> {
	constructor(init_: mk_storage_.init_config<CT>) {
		this._init_config = init_;

		if (typeof init_.write_interval_ms_n === "number") {
			this._write_pipeline.interval_ms_n = init_.write_interval_ms_n;
		}
	}

	/* --------------- public --------------- */

	/** 存储数据键 */
	key: { [k in keyof CT]: k } = new Proxy(Object.create(null), {
		get: (target, key) => key,
	});
	/** 存储器名 */
	get name_s(): string {
		return this._init_config.name_s ?? "";
	}
	set name_s(value_s_) {
		this._set_name_s(value_s_);
	}

	/** 写入间隔（毫秒） */
	get write_interval_ms_n(): number {
		return this._write_pipeline.interval_ms_n;
	}
	set write_interval_ms_n(value_n_: number) {
		this._write_pipeline.interval_ms_n = value_n_;
	}
	/* --------------- private --------------- */
	/** 初始化配置 */
	private _init_config: mk_storage_.init_config<CT>;
	/** 缓存数据 */
	private _cache: CT = Object.create(null);
	/** 写入任务 */
	private _write_pipeline = new mk_task_pipeline();
	/* ------------------------------- 功能 ------------------------------- */
	/** 清空所有存储器数据 */
	static clear(): void {
		cc.sys.localStorage.clear();
	}

	/**
	 * 设置存储数据
	 * @param key_ 存储键
	 * @param data_ 存储数据
	 * @returns 成功状态
	 */
	set<T extends keyof CT, T2 extends CT[T]>(key_: T, data_: T2): boolean {
		const key_s = String(key_);

		try {
			/** 存储数据 */
			const storage_data_s = JSON.stringify(data_);

			// 与本地数据一致
			if (this._cache[key_s] === storage_data_s) {
				return true;
			}

			// 录入缓存
			this._cache[key_s] = storage_data_s;
			// 写入本地
			this._write(key_s, storage_data_s);
		} catch (error) {
			return false;
		}

		return true;
	}

	/**
	 * 获取数据
	 * @param key_ 存储键
	 * @returns
	 */
	get<T extends keyof CT, T2 extends CT[T]>(key_: T): T2 | null {
		const key_s = String(key_);

		// 读取缓存数据
		if (this._cache[key_s] !== undefined) {
			return JSON.parse(this._cache[key_s]);
		}

		/** 存储数据 */
		let storage_s = !this._init_config.name_s ? null : cc.sys.localStorage.getItem(`${this._init_config.name_s}-${String(key_s)}`);

		// 不存在则创建新数据
		if (storage_s === null) {
			this.set(key_, this._init_config.data[key_]);

			return JSON.parse(this._cache[key_s]);
		}

		// 解码
		if (this._init_config.codec) {
			storage_s = this._init_config.codec.decode(storage_s) as string;
		}

		return JSON.parse(storage_s);
	}

	/**
	 * 删除数据
	 * @param key_ 存储键
	 */
	del<T extends keyof CT>(key_: T): void {
		let key_s = String(key_);

		this._cache[key_s] = undefined;

		if (!this._init_config.name_s) {
			return;
		}

		// 更新 key
		key_s = `${this._init_config.name_s}-${String(key_s)}`;
		// 删除数据
		this._write_pipeline.add(() => {
			cc.sys.localStorage.removeItem(key_s);
		});
	}

	/** 清空当前存储器数据 */
	clear(): void {
		for (const k_s in this._cache) {
			this._cache[k_s] = undefined!;
		}

		if (!this._init_config.name_s) {
			return;
		}

		Object.keys(this._init_config.data).forEach((v_s) => {
			const key_s = `${this._init_config.name_s}-${String(v_s)}`;

			this._write_pipeline.add(() => {
				cc.sys.localStorage.removeItem(key_s);
			});
		});
	}

	/**
	 * 写入数据到磁盘
	 * @param key_s_ 数据键
	 * @param data_s_ 写入数据
	 * @returns
	 */
	private _write(key_s_: string, data_s_: string): void {
		// 无存储器名不存储到本地
		if (!this._init_config.name_s) {
			return;
		}

		// 编码
		if (this._init_config.codec) {
			data_s_ = this._init_config.codec.encode(data_s_);
		}

		/** 存储 key */
		const key_s = `${this._init_config.name_s}-${String(key_s_)}`;

		// 写入数据
		this._write_pipeline.add(() => {
			cc.sys.localStorage.setItem(key_s, data_s_);
		});
	}
	/* ------------------------------- get/set ------------------------------- */
	private _set_name_s(value_s_: string): void {
		// 迁移缓存到本地
		if (!this._init_config.name_s) {
			this._init_config.name_s = value_s_;

			for (const k_s in this._cache) {
				// 已被删除
				if (this._cache[k_s] === undefined) {
					this.del(k_s);
				}
				// 写入
				else {
					this._write(k_s, this._cache[k_s] as string);
				}
			}

			return;
		}
		// 迁移本地到本地
		else {
			Object.keys(this._init_config.data).forEach((v_s) => {
				const data_s = cc.sys.localStorage.getItem(`${this._init_config.name_s}-${String(v_s)}`);

				if (data_s === null) {
					return;
				}

				const new_key_s = `${value_s_}-${String(v_s)}`;
				const old_key_s = `${this._init_config.name_s}-${String(v_s)}`;

				this._write_pipeline.add(() => {
					cc.sys.localStorage.setItem(new_key_s, data_s);
					cc.sys.localStorage.removeItem(old_key_s);
				});
			});

			this._init_config.name_s = value_s_;
		}
	}
}

export namespace mk_storage_ {
	export interface init_config<CT extends Object> {
		/** 存储器名 */
		name_s?: string;
		/** 存储数据 */
		data: CT;
		/** 编解码器 */
		codec?: mk_codec_base;
		/** 写入间隔（毫秒） */
		write_interval_ms_n?: number;
	}
}

export default mk_storage;
