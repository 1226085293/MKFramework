import { sys } from "cc";
import MKCodecBase from "./MKCodecBase";
import MKTaskPipeline from "./Task/MKTaskPipeline";

/**
 * 存储器（类型安全）
 * @noInheritDoc
 * @remarks
 * 注意：在未设置 nameStr(存储器名) 之前，存储数据将不会被存储在硬盘，而是在内存中
 */
class MKStorage<CT extends Object> {
	constructor(init_: MKStorage_.InitConfig<CT>) {
		this._initConfig = init_;

		if (typeof init_.writeIntervalMsNum === "number") {
			this._writePipeline.intervalMsNum = init_.writeIntervalMsNum;
		}
	}

	/* --------------- public --------------- */

	/** 存储数据键 */
	key: { [k in keyof CT]: k } = new Proxy(Object.create(null), {
		get: (target, key) => key,
	});
	/** 存储器名 */
	get nameStr(): string {
		return this._initConfig.nameStr ?? "";
	}
	set nameStr(valueStr_) {
		this._setNameStr(valueStr_);
	}

	/** 写入间隔（毫秒） */
	get writeIntervalMsNum(): number {
		return this._writePipeline.intervalMsNum;
	}
	set writeIntervalMsNum(valueNum_: number) {
		this._writePipeline.intervalMsNum = valueNum_;
	}
	/* --------------- private --------------- */
	/** 初始化配置 */
	private _initConfig: MKStorage_.InitConfig<CT>;
	/** 缓存数据 */
	private _cache: CT = Object.create(null);
	/** 写入任务 */
	private _writePipeline = new MKTaskPipeline();
	/* ------------------------------- 功能 ------------------------------- */
	/** 清空所有存储器数据 */
	static clear(): void {
		sys.localStorage.clear();
	}

	/**
	 * 设置存储数据
	 * @param key_ 存储键
	 * @param data_ 存储数据
	 * @returns 成功状态
	 */
	set<T extends keyof CT, T2 extends CT[T]>(key_: T, data_: T2): boolean {
		const keyStr = String(key_);

		try {
			/** 存储数据 */
			const storageDataStr = JSON.stringify(data_);

			// 与本地数据一致
			if (this._cache[keyStr] === storageDataStr) {
				return true;
			}

			// 录入缓存
			this._cache[keyStr] = storageDataStr;
			// 写入本地
			this._write(keyStr, storageDataStr);
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
		const keyStr = String(key_);

		// 读取缓存数据
		if (this._cache[keyStr] !== undefined) {
			return JSON.parse(this._cache[keyStr]);
		}

		/** 存储数据 */
		let storageStr = !this._initConfig.nameStr ? null : sys.localStorage.getItem(`${this._initConfig.nameStr}-${String(keyStr)}`);

		// 不存在则创建新数据
		if (storageStr === null) {
			if (this._initConfig.data[key_] === undefined) {
				return null;
			}

			this.set(key_, this._initConfig.data[key_]);

			return JSON.parse(this._cache[keyStr]);
		}

		// 解码
		if (this._initConfig.codec) {
			storageStr = this._initConfig.codec.decode(storageStr) as string;
		}

		return JSON.parse(storageStr);
	}

	/**
	 * 删除数据
	 * @param key_ 存储键
	 */
	del<T extends keyof CT>(key_: T): void {
		let keyStr = String(key_);

		this._cache[keyStr] = undefined;

		if (!this._initConfig.nameStr) {
			return;
		}

		// 更新 key
		keyStr = `${this._initConfig.nameStr}-${String(keyStr)}`;
		// 删除数据
		this._writePipeline.add(() => {
			sys.localStorage.removeItem(keyStr);
		});
	}

	/** 清空当前存储器数据 */
	clear(): void {
		for (const kStr in this._cache) {
			this._cache[kStr] = undefined!;
		}

		if (!this._initConfig.nameStr) {
			return;
		}

		Object.keys(this._initConfig.data).forEach((vStr) => {
			const keyStr = `${this._initConfig.nameStr}-${String(vStr)}`;

			this._writePipeline.add(() => {
				sys.localStorage.removeItem(keyStr);
			});
		});
	}

	/**
	 * 写入数据到磁盘
	 * @param keyStr_ 数据键
	 * @param dataStr_ 写入数据
	 * @returns
	 */
	private _write(keyStr_: string, dataStr_: string): void {
		// 无存储器名不存储到本地
		if (!this._initConfig.nameStr) {
			return;
		}

		// 编码
		if (this._initConfig.codec) {
			dataStr_ = this._initConfig.codec.encode(dataStr_);
		}

		/** 存储 key */
		const keyStr = `${this._initConfig.nameStr}-${String(keyStr_)}`;

		// 写入数据
		this._writePipeline.add(() => {
			sys.localStorage.setItem(keyStr, dataStr_);
		});
	}
	/* ------------------------------- get/set ------------------------------- */
	private _setNameStr(valueStr_: string): void {
		// 迁移缓存到本地
		if (!this._initConfig.nameStr) {
			this._initConfig.nameStr = valueStr_;

			for (const kStr in this._cache) {
				// 已被删除
				if (this._cache[kStr] === undefined) {
					this.del(kStr);
				}
				// 写入
				else {
					this._write(kStr, this._cache[kStr] as string);
				}
			}

			return;
		}
		// 迁移本地到本地
		else {
			Object.keys(this._initConfig.data).forEach((vStr) => {
				const dataStr = sys.localStorage.getItem(`${this._initConfig.nameStr}-${String(vStr)}`);

				if (dataStr === null) {
					return;
				}

				const newKeyStr = `${valueStr_}-${String(vStr)}`;
				const oldKeyStr = `${this._initConfig.nameStr}-${String(vStr)}`;

				this._writePipeline.add(() => {
					sys.localStorage.setItem(newKeyStr, dataStr);
					sys.localStorage.removeItem(oldKeyStr);
				});
			});

			this._initConfig.nameStr = valueStr_;
		}
	}
}

export namespace MKStorage_ {
	export interface InitConfig<CT extends Object> {
		/** 存储器名 */
		nameStr?: string;
		/** 存储数据 */
		data: CT;
		/** 编解码器 */
		codec?: MKCodecBase;
		/** 写入间隔（毫秒） */
		writeIntervalMsNum?: number;
	}
}

export default MKStorage;
