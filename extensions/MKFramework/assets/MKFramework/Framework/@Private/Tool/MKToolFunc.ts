import * as cc from "cc";
import { mkLog } from "../../MKLogger";
import MKInstanceBase from "../../MKInstanceBase";

/** 函数扩展 */
class MKToolFunc extends MKInstanceBase {
	private _runParentFuncMarkMap = new Map<any, Record<string, boolean>>();
	private _timeoutWarningMarkMap = new Map<any, Record<string, boolean>>();
	/* ------------------------------- 功能 ------------------------------- */
	/** 自动执行父类函数 */
	runParentFunc<T extends object>(target_: T, key_: string | string[]): void {
		let keyList: any[] = [];

		// 参数分类
		{
			if (Array.isArray(key_)) {
				keyList.push(...key_);
			} else {
				keyList.push(key_);
			}

			keyList = keyList.filter((v) => target_[v] && typeof target_[v] === "function");
		}

		/** 修改标记 */
		let markTab = this._runParentFuncMarkMap.get(target_)!;

		if (!markTab) {
			this._runParentFuncMarkMap.set(target_, (markTab = Object.create(null)));
		}

		keyList.forEach((v) => {
			// 跳过已修改函数
			if (markTab[v]) {
				return;
			}

			/** 当前类及父类函数 */
			const funcList = this._getParentFunc(target_.constructor, v);

			// 标记重载
			markTab[v] = true;

			// 重载当前函数
			target_[v] = async (...argsList: any): Promise<any> => {
				let result: any;

				try {
					// 同步执行父类到子类的函数
					for (let k2Num = 0; k2Num < funcList.length - 1; k2Num++) {
						result = funcList[k2Num].call(target_, ...argsList);
						if (result instanceof Promise) {
							await result;
						}
					}

					// 获取子类函数返回值
					if (funcList.length) {
						result = funcList[funcList.length - 1].call(target_, ...argsList);
						if (result instanceof Promise) {
							result = await result;
						}
					}
				} catch (error) {
					if (error === "中断") {
						return;
					}

					mkLog.error(error);
				}

				return result;
			};
		});
	}

	/**
	 * 超时警告
	 * @param timeMsN_ 最大执行时间
	 */
	timeoutWarning<T extends object>(timeMsN_: number, target_: T, key_: string | string[]): void {
		if (!timeMsN_) {
			return;
		}

		let keyList: any[] = [];

		// 参数分类
		{
			if (Array.isArray(key_)) {
				keyList.push(...key_);
			} else {
				keyList.push(key_);
			}

			keyList = keyList.filter((v) => target_[v] && typeof target_[v] === "function");
		}

		/** 修改标记 */
		let markTab = this._timeoutWarningMarkMap.get(target_)!;

		if (!markTab) {
			this._timeoutWarningMarkMap.set(target_, (markTab = Object.create(null)));
		}

		keyList.forEach((keyStr_) => {
			// 不存在或者已修改则退出
			if (!target_[keyStr_] || markTab[keyStr_]) {
				return;
			}

			markTab[keyStr_] = true;
			const oldFunc = target_[keyStr_];

			target_[keyStr_] = (...argsList: any[]) => {
				/** 定时器 */
				const timer = setTimeout(() => {
					mkLog.error(`${cc.js.getClassName(target_)}:${keyStr_} 执行超时`, target_);
				}, timeMsN_);

				const result = oldFunc.call(target_, ...argsList);

				// 取消定时器
				if (result instanceof Promise) {
					result.then(() => {
						clearTimeout(timer);
					});
				} else {
					clearTimeout(timer);
				}

				return result;
			};
		});
	}

	/** 获取当前类及父类函数 */
	private _getParentFunc(target_: any, key_: any, oldTarget_?: any, funcList_: Function[] = []): Function[] {
		if (!target_ || target_ === Object) {
			return funcList_;
		}

		this._getParentFunc(cc.js.getSuper(target_), key_, target_, funcList_);
		if (target_.prototype[key_] && (oldTarget_ ? target_.prototype[key_] !== oldTarget_.prototype[key_] : true)) {
			funcList_.push(target_.prototype[key_]);
		}

		return funcList_;
	}
}

export default MKToolFunc.instance();
