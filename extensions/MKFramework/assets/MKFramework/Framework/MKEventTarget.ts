import { EventTarget } from "cc";

/**
 * 事件对象（类型安全）
 * @noInheritDoc
 * @remarks
 * 获取事件键使用 EventTarget.key.xxx
 */
class MKEventTarget<CT> extends EventTarget {
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
	 * @param isOnce_ 是否触发单次
	 * @returns 触发回调
	 */
	// @ts-ignore
	on<T extends keyof CT, T2 extends (...argsList: Parameters<CT[T]>) => void>(
		type_: T | T[],
		callback_: T2,
		target_?: any,
		isOnce_?: boolean
	): typeof callback_ | null {
		if (Array.isArray(type_)) {
			type_.forEach((v) => {
				super.on(v as any, callback_ as any, target_, isOnce_);
			});

			return null;
		} else {
			// 录入事件对象
			target_?.eventTargetList?.push(this);

			return super.on(type_ as any, callback_ as any, target_, isOnce_);
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
	once<T extends keyof CT, T2 extends (...argsList: Parameters<CT[T]>) => void>(
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
			target_?.eventTargetList?.push(this);

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
	off<T extends keyof CT, T2 extends (...argsList: Parameters<CT[T]>) => void>(type_: T | T[], callback_?: T2, target_?: any): void {
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
	 * @param argsList_ 事件参数
	 */
	// @ts-ignore
	emit<T extends keyof CT, T2 extends Parameters<CT[T]>>(type_: T | T[], ...argsList_: T2): void {
		if (Array.isArray(type_)) {
			type_.forEach((v) => {
				super.emit(v as any, ...argsList_);
			});
		} else {
			super.emit(type_ as any, ...argsList_);
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
	has<T extends keyof CT, T2 extends (...argsList: Parameters<CT[T]>) => void>(type_: T, callback_?: T2, target_?: any): boolean {
		return super.hasEventListener(type_ as any, callback_ as any, target_);
	}

	/** 清空所有事件 */
	clear(): void;

	/**
	 * 请求事件
	 * @param type_ 事件类型
	 * @param args_ 事件参数
	 * @remarks
	 * 等待请求事件返回
	 */
	// @ts-ignore
	request<T extends keyof CT, T2 extends Parameters<CT[T]>, T3 extends ReturnType<CT[T]>>(type_: T | T[], ...args_: T2): Promise<T3>[] {
		if (Array.isArray(type_)) {
			const resultList: Promise<any>[] = [];

			type_.forEach((v) => {
				resultList.push(...this._requestSingle(v, ...args_));
			});

			return resultList;
		} else {
			return this._requestSingle(type_, ...args_);
		}
	}

	/**
	 * 请求单个事件
	 * @param type_ 事件类型
	 * @param argsList_ 事件参数
	 * @returns
	 */
	// @ts-ignore
	private _requestSingle<T extends keyof CT, T2 extends Parameters<CT[T]>, T3 extends ReturnType<CT[T]>>(
		type_: T,
		...argsList_: T2
	): Promise<T3>[] {
		/** 返回值 */
		const resultList: Promise<any>[] = [];
		/** 回调列表 */
		const callbackList: { callback: Function; target?: any }[] = this["_callbackTable"][type_]?.callbackInfos;

		if (!callbackList) {
			return resultList;
		}

		callbackList.forEach((v) => {
			const oldCallbackFunc = v.callback;
			const target = v.target;

			v.callback = (...argsList: any[]) => {
				resultList.push(oldCallbackFunc.call(target, ...argsList));
				v.callback = oldCallbackFunc;
			};
		});

		this.emit(type_, ...argsList_);

		return resultList;
	}
}

export default MKEventTarget;
