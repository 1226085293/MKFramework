import MKInstanceBase from "../../MKInstanceBase";

class MKToolString extends MKInstanceBase {
	/**
	 * 字符串相似度
	 * @param vStr_ 字符集
	 * @param v2Str_ 对比字符
	 * @returns 0-1
	 * @remarks
	 * 编辑距离算法
	 */
	similarityEditDist(vStr_: string, v2Str_: string): number {
		const vLenNum = vStr_.length;
		const v2LenNum = v2Str_.length;

		// 安检
		{
			if (vLenNum == 0) {
				return v2LenNum;
			}

			if (v2LenNum == 0) {
				return vLenNum;
			}
		}

		const distList: number[][] = [];

		// 二维距离表格
		{
			for (let kNum = 0; kNum <= vLenNum; kNum++) {
				distList[kNum] = [];
				distList[kNum][0] = kNum;
			}

			for (let kNum = 0; kNum <= v2LenNum; kNum++) {
				distList[0][kNum] = kNum;
			}
		}

		// 计算每个格子距离
		{
			let vCurrStr: string;
			let v2CurrStr: string;

			for (let kNum = 1; kNum <= vLenNum; kNum++) {
				vCurrStr = vStr_.charAt(kNum - 1);
				for (let k2Num = 1; k2Num <= v2LenNum; k2Num++) {
					v2CurrStr = v2Str_.charAt(k2Num - 1);
					distList[kNum][k2Num] = Math.min(
						distList[kNum - 1][k2Num] + 1,
						distList[kNum][k2Num - 1] + 1,
						distList[kNum - 1][k2Num - 1] + (vCurrStr == v2CurrStr ? 0 : 1)
					);
				}
			}
		}

		// 返回右下角距离的比例
		return Number((1 - distList[vLenNum][v2LenNum] / Math.max(vStr_.length, v2Str_.length)).toFixed(4));
	}

	/**
	 * 模糊匹配
	 * @param args_ 字符集
	 * @param keyStr_ 对比字符
	 * @param minSimileNum_ 最小相似度
	 * @returns
	 * @remarks
	 * 多个源字符串时返回相似度最高的字符串
	 */
	fuzzy_match(args_: string | string[], keyStr_: string, minSimileNum_ = 0): string | null {
		if (!keyStr_) {
			return null;
		}

		let source_ss: string[];

		if (typeof args_ === "string") {
			source_ss = [args_];
		} else {
			source_ss = args_;
		}

		const match_result_ss: string[] = [];
		const key_ss = keyStr_.split("");
		let index_n: number;

		source_ss.forEach((v_s) => {
			index_n = -1;
			for (let k2_n = 0; k2_n < key_ss.length; ++k2_n) {
				// 有一个关键字都没匹配到，则没有匹配到数据
				if (v_s.indexOf(key_ss[k2_n]) < 0) {
					break;
				} else {
					const reg = RegExp(`${key_ss[k2_n]}`, "g");
					let exec_result: RegExpExecArray | null;

					while ((exec_result = reg.exec(v_s)) !== null) {
						if (exec_result.index > index_n) {
							index_n = exec_result.index;
							if (k2_n === key_ss.length - 1) {
								match_result_ss.push(v_s);

								return;
							}

							break;
						}
					}
				}
			}
		});

		if (!match_result_ss.length) {
			return null;
		}
		// 返回相识度最高的字符串
		else {
			match_result_ss.sort((v_a_s: string, v_b_s: string) => this.similarityEditDist(v_b_s, keyStr_) - this.similarityEditDist(v_a_s, keyStr_));

			return this.similarityEditDist(match_result_ss[0], keyStr_) >= minSimileNum_ ? match_result_ss[0] : keyStr_;
		}
	}
}

export default MKToolString.instance();
