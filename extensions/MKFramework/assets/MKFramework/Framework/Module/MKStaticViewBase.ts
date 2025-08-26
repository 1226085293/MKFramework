import { _decorator } from "cc";
import MKLifeCycle from "./MKLifeCycle";
const { ccclass, property } = _decorator;

/**
 * 静态视图基类
 * @remarks
 * 继承于 MKLifeCycle，屏蔽了多余 inspector 展示
 */
@ccclass
export class MKStaticViewBase extends MKLifeCycle {
	protected _isUseLayer = false;
}

export default MKStaticViewBase;
