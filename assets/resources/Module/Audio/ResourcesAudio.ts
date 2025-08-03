import * as cc from "cc";
import { _decorator } from "cc";
import mk from "mk";
import GlobalConfig from "global_config";
const { ccclass, property } = _decorator;

@ccclass("ResourcesAudio")
export class ResourcesAudio extends mk.ViewBase {
	/* --------------- 属性 --------------- */
	// 编辑器资源使用 play 接口播放只会有一个音频生效
	@property({ displayName: "音乐", type: mk.Audio_.Unit })
	music = new mk.Audio_.Unit();

	@property({ displayName: "音效", type: mk.Audio_.Unit })
	effect = new mk.Audio_.Unit();

	@property({ displayName: "重叠音效", type: mk.Audio_.Unit })
	overlapEffect = new mk.Audio_.Unit();

	@property({ displayName: "音乐暂停", type: cc.Toggle })
	musicPause: cc.Toggle = null!;

	@property({ displayName: "音效暂停", type: cc.Toggle })
	effectPause: cc.Toggle = null!;

	/* --------------- private --------------- */
	/** 重叠音频数组 */
	private _overlapEffectList!: mk.Audio_.Unit[];
	/**  */
	/* ------------------------------- 生命周期 ------------------------------- */
	// @ts-ignore
	// init(init_?: typeof this.init_data): void {}

	async open(): Promise<void> {
		await this._initData();
		await this._initView();
		this._initEvent();
	}

	close(config_?: Omit<mk.UIManage_.CloseConfig<any>, "type" | "isAll">): void | Promise<void> {
		// 停止音乐
		mk.audio.stopAll();
		mk.audio.getGroup(GlobalConfig.Audio.Type.Music).clear();
		mk.audio.getGroup(GlobalConfig.Audio.Type.Effect).clear();
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 初始化数据 */
	private async _initData(): Promise<void> {
		// 重叠播放音频单元，想控制最大重叠播放几次就 clone 几个
		this._overlapEffectList = [this.overlapEffect, this.overlapEffect.clone()];

		// // 动态加载音频
		// {
		// 	this.music = (await mk.audio.add("db://assets/resources/Module/Audio/Audio/Strictlyviolin荀博,马克Musician - Are You Lost.mp3", this, {
		// 		type: GlobalConfig.Audio.Type.Music,
		// 	}))!;

		// 	this.effect = (await mk.audio.add("db://assets/resources/Module/Audio/Audio/龙卷风声音_耳聆网_[声音ID：36225].mp3", this))!;
		// 	this.overlapEffect = (await mk.audio.add(
		// 		"db://assets/resources/Module/Audio/Audio/经典激光_射线枪射击_耳聆网_[声音ID：20870].wav",
		// 		this
		// 	))!;
		// }

		// 循环播放
		this.music.isLoop = true;
		this.effect.isLoop = true;
		// 开启播放
		mk.audio.getGroup(GlobalConfig.Audio.Type.Music).stop(false);
		mk.audio.getGroup(GlobalConfig.Audio.Type.Effect).stop(false);
	}

	/** 初始化视图 */
	private _initView(): void {
		mk.audio.play(this.music);
		mk.audio.play(this.effect);
	}

	/** 初始化事件 */
	private _initEvent(): void {
		// ...
	}

	/* ------------------------------- 按钮事件 ------------------------------- */
	clickClose(): void {
		this.close({
			isDestroy: true,
		});
	}

	/** 重叠播放 */
	clickOverlapPlay(): void {
		mk.audio.play(this._overlapEffectList.find((v) => v.state === mk.Audio_.State.Stop)!);
	}

	/** 音乐暂停 */
	clickMusicPause(toggle_: cc.Toggle): void {
		// 停止状态不能暂停
		if (mk.audio.getGroup(GlobalConfig.Audio.Type.Music).isStop) {
			this.musicPause.isChecked = false;

			return;
		}

		if (toggle_.isChecked) {
			mk.audio.getGroup(GlobalConfig.Audio.Type.Music).pause();
		} else {
			mk.audio.getGroup(GlobalConfig.Audio.Type.Music).play(mk.Audio_.State.Pause);
		}
	}

	/** 音乐停止 */
	clickMusicStop(toggle_: cc.Toggle): void {
		if (toggle_.isChecked) {
			mk.audio.getGroup(GlobalConfig.Audio.Type.Music).stop();
			this.musicPause.isChecked = false;
		} else {
			mk.audio.getGroup(GlobalConfig.Audio.Type.Music).stop(false);
			mk.audio.getGroup(GlobalConfig.Audio.Type.Music).play(mk.Audio_.State.Stop);
		}
	}

	/** 音效暂停 */
	clickEffectPause(toggle_: cc.Toggle): void {
		// 停止状态不能暂停
		if (mk.audio.getGroup(GlobalConfig.Audio.Type.Effect).isStop) {
			this.effectPause.isChecked = false;

			return;
		}

		if (toggle_.isChecked) {
			mk.audio.getGroup(GlobalConfig.Audio.Type.Effect).pause();
		} else {
			mk.audio.getGroup(GlobalConfig.Audio.Type.Effect).play(mk.Audio_.State.Pause);
		}
	}

	/** 音效停止 */
	clickEffectStop(toggle_: cc.Toggle): void {
		if (toggle_.isChecked) {
			mk.audio.getGroup(GlobalConfig.Audio.Type.Effect).stop();
			this.effectPause.isChecked = false;
		} else {
			mk.audio.getGroup(GlobalConfig.Audio.Type.Effect).stop(false);
			mk.audio.play(this.effect);
		}
	}
}
