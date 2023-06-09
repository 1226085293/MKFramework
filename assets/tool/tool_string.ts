import tool_math from "./tool_math";
import codec from "./codec/tool_codec";

class tool_string {
	/** unicode 编解码器 */
	private _codec_unicode = new codec.unicode();
	/** 姓 */
	private _last_name_ss = [
		"赵",
		"钱",
		"孙",
		"李",
		"周",
		"吴",
		"郑",
		"王",
		"冯",
		"陈",
		"褚",
		"卫",
		"蒋",
		"沈",
		"韩",
		"杨",
		"朱",
		"秦",
		"尤",
		"许",
		"何",
		"吕",
		"施",
		"张",
		"孔",
		"曹",
		"严",
		"华",
		"金",
		"魏",
		"陶",
		"姜",
		"戚",
		"谢",
		"邹",
		"喻",
		"柏",
		"水",
		"窦",
		"章",
		"云",
		"苏",
		"潘",
		"葛",
		"奚",
		"范",
		"彭",
		"郎",
		"鲁",
		"韦",
		"昌",
		"马",
		"苗",
		"凤",
		"花",
		"方",
		"俞",
		"任",
		"袁",
		"柳",
		"酆",
		"鲍",
		"史",
		"唐",
		"费",
		"廉",
		"岑",
		"薛",
		"雷",
		"贺",
		"倪",
		"汤",
		"滕",
		"殷",
		"罗",
		"毕",
		"郝",
		"邬",
		"安",
		"常",
		"乐",
		"于",
		"时",
		"傅",
		"皮",
		"卞",
		"齐",
		"康",
		"伍",
		"余",
		"元",
		"卜",
		"顾",
		"孟",
		"平",
		"黄",
		"和",
		"穆",
		"萧",
		"尹",
		"姚",
		"邵",
		"舒",
		"汪",
		"祁",
		"毛",
		"禹",
		"狄",
		"米",
		"贝",
		"明",
		"臧",
		"计",
		"伏",
		"成",
		"戴",
		"谈",
		"宋",
		"茅",
		"庞",
		"熊",
		"纪",
		"屈",
		"项",
		"祝",
		"董",
		"杜",
		"阮",
		"蓝",
		"闵",
		"席",
		"季",
		"麻",
		"强",
		"贾",
		"路",
		"娄",
		"危",
		"江",
		"童",
		"颜",
		"郭",
		"梅",
		"盛",
		"林",
		"刁",
		"钟",
		"徐",
		"邱",
		"骆",
		"高",
		"夏",
		"蔡",
		"田",
		"樊",
		"胡",
		"凌",
		"霍",
		"虞",
		"万",
		"支",
		"柯",
		"咎",
		"管",
		"卢",
		"莫",
		"经",
		"房",
		"裘",
		"缪",
		"干",
		"解",
		"应",
		"宗",
		"宣",
		"丁",
		"贲",
		"邓",
		"郁",
		"单",
		"杭",
		"洪",
		"包",
		"诸",
		"左",
		"石",
		"崔",
		"吉",
		"钮",
		"龚",
		"程",
		"嵇",
		"邢",
		"滑",
		"裴",
		"陆",
		"荣",
		"翁",
		"荀",
		"羊",
		"於",
		"惠",
		"甄",
		"加",
		"封",
		"芮",
		"羿",
		"储",
		"靳",
		"汲",
		"邴",
		"糜",
		"松",
		"井",
		"段",
		"富",
		"巫",
		"乌",
		"焦",
		"巴",
		"弓",
		"牧",
		"隗",
		"山",
		"谷",
		"车",
		"侯",
		"宓",
		"蓬",
		"全",
		"郗",
		"班",
		"仰",
		"秋",
		"仲",
		"伊",
		"宫",
		"宁",
		"仇",
		"栾",
		"暴",
		"甘",
		"钭",
		"厉",
		"戎",
		"祖",
		"武",
		"符",
		"刘",
		"詹",
		"束",
		"龙",
		"叶",
		"幸",
		"司",
		"韶",
		"郜",
		"黎",
		"蓟",
		"薄",
		"印",
		"宿",
		"白",
		"怀",
		"蒲",
		"台",
		"从",
		"鄂",
		"索",
		"咸",
		"籍",
		"赖",
		"卓",
		"蔺",
		"屠",
		"蒙",
		"池",
		"乔",
		"阴",
		"胥",
		"能",
		"苍",
		"双",
		"闻",
		"莘",
		"党",
		"翟",
		"谭",
		"贡",
		"劳",
		"逄",
		"姬",
		"申",
		"扶",
		"堵",
		"冉",
		"宰",
		"郦",
		"雍",
		"璩",
		"桑",
		"桂",
		"濮",
		"牛",
		"寿",
		"通",
		"边",
		"扈",
		"燕",
		"冀",
		"郏",
		"浦",
		"尚",
		"农",
		"温",
		"别",
		"庄",
		"晏",
		"柴",
		"瞿",
		"阎",
		"充",
		"慕",
		"连",
		"茹",
		"习",
		"宦",
		"艾",
		"鱼",
		"容",
		"向",
		"古",
		"易",
		"慎",
		"戈",
		"廖",
		"庚",
		"终",
		"暨",
		"居",
		"衡",
		"步",
		"都",
		"耿",
		"满",
		"弘",
		"匡",
		"国",
		"文",
		"寇",
		"广",
		"禄",
		"阙",
		"东",
		"殳",
		"沃",
		"利",
		"蔚",
		"越",
		"夔",
		"隆",
		"师",
		"巩",
		"厍",
		"聂",
		"晁",
		"勾",
		"敖",
		"融",
		"冷",
		"訾",
		"辛",
		"阚",
		"那",
		"简",
		"饶",
		"空",
		"曾",
		"毋",
		"沙",
		"乜",
		"养",
		"鞠",
		"须",
		"丰",
		"巢",
		"关",
		"蒯",
		"相",
		"查",
		"后",
		"红",
		"游",
		"竺",
		"权",
		"逯",
		"盖",
		"益",
		"桓",
		"公",
		"晋",
		"楚",
		"法",
		"汝",
		"鄢",
		"涂",
		"钦",
		"缑",
		"亢",
		"况",
		"有",
		"商",
		"牟",
		"佘",
		"佴",
		"伯",
		"赏",
		"墨",
		"哈",
		"谯",
		"笪",
		"年",
		"爱",
		"阳",
		"佟",
		"琴",
		"言",
		"福",
		"百",
		"家",
		"姓",
		"续",
		"岳",
		"帅第五",
		"梁丘",
		"左丘",
		"东门",
		"百里",
		"东郭",
		"南门",
		"呼延",
		"万俟",
		"南宫",
		"段干",
		"西门",
		"司马",
		"上官",
		"欧阳",
		"夏侯",
		"诸葛",
		"闻人",
		"东方",
		"赫连",
		"皇甫",
		"尉迟",
		"公羊",
		"澹台",
		"公冶",
		"宗政",
		"濮阳",
		"淳于",
		"仲孙",
		"太叔",
		"申屠",
		"公孙",
		"乐正",
		"轩辕",
		"令狐",
		"钟离",
		"闾丘",
		"长孙",
		"慕容",
		"鲜于",
		"宇文",
		"司徒",
		"司空",
		"亓官",
		"司寇",
		"子车",
		"颛孙",
		"端木",
		"巫马",
		"公西",
		"漆雕",
		"壤驷",
		"公良",
		"夹谷",
		"宰父",
		"微生",
		"羊舌",
	];

