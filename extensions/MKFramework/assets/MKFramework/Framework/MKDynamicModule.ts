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

		module_.then((v) => {
			moduleExportTab = v;
		}) as any;

		return new Proxy(Object.create(null), {
			get: (target, key) => {
				if (!moduleExportTab[key]) {
					mkLog.error("模块未加载完成");

					return null;
				}

				return moduleExportTab[key];
			},
		});
	}
}

const mkDynamicModule = MKDynamicModule.instance();

export default mkDynamicModule;
