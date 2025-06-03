/* eslint-disable */

export type type_texture_config<
	T = Record<
		number,
		{
			/** ID */
			id_n: number;
			/** 中文 */
			zh_cn: string;
			/** 英语 */
			en_us: string;
		}
	>
> = {
	readonly [P in keyof T]: T[P] extends Function
		? T[P]
		: type_texture_config<T[P]>;
};

/** 全局多语言/c_texture */
export const texture_config: type_texture_config = new Proxy(
	{},
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