	/* ------------------------------- 功能 ------------------------------- */
	/** 插入字符串 */
	insert(value_s_: string, pos_n_: number, insert_s_: string): string {
		return `${value_s_.slice(0, pos_n_)}${insert_s_}${value_s_.slice(pos_n_, value_s_.length)}`;
	}

	/** 转换字符串为任意数据类型
	 * - n_*: number数据
	 * - s_*: string数据
	 * - b_*: boolean数据
	 */
	convert_string_to_any(value_s_: string): any[] {
		const args_ss = value_s_.split(/,/g).map((v_s) => v_s.replace(/\s/g, ""));
		const args_as: any[] = [];

		args_ss.forEach((v_s) => {
			const k2_n = v_s.indexOf("_");

			if (k2_n == -1) {
				args_as.push(v_s);

				return;
			}

			const type_s = v_s.substring(0, k2_n);
			const v2_s = v_s.substring(k2_n + 1, v_s.length);

			switch (type_s) {
				case "n":
					args_as.push(Number(v2_s));
					break;
				case "s":
					args_as.push(v2_s);
					break;
				case "b":
					args_as.push(v2_s == "true");
					break;
			}
		});

		return args_as;
	}

	/** 获取随机中文名） */
	random_chinese_name(length_n_ = tool_math.random(1, 2, true)): string {
		let name_s = this._last_name_ss[tool_math.random(0, this._last_name_ss.length - 1, true)];

		for (let k_n = 0; k_n < length_n_; ++k_n) {
			name_s += this._codec_unicode.encode(tool_math.random(19968, 20901, true));
		}

		return name_s;
	}

	/** 单位毫秒格式化
	 * - $H: 替换为小时，补全空位(02:00:00)
	 * - $h: 替换为小时，不补全(2:00:00)
	 * - $M: 替换为分钟，补全空位(00:02:00)
	 * - $m: 替换为分钟，不补全(00:2:00)
	 * - $S: 替换为秒，补全空位(00:00:02)
	 * - $s: 替换为秒，不补全(0:00:2)
	 */
	ms_format(ms_n_: number, format_s_: string): string {
		let s_n = ms_n_ / 1000;
		let m_n = s_n / 60;
		let h_n = m_n / 60;

		s_n = Math.floor(s_n % 60);
		m_n = Math.floor(m_n % 60);
		h_n = Math.floor(h_n);
		format_s_ = format_s_.replace("$H", h_n < 10 ? `0${h_n}` : `${h_n}`);
		format_s_ = format_s_.replace("$h", `${h_n}`);
		format_s_ = format_s_.replace("$M", m_n < 10 ? `0${m_n}` : `${m_n}`);
		format_s_ = format_s_.replace("$m", `${m_n}`);
		format_s_ = format_s_.replace("$S", s_n < 10 ? `0${s_n}` : `${s_n}`);
		format_s_ = format_s_.replace("$s", `${s_n}`);

		return format_s_;
	}

	/** 字符串相似度（编辑距离算法） */
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

	/** 模糊匹配（多个源字符串时返回相识度最高的字符串） */
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

export default new tool_string();
