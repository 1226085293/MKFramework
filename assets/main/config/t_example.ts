/* eslint-disable */
/** 示例配置 */
export const t_example: type_config = {
	[1]: {"id_n":1,"test_n":1,"test_s":"2","test_b":true,"test":[1,["你好","世界"],[[0,1,2],[3,4,5]]]},
};

export type type_config<T = Record<number, {
	/** ID */
	id_n: number;
	/** test */
	test_n: number;
	/** test2 */
	test_s: string;
	/** test3 */
	test_b: boolean;
	/** test4 */
	test: [number, string[], number[][]]
}>> = {
	readonly [P in keyof T]: T[P] extends Function ? T[P] : type_config<T[P]>;
};