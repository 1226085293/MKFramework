import type { Constructor } from "cc";
import MKStatusTask from "./Task/MKStatusTask";

/**
 * 返回一个增加 MKDataSharer_.api 接口的数据
 * @param class_ 数据类型
 * @returns 数据源为 new class_ 的 Proxy
 * @remarks
 * 如果需要监听数据修改，请使用 returns.source
 */
export default function mkDataSharer<T extends Object, T2 = T & MKDataSharer_.Api<T>>(class_: Constructor<T>): T2 {
	let data: T;
	/** 请求表 */
	const requestMap = new Map<any, MKStatusTask<any>>();

	const requestFunc = (key: PropertyKey): any => {
		if (data[key] !== undefined) {
			return data[key];
		}

		let request = requestMap.get(key);

		// 新的请求
		if (!request) {
			requestMap.set(key, (request = new MKStatusTask(false)));

			return request.task;
		}

		// 多次请求
		if (request && !request.isFinish) {
			return request.task;
		}
	};

	const resetFunc = (): void => {
		requestMap.forEach((v) => v.finish(true, null));
		requestMap.clear();
		data = new class_();
		data["request"] = requestFunc;
		data["reset"] = resetFunc;
		data["source"] = data;
		data["key"] = new Proxy(Object.create(null), {
			get: (target, key) => key,
		});
	};

	resetFunc();

	return new Proxy(
		{},
		{
			get: (target, key) => data[key],
			set(target, key, newValue) {
				const request = requestMap.get(key);

				data[key] = newValue;

				// 处理请求
				if (request) {
					request.finish(true, newValue);
					requestMap.delete(key);
				}

				return true;
			},
		}
	) as any;
}

export namespace MKDataSharer_ {
	export interface Api<T extends Object, T2 = keyof T> {
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
