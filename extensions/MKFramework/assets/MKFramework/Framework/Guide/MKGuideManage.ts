import MKEventTarget from "../MKEventTarget";
import MKLogger from "../MKLogger";
import MKTaskPipeline from "../Task/MKTaskPipeline";
import MKGuideStepBase from "./MKGuideStepBase";
import mkBundle from "../Resources/MKBundle";

/**
 * 引导管理器
 * @noInheritDoc
 * @remarks
 *
 * - 支持多实例
 *
 * - 支持任意步骤的(插入/删除)
 *
 * - 支持(暂停/完成)引导
 *
 * - 支持任意步骤跳转后的状态还原(操作单元)
 *
 * - 引导步骤脚本分离，支持组件式挂载
 */
class MKGuideManage {
	constructor(init_: MKGuideManage_.InitConfig) {
		// 初始化数据
		this._log = new MKLogger(init_.nameStr ?? "MKGuideManage");
		this._initConfig = init_;

		if (this._initConfig.currentStepNum !== undefined) {
			this._stepNum = this._initConfig.currentStepNum;
		}
	}

	/* --------------- public --------------- */
	/** 事件 */
	event = new MKEventTarget<MKGuideManage_.EventProtocol>();
	/** 步骤表 */
	stepMap = new Map<number, MKGuideStepBase>();
	/** 暂停状态 */
	get isPause(): boolean {
		return this._isPause;
	}

	set isPause(value_) {
		this._setIsPause(value_);
	}

	/** 完成状态 */
	get isFinish(): boolean {
		return this._stepNum === this._initConfig.endStepNum;
	}

	/** 结束步骤 */
	get endStepNum(): number {
		return this._initConfig.endStepNum ?? 0;
	}

	/* --------------- private --------------- */
	/** 日志 */
	private _log!: MKLogger;
	/** 初始化配置 */
	private _initConfig!: MKGuideManage_.InitConfig;
	/** 暂停状态 */
	private _isPause = false;
	/** 上次步骤序号 */
	private _preStepNum?: number;
	/** 当前步骤序号 */
	private _stepNum!: number;
	/** 任务管线 */
	private _taskPipeline = new MKTaskPipeline();
	/** 步骤预加载任务表 */
	private _stepPreloadMap = new Map<number, null | Promise<any>>();
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 注册步骤
	 * @param step_ 步骤实例
	 */
	regis(step_: MKGuideStepBase | MKGuideStepBase[]): void {
		if (Array.isArray(step_)) {
			step_.forEach((v) => {
				v.guideManage = this;
				this.stepMap.set(v.stepNum, v);
			});
		} else {
			step_.guideManage = this;
			this.stepMap.set(step_.stepNum, step_);
		}
	}

	/**
	 * 运行引导
	 * @remarks
	 * 自动取消暂停状态，且更新当前步骤视图
	 */
	run(): Promise<void> {
		return this._taskPipeline.add(async () => {
			if (this._preStepNum === this._stepNum) {
				return;
			}

			/** 上次引导步骤 */
			const preStep = this._preStepNum === undefined ? null : this.stepMap.get(this._preStepNum);
			/** 当前引导步骤 */
			const currentStep = this.stepMap.get(this._stepNum);
			/** 跳转状态 */
			const isJump = !preStep?.nextStepNumList?.includes(this._stepNum);

			// 步骤未注册
			if (!currentStep) {
				this._log.error(`步骤 ${this._stepNum} 未注册`);
				this.isPause = true;

				return;
			}

			// 初始步骤数据
			if (this._preStepNum === undefined && !currentStep.stepUpdateData && !this._updateStepData()) {
				return;
			}

			/** 下次引导步骤 */
			const nextStepList =
				!currentStep.nextStepNumList || currentStep.nextStepNumList.length > 1
					? null
					: currentStep.nextStepNumList.map((vNum) => this.stepMap.get(vNum));

			// 恢复暂停
			this.isPause = false;

			// 加载步骤事件
			this._log.log("执行步骤", currentStep.stepNum, currentStep.describeStr ?? "");
			await Promise.all(this.event.request(this.event.key.loadingStep));

			// 执行下步预加载
			nextStepList?.forEach((v) => {
				if (!v?.preLoad) {
					return;
				}

				this._stepPreloadMap.set(v.stepNum, v.preLoad() ?? null);
			});

			// 加载场景
			if (currentStep.sceneStr?.includes(".")) {
				const bundleStr = currentStep.sceneStr.split(".")[0];
				const sceneStr = currentStep.sceneStr.split(".")[1];

				if (mkBundle.bundleStr !== bundleStr || mkBundle.sceneStr !== sceneStr) {
					await mkBundle.loadScene(sceneStr, {
						bundleStr: bundleStr,
					});
				}
			}

			// (加载/卸载/重置)操作
			if (this._initConfig.operateTab) {
				/** 当前步骤操作 */
				const currentOperateStrList = currentStep.operateStrList;
				/** 上次步骤操作 */
				const preOperateStrList = preStep?.operateStrList ?? ([] as any as typeof currentOperateStrList);

				for (const vStr of preOperateStrList) {
					// 重置操作，当前步骤和上次步骤都存在的操作
					if (currentOperateStrList.includes(vStr)) {
						await this._initConfig.operateTab[vStr].reset?.();
						currentStep.operateTab[vStr] = preStep?.operateTab[vStr];
					}
					// 卸载操作，上次步骤存在，当前步骤不存在的操作
					else {
						await this._initConfig.operateTab[vStr].unload?.();
					}
				}

				// 加载操作，当前步骤存在，上次步骤不存在的操作
				for (const vStr of currentOperateStrList.filter((v) => !preOperateStrList.includes(v))) {
					currentStep.operateTab[vStr] = await this._initConfig.operateTab[vStr].load();
				}
			}

			// 确认预加载完成
			{
				await (this._stepPreloadMap.get(currentStep.stepNum) ?? null);
				this._stepPreloadMap.delete(currentStep.stepNum);
			}

			// 卸载步骤
			if (preStep) {
				// 执行上个步骤 unload
				await preStep.unload?.();
				// 卸载步骤事件
				await Promise.all(this.event.request(this.event.key.afterUnloadStep, preStep));
			}

			// 更新上个步骤
			this._preStepNum = currentStep.stepNum;
			// 执行步骤 load
			await currentStep.load(isJump);
			// 加载步骤完成事件
			await Promise.all(this.event.request(this.event.key.loadingStepComplete));
		});
	}

