import resources_audio_nodes from "./resources_audio_nodes";
import * as cc from "cc";
import { _decorator } from "cc";
import GlobalConfig from "global_config";
import resources_config from "../../bundle/resources_config";
import mk from "mk";
const { ccclass, property } = _decorator;

@ccclass("resources_audio")
export class resources_audio extends mk.view_base {
	/* --------------- static --------------- */
	/* --------------- 属性 --------------- */
	@property(resources_audio_nodes)
	nodes = new resources_audio_nodes();

	// 编辑器资源使用 play 接口播放只会有一个音频生效
	@property({ displayName: "音乐", type: mk.audio_.unit })
	music = new mk.audio_.unit();

	@property({ displayName: "音效", type: mk.audio_.unit })
	effect = new mk.audio_.unit();

	@property({ displayName: "音效2", type: mk.audio_.unit })
	effect2 = new mk.audio_.unit();

	@property({ displayName: "重叠音效", type: mk.audio_.unit })
	overlap_effect = new mk.audio_.unit();

	/* --------------- public --------------- */
	data = new (class {
		music = {
			/** 进度 */
			progress_n: 0,
			/** 音量 */
			volume_n: 0.2,
			/** 暂停状态 */
			pause_b: false,
			/** 停止状态 */
			stop_b: false,
		};

		effect = {
			/** 音量 */
			volume_n: 0.5,
			/** 暂停状态 */
			pause_b: false,
			/** 停止状态 */
			stop_b: false,
		};

		/** 分组 */
		group = {
			/** 停止状态 */
			stop_b: false,
			/** 音量 */
			volume_n: 1,
		};

		/** 分组2 */
		group2 = {
			/** 停止状态 */
			stop_b: false,
			/** 音量 */
			volume_n: 1,
		};
	})();

	/* --------------- protected --------------- */
	/* --------------- private --------------- */
	/** 重叠音频数组 */
	private _overlap_effect_as!: mk.audio_.unit[];
	/* ------------------------------- 生命周期 ------------------------------- */
	// @ts-ignore
	// init(init_?: typeof this.init_data): void {}

	async open(): Promise<void> {
		await this._init_data();
		await this._init_view();
		this._init_event();
	}

	close(): void {
		// 停止音乐
		mk.audio.stop_all();
		mk.audio.get_group(resources_config.audio.group.test).clear();
		mk.audio.get_group(resources_config.audio.group.test2).clear();
	}

	/* ------------------------------- 按钮事件 ------------------------------- */
	button_close(): void {
		mk.ui_manage.close(this);
	}

	/** 音效 */
	button_effect(): void {
		this.data.group.stop_b = !this.data.group.stop_b;
	}

	/** 音效2 */
	button_effect2(): void {
		this.data.group2.stop_b = !this.data.group2.stop_b;
	}

