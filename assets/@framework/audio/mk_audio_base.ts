import mk_instance_base from "../mk_instance_base";
import cache, { mk_asset_ } from "../resources/mk_asset";
import { EDITOR } from "cc/env";
import mk_event_target from "../mk_event_target";
import mk_logger from "../mk_logger";
import * as cc from "cc";
import global_config from "../../@config/global_config";
import global_event from "../../@config/global_event";
import mk_tool from "../@private/tool/mk_tool";

const { ccclass, property } = cc._decorator;

/** 音频基类 */
abstract class mk_audio_base extends mk_instance_base {
	constructor() {
		super();
		global_event.on(global_event.key.restart, this._event_restart, this);
	}

	/* --------------- protected --------------- */
	/** 日志 */
	protected abstract _log: mk_logger;
	/** 初始化数据 */
	protected _init_config?: mk_audio_base_.init_config;
	/** 音频组 */
	protected _group_map = new Map<number, mk_audio_base_.group>();
	/* ------------------------------- 功能 ------------------------------- */
	/** 暂停 */
	abstract pause(audio_: mk_audio_base_.unit): void;
	/** 停止 */
	abstract stop(audio_: mk_audio_base_.unit): void;
	/** 获取音频实例 */
	protected abstract _get_audio_unit<T extends mk_audio_base_._unit>(init_?: Partial<mk_audio_base_._unit>): T;

	/**
	 * 初始化
	 * @param config_ 初始化配置
	 */
	init(config_: mk_audio_base_.init_config): void {
		this._init_config = config_;
		// 重置编辑器视图
		if (EDITOR) {
			cc.CCClass.Attr.setClassAttr(mk_audio_base_._unit, "type", "enumList", cc.Enum.getList(cc.Enum(this._init_config.type)));
		}
	}

	/** 获取组音频 */
	get_group(group_n_: number): mk_audio_base_.group {
		let result = this._group_map.get(group_n_);

		if (!result) {
			this._group_map.set(group_n_, (result = new mk_audio_base_.group(this, group_n_)));
		}
		return result;
	}

	/** 添加音频单元（添加后应该随视图自动释放） */
	add(url_s_: string, config_?: mk_audio_base_.add_config): Promise<(mk_audio_base_.unit & mk_audio_base_.unit[]) | null>;
	add(url_ss_: string[], config_?: mk_audio_base_.add_config): Promise<mk_audio_base_.unit[] | null>;
	async add(url_: string | string[], config_?: mk_audio_base_.add_config): Promise<mk_audio_base_.unit | mk_audio_base_.unit[] | null> {
		if (EDITOR || !this._init_config) {
			return null;
		}

		/** 路径列表 */
		let url_ss: string[];

		// 参数转换
		if (typeof url_ === "string") {
			url_ss = [url_];
		} else {
			url_ss = url_;
		}

		const audio_as: mk_audio_base_._unit[] = [];
		let result: mk_audio_base_._unit | mk_audio_base_._unit[];

		if (config_?.dir_b) {
			for (const v_s of url_ss) {
				const asset_as = await cache.get_dir(v_s, config_.load_config);

				asset_as?.forEach((v2) => {
					const audio = this._get_audio_unit({
						clip: v2,
					});

					audio_as.push(audio);
				});
			}
			result = audio_as;
		} else {
			for (const v_s of url_ss) {
				const config = (config_?.load_config as any) ?? cc.AudioClip;
				const asset = await cache.get<cc.AudioClip>(v_s, config);

				if (!asset) {
					continue;
				}
				const audio = this._get_audio_unit({
					clip: asset,
				});

				audio_as.push(audio);
			}
			result = audio_as.length === 1 ? audio_as[0] : audio_as;
		}

		// 添加音频
		audio_as.forEach((v) => {
			this._add(v, config_?.group_ns);
		});

		return result as any;
	}

	/**
	 * 播放音效
	 * @param audio_ 音频单元
	 * @param config_ 播放配置
	 * @returns
	 */
	play(audio_: mk_audio_base_.unit, config_?: Partial<mk_audio_base_.play_config>): boolean {
		const audio = audio_ as mk_audio_base_._unit;

		// 参数安检
		if (!this._init_config || !audio_?.clip) {
			return false;
		}

		// 初始化音频
		{
			// 更新配置
			if (config_) {
				Object.assign(audio, config_);
			}
			// 添加音频
			this._add(audio, audio.group_ns);
		}

		if (audio.stop_group_n !== null) {
			return false;
		}

		return true;
	}

