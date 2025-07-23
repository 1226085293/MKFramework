import MKInstanceBase from "../../MKInstanceBase";
import { mkLog } from "../../MKLogger";

class MKToolObject extends MKInstanceBase {
	/**
	 * 重置数据
	 * @param data_ class 类型数据
	 * @param isAssign_ 使用新对象覆盖属性
	 * @returns
	 * @remarks
	 * 注意构造内的 this 对象不是 data_
	 */
	reset<T extends { constructor: any }, T2 extends boolean>(data_: T, isAssign_: T2): T2 extends true ? null : T {
		if (!data_?.constructor) {
			mkLog.error("数据类型错误");

			return null!;
		}

		if (isAssign_) {
			Object.assign(data_, new data_.constructor());

			return null!;
		} else {
			return new data_.constructor();
		}
	}

	/**
	 * 遍历对象
	 * @param target_ 对象
	 * @param callbackFunc_ 回调函数
	 * @returns
	 */
	traverse(
		target_: any,
		callbackFunc_: (
			/** 当前值 */
			value: any,
			/** 当前键 */
			keyStr: string,
			/** 当前路径：a/b/c */
			pathStr: string
		) => void
	): void {
		return this._traverse(target_, callbackFunc_);
	}

	/** 遍历对象 */
	private _traverse(target_: any, callback_f_: (value: any, keyStr: string, pathStr: string) => void, pathStr_ = "", recordSet = new Set()): void {
		switch (typeof target_) {
			case "object": {
				// 数组：遍历
				if (Array.isArray(target_)) {
					if (recordSet.has(target_)) {
						return;
					}

					recordSet.add(target_);

					target_.forEach((v, kNum) => {
						// 递归数组中的每一项
						callback_f_(target_[kNum], kNum + "", pathStr_);
						this._traverse(target_[kNum], callback_f_, pathStr_ ? `${pathStr_}/${kNum}` : kNum + "", recordSet);
					});
				}
				// 普通对象：循环递归赋值对象的所有值
				else {
					if (recordSet.has(target_)) {
						return;
					}

					recordSet.add(target_);
					for (const kStr in target_) {
						callback_f_(target_[kStr], kStr, pathStr_);
						this._traverse(target_[kStr], callback_f_, pathStr_ ? `${pathStr_}/${kStr}` : kStr, recordSet);
					}
				}

				break;
			}
		}
	}
}

export default MKToolObject.instance();
