import MKInstanceBase from "./MKInstanceBase";
import { mkLog } from "./MKLogger";

/**
 * 动态模块
 * @noInheritDoc
 * @remarks
 * 更优雅的使用动态模块，不必每次 await import(...)
 */
export class MKDynamicModule extends MKInstanceBase {
	/**
	 * 获取模块默认导出
	 * @param module_ 动态模块
	 * @returns
	 */
	// @ts-ignore
	default<T extends Promise<any>>(module_: T): Awaited<T>["default"] {
		/** 模块导出表 */
		let moduleExportTab: any;

		module_.then((v) => {
			moduleExportTab = v;
		}) as any;

		return new Proxy(Object.create(null), {
			get: (target, key) => {
				if (moduleExportTab) {
					return moduleExportTab["default"][key];
				}

				mkLog.error("模块未加载完成");

				return null;
			},
			set: (target, key, value) => {
				if (moduleExportTab) {
					moduleExportTab["default"][key] = value;

					return true;
				}

				mkLog.error("模块未加载完成");

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
		let moduleExportTab: any;
		/** 模块导出代理表 */
		const moduleExportProxyTab = {};

		module_.then((v) => {
			moduleExportTab = v;
		}) as any;

		return new Proxy(Object.create(null), {
			get: (target, key) => {
				if (moduleExportProxyTab[key] === undefined) {
					moduleExportProxyTab[key] = new Proxy(Object.create(null), {
						get: (target2, key2) => {
							if (moduleExportTab) {
								return moduleExportTab[key][key2];
							}

							mkLog.error("模块未加载完成");

							return null;
						},
						set: (target2, key2, value) => {
							if (moduleExportTab) {
								moduleExportTab[key][key2] = value;

								return true;
							}

							mkLog.error("模块未加载完成");

							return false;
						},
					});
				}

				return moduleExportProxyTab[key];
			},
		});
	}
}

export default MKDynamicModule.instance();