	/** 暂停所有音频 */
	pause_all(): void {
		this._group_map.forEach((v1) => {
			v1.audio_unit_as.forEach((v2) => {
				this.pause(v2);
			});
		});
	}

	/** 恢复所有音频 */
	resume_all(): void {
		this._group_map.forEach((v1) => {
			v1.audio_unit_as.forEach((v2) => {
				if (v2.state === mk_audio_base_.state.pause) {
					this.play(v2);
				}
			});
		});
	}

	/** 停止所有音频 */
	stop_all(): void {
		this._group_map.forEach((v1) => {
			v1.audio_unit_as.forEach((v2) => {
				this.stop(v2);
			});
		});
	}

	/** 添加音频单元 */
	protected _add(audio_: mk_audio_base_._unit, group_ns_?: ReadonlyArray<number>): boolean {
		// 参数安检
		if (!this._init_config || !audio_ || audio_.init_b || !audio_.clip) {
			return false;
		}

		// 添加分组音频
		[audio_.type].concat(group_ns_ ?? []).forEach((v_n) => {
			/** 组音频列表 */
			let audio_group = this._group_map.get(v_n);

			// 添加到音频列表
			if (!audio_group) {
				this._group_map.set(v_n, (audio_group = new mk_audio_base_.group(this, v_n)));
			}
			audio_group.add_audio(audio_);
		});

		return true;
	}

	/* ------------------------------- 全局事件 ------------------------------- */
	private _event_restart(): void {
		// 停止所有音频
		this.stop_all();

		// 重置数据（音频资源释放应该由视图管理）
		mk_tool.object.reset(this);
	}
}

export namespace mk_audio_base_ {
	/** 音频状态 */
	export enum state {
		/** 停止 */
		stop = 1,
		/** 暂停 */
		pause = 2,
		/** 播放 */
		play = 4,
	}

	/** 初始化配置 */
	export interface init_config {
		/** 类型枚举 */
		type: Record<string | number, string | number>;
		/** 组枚举 */
		group: Record<string | number, string | number>;
	}

	/** 安全音频单元 */
	export interface unit {
		/** 初始化状态 */
		readonly init_b: boolean;
		/** 分组 */
		readonly group_ns: ReadonlyArray<number>;
		/** 当前停止分组（停止时优先级最大的分组） */
		readonly stop_group_n: number | null;
		/** 播放状态 */
		readonly state: state;
		/** 等待播放次数（0-n：等待播放次数） */
		readonly wait_play_n: number;
		/** 总时长(秒) */
		readonly total_time_s_n: number;
		/** 事件对象 */
		readonly event: mk_event_target<event_protocol>;
		/** 音频类型 */
		readonly type: number;
		/** 真实音量 */
		readonly real_volume_n: number;
		/** （common 使用）音频组件 */
		readonly audio_source?: cc.AudioSource;
		/** 音频资源 */
		clip: cc.AudioClip | null;
		/** 音量
		 * - common：use_play_b 为 false 的情况下修改只能在下次 play 时生效
		 */
		volume_n: number;
		/** 循环 */
		loop_b: boolean;
		/** 当前时间(秒) */
		curr_time_s_n: number;
		/**
		 * （audio_common 使用）使用 play 接口，默认使用 playOneShot
		 * - play 接口存在最大并发数限制 cc.AudioSource.maxAudioChannel
		 * - playOneShot 接口不能暂停
		 */
		use_play_b?: boolean;
		/** 等待播放开关 */
		wait_play_b?: boolean;
		/* ------------------------------- 功能 ------------------------------- */
		/** 克隆 */
		clone<T extends this>(): T;
		/**
		 * 克隆
		 * @param value_n_ 克隆数量
		 */
		clone<T extends this>(value_n_: number): T[];
	}

	/** add 配置 */
	export interface add_config {
		/** 分组 */
		group_ns?: number[];
		/** 文件夹 */
		dir_b?: boolean;
		/** 加载配置 */
		load_config: mk_asset_.get_dir_config<cc.AudioClip>;
	}

	/** play 配置 */
	export interface play_config {
		/** 音量 */
		volume_n: number;
		/** 循环 */
		loop_b: boolean;
		/**
		 * 使用 play 接口，默认使用 playOneShot
		 * - play 接口存在最大并发数限制 cc.AudioSource.maxAudioChannel
		 * - playOneShot 接口不能暂停
		 */
		use_play_b: boolean;
	}

	/** 事件协议 */
	interface event_protocol {
		/** 初始化 */
		init(): void;
		/** 播放 */
		play(): void;
		/** 暂停 */
		pause(): void;
		/** 恢复 */
		resume(): void;
		/** 中止 */
		stop(): void;
		/** 结束 */
		end(): void;
	}

