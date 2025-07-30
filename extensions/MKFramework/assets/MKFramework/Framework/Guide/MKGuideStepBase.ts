import * as cc from "cc";
import { mkLog } from "../MKLogger";
import type MKGuideManage from "./MKGuideManage";
import type { MKGuideManage_ } from "./MKGuideManage";
import { _decorator } from "cc";
const { ccclass, property } = _decorator;

/**
 * 引导步骤基类
 * @noInheritDoc
 */
@ccclass("MkGuideStepBase")
abstract class MKGuideStepBase<CT extends Record<string, MKGuideManage_.OperateCell> = any> extends cc.Component {
	/** 步骤序号 */
	abstract stepNum: number;
	/**
	 * 所属场景
	 * @remarks
	 * 格式：bundle.scene
	 */
	sceneStr?: string;
	/** 引导管理器 */
	guideManage!: MKGuideManage;
	/** 操作键列表 */
	operateStrList: Exclude<keyof CT, symbol>[] = [];
	/** 操作表返回值 */
	operateTab: { [k in keyof CT]: ReturnType<Awaited<CT[k]["load"]>> | undefined } = {} as any;
	/** 初始化数据 */
	initData!: any;
	/** 步骤更新返回数据 */
	stepUpdateData!: any;
	/**
	 * 步骤描述
	 * @remarks
	 * 用于日志打印
	 */
	describeStr?: string;
	/**
	 * 下个步骤
	 * @remarks
	 *
	 * - length == 1：预加载及 this._next 跳转
	 *
	 * - length > 1：预加载
	 */
	nextStepNumList?: number[];
	/* ------------------------------- 生命周期 ------------------------------- */
	/**
	 * 预加载
	 * @remarks
	 * 上个步骤 load 后执行
	 */
	preLoad?(): void | Promise<void>;

	/**
	 * 加载
	 * @param isJump_ 跳转状态
	 * @remarks
	 * 进入当前步骤
	 */
	abstract load(isJump_: boolean): void | Promise<void>;

	/**
	 * 卸载
	 * @remarks
	 * 退出当前步骤
	 */
	unload?(): void | Promise<void>;
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 跳转到下个步骤
	 * @param initData_ 下个步骤初始化数据
	 * @returns
	 */
	protected _next(initData_?: any): void {
		if (this.nextStepNumList === undefined) {
			mkLog.error("下个步骤序号为空");

			return;
		}

		if (this.nextStepNumList.length > 1) {
			return;
		}

		this.guideManage.setStep(this.nextStepNumList[0], initData_);
	}
}

export default MKGuideStepBase;
