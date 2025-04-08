import mk_instance_base from "../../mk_instance_base";

class mk_tool_string extends mk_instance_base {
	/**
	 * 字符串相似度
	 * @param v_s_ 字符集
	 * @param v2_s_ 对比字符
	 * @returns 0-1
	 * @remarks
	 * 编辑距离算法
	 */
	similarity_edit_dist(v_s_: string, v2_s_: string): number {
		const v_len_n = v_s_.length;
		const v2_len_n = v2_s_.length;

		// 安检
		{
			if (v_len_n == 0) {
				return v2_len_n;
			}

			if (v2_len_n == 0) {
				return v_len_n;
			}
		}

		const dist_nss: number[][] = [];

		// 二维距离表格
		{
			for (let k_n = 0; k_n <= v_len_n; k_n++) {
				dist_nss[k_n] = [];
				dist_nss[k_n][0] = k_n;
			}

			for (let k_n = 0; k_n <= v2_len_n; k_n++) {
				dist_nss[0][k_n] = k_n;
			}
		}

		// 计算每个格子距离
		{
			let v_curr_s: string;
			let v2_curr_s: string;

			for (let k_n = 1; k_n <= v_len_n; k_n++) {
				v_curr_s = v_s_.charAt(k_n - 1);
				for (let k2_n = 1; k2_n <= v2_len_n; k2_n++) {
					v2_curr_s = v2_s_.charAt(k2_n - 1);
					dist_nss[k_n][k2_n] = Math.min(
						dist_nss[k_n - 1][k2_n] + 1,
						dist_nss[k_n][k2_n - 1] + 1,
						dist_nss[k_n - 1][k2_n - 1] + (v_curr_s == v2_curr_s ? 0 : 1)
					);
				}
			}
		}

		// 返回右下角距离的比例
		return Number((1 - dist_nss[v_len_n][v2_len_n] / Math.max(v_s_.length, v2_s_.length)).toFixed(4));
	}

	/**
	 * 模糊匹配
	 * @param args_ 字符集
	 * @param key_s_ 对比字符
	 * @param min_simile_n_ 最小相似度
	 * @returns
	 * @remarks
	 * 多个源字符串时返回相似度最高的字符串
	 */
	fuzzy_match(args_: string | string[], key_s_: string, min_simile_n_ = 0): string | null {
		if (!key_s_) {
			return null;
		}

		let source_ss: string[];

		if (typeof args_ === "string") {
			source_ss = [args_];
		} else {
			source_ss = args_;
		}

		const match_result_ss: string[] = [];
		const key_ss = key_s_.split("");
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
			match_result_ss.sort(
				(v_a_s: string, v_b_s: string) => this.similarity_edit_dist(v_b_s, key_s_) - this.similarity_edit_dist(v_a_s, key_s_)
			);

			return this.similarity_edit_dist(match_result_ss[0], key_s_) >= min_simile_n_ ? match_result_ss[0] : key_s_;
		}
	}
}

export default mk_tool_string.instance();
