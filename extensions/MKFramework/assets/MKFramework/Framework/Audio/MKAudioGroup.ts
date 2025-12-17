import type { MKAudio } from "./MKAudio";
import MKAudioUnit, { MKAudioUnit_ } from "./MKAudioUnit";

/** 音频组 */
class MKAudioGroup {
	constructor(init_: MKAudio, idNum_: number) {
		this._audioManage = init_;
		this.idNum = idNum_;
	}

	/* --------------- public --------------- */
	/** 分组 ID */
	readonly idNum: number;
	/** 音频列表 */
	audioUnitList: ReadonlyArray<MKAudioUnit_.MKAudioUnitSafe> = [];

	/** 播放状态 */
	get isPlay(): boolean {
		return this._isPlay;
	}

	/** 停止状态 */
	get isStop(): boolean {
		return this._isStop;
	}

	/** 音量 */
	get volumeNum(): number {
		return this._volumeNum;
	}

	set volumeNum(valueNum_: number) {
		// 参数安检
		{
			if (valueNum_ > 1) {
				valueNum_ = 1;
			}

			if (valueNum_ < 0) {
				valueNum_ = 0;
			}
		}

		// 设置音量
		{
			this._volumeNum = valueNum_;
			this.audioUnitList.forEach((v) => {
				// eslint-disable-next-line no-self-assign
				v.updateVolume();
			});
		}
	}

	/* --------------- private --------------- */
	/** 音频管理器 */
	private _audioManage!: MKAudio;
	/** 音量 */
	private _volumeNum = 1;
	/** 播放状态 */
	private _isPlay = true;
	/** 停止状态 */
	private _isStop = false;
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 播放
	 * @param containsStateNum_ 包含状态，处于这些状态中的音频将被播放；
	 * 默认值 `mk.Audio_.MKAudioUnit_.State.Pause | mk.Audio_.MKAudioUnit_.State.Stop`
	 */
	play(containsStateNum_ = MKAudioUnit_.State.Pause | MKAudioUnit_.State.Stop): void {
		// 停止状态没有暂停的音乐
		if (this._isStop) {
			containsStateNum_ &= ~MKAudioUnit_.State.Pause;
		}

		// 没有包含状态
		if (!containsStateNum_) {
			return;
		}

		this._isPlay = true;
		this._isStop = false;
		this.audioUnitList.forEach((v) => {
			if (!(v.state & containsStateNum_)) {
				return;
			}

			// 播放音频
			this._audioManage.play(v);
		});
	}

	/** 暂停 */
	pause(): void {
		this._isPlay = false;
		this.audioUnitList.forEach((v) => {
			this._audioManage.pause(v);
		});
	}

	/**
	 * 停止
	 * @param isStop_
	 * true: 停止当前并阻止后续音频播放；false: 恢复播放能力；默认值 true
	 * @remarks
	 * - 停止后续播放音频将不会执行播放逻辑
	 */
	stop(isStop_ = true): void {
		this._isPlay = !isStop_;
		this._isStop = isStop_;

		if (isStop_) {
			this.audioUnitList.forEach((v) => {
				this._audioManage.stop(v);
			});
		}
	}

	/**
	 * 添加音频
	 * @param audio_ 音频单元或音频单元列表
	 */
	addAudio(audio_: MKAudioUnit_.MKAudioUnitSafe | MKAudioUnit_.MKAudioUnitSafe[]): void {
		let audioUnitList: MKAudioUnit[];

		// 参数转换
		if (Array.isArray(audio_)) {
			audioUnitList = audio_ as any;
		} else {
			audioUnitList = [audio_ as any];
		}

		audioUnitList.forEach((v) => {
			if (
				// 不能重复添加
				this.audioUnitList.includes(v) ||
				// 已存在当前分组
				v.groupIdNumList.includes(this.idNum)
			) {
				return;
			}

			// 添加到音频列表
			(this.audioUnitList as MKAudioUnit[]).push(v);
			// 添加到音频分组
			v.groupIdNumList.push(this.idNum);
		});
	}

	/**
	 * 删除音频
	 * @param audio_ 音频单元或音频单元列表
	 */
	delAudio(audio_: MKAudioUnit_.MKAudioUnitSafe | MKAudioUnit_.MKAudioUnitSafe[]): void {
		const selfAudioUnitList = this.audioUnitList as MKAudioUnit[];
		let audioUnitList: MKAudioUnit[];

		// 参数转换
		if (Array.isArray(audio_)) {
			audioUnitList = audio_ as any;
		} else {
			audioUnitList = [audio_ as any];
		}

		audioUnitList.forEach((v) => {
			// 从音频列表移除
			{
				const indexNum = selfAudioUnitList.indexOf(v);

				if (indexNum !== -1) {
					selfAudioUnitList.splice(indexNum, 1);
				}
			}

			// 删除分组
			{
				const indexNum = v.groupIdNumList.indexOf(this.idNum);

				if (indexNum !== -1) {
					v.groupIdNumList.splice(indexNum, 1);
				}
			}
		});
	}

	/** 清理所有音频 */
	clear(): MKAudioUnit_.MKAudioUnitSafe[] {
		const selfAudioUnitList = this.audioUnitList as MKAudioUnit[];

		selfAudioUnitList.forEach((v) => {
			// 删除分组
			{
				const indexNum = v.groupIdNumList.indexOf(this.idNum);

				if (indexNum !== -1) {
					v.groupIdNumList.splice(indexNum, 1);
				}
			}
		});

		return selfAudioUnitList.splice(0, selfAudioUnitList.length);
	}
}

export default MKAudioGroup;
