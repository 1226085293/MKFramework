import prettier from "prettier";

export default function (
	/** 配置数据 */
	config_tab_: Record<string, any>,
	/** 注释 */
	attractor_desc_ss_: string[],
	/** 属性名 */
	attractor_name_ss_: string[],
	/** 类型 */
	attractor_type_ss_: string[],
	/** 输出文件路径 */
	output_path_s_: string,
	/** 输入文件路径 */
	input_path_s_: string,
	/** 表名 */
	table_name_s_: string
): string {
	return prettier.format(JSON.stringify(config_tab_), {
		useTabs: true,
		filepath: "*.json",
	});
}
