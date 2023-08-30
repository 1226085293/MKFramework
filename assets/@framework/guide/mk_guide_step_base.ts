import * as cc from "cc";
import { mk_log } from "../mk_logger";
import type mk_guide_manage from "./mk_guide_manage";
import { mk_guide_manage_ } from "./mk_guide_manage";
import { _decorator } from "cc";
const { ccclass, property } = _decorator;

/** 引导步骤基类 */
@ccclass("mk_guide_step_base")
abstract class mk_guide_step_base<CT extends Record<string, mk_guide_manage_.operate_cell> = any> extends cc.Component {
	/** 步骤序号 */
	abstract step_n: number;
	/**
	 * 所属场景
	 * @remarks
	 * 格式：bundle.scene
	 */
	scene_s?: string;
	/** 引导管理器 */
	guide_manage!: mk_guide_manage;
	/** 操作键列表 */
	operate_ss: Exclude<keyof CT, symbol>[] = [];
	/** 操作表返回值 */
	operate_tab: { [k in keyof CT]: ReturnType<Awaited<CT[k]["load"]>> | undefined } = {} as any;
	/** 初始化数据 */
	init_data!: any;
	/** 步骤更新返回数据 */
	step_update_data!: any;
	/**
	 * 步骤描述
	 * @remarks
	 * 用于日志打印
	 */
	describe_s?: string;
	/**
	 * 下个步骤
	 * @remarks
	 * - length == 1：预加载及 this._next 跳转
	 * - length > 1：预加载
	 */
	next_step_ns?: number[];
	/* ------------------------------- 生命周期 ------------------------------- */
	/**
	 * 预加载
	 * @remarks
	 * 上个步骤 load 后执行
	 */
	pre_load?(): void | Promise<void>;

	/**
	 * 加载
	 * @param jump_b_ 跳转状态
	 * @remarks
	 * 进入当前步骤
	 */
	abstract load(jump_b_: boolean): void | Promise<void>;

	/**
	 * 卸载
	 * @remarks
	 * 退出当前步骤
	 */
	unload?(): void | Promise<void>;
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 跳转到下个步骤
	 * @param init_data_ 下个步骤初始化数据
	 * @returns
	 */
	protected _next(init_data_?: any): void {
		if (this.next_step_ns === undefined) {
			mk_log.error("下个步骤序号为空");

			return;
		}

		if (this.next_step_ns.length > 1) {
			return;
		}

		this.guide_manage.set_step(this.next_step_ns[0], init_data_);
	}
}

export default mk_guide_step_base;
