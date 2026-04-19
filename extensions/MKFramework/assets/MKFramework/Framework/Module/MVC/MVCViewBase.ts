import MKViewBase, { MKViewBase_ } from "../MKViewBase";
import MVCModelBase from "./MVCModelBase";
import MKEventTarget from "../../MKEventTarget";
import { _decorator } from "cc";
const { ccclass } = _decorator;

namespace _MVCViewBase {
	/** 递归只读 */
	type TypeRecursiveReadonly<T> = {
		readonly [P in keyof T]: T[P] extends Function ? T[P] : TypeRecursiveReadonly<T[P]>;
	};

	/** 排除函数属性的对象键 */
	type TypeNonFunctionKeys<T> = {
		// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
		[P in keyof T]: T[P] extends Function | void ? never : P;
	}[keyof T];

	/** 递归只读且无函数 */
	export type TypeRecursiveReadonlyAndNonFunctionKeys<T> = TypeRecursiveReadonly<Pick<T, TypeNonFunctionKeys<T>>>;

	/** MVC View 创建配置 */
	export interface CreateConfig<CT extends MVCModelBase = MVCModelBase> extends MKViewBase_.CreateConfig {
		model?: TypeRecursiveReadonlyAndNonFunctionKeys<CT>;
	}
}

@ccclass
abstract class MVCViewBase<CT extends MVCModelBase = MVCModelBase> extends MKViewBase {
	/** 视图事件 */
	event = new MKEventTarget<any>();
	/** 数据访问器 */
	protected _model!: _MVCViewBase.TypeRecursiveReadonlyAndNonFunctionKeys<CT>;
	/** 设置模块配置 */
	set config(config_: _MVCViewBase.CreateConfig<CT>) {
		super.config = config_;

		if (config_.model) {
			this._model = config_.model;
		}
	}
	/* ------------------------------- segmentation ------------------------------- */
	/** 视图构造函数，由继承类型实现并被 control 访问 */
	static async new?<T extends new (...argsList: any[]) => any>(this: T, ...argsList: any[]): Promise<InstanceType<T> | null>;
}

export default MVCViewBase;
