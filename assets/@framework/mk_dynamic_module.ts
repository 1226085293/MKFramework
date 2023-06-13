import mk_instance_base from "./mk_instance_base";
import { mk_log } from "./mk_logger";

/**
 * 动态模块
 * @remarks
 * 用以解除循环引用
 */
class mk_dynamic_module extends mk_instance_base {
	/**
	 * 获取模块默认导出
	 * @param module_ 动态模块
	 * @returns
	 */
	// @ts-ignore
	default<T extends Promise<any>>(module_: T): Awaited<T>["default"] {
		/** 模块导出表 */
		let module_export_tab: any;

		module_.then((v) => {
			module_export_tab = v;
		}) as any;

		return new Proxy(Object.create(null), {
			get: (target, key) => {
				if (module_export_tab) {
					return module_export_tab["default"][key];
				}

				mk_log.error("模块未加载完成");

				return null;
			},
			set: (target, key, value) => {
				if (module_export_tab) {
					module_export_tab["default"][key] = value;

					return true;
				}

				mk_log.error("模块未加载完成");

				return false;
			},
		});
	}

	/**
	 * 获取模块所有导出
	 * @param module_ 动态模块
	 * @returns
	 */
	// @ts-ignore
	all<T extends Promise<any>>(module_: T): Awaited<T> {
		/** 模块导出表 */
		let module_export_tab: any;
		/** 模块导出代理表 */
		const module_export_proxy_tab = {};

		module_.then((v) => {
			module_export_tab = v;
		}) as any;

		return new Proxy(Object.create(null), {
			get: (target, key) => {
				if (module_export_proxy_tab[key] === undefined) {
					module_export_proxy_tab[key] = new Proxy(Object.create(null), {
						get: (target2, key2) => {
							if (module_export_tab) {
								return module_export_tab[key][key2];
							}

							mk_log.error("模块未加载完成");

							return null;
						},
						set: (target2, key2, value) => {
							if (module_export_tab) {
								module_export_tab[key][key2] = value;

								return true;
							}

							mk_log.error("模块未加载完成");

							return false;
						},
					});
				}

				return module_export_proxy_tab[key];
			},
		});
	}
}

export default mk_dynamic_module.instance();