	/** 音频单元 */
	@ccclass("mk_audio_base/unit")
	export abstract class _unit {
		constructor(init_?: Partial<_unit>) {
			Object.assign(this, init_);
		}

		/* --------------- 属性 --------------- */
		/** 音频资源 */
		@property({ displayName: "音频资源", type: cc.AudioClip })
		clip: cc.AudioClip | null = null;

		/** 音频类型 */
		@property({ displayName: "音频类型", type: cc.Enum({}) })
		type = global_config.audio.group.effect;

		/* --------------- public --------------- */
		/** 事件对象 */
		_event?: mk_event_target<event_protocol>;
		/** 分组 */
		group_ns: number[] = [];
		/** 当前停止分组（停止时优先级最大的分组） */
		stop_group_n: number | null = null;
		/** 播放状态 */
		state = state.stop;
		/** 等待播放次数（-1：关闭，0-n：等待播放次数） */
		wait_play_n = -1;
		/** 真实音量 */
		real_volume_n = 0;
		/** （common 使用）音频组件 */
		audio_source?: cc.AudioSource;
		/**
		 * （common 使用）使用 play 接口，默认使用 playOneShot
		 * - play 接口存在最大并发数限制 cc.AudioSource.maxAudioChannel
		 * - playOneShot 接口不能暂停
		 */
		use_play_b?: boolean;

		/** 初始化状态 */
		get init_b(): boolean {
			return this._init_b;
		}

		set init_b(value_b_) {
			this._init_b = value_b_;
		}

		/** 音量
		 * - common：use_play_b 为 false 的情况下修改只能在下次 play 时生效
		 */
		get volume_n(): number {
			return 0;
		}

		set volume_n(value_n_) {
			throw "未实现";
		}

		/** 循环 */
		get loop_b(): boolean {
			return false;
		}

		set loop_b(value_b_) {
			throw "未实现";
		}

		/** 总时长(秒) */
		get total_time_s_n(): number {
			return 0;
		}

		/** 当前时间(秒) */
		get curr_time_s_n(): number {
			return 0;
		}

		set curr_time_s_n(value_n_) {
			throw "未实现";
		}

		/** 事件对象 */
		get event(): mk_event_target<event_protocol> {
			return this._event ?? (this._event = new mk_event_target<event_protocol>());
		}

		/** 等待播放开关 */
		get wait_play_b(): boolean {
			return this.wait_play_n !== -1;
		}

		set wait_play_b(value_b) {
			this.wait_play_n = value_b ? 0 : -1;
		}

		/* --------------- protected --------------- */
		/** 初始化状态 */
		protected _init_b = false;
		/* ------------------------------- 功能 ------------------------------- */
		/** 更新音量 */
		abstract update_volume(): void;
		/** 克隆 */
		protected abstract _clone(): _unit;

		/** 克隆 */
		clone(): _unit;
		/**
		 * 克隆
		 * @param value_n_ 克隆数量
		 */
		clone(value_n_: number): _unit[];
		clone(value_n_?: number): _unit | _unit[] {
			if (value_n_ === undefined) {
				return this._clone();
			}
			const audio_as: _unit[] = [];

			// 克隆数组
			for (let k_n = 0, len_n = value_n_; k_n < len_n; ++k_n) {
				audio_as.push(this._clone());
			}
			return audio_as;
		}
	}

	/** 音频组 */
	export class group {
		constructor(init_: mk_audio_base, priority_n_: number) {
			this._audio_manage = init_;
			this.priority_n = priority_n_;
		}

		/* --------------- public --------------- */
		/** 优先级（值越小优先级越大） */
		readonly priority_n: number;
		/** 音频列表 */
		audio_unit_as: ReadonlyArray<_unit> = [];

		/** 播放状态 */
		get play_b(): boolean {
			return this._play_b;
		}

		/** 停止状态 */
		get stop_b(): boolean {
			return this._stop_b;
		}

		/** 音量 */
		get volume_n(): number {
			return this._volume_n;
		}

		set volume_n(value_n_: number) {
			// 参数安检
			{
				if (value_n_ > 1) {
					value_n_ = 1;
				}
				if (value_n_ < 0) {
					value_n_ = 0;
				}
			}

			// 设置音量
			{
				this._volume_n = value_n_;
				this.audio_unit_as.forEach((v) => {
					// eslint-disable-next-line no-self-assign
					v.update_volume();
				});
			}
		}