	/** 重叠播放 */
	button_overlap_play(): void {
		mk.audio.play(this._overlap_effect_as.find((v) => v.state === mk.audio_.state.stop)!);
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 初始化数据 */
	private async _init_data(): Promise<void> {
		// 重叠播放音频单元
		this._overlap_effect_as = [this.overlap_effect, this.overlap_effect.clone()];

		// 初始化音频数据
		{
			// 使用动态加载
			{
				// this.music = (await mk.audio.add(
				// 	"db://assets/resources/module/audio/audio/Strictlyviolin荀博,马克Musician - Are You Lost.mp3",
				// 	this,
				// 	{
				// 		type: global_config.audio.type.music,
				// 	}
				// ))!;
				// this.effect = (await mk.audio.add("db://assets/resources/module/audio/audio/龙卷风声音_耳聆网_[声音ID：36225].mp3", this))!;
				// this.effect2 = (await mk.audio.add("db://assets/resources/module/audio/audio/水滴声音_耳聆网__声音ID：11407_.mp3", this))!;
			}

			// 使用 play 接口
			this.music.use_play_b = true;
			this.effect.use_play_b = true;
			this.effect2.use_play_b = true;

			// 循环播放
			this.music.loop_b = true;
			this.effect.loop_b = true;
			this.effect2.loop_b = true;

			// 添加到分组
			mk.audio.get_group(resources_config.audio.group.test).add_audio([this.effect, this.effect2]);
			mk.audio.get_group(resources_config.audio.group.test2).add_audio([this.effect2]);
		}
	}

	/** 初始化视图 */
	private _init_view(): void {
		// 更新音乐进度条
		this.schedule(() => {
			if (this.music.state !== mk.audio_.state.play) {
				return;
			}

			this.data.music.progress_n = this.music.curr_time_s_n / this.music.total_time_s_n;
		}, 1);
	}

	/** 初始化事件 */
	private _init_event(): void {
		// 数据事件
		{
			// 音乐进度条
			mk.monitor.on(this.data.music, "progress_n", this._data_music_progress_n, this)?.call(this, this.data.music.progress_n);
			// 音乐暂停
			mk.monitor.on(this.data.music, "pause_b", this._data_music_pause_b, this)?.call(this, this.data.music.pause_b);
			// 音乐停止
			mk.monitor.on(this.data.music, "stop_b", this._data_music_stop_b, this)?.call(this, this.data.music.stop_b);
			// 音效暂停
			mk.monitor.on(this.data.effect, "pause_b", this._data_effect_pause_b, this)?.call(this, this.data.effect.pause_b);
			// 音效停止
			mk.monitor.on(this.data.effect, "stop_b", this._data_effect_stop_b, this)?.call(this, this.data.effect.stop_b);
			// 音乐音量
			mk.monitor.on(this.data.music, "volume_n", this._data_music_volume_n, this)?.call(this, this.data.music.volume_n);
			// 音效音量
			mk.monitor.on(this.data.effect, "volume_n", this._data_effect_volume_n, this)?.call(this, this.data.effect.volume_n);
			// 分组停止
			mk.monitor.on(this.data.group, "stop_b", this._data_group_stop_b, this)?.call(this, this.data.group.stop_b);
			// 分组音量
			mk.monitor.on(this.data.group, "volume_n", this._data_group_volume_n, this)?.call(this, this.data.group.volume_n);
			// 分组2音量
			mk.monitor.on(this.data.group2, "volume_n", this._data_group2_volume_n, this)?.call(this, this.data.group2.volume_n);
			// 分组2停止
			mk.monitor.on(this.data.group2, "stop_b", this._data_group2_stop_b, this)?.call(this, this.data.group2.stop_b);
		}

		// 节点事件
		this.nodes.bg.on(cc.Node.EventType.TOUCH_MOVE, this._node_touch_move, this);
	}

	/* ------------------------------- 数据事件 ------------------------------- */
	private _data_music_progress_n(value_n_: number): void {
		this.music.curr_time_s_n = this.music.total_time_s_n * value_n_;
	}

	private _data_music_pause_b(value_b_: boolean): void {
		if (value_b_) {
			mk.audio.get_group(GlobalConfig.audio.type.music).pause();
		} else {
			mk.audio.get_group(GlobalConfig.audio.type.music).play(mk.audio_.state.pause);
		}
	}

	private _data_music_stop_b(value_b_: boolean): void {
		if (value_b_) {
			mk.audio.get_group(GlobalConfig.audio.type.music).stop();
		} else {
			mk.audio.get_group(GlobalConfig.audio.type.music).play(mk.audio_.state.pause | mk.audio_.state.stop);
			// 更新状态
			this.data.music.pause_b = false;
		}
	}

	private _data_effect_pause_b(value_b_: boolean): void {
		if (value_b_) {
			mk.audio.get_group(GlobalConfig.audio.type.effect).pause();
		} else {
			mk.audio.get_group(GlobalConfig.audio.type.effect).play(mk.audio_.state.pause);
			// 重新播放分组 0
			if (!this.data.effect.stop_b) {
				mk.audio.get_group(resources_config.audio.group.test).play(mk.audio_.state.stop);
			}
		}
	}

	private _data_effect_stop_b(value_b_: boolean): void {
		if (value_b_) {
			mk.audio.get_group(GlobalConfig.audio.type.effect).stop();
		} else {
			mk.audio.get_group(GlobalConfig.audio.type.effect).stop(false);
			// 更新状态
			this.data.effect.pause_b = false;
			// 重新播放分组 0
			if (!this.data.effect.stop_b) {
				mk.audio.get_group(resources_config.audio.group.test).play(mk.audio_.state.stop);
			}
		}
	}

	private _data_music_volume_n(value_n_: number): void {
		mk.audio.get_group(GlobalConfig.audio.type.music).volume_n = value_n_;
	}

	private _data_effect_volume_n(value_n_: number): void {
		mk.audio.get_group(GlobalConfig.audio.type.effect).volume_n = value_n_;
	}

	private _data_group_stop_b(value_b_: boolean): void {
		if (value_b_) {
			mk.audio.get_group(resources_config.audio.group.test).stop();
		} else {
			mk.audio.get_group(resources_config.audio.group.test).stop(false);
			mk.audio.get_group(resources_config.audio.group.test).play(mk.audio_.state.pause | mk.audio_.state.stop);
		}
	}

	private _data_group_volume_n(value_n_: number): void {
		mk.audio.get_group(resources_config.audio.group.test).volume_n = value_n_;
	}

	private _data_group2_volume_n(value_n_: number): void {
		mk.audio.get_group(resources_config.audio.group.test2).volume_n = value_n_;
	}

	private _data_group2_stop_b(value_b_: boolean): void {
		if (value_b_) {
			mk.audio.get_group(resources_config.audio.group.test2).stop();
		} else {
			mk.audio.get_group(resources_config.audio.group.test2).stop(false);
			mk.audio.get_group(resources_config.audio.group.test2).play(mk.audio_.state.pause | mk.audio_.state.stop);
		}
	}

	/* ------------------------------- 节点事件 ------------------------------- */
	private _node_touch_move(event: cc.EventTouch): void {
		const canvas = cc.director.getScene()!.getComponentInChildren(cc.Canvas)!;
		/** 触摸世界坐标 */
		const touch_pos_v3 = event.getUILocation();

		/** 距中心点距离 */
		const dist_n = cc
			.v2(touch_pos_v3.x - mk.N(canvas.node).transform.width * 0.5, touch_pos_v3.y - mk.N(canvas.node).transform.height * 0.5)
			.length();

		// 更新方块位置
		this.nodes.cube.worldPosition = cc.v3(touch_pos_v3.x, touch_pos_v3.y);
		// 更新分组音量
		this.data.group.volume_n = mk.audio.get_group(resources_config.audio.group.test).volume_n = 1 - Math.min(1, dist_n / 500);
	}
}