	/**
	 * 设置当前步骤
	 * @param stepNum_ 步骤
	 * @param initData_ 初始化数据
	 * @remarks
	 *
	 * - 暂停状态：更新步骤数据
	 *
	 * - 正常状态：更新步骤数据，执行步骤生命周期
	 */
	setStep(stepNum_: number, initData_?: any): Promise<void> {
		return this._taskPipeline.add(async () => {
			if (this._stepNum === stepNum_) {
				return;
			}

			// 切换前事件
			await Promise.all(this.event.request(this.event.key.beforeSwitch, stepNum_));

			// 更新步骤
			this._stepNum = stepNum_;

			/** 当前引导步骤 */
			const currentStep = this.stepMap.get(this._stepNum);

			// 更新初始化数据
			if (currentStep) {
				currentStep.initData = initData_;
			}

			this._log.log("切换到步骤", this._stepNum, currentStep?.describeStr ?? "");

			// 更新步骤数据
			if (!this._updateStepData() && this._stepNum !== this._initConfig.endStepNum) {
				return;
			}

			// 步骤完成
			if (this._stepNum === this._initConfig.endStepNum) {
				this.finish();

				return;
			}

			// 运行
			if (!this.isPause) {
				this.run();
			}
		});
	}

	/** 获取步骤 */
	getStep(): number {
		return this._stepNum;
	}

	/** 完成引导 */
	finish(): void {
		this._log.log("引导完成");
		this.isPause = true;
		this.event.emit(this.event.key.finish);
	}

	/** 更新步骤数据 */
	private _updateStepData(): boolean {
		/** 当前引导步骤 */
		const currentStep = this.stepMap.get(this._stepNum);
		/** 步骤数据 */
		const stepData = !this._initConfig.stepUpdateCallbackFunc ? true : this._initConfig.stepUpdateCallbackFunc(this._stepNum);

		// 引导中断
		if ((stepData ?? null) === null) {
			this._isPause = true;
			this.event.emit(this.event.key.break);
			this._log.warn(`当前步骤 ${this._stepNum} 数据错误，引导中断`);

			return false;
		}

		// 更新步骤数据
		if (currentStep) {
			currentStep.stepUpdateData = stepData;
		} else {
			this._isPause = true;
			this.event.emit(this.event.key.break);
			this._log.warn(`当前步骤 ${this._stepNum} 未注册，引导中断`);

			return false;
		}

		return true;
	}

	/* ------------------------------- get/set ------------------------------- */
	private _setIsPause(value_: boolean): void {
		if (this._isPause === value_) {
			return;
		}

		this._isPause = value_;

		// (暂停/恢复)事件
		this.event.emit(this._isPause ? this.event.key.pause : this.event.key.resume);
	}
}

export namespace MKGuideManage_ {
	/** 事件协议 */
	export interface EventProtocol {
		/** 暂停 */
		pause(): void;
		/** 恢复 */
		resume(): void;
		/**
		 * 切换步骤前
		 * @param nextStepNum 下个步骤
		 * @remarks
		 * setStep 时执行
		 */
		beforeSwitch(nextStepNum: number): void;
		/**
		 * 加载步骤
		 * @remarks
		 * 加载步骤(场景/操作)前调用
		 */
		loadingStep(): void;
		/**
		 * 卸载步骤后
		 * @param step 卸载的步骤
		 */
		afterUnloadStep(step: MKGuideStepBase): void;
		/**
		 * 加载步骤完成
		 * @remarks
		 * 步骤 load 执行后调用
		 */
		loadingStepComplete(): void;
		/** 中断 */
		break(): void;
		/** 完成 */
		finish(): void;
	}

	/** 操作单元 */
	export interface OperateCell {
		/** 加载 */
		load: () => any;
		/** 卸载 */
		unload?: () => any;
		/**
		 * 重置
		 * @remarks
		 * 上下步骤都存在当前操作时调用
		 */
		reset?: () => any;
	}

	/** 初始化配置 */
	export interface InitConfig {
		/** 当前步骤 */
		currentStepNum?: number;
		/** 结束步骤 */
		endStepNum?: number;
		/** 操作表 */
		operateTab?: Record<string, OperateCell>;
		/**
		 * 引导名
		 * @remarks
		 * 用于日志输出
		 */
		nameStr?: string;
		/**
		 * 步骤更新回调
		 * @param stepNum
		 * @returns null/undefined：更新失败，中断引导
		 * @remarks
		 * - 默认返回 true
		 *
		 * - 可在此内更新服务端数据并请求奖励
		 *
		 * - 步骤可使用 this.stepUpdateData 获取返回数据
		 */
		stepUpdateCallbackFunc?(stepNum: number): any;
	}
}

export default MKGuideManage;
