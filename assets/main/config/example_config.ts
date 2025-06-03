/* eslint-disable */

export type type_example_config<T = Record<number, {
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
	readonly [P in keyof T]: T[P] extends Function ? T[P] : type_example_config<T[P]>;
};

/** 示例配置 */
export const example_config: type_example_config = new Proxy(
	{
		[1]: {"id_n":1,"test_n":1,"test_s":"2","test_b":true,"test":[1,["你好","世界"],[[0,1,2],[3,4,5]]]},
		[2]: {"id_n":2,"test_n":4,"test_s":"5","test_b":false,"test":[1,["你好","世界"],[[0,1,2],[3,4,5]]]},
	},
	{
		get(target, key): any {
			if (!freeze_tab[key]) {
				freeze_tab[key] = true;
				deep_freeze(target[key]);
			}

			return target[key];
		},
		set() {
			return false;
		},
	}
);

const freeze_tab: Record<PropertyKey, boolean> = {};
function deep_freeze<T extends object>(object_: T): T {
	const prop_name_ss = Object.getOwnPropertyNames(object_);

	prop_name_ss.forEach((v_s) => {
		const value = object_[v_s as keyof T];

		if (value && typeof value === "object") {
			deep_freeze(value);
		}
	});

	return Object.freeze(object_);
}