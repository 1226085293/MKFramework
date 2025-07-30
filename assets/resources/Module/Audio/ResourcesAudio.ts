import ResourcesAudioNodes from "./ResourcesAudioNodes";
import * as cc from "cc";
import { _decorator } from "cc";
import GlobalConfig from "global_config";
import ResourcesConfig from "../../Bundle/ResourcesConfig";
import mk from "mk";
const { ccclass, property } = _decorator;

@ccclass("ResourcesAudio")
export class ResourcesAudio extends mk.ViewBase {
	/* --------------- 属性 --------------- */
	@property(ResourcesAudioNodes)
	nodes = new ResourcesAudioNodes();

	// 编辑器资源使用 play 接口播放只会有一个音频生效
	@property({ displayName: "音乐", type: mk.Audio_.Unit })
	music = new mk.Audio_.Unit();

	@property({ displayName: "音效", type: mk.Audio_.Unit })
	effect = new mk.Audio_.Unit();

	@property({ displayName: "音效2", type: mk.Audio_.Unit })
	effect2 = new mk.Audio_.Unit();

	@property({ displayName: "重叠音效", type: mk.Audio_.Unit })
	overlapEffect = new mk.Audio_.Unit();

	/* --------------- public --------------- */
	data = new (class {
		music = {
			/** 进度 */
			progressNum: 0,
			/** 音量 */
			volumeNum: 0.2,
			/** 暂停状态 */
			isPause: false,
			/** 停止状态 */
			isStop: false,
		};

		effect = {
			/** 音量 */
			volumeNum: 0.5,
			/** 暂停状态 */
			isPause: false,
			/** 停止状态 */
			isStop: false,
		};

		/** 分组 */
		group = {
			/** 停止状态 */
			isStop: false,
			/** 音量 */
			volumeNum: 1,
		};

		/** 分组2 */
		group2 = {
			/** 停止状态 */
			isStop: false,
			/** 音量 */
			volumeNum: 1,
		};
	})();

	/* --------------- private --------------- */
	/** 重叠音频数组 */
	private _overlapEffectList!: mk.Audio_.Unit[];
	/* ------------------------------- 生命周期 ------------------------------- */
	// @ts-ignore
	// init(init_?: typeof this.init_data): void {}

	async open(): Promise<void> {
		await this._initData();
		await this._initView();
		this._initEvent();
	}

	close(): void {
		// 停止音乐
		mk.audio.stopAll();
		mk.audio.getGroup(ResourcesConfig.Audio.Group.Test).clear();
		mk.audio.getGroup(ResourcesConfig.Audio.Group.Test2).clear();
	}

	/* ------------------------------- 按钮事件 ------------------------------- */
	buttonClose(): void {
		mk.uiManage.close(this);
	}

	/** 音效 */
	buttonEffect(): void {
		this.data.group.isStop = !this.data.group.isStop;
	}

	/** 音效2 */
	buttonEffect2(): void {
		this.data.group2.isStop = !this.data.group2.isStop;
	}

