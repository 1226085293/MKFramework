/* eslint-disable */

export type type_label_config<
	T = Record<
		number,
		{
			/** ID */
			id_n: number;
			/** 中文 */
			zhCn: string;
			/** 英语 */
			enUs: string;
		}
	>
> = {
	readonly [P in keyof T]: T[P] extends Function ? T[P] : type_label_config<T[P]>;
};

/** 全局多语言/c_label */
export const label_config: type_label_config = new Proxy(
	{
		[1]: { id_n: 1, zhCn: "测试", enUs: "Test" },
		[2]: { id_n: 2, zhCn: "测试参数{0}", enUs: "TestParameters{0}" },
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
