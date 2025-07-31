import tool_math from "./ToolMath";
import Codec from "./Codec/ToolCodec";

class ToolString {
	/** unicode 编解码器 */
	private _codecUnicode = new Codec.Unicode();
	/** 姓 */
	private _lastNameStrList = [
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
	insert(valueStr_: string, posNum_: number, insertStr_: string): string {
		return `${valueStr_.slice(0, posNum_)}${insertStr_}${valueStr_.slice(posNum_, valueStr_.length)}`;
	}

	/**
	 * 转换字符串为任意数据类型
	 * - n_*: number数据
	 * - s_*: string数据
	 * - b_*: boolean数据
	 */
	convertStringToAny(valueStr_: string): any[] {
		const argsStrList = valueStr_.split(/,/g).map((vStr) => vStr.replace(/\s/g, ""));
		const argsList: any[] = [];

		argsStrList.forEach((vStr) => {
			const k2Num = vStr.indexOf("_");

			if (k2Num == -1) {
				argsList.push(vStr);

				return;
			}

			const typeStr = vStr.substring(0, k2Num);
			const v2Str = vStr.substring(k2Num + 1, vStr.length);

			switch (typeStr) {
				case "n":
					argsList.push(Number(v2Str));
					break;
				case "s":
					argsList.push(v2Str);
					break;
				case "b":
					argsList.push(v2Str == "true");
					break;
			}
		});

		return argsList;
	}

	/** 获取随机中文名） */
	randomChineseName(lengthNum_ = tool_math.random(1, 2, true)): string {
		let nameStr = this._lastNameStrList[tool_math.random(0, this._lastNameStrList.length - 1, true)];

		for (let kNum = 0; kNum < lengthNum_; ++kNum) {
			nameStr += this._codecUnicode.encode(tool_math.random(19968, 20901, true));
		}

		return nameStr;
	}

	/**
	 * 单位毫秒格式化
	 * - $H: 替换为小时，补全空位(02:00:00)
	 * - $h: 替换为小时，不补全(2:00:00)
	 * - $M: 替换为分钟，补全空位(00:02:00)
	 * - $m: 替换为分钟，不补全(00:2:00)
	 * - $S: 替换为秒，补全空位(00:00:02)
	 * - $s: 替换为秒，不补全(0:00:2)
	 */
	msFormat(msNum_: number, formatStr_: string): string {
		let sNum = msNum_ / 1000;
		let mNum = sNum / 60;
		let hNum = mNum / 60;

		sNum = Math.floor(sNum % 60);
		mNum = Math.floor(mNum % 60);
		hNum = Math.floor(hNum);
		formatStr_ = formatStr_.replace("$H", hNum < 10 ? `0${hNum}` : `${hNum}`);
		formatStr_ = formatStr_.replace("$h", `${hNum}`);
		formatStr_ = formatStr_.replace("$M", mNum < 10 ? `0${mNum}` : `${mNum}`);
		formatStr_ = formatStr_.replace("$m", `${mNum}`);
		formatStr_ = formatStr_.replace("$S", sNum < 10 ? `0${sNum}` : `${sNum}`);
		formatStr_ = formatStr_.replace("$s", `${sNum}`);

		return formatStr_;
	}

	/** 字符串相似度（编辑距离算法） */
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

	/** 模糊匹配（多个源字符串时返回相识度最高的字符串） */
	fuzzyMatch(args_: string | string[], keyStr_: string, minSimileNum_ = 0): string | null {
		if (!keyStr_) {
			return null;
		}

		let sourceStrList: string[];

		if (typeof args_ === "string") {
			sourceStrList = [args_];
		} else {
			sourceStrList = args_;
		}

		const matchResultStrList: string[] = [];
		const keyStrList = keyStr_.split("");
		let indexNum: number;

		sourceStrList.forEach((vStr) => {
			indexNum = -1;
			for (let k2Num = 0; k2Num < keyStrList.length; ++k2Num) {
				// 有一个关键字都没匹配到，则没有匹配到数据
				if (vStr.indexOf(keyStrList[k2Num]) < 0) {
					break;
				} else {
					const reg = RegExp(`${keyStrList[k2Num]}`, "g");
					let execResult: RegExpExecArray | null;

					while ((execResult = reg.exec(vStr)) !== null) {
						if (execResult.index > indexNum) {
							indexNum = execResult.index;
							if (k2Num === keyStrList.length - 1) {
								matchResultStrList.push(vStr);

								return;
							}

							break;
						}
					}
				}
			}
		});

		if (!matchResultStrList.length) {
			return null;
		}
		// 返回相识度最高的字符串
		else {
			matchResultStrList.sort(
				(vaStr: string, vbStr: string) => this.similarityEditDist(vbStr, keyStr_) - this.similarityEditDist(vaStr, keyStr_)
			);

			return this.similarityEditDist(matchResultStrList[0], keyStr_) >= minSimileNum_ ? matchResultStrList[0] : keyStr_;
		}
	}
}

export default new ToolString();
