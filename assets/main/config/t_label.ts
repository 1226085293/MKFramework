/* eslint-disable */
/** 全局多语言 */
export const t_label: type_config = {
	[1]: {"id_n":1,"zh_cn":"测试","en_us":"Test"},
	[2]: {"id_n":2,"zh_cn":"测试参数{0}","en_us":"TestParameters{0}"},
};

export type type_config<T = Record<number, {
	/** ID */
	id_n: number;
	/** 中文 */
	zh_cn: string;
	/** 英语 */
	en_us: string
}>> = {
	readonly [P in keyof T]: T[P] extends Function ? T[P] : type_config<T[P]>;
};