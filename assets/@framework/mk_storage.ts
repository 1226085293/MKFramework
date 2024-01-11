import * as cc from "cc";
import { NATIVE } from "cc/env";
import mk_codec_base from "./mk_codec_base";

namespace _mk_storage {
	/** 存储根路径 */
	export const storage_path_s = cc.native?.fileUtils?.getWritablePath ? cc.native.fileUtils.getWritablePath() + "/storage_data" : "";
}

/**
 * 存储器（类型安全）
 * @noInheritDoc
 * @remarks
 *
 * - (原生/web)接口分离，获得更高的性能
 */
class mk_storage<CT extends Object> {
	constructor(init_: mk_storage_.init_config<CT>) {
		this._init_config = init_;

		// 创建存储目录
		if (NATIVE && !cc.native.fileUtils.isDirectoryExist(this._storage_path_s)) {
			cc.native.fileUtils.createDirectory(this._storage_path_s);
		}
	}

	/* --------------- public --------------- */
	/** 存储数据键 */
	key: { [k in keyof CT]: k } = new Proxy(Object.create(null), {
		get: (target, key) => key,
	});

	/* --------------- private --------------- */
	/** 初始化配置 */
	private _init_config: mk_storage_.init_config<CT>;
	/** 缓存数据 */
	private _cache: CT = Object.create(null);
	/** 当前存储路径 */
	private get _storage_path_s(): string {
		return _mk_storage.storage_path_s + "/" + this._init_config.name_s;
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 清空所有存储器数据 */
	static clear(): void {
		if (NATIVE) {
			cc.native.fileUtils.removeDirectory(_mk_storage.storage_path_s);
		} else {
			cc.sys.localStorage.clear();
		}
	}

	/**
	 * 设置存储数据
	 * @param key_ 存储键
	 * @param data_ 存储数据
	 * @param effective_time_ms_n_ 失效时间
	 * @returns storage.status
	 */
	set<T extends keyof CT>(key_: T, data_: any): boolean {
		const key_s = String(key_);

		try {
			/** 存储数据 */
			let storage_data_s = JSON.stringify(data_);

			// 与本地数据一致
			if (this._cache[key_s] === storage_data_s) {
				return true;
			}

			// 录入缓存
			this._cache[key_s] = storage_data_s;

			// 编码
			if (this._init_config.codec) {
				storage_data_s = this._init_config.codec.encode(storage_data_s);
			}

			// 写入数据
			if (NATIVE) {
				cc.native.fileUtils.writeStringToFile(storage_data_s, this._storage_path_s + "/" + key_s);
			} else {
				cc.sys.localStorage.setItem(key_s, storage_data_s);
			}
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
	get<T extends keyof CT, T2 extends CT[T]>(key_: T): T2 {
		const key_s = String(key_);

		// 读取缓存数据
		if (this._cache[key_s] !== undefined) {
			return JSON.parse(this._cache[key_s]);
		}

		/** 存储数据 */
		let storage_s!: string;

		// 读取文件数据
		{
			if (NATIVE) {
				storage_s = cc.native.fileUtils.getStringFromFile(this._storage_path_s + "/" + key_s);
			} else {
				storage_s = cc.sys.localStorage.getItem(key_s) ?? "";
			}
		}

		// 不存在则创建新数据
		if (!storage_s) {
			this.set(key_, this._init_config.data[key_]);

			return JSON.parse(this._cache[key_s]);
		}

		// 解码
		if (this._init_config.codec) {
			storage_s = this._init_config.codec.decode(storage_s);
		}

		return JSON.parse(storage_s);
	}

	/**
	 * 删除数据
	 * @param key_ 存储键
	 */
	del<T extends keyof CT>(key_: T): void {
		const key_s = String(key_);

		if (NATIVE) {
			cc.native.fileUtils.removeFile(this._storage_path_s + "/" + key_s);
		} else {
			cc.sys.localStorage.removeItem(key_s);
		}
	}

	/** 清空当前存储器数据 */
	clear(): void {
		if (NATIVE) {
			cc.native.fileUtils.removeDirectory(this._storage_path_s);
		} else {
			Object.keys(this._init_config.data).forEach((v_s) => {
				cc.sys.localStorage.removeItem(v_s);
			});
		}
	}
}

export namespace mk_storage_ {
	export interface init_config<CT extends Object> {
		/** 存储器名 */
		name_s: string;
		/** 存储数据 */
		data: CT;
		/** 编解码器 */
		codec?: mk_codec_base;
	}
}

export default mk_storage;
