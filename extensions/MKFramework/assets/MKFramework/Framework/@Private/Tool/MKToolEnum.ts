import MKInstanceBase from "../../MKInstanceBase";

/** 枚举扩展 */
class MKToolEnum extends MKInstanceBase {
	/** 转换对象为枚举 */
	objToEnum(value_: any): any {
		const result: any = {};

		if (!value_) {
			return result;
		}

		if (typeof value_ === "object") {
			Object.keys(value_).forEach((vStr, kNum) => {
				if (!isNaN(Number(vStr))) {
					vStr = `\u200B${vStr}`;
				}

				result[kNum] = vStr;
				result[vStr] = kNum;
			});
		}

		return result;
	}
}

const mkToolEnum = new MKToolEnum();
export default mkToolEnum;
