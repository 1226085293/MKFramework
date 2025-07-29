import * as cc from "cc";
import { DEBUG } from "cc/env";

interface GlobalEventProtocol {
	/** 屏幕尺寸改变 */
	resize(): void;
	/** 重启游戏 */
	restart(): void;
	/** 等待关闭场景（当前场景所有模块生命周期执行完成） */
	waitCloseScene(): void;
}

class Event<CT> extends cc.EventTarget {
	key: { [key in keyof CT]: key } = new Proxy(Object.create(null), {
		get: (target, key) => key,
	});

	// @ts-ignore
	on<T extends keyof CT, T2 extends (...event_: Parameters<CT[T]>) => void>(
		type_: T | T[],
		callback_: T2,
		this_?: any,
		isOnce_?: boolean
	): typeof callback_ | null {
		if (Array.isArray(type_)) {
			type_.forEach((v) => {
				super.on(v as any, callback_ as any, this_, isOnce_);
			});

			return null;
		} else {
			return super.on(type_ as any, callback_ as any, this_, isOnce_);
		}
	}

	// @ts-ignore
	once<T extends keyof CT, T2 extends (...event_: Parameters<CT[T]>) => void>(type_: T | T[], callback_: T2, this_?: any): typeof callback_ | null {
		if (Array.isArray(type_)) {
			type_.forEach((v) => {
				super.once(v as any, callback_ as any, this_);
			});

			return null;
		} else {
			return super.once(type_ as any, callback_ as any, this_);
		}
	}

	// @ts-ignore
	off<T extends keyof CT, T2 extends (...event_: Parameters<CT[T]>) => void>(type_: T | T[], callback_?: T2, this_?: any): void {
		if (Array.isArray(type_)) {
			type_.forEach((v) => {
				super.off(v as any, callback_ as any, this_);
			});
		} else {
			super.off(type_ as any, callback_ as any, this_);
		}
	}

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

	// @ts-ignore
	has<T extends keyof CT, T2 extends (...event_: Parameters<CT[T]>) => void>(type_: T, callback_?: T2, target_?: any): boolean {
		return super.hasEventListener(type_ as any, callback_ as any, target_);
	}

	declare clear: () => void;

	/** 请求（等待返回） */
	// @ts-ignore
	request<T extends keyof CT, T2 extends Parameters<CT[T]>, T3 extends ReturnType<CT[T]>>(type_: T | T[], ...args_: T2): Promise<T3>[] {
		if (Array.isArray(type_)) {
			const resultTaskList: Promise<any>[] = [];

			type_.forEach((v) => {
				resultTaskList.push(...this._requestSingle(v, ...args_));
			});

			return resultTaskList;
		} else {
			return this._requestSingle(type_, ...args_);
		}
	}

	/** 请求单个事件 */
	// @ts-ignore
	private _requestSingle<T extends keyof CT, T2 extends Parameters<CT[T]>, T3 extends ReturnType<CT[T]>>(type_: T, ...args_: T2): Promise<T3>[] {
		/** 返回值 */
		const resultTaskList: Promise<any>[] = [];
		/** 回调列表 */
		const callbackFuncList: { callback: Function; target?: any }[] = this["_callbackTable"][type_]?.callbackInfos;

		if (!callbackFuncList) {
			return resultTaskList;
		}

		callbackFuncList.forEach((v) => {
			const oldCallbackFunc = v.callback;
			const target = v.target;

			v.callback = (...argsList: any[]) => {
				resultTaskList.push(oldCallbackFunc.call(target, ...argsList));
				v.callback = oldCallbackFunc;
			};
		});

		this.emit(type_, ...args_);

		return resultTaskList;
	}
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const GlobalEvent = new Event<GlobalEventProtocol>();

if (DEBUG) {
	window["GlobalEvent"] = GlobalEvent;
}

export default GlobalEvent;