	/** 重叠播放 */
	buttonOverlapPlay(): void {
		mk.audio.play(this._overlapEffectList.find((v) => v.state === mk.Audio_.State.Stop)!);
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 初始化数据 */
	private async _initData(): Promise<void> {
		// 重叠播放音频单元
		this._overlapEffectList = [this.overlapEffect, this.overlapEffect.clone()];

		// 初始化音频数据
		{
			// // 使用动态加载
			// {
			// 	this.music = (await mk.audio.add(
			// 		"db://assets/resources/Module/Audio/Audio/Strictlyviolin荀博,马克Musician - Are You Lost.mp3",
			// 		this,
			// 		{
			// 			type: GlobalConfig.Audio.Type.Music,
			// 		}
			// 	))!;

			// 	this.effect = (await mk.audio.add("db://assets/resources/Module/Audio/Audio/龙卷风声音_耳聆网_[声音ID：36225].mp3", this))!;
			// 	this.effect2 = (await mk.audio.add("db://assets/resources/Module/Audio/Audio/水滴声音_耳聆网__声音ID：11407_.mp3", this))!;
			// }

			// 循环播放
			this.music.isLoop = true;
			this.effect.isLoop = true;
			this.effect2.isLoop = true;

			// 添加到分组
			mk.audio.getGroup(ResourcesConfig.Audio.Group.Test).addAudio([this.effect, this.effect2]);
			mk.audio.getGroup(ResourcesConfig.Audio.Group.Test2).addAudio([this.effect2]);
		}
	}

	/** 初始化视图 */
	private _initView(): void {
		// 更新音乐进度条
		this.schedule(() => {
			if (this.music.state !== mk.Audio_.State.Play) {
				return;
			}

			this.data.music.progressNum = this.music.currentTimeSNum / this.music.totalTimeSNum;
		}, 1);
	}

	/** 初始化事件 */
	private _initEvent(): void {
		// 数据事件
		{
			// 音乐进度条
			mk.monitor.on(this.data.music, "progressNum", this._dataMusicProgressNum, this)?.call(this, this.data.music.progressNum);
			// 音乐暂停
			mk.monitor.on(this.data.music, "isPause", this._dataMusicIsPause, this)?.call(this, this.data.music.isPause);
			// 音乐停止
			mk.monitor.on(this.data.music, "isStop", this._dataMusicIsStop, this)?.call(this, this.data.music.isStop);
			// 音效暂停
			mk.monitor.on(this.data.effect, "isPause", this._dataEffectIsPause, this)?.call(this, this.data.effect.isPause);
			// 音效停止
			mk.monitor.on(this.data.effect, "isStop", this._dataEffectIsStop, this)?.call(this, this.data.effect.isStop);
			// 音乐音量
			mk.monitor.on(this.data.music, "volumeNum", this._dataMusicVolumeNum, this)?.call(this, this.data.music.volumeNum);
			// 音效音量
			mk.monitor.on(this.data.effect, "volumeNum", this._dataEffectVolumeNum, this)?.call(this, this.data.effect.volumeNum);
			// 分组停止
			mk.monitor.on(this.data.group, "isStop", this._dataGroupIsStop, this)?.call(this, this.data.group.isStop);
			// 分组音量
			mk.monitor.on(this.data.group, "volumeNum", this._dataGroupVolumeNum, this)?.call(this, this.data.group.volumeNum);
			// 分组2音量
			mk.monitor.on(this.data.group2, "volumeNum", this._dataGroup2VolumeNum, this)?.call(this, this.data.group2.volumeNum);
			// 分组2停止
			mk.monitor.on(this.data.group2, "isStop", this._dataGroup2IsStop, this)?.call(this, this.data.group2.isStop);
		}

		// 节点事件
		this.nodes.bg.on(cc.Node.EventType.TOUCH_MOVE, this._nodeTouchMove, this);
	}

	/* ------------------------------- 数据事件 ------------------------------- */
	private _dataMusicProgressNum(valueNum_: number): void {
		this.music.currentTimeSNum = this.music.totalTimeSNum * valueNum_;
	}

	private _dataMusicIsPause(value_: boolean): void {
		if (value_) {
			mk.audio.getGroup(GlobalConfig.Audio.Type.Music).pause();
		} else {
			mk.audio.getGroup(GlobalConfig.Audio.Type.Music).play(mk.Audio_.State.Pause);
		}
	}

	private _dataMusicIsStop(value_: boolean): void {
		if (value_) {
			mk.audio.getGroup(GlobalConfig.Audio.Type.Music).stop();
		} else {
			mk.audio.getGroup(GlobalConfig.Audio.Type.Music).play(mk.Audio_.State.Pause | mk.Audio_.State.Stop);
			// 更新状态
			this.data.music.isPause = false;
		}
	}

	private _dataEffectIsPause(value_: boolean): void {
		if (value_) {
			mk.audio.getGroup(GlobalConfig.Audio.Type.Effect).pause();
		} else {
			mk.audio.getGroup(GlobalConfig.Audio.Type.Effect).play(mk.Audio_.State.Pause);
			// 重新播放分组 0
			if (!this.data.effect.isStop) {
				mk.audio.getGroup(ResourcesConfig.Audio.Group.Test).play(mk.Audio_.State.Stop);
			}
		}
	}

	private _dataEffectIsStop(value_: boolean): void {
		if (value_) {
			mk.audio.getGroup(GlobalConfig.Audio.Type.Effect).stop();
		} else {
			mk.audio.getGroup(GlobalConfig.Audio.Type.Effect).stop(false);
			// 更新状态
			this.data.effect.isPause = false;
			// 重新播放分组 0
			if (!this.data.effect.isStop) {
				mk.audio.getGroup(ResourcesConfig.Audio.Group.Test).play(mk.Audio_.State.Stop);
			}
		}
	}

	private _dataMusicVolumeNum(valueNum_: number): void {
		mk.audio.getGroup(GlobalConfig.Audio.Type.Music).volumeNum = valueNum_;
	}

	private _dataEffectVolumeNum(valueNum_: number): void {
		mk.audio.getGroup(GlobalConfig.Audio.Type.Effect).volumeNum = valueNum_;
	}

	private _dataGroupIsStop(value_: boolean): void {
		if (value_) {
			mk.audio.getGroup(ResourcesConfig.Audio.Group.Test).stop();
		} else {
			mk.audio.getGroup(ResourcesConfig.Audio.Group.Test).stop(false);
			mk.audio.getGroup(ResourcesConfig.Audio.Group.Test).play(mk.Audio_.State.Pause | mk.Audio_.State.Stop);
		}
	}

	private _dataGroupVolumeNum(valueNum_: number): void {
		mk.audio.getGroup(ResourcesConfig.Audio.Group.Test).volumeNum = valueNum_;
	}

	private _dataGroup2VolumeNum(valueNum_: number): void {
		mk.audio.getGroup(ResourcesConfig.Audio.Group.Test2).volumeNum = valueNum_;
	}

	private _dataGroup2IsStop(value_: boolean): void {
		if (value_) {
			mk.audio.getGroup(ResourcesConfig.Audio.Group.Test2).stop();
		} else {
			mk.audio.getGroup(ResourcesConfig.Audio.Group.Test2).stop(false);
			mk.audio.getGroup(ResourcesConfig.Audio.Group.Test2).play(mk.Audio_.State.Pause | mk.Audio_.State.Stop);
		}
	}

	/* ------------------------------- 节点事件 ------------------------------- */
	private _nodeTouchMove(event: cc.EventTouch): void {
		const canvas = cc.director.getScene()!.getComponentInChildren(cc.Canvas)!;
		/** 触摸世界坐标 */
		const touchPosV3 = event.getUILocation();

		/** 距中心点距离 */
		const distanceNum = cc
			.v2(touchPosV3.x - mk.N(canvas.node).transform.width * 0.5, touchPosV3.y - mk.N(canvas.node).transform.height * 0.5)
			.length();

		// 更新方块位置
		this.nodes.cube.worldPosition = cc.v3(touchPosV3.x, touchPosV3.y);
		// 更新分组音量
		this.data.group.volumeNum = mk.audio.getGroup(ResourcesConfig.Audio.Group.Test).volumeNum = 1 - Math.min(1, distanceNum / 500);
	}
}
