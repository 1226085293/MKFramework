import * as cc from "cc";

/** 安全事件对象 */
class mk_event_target<CT> extends cc.EventTarget {
	/** 事件键 */
	key: { [k in keyof CT]: k } = new Proxy(Object.create(null), {
		get: (target, key) => key,
	});

	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 监听事件
	 * @param type_ 事件类型
	 * @param callback_ 触发回调
	 * @param target_ 事件目标对象
	 * @param once_b_ 是否触发单次
	 * @returns 触发回调
	 */
	// @ts-ignore
	on<T extends keyof CT, T2 extends (...event_: Parameters<CT[T]>) => void>(
		type_: T | T[],
		callback_: T2,
		target_?: any,
		once_b_?: boolean
	): typeof callback_ | null {
		if (Array.isArray(type_)) {
			type_.forEach((v) => {
				super.on(v as any, callback_ as any, target_, once_b_);
			});

			return null;
		} else {
			// 录入事件对象
			target_?.event_target_as?.push(this);

			return super.on(type_ as any, callback_ as any, target_, once_b_);
		}
	}

	/**
	 * 监听单次事件
	 * @param type_ 事件类型
	 * @param callback_ 触发回调
	 * @param target_ 事件目标对象
	 * @returns 触发回调
	 */
	// @ts-ignore
	once<T extends keyof CT, T2 extends (...event_: Parameters<CT[T]>) => void>(
		type_: T | T[],
		callback_: T2,
		target_?: any
	): typeof callback_ | null {
		if (Array.isArray(type_)) {
			type_.forEach((v) => {
				super.once(v as any, callback_ as any, target_);
			});

			return null;
		} else {
			// 录入事件对象
			target_?.event_target_as?.push(this);

			return super.once(type_ as any, callback_ as any, target_);
		}
	}

	/**
	 * 取消监听事件
	 * @param type_ 事件类型
	 * @param callback_ 触发回调
	 * @param target_ 事件目标对象
	 * @returns 触发回调
	 */
	// @ts-ignore
	off<T extends keyof CT, T2 extends (...event_: Parameters<CT[T]>) => void>(type_: T | T[], callback_?: T2, target_?: any): void {
		if (Array.isArray(type_)) {
			type_.forEach((v) => {
				super.off(v as any, callback_ as any, target_);
			});
		} else {
			super.off(type_ as any, callback_ as any, target_);
		}
	}

	/**
	 * 派发事件
	 * @param type_ 事件类型
	 * @param args_ 事件参数
	 */
	// @ts-ignore
	emit<T extends keyof CT, T2 extends Parameters<CT[T]>>(type_: T | T[], ...args_: T2): void {
		if (Array.isArray(type_)) {
			type_.forEach((v) => {
				super.emit(v as any, ...args_);
			});
		} else {
			super.emit(type_ as any, ...args_);
		}
	}

	/**
	 * 是否存在事件
	 * @param type_ 事件类型
	 * @param callback_ 触发回调
	 * @param target_ 事件目标对象
	 * @returns
	 */
	// @ts-ignore
	has<T extends keyof CT, T2 extends (...event_: Parameters<CT[T]>) => void>(type_: T, callback_?: T2, target_?: any): boolean {
		return super.hasEventListener(type_ as any, callback_ as any, target_);
	}

	/** 清空所有事件 */
	clear(): void {
		return super["clear"]();
	}

	/**
	 * 请求事件
	 * @param type_ 事件类型
	 * @param args_ 事件参数
	 * @beta
	 * @remarks
	 * 等待请求事件返回
	 */
	// @ts-ignore
	request<T extends keyof CT, T2 extends Parameters<CT[T]>, T3 extends ReturnType<CT[T]>>(type_: T | T[], ...args_: T2): Promise<T3>[] {
		if (Array.isArray(type_)) {
			const result_as: Promise<any>[] = [];

			type_.forEach((v) => {
				result_as.push(...this._request_single(v, ...args_));
			});

			return result_as;
		} else {
			return this._request_single(type_, ...args_);
		}
	}

	/**
	 * 请求单个事件
	 * @param type_ 事件类型
	 * @param args_ 事件参数
	 * @returns
	 */
	// @ts-ignore
	private _request_single<T extends keyof CT, T2 extends Parameters<CT[T]>, T3 extends ReturnType<CT[T]>>(type_: T, ...args_: T2): Promise<T3>[] {
		/** 返回值 */
		const result_as: Promise<any>[] = [];
		/** 回调列表 */
		const callback_as: { callback: Function; target?: any }[] = this["_callbackTable"][type_]?.callbackInfos;

		if (!callback_as) {
			return result_as;
		}

		callback_as.forEach((v) => {
			const old_callback_f = v.callback;
			const target = v.target;

			v.callback = (...args: any[]) => {
				result_as.push(old_callback_f.call(target, ...args));
				v.callback = old_callback_f;
			};
		});

		this.emit(type_, ...args_);

		return result_as;
	}
}

export default mk_event_target;
