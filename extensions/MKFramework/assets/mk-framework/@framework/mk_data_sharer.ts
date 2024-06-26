import * as cc from "cc";
import mk_status_task from "./task/mk_status_task";

/**
 * 返回一个增加 mk_data_sharer_.api 接口的数据
 * @param class_ 数据类型
 * @returns 数据源为 new class_ 的 Proxy
 * @remarks
 * 如果需要监听数据修改，请使用 returns.source
 */
export default function mk_data_sharer<T extends Object, T2 = T & mk_data_sharer_.api<T>>(class_: cc.Constructor<T>): T2 {
	let data: T;
	/** 请求表 */
	const request_map = new Map<any, mk_status_task<any>>();

	const request_f = (key: PropertyKey): any => {
		if (data[key] !== undefined) {
			return data[key];
		}

		let request = request_map.get(key);

		// 新的请求
		if (!request) {
			request_map.set(key, (request = new mk_status_task(false)));

			return request.task;
		}

		// 多次请求
		if (request && !request.finish_b) {
			return request.task;
		}
	};

	const reset_f = (): void => {
		request_map.forEach((v) => v.finish(true, null));
		request_map.clear();
		data = new class_();
		data["request"] = request_f;
		data["reset"] = reset_f;
		data["source"] = data;
		data["key"] = new Proxy(Object.create(null), {
			get: (target, key) => key,
		});
	};

	reset_f();

	return new Proxy(
		{},
		{
			get: (target, key) => data[key],
			set(target, key, new_value) {
				const request = request_map.get(key);

				data[key] = new_value;

				// 处理请求
				if (request) {
					request.finish(true, new_value);
					request_map.delete(key);
				}

				return true;
			},
		}
	) as any;
}

export namespace mk_data_sharer_ {
	export interface api<T extends Object, T2 = keyof T> {
		/**
		 * 原始数据
		 * @remarks
		 * 可用于数据监听
		 */
		source: T;
		/** 数据键 */
		key: { [k in keyof T]: k };

		/**
		 * 请求数据
		 * @param key_ 数据键
		 * @remarks
		 * 用于等待指定数据 set
		 */
		// @ts-ignore
		request(key_: T2): Promise<T[T2]>;

		/**
		 * 重置数据
		 */
		reset(): void;
	}
}
