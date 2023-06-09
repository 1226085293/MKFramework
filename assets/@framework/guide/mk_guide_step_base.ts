import { mk_log } from "../mk_logger";
import type mk_guide_manage from "./mk_guide_manage";

/** 引导步骤基类 */
abstract class mk_guide_step_base {
	/** 步骤序号 */
	abstract step_n: number;
	/** 所属场景（bundle.scene） */
	abstract scene_s: string;
	/** 引导管理器 */
	guide_manage!: mk_guide_manage;
	/** 操作键列表 */
	operate_ss: any[] = [];
	/** 操作表返回值 */
	operate_tab: Record<PropertyKey, any> = {};
	/** 初始化数据 */
	init_data!: any;
	/** 步骤更新返回数据 */
	step_update_data!: any;
	/** 步骤描述（用于打印） */
	describe_s?: string;
	/** 下个步骤（用于预加载以及 this._next 跳转） */
	next_step_n?: number;
	/* ------------------------------- 生命周期 ------------------------------- */
	/** 预加载（上个步骤 load 后执行） */
	pre_load?(): void | Promise<void>;

	/** 加载（进入当前步骤） */
	abstract load(): void | Promise<void>;

	/** 卸载（退出当前步骤） */
	unload?(): void | Promise<void>;
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 跳转到下个步骤
	 * @param init_data_ 下个步骤初始化数据
	 * @returns
	 */
	protected _next(init_data_?: any): void {
		if (this.next_step_n === undefined) {
			mk_log.error("下个步骤序号为空");

			return;
		}

		this.guide_manage.set_step(this.next_step_n, init_data_);
	}
}

export default mk_guide_step_base;
