import MKViewBase from "../MKViewBase";
import MVCModelBase from "./MVCModelBase";
import MKEventTarget from "../../MKEventTarget";
import { _decorator } from "cc";
const { ccclass, property } = _decorator;

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
}

@ccclass
abstract class MVCViewBase<CT extends MVCModelBase = MVCModelBase> extends MKViewBase {
	/** 视图事件 */
	event = new MKEventTarget<any>();
	/** 数据访问器 */
	protected _model!: _MVCViewBase.TypeRecursiveReadonlyAndNonFunctionKeys<CT>;
	/* ------------------------------- segmentation ------------------------------- */
	/** 视图构造函数，由继承类型实现并被 control 访问 */
	static async new?<T extends new (...argsList: any[]) => any>(this: T): Promise<InstanceType<T> | null>;
}

export default MVCViewBase;
