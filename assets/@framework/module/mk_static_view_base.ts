import * as cc from "cc";
import mk_life_cycle from "./mk_life_cycle";
const { ccclass, property } = cc._decorator;

/**
 * 场景基类
 * @remarks
 * 继承于 mk_life_cycle，屏蔽了多余 inspector 展示
 */
@ccclass
export class mk_static_view_base extends mk_life_cycle {
	protected _use_layer_b = false;
}

export default mk_static_view_base;