		/* --------------- private --------------- */
		/** 音频管理器 */
		private _audio_manage!: mk_audio_base;
		/** 音量 */
		private _volume_n = 1;
		/** 播放状态 */
		private _play_b = true;
		/** 停止状态 */
		private _stop_b = false;
		/* ------------------------------- 功能 ------------------------------- */
		/**
		 * 播放
		 * @param contains_state_n_ 包含状态（处于这些状态中的音频将被播放，例：mk.audio_.state.pause | mk.audio_.state.stop）
		 */
		play(contains_state_n_ = state.play | state.pause | state.stop): void {
			this._play_b = true;
			this._stop_b = false;

			this.audio_unit_as.forEach((v) => {
				if (!mk_tool.byte.get_bit(v.state, contains_state_n_)) {
					return;
				}

				// 更新音频停止组
				this._update_stop_group(v, false);
				// 播放音频
				this._audio_manage.play(v);
			});
		}

		/** 暂停 */
		pause(): void {
			this._play_b = false;
			this.audio_unit_as.forEach((v) => {
				this._audio_manage.pause(v);
			});
		}

		/**
		 * 停止
		 * - 停止后播放的音频将跳过
		 */
		stop(state_b_ = true): void {
			this._play_b = !state_b_;
			this._stop_b = state_b_;

			if (state_b_) {
				this.audio_unit_as.forEach((v) => {
					this._audio_manage.stop(v);
					// 更新音频停止组
					this._update_stop_group(v, true);
				});
			} else {
				this.audio_unit_as.forEach((v) => {
					// 更新音频停止组
					this._update_stop_group(v, false);
				});
			}
		}

		/** 添加音频 */
		add_audio(audio_: unit | unit[]): void {
			let audio_as: _unit[];

			// 参数转换
			if (Array.isArray(audio_)) {
				audio_as = audio_ as any;
			} else {
				audio_as = [audio_ as any];
			}

			audio_as.forEach((v) => {
				// 已存在当前分组
				if (v.group_ns.includes(this.priority_n)) {
					return;
				}

				// 添加到音频列表
				(this.audio_unit_as as _unit[]).push(v);
				// 添加到音频分组
				v.group_ns.push(this.priority_n);
				// 升序排列
				v.group_ns.sort((va_n, vb_n) => va_n - vb_n);
				// 更新音频停止组
				this._update_stop_group(v, true);
			});
		}

		/** 删除音频 */
		del_audio(audio_: unit | unit[]): void {
			const audio_unit_as = this.audio_unit_as as _unit[];
			let audio_as: _unit[];

			// 参数转换
			if (Array.isArray(audio_)) {
				audio_as = audio_ as any;
			} else {
				audio_as = [audio_ as any];
			}

			audio_as.forEach((v) => {
				// 从音频列表移除
				{
					const index_n = audio_unit_as.indexOf(v);

					if (index_n !== -1) {
						audio_unit_as.splice(index_n, 1);
					}
				}

				// 更新音频停止组
				this._update_stop_group(v, false);

				// 删除分组
				{
					const index_n = v.group_ns.indexOf(this.priority_n);

					if (index_n !== -1) {
						v.group_ns.splice(index_n, 1);
					}
				}
			});
		}

		/** 清理所有音频 */
		clear(): unit[] {
			const audio_unit_as = this.audio_unit_as as _unit[];

			audio_unit_as.forEach((v) => {
				// 更新音频停止组
				this._update_stop_group(v, false);

				// 删除分组
				{
					const index_n = v.group_ns.indexOf(this.priority_n);

					if (index_n !== -1) {
						v.group_ns.splice(index_n, 1);
					}
				}
			});

			return audio_unit_as.splice(0, audio_unit_as.length);
		}

		/**
		 * 更新音频停止组
		 * @param audio_ 音频单元
		 * @param add_or_stop_b_ 添加或停止状态
		 */
		private _update_stop_group(audio_: _unit, add_or_stop_b_: boolean): void {
			// 添加 | 停止
			if (add_or_stop_b_) {
				if (this.stop_b && (audio_.stop_group_n === null || this.priority_n < audio_.stop_group_n)) {
					audio_.stop_group_n = this.priority_n;
				}
			}
			// 移除 | 播放
			else {
				if (audio_.stop_group_n === this.priority_n) {
					const stop_group_n = audio_.group_ns.find((v_n) => this._audio_manage.get_group(v_n).stop_b);

					audio_.stop_group_n = stop_group_n !== undefined ? stop_group_n : null;
				}
			}
		}
	}

	export const unit = _unit as any as Omit<unit, keyof Function> & { new (init_?: Partial<unit>): Omit<unit, keyof Function> };
}

export default mk_audio_base;
