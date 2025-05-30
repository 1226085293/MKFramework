/* eslint-disable */
/** 全局多语言 */
export const t_texture: type_config = {

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