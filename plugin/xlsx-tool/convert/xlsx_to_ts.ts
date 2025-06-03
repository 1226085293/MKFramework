import prettier from "prettier";
import path from "path";

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
	/** 类型 */
	let type_s = "";
	/** 配置 */
	let config_s = "";
	/** 输出文件名 */
	let output_name_s = path.basename(output_path_s_, path.extname(output_path_s_));
	/** 输入文件名 */
	let input_name_s = path.basename(input_path_s_, path.extname(input_path_s_));

	type_s = `Record<number, {${attractor_name_ss_
		.map((v2_s, k2_n) => `\n	/** ${attractor_desc_ss_[k2_n]} */\n	${v2_s}: ${attractor_type_ss_[k2_n]}`)
		.join(";")}\n}>`;

	for (let v2_s in config_tab_) {
		config_s += `\n		[${v2_s}]: ${JSON.stringify(config_tab_[v2_s])},`;
	}
	config_s = config_s.slice(1);

	let file_s = `/* eslint-disable */
    
    export type type_${output_name_s}<T = ${type_s}> = {
        readonly [P in keyof T]: T[P] extends Function ? T[P] : type_${output_name_s}<T[P]>;
    };
    
    /** ${input_name_s}/${table_name_s_} */
    export const ${output_name_s}: type_${output_name_s} = new Proxy(
        {
    ${config_s}
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
    }`;

    return prettier.format(file_s, {
        useTabs: true,
        filepath: "*.ts",
    });
}
