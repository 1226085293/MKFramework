import * as cc from "cc";

/** 枚举扩展 */
class ToolEnum {
	/** 处理字符串值枚举，让其可以通过cc.Enum选择 */
	stringToCC(enum_: any, newEnum_: any): any {
		let indexNum = 0;
		const newEnum = {};

		for (const kStr in enum_) {
			if (typeof enum_[kStr] === "string") {
				newEnum_[indexNum] = enum_[kStr];
				newEnum_[enum_[kStr]] = indexNum;
				newEnum[kStr] = indexNum++;
			}
		}

		return cc.Enum(newEnum);
	}

	/** 转换数字枚举值为对应字符串 */
	numberToString(enum_: any): any {
		const result: any = {};

		for (const kStr in enum_) {
			if (isNaN(Number(kStr))) {
				result[kStr] = kStr;
			}
		}

		return result;
	}

	/** 合并多个枚举，返回新枚举 */
	merge(enumList_: any[]): any {
		const result: any = {};
		let indexNum = 0;

		enumList_.forEach((v) => {
			for (const k2Str in v) {
				if (isNaN(Number(k2Str))) {
					if (result[k2Str]) {
						console.warn(`[tool.enum_extend]：合并枚举 ${k2Str} 键冲突，跳过`);
						continue;
					}

					result[k2Str] = indexNum;
					result[indexNum++] = k2Str;
				}
			}
		});

		return result;
	}

	/** 转换对象为枚举 */
	objToEnum(value_: any): any {
		const result: any = {};

		if (!value_) {
			return result;
		}

		if (typeof value_ === "object") {
			Object.keys(value_).forEach((vStr, kNum) => {
				result[kNum] = vStr;
				result[vStr] = kNum;
			});
		}

		return result;
	}

	/** 数组到枚举 */
	arrayToEnum(valueList_: any[]): any {
		const result: any = {};

		if (!valueList_) {
			return result;
		}

		valueList_.forEach((vStr, kNum) => {
			result[kNum] = vStr;
			result[vStr] = kNum;
		});

		return result;
	}

	/**
	 * 转换枚举到编辑器属性枚举
	 * @param value_ 枚举
	 * @returns cc.Enum
	 * - 用于 setClassAttr
	 */
	enumToAttrEnum<T extends {}>(value_: T): ReturnType<typeof cc.Enum.getList<T>> {
		return cc.Enum.getList(cc.Enum(value_));
	}

	/** 数组到编辑器枚举 */
	arrayToCCEnum(valueList_: any[]): any {
		return this.enumToAttrEnum(this.arrayToEnum(valueList_));
	}

	/** 对象转编辑器枚举 */
	objToCcEnum(value_: any): any {
		return this.enumToAttrEnum(this.objToEnum(value_));
	}

	/** 重置数字枚举值 */
	resetValue(startNum_: number, enum_: any, isModify_?: boolean): any;
	resetValue(startNum_: number, enumList_: any[], isModify_?: boolean): any[];
	resetValue(startNum_: number, args2_: any, isModify_?: boolean): any {
		if (args2_ instanceof Array) {
			if (isModify_) {
				args2_.forEach((v) => {
					for (const kStr in v) {
						if (isNaN(Number(kStr))) {
							v[v[kStr]] = undefined;
							v[kStr] = startNum_;
							v[startNum_] = kStr;
							startNum_++;
						}
					}
				});
			} else {
				const resultList: any[] = [];

				args2_.forEach((v) => {
					const newEnum = {};

					resultList.push(newEnum);
					for (const kStr in v) {
						if (isNaN(Number(kStr))) {
							newEnum[kStr] = startNum_;
							newEnum[startNum_] = kStr;
							startNum_++;
						}
					}
				});

				return resultList;
			}
		} else {
			if (isModify_) {
				for (const kStr in args2_) {
					if (isNaN(Number(kStr))) {
						args2_[args2_[kStr]] = undefined;
						args2_[kStr] = startNum_;
						args2_[startNum_] = kStr;
						startNum_++;
					}
				}
			} else {
				const result = {};

				for (const kStr in args2_) {
					if (isNaN(Number(kStr))) {
						result[kStr] = startNum_;
						result[startNum_] = kStr;
						startNum_++;
					}
				}

				return result;
			}
		}
	}
}

export default new ToolEnum();
