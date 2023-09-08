import mk_instance_base from "./mk_instance_base";
import mk_status_task from "./task/mk_status_task";

/**
 * 数据共享器
 * @noInheritDoc
 * @remarks
 * 用以模块间共享数据
 *
 * - 支持请求数据返回
 */
class mk_data_sharer<CT = any> extends mk_instance_base {
	/* --------------- public --------------- */
	key: { [k in keyof CT]: k } = new Proxy(Object.create(null), {
		get: (target, key) => key,
	});

	/* --------------- private --------------- */
	/** 数据表 */
	private _data_map = new Map<any, any>();
	/** 请求表 */
	private _request_map = new Map<any, mk_status_task<any>>();
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 删除数据
	 * @param key_ 注册键
	 */
	delete<T extends keyof CT>(key_: T): void {
		// 录入数据表
		this._data_map.delete(key_);

		// 检查请求表
		const request = this._request_map.get(key_);

		// 返回请求
		if (request) {
			request.finish(true, null);
			this._request_map.delete(key_);
		}
	}

	/**
	 * 设置数据
	 * @param key_ 注册键
	 * @param data_ 数据
	 */
	set<T extends keyof CT, T2 = CT[T]>(key_: T, data_: T2): void {
		// 录入数据表
		this._data_map.set(key_, data_);

		// 检查请求表
		const request = this._request_map.get(key_);

		// 返回请求
		if (request) {
			request.finish(true, data_);
			this._request_map.delete(key_);
		}
	}

	/**
	 * 获取数据
	 * @param key_ 注册键
	 */
	get<T extends keyof CT, T2 = CT[T]>(key_: T): T2 | null;
	/**
	 * 获取数据
	 * @param key_ 注册键
	 * @param request_ 请求数据，若不存在则等待 set 后返回
	 */
	get<T extends keyof CT, T2 extends true | false, T3 = CT[T]>(key_: T, request_: T2): T2 extends true ? Promise<T3> : T3 | null;
	get<T extends keyof CT, T2 extends true | false, T3 = CT[T]>(key_: T, request_?: T2): T2 extends true ? Promise<T3> : T3 | null {
		const data = this._data_map.get(key_);

		if (data) {
			return data;
		}

		// 返回请求
		if (request_) {
			const request = new mk_status_task<T3>(false);

			this._request_map.set(key_, request);

			return request.task as any;
		}

		return null!;
	}

	/** 清空 */
	clear(): void {
		this._request_map.forEach((v) => v.finish(true, null));
	}
}

export default mk_data_sharer;
