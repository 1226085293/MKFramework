import * as cc from "cc";
import global_config from "../../@config/global_config";
import global_event from "../../@config/global_event";
import mk_codec_base from "../mk_codec_base";
import mk_event_target from "../mk_event_target";
import mk_instance_base from "../mk_instance_base";
import mk_logger from "../mk_logger";
import mk_status_task from "../task/mk_status_task";

namespace _mk_network_base {
	/** 从 T 中排除 null, undefined, void */
	// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
	type NonVoid<T> = T extends null | undefined | void ? never : T;

	/** 消息协议 */
	export interface event_protocol<T extends mk_codec_base = mk_codec_base> {
		/** 网络连接 */
		open(): void;
		/**
		 * 网络断开
		 * @param event socket 事件
		 */
		close(event: any): void;
		/** 重连成功 */
		reconnect_success(): void;
		/** 重连失败 */
		reconnect_fail(): void;
		/**
		 * 心跳超时
		 * @remarks
		 * 在接收心跳超时时通知
		 */
		heartbeat_timeout(): void;
		/**
		 * 收到任意消息
		 * @param data 收到的消息
		 */
		recv(data: NonVoid<ReturnType<T["decode"]>>): void;
	}

	/** 消息事件 */
	export class message_event<CT extends mk_codec_base = mk_codec_base> extends cc.EventTarget {
		constructor(network_: mk_network_base) {
			super();
			this._network = network_;
		}

		/* --------------- private --------------- */
		/** 网络实例 */
		private _network: mk_network_base;
		/** 日志 */
		private _log = new mk_logger(cc.js.getClassName(this));
		/* ------------------------------- 功能 ------------------------------- */
		// @ts-ignore
		on<T extends cc.Constructor<global_config.network.proto_head> | string | number, T2 extends (event_: T["prototype"]) => void>(
			type_: T,
			callback_: T2,
			this_?: any,
			once_b_?: boolean
		): typeof callback_ | null {
			if (typeof type_ === "function") {
				const message_id = this._network.config.parse_message_id_f(type_.prototype);

				if (message_id !== undefined) {
					return super.on(message_id, callback_, this_, once_b_);
				}
			} else {
				return super.on(type_, callback_, this_, once_b_);
			}

			this._log.error("消息 id 解析错误");

			return null;
		}

		// @ts-ignore
		once<T extends cc.Constructor<global_config.network.proto_head> | string | number, T2 extends (event_: T["prototype"]) => void>(
			type_: T,
			callback_: T2,
			this_?: any
		): typeof callback_ | null {
			return this.on(type_, callback_, this_, true);
		}

		// @ts-ignore
		off<T extends cc.Constructor<global_config.network.proto_head> | string | number, T2 extends (event_: T["prototype"]) => void>(
			type_: T,
			callback_?: T2,
			this_?: any
		): void {
			if (typeof type_ === "function") {
				const message_id = this._network.config.parse_message_id_f(type_.prototype);

				if (message_id !== undefined) {
					super.off(message_id, callback_, this_);

					return;
				}
			} else {
				super.off(type_, callback_, this_);
			}

			this._log.error("消息 id 解析错误");
		}

		/**
		 * 派发事件
		 * @param data_ 消息数据
		 * @remarks
		 * 接收消息后派发，可用此接口模拟数据
		 */
		emit<T extends global_config.network.proto_head>(data_: T): void;
		/**
		 * 派发事件
		 * @param type_ 消息号
		 * @param data_  消息数据
		 * @remarks
		 * 接收消息后派发，可用此接口模拟数据
		 */
		emit<T extends string | number>(type_: T, data_: any): void;
		emit<T extends cc.Constructor<global_config.network.proto_head> | string | number>(args_: T, data_?: any): void {
			let type_: string | number | undefined;

			// 参数转换
			if (typeof args_ === "object") {
				data_ = args_;
			} else {
				type_ = args_ as any;
			}

			if (type_ !== undefined) {
				super.emit(type_, data_);
			} else {
				const message_id = this._network.config.parse_message_id_f(args_);

				if (message_id === undefined) {
					this._log.error("消息 id 解析错误");

					return;
				}

				super.emit(message_id, args_);
			}
		}

		/**
		 * 发送
		 * @param data_ 发送数据
		 * @returns
		 */
		send<T = Parameters<CT["encode"]>[0]>(data_: T): void {
			this._network._send(data_);
		}

		/**
		 * 请求
		 * @param data_ 发送数据
		 * @param timeout_ms_n_ 超时时间
		 * @returns
		 * @remarks
		 * 等待事件回调返回
		 */
		request<T extends Parameters<CT["encode"]>[0]>(data_: T, timeout_ms_n_?: number): Promise<any> | null {
			this._network._send(data_);

			return this._network._wait(data_, timeout_ms_n_);
		}

		// @ts-ignore
		has<T extends cc.Constructor<global_config.network.proto_head> | string | number, T2 extends (event_: T["prototype"]) => void>(
			type_: T,
			callback_?: T2,
			target_?: any
		): boolean {
			if (typeof type_ === "function") {
				const message_id = this._network.config.parse_message_id_f(type_.prototype);

				if (message_id !== undefined) {
					return super.hasEventListener(message_id as any, callback_, target_);
				}
			} else {
				return super.hasEventListener(type_ as any, callback_, target_);
			}

			this._log.error("消息 id 解析错误");

			return false;
		}

		clear(): void {
			return super["clear"]();
		}
	}
}

/**
 * 网络系统基类
 * @noInheritDoc
 * @remarks
 *
 * - 支持多实例
 *
 * - (心跳/断线重连)支持
 *
 * - 网络消息接口事件化
 *
 * - 支持消息潮
 *
 * - 网络消息模拟
 */
abstract class mk_network_base<CT extends mk_codec_base = mk_codec_base> extends mk_instance_base {
	constructor(init_?: Partial<mk_network_base_.init_config<CT>>) {
		super();
		this.config = new mk_network_base_.init_config(init_);

		// 启动心跳
		this._start_heartbeat();

		// 事件监听
		global_event.on(global_event.key.restart, this._event_restart, this);
	}

	/* --------------- public --------------- */
	/** 网络事件 */
	event = new mk_event_target<_mk_network_base.event_protocol<CT>>();
	/** 消息事件 */
	message: _mk_network_base.message_event<CT> = new _mk_network_base.message_event<CT>(this);
	/** 配置信息 */
	config: Readonly<mk_network_base_.init_config<CT>>;

	/** socket 状态 */
	get state(): mk_network_base_.status {
		return this._state;
	}

	/** 编解码器 */
	get codec(): CT | undefined {
		return this.config.codec;
	}

	set codec(value_) {
		(this.config as mk_network_base_.init_config<CT>).codec = value_;
	}

	/* --------------- protected --------------- */
	/** socket */
	protected abstract _socket: any;
	/** 日志 */
	protected _log = new mk_logger(cc.js.getClassName(this));
	/** socket 状态 */
	protected _state = mk_network_base_.status.closed;
	/** 地址 */
	protected _addr_s!: string;
	/**
	 * 写入睡眠状态
	 * @internal
	 */
	protected _write_sleep2_b = true;
	/** 写入队列 */
	protected _write_as: any[] = [];
	/* --------------- private --------------- */
	/** 重连计数 */
	private _reconnect_count_n = 0;
	/** 重连定时器 */
	private _reconnect_timer: any = null;
	/** 发送定时器 */
	private _send_timer: any = null;
	/** 等待任务表 */
	private _wait_task_map = new Map<string | number, mk_status_task<any>>();
	/** 写睡眠状态 */
	private get _write_sleep_b(): boolean {
		return this._write_sleep2_b;
	}

	private set _write_sleep_b(value_b_) {
		this._set_write_sleep_b(value_b_);
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 重置 socket */
	protected abstract _reset_socket(): void;

	/** 连接 */
	connect(addr_s_: string): void {
		this._state = mk_network_base_.status.connecting;
		this._addr_s = addr_s_;
		this._reset_socket();
	}

	/** 断开 */
	close(): void {
		this._state = mk_network_base_.status.closing;
		this._socket?.close();
	}

	/**
	 * 发送
	 * @param data_ 发送数据
	 * @returns
	 * @internal
	 */
	_send(data_: Parameters<CT["encode"]>[0]): void {
		this._write_as.push(data_);

		// 更新状态
		if (this._write_sleep_b) {
			this._write_sleep_b = false;
		}
	}

	/**
	 * 等待消息
	 * @param key_ 消息键
	 * @param timeout_ms_n_ 超时时间
	 * @returns
	 * @internal
	 */
	// @ts-ignore
	_wait<T, T2 = T["prototype"] extends Object ? T["prototype"] : any>(
		key_: T,
		timeout_ms_n_ = this.config.wait_timeout_ms_n
		// @ts-ignore
	): Promise<T2 | null> | null {
		/** 消息序列号 */
		const message_sequence = this.config.parse_message_sequence_f(key_);

		if (message_sequence === undefined) {
			this._log.error("消息序列号解析错误");

			return null;
		}

		/** 指定标记的等待数据 */
		let wait_task = this._wait_task_map.get(message_sequence);

		if (wait_task) {
			return wait_task.task;
		} else {
			this._wait_task_map.set(
				message_sequence,
				(wait_task = new mk_status_task(false, {
					timeout_ms_n: timeout_ms_n_,
				}))
			);
		}

		return wait_task.task;
	}

	/** socket 准备完成 */
	protected _open(event_: any): void {
		this._state = mk_network_base_.status.open;
		this._log.debug("socket 准备完成", event_);
		if (this._write_as.length) {
			this._write_sleep_b = false;
		}

		// 取消重连
		this._cancel_reconnect(true);

		// 事件通知
		this.event.emit(this.event.key.open);
	}

	/** socket 消息 */
	protected async _message(event_: any): Promise<void> {
		const data = this.config.codec ? await this.config.codec.decode(event_.data) : event_.data;

		if (data === undefined) {
			return;
		}

		this._log.debug("收到消息", data);

		// 事件通知
		this.event.emit(this.event.key.recv, data);

		/** 消息 id */
		const message_id = this.config.parse_message_id_f(data);

		if (message_id !== undefined) {
			// 指定事件通知
			this.message.emit(message_id, data);

			// 触发等待消息
			this._trigger_wait_task(data);
		}
	}

	/** socket 错误 */
	protected _error(event_: any): void {
		if (this._state === mk_network_base_.status.open) {
			this._log.error("socket 错误", event_);
		}
	}

	/** socket 关闭 */
	protected _close(event_: any): void {
		const last_status = this._state;

		this._state = mk_network_base_.status.closed;

		if (last_status !== mk_network_base_.status.closed) {
			this._log.warn("socket 关闭", event_);
			this.event.emit(this.event.key.close, event_);
		}

		// 超出最大重连次数
		if (this._reconnect_timer !== null) {
			if (++this._reconnect_count_n > this.config.max_reconnect_n) {
				this._cancel_reconnect(false);

				return;
			}

			this._log.warn("socket 重连计数", this._reconnect_count_n);
		}

		// 准备重连
		if (last_status === mk_network_base_.status.open && this._reconnect_timer === null) {
			this._log.warn("socket 开始重连");
			this._write_sleep_b = true;
			this._reconnect_timer = setInterval(this._timer_reconnect.bind(this), this.config.reconnect_interval_ms_n);
		}
	}

	/** 定时发送 */
	protected async _timer_send(): Promise<void> {
		// 保证网络正常
		if (this._socket?.readyState !== WebSocket.OPEN) {
			return;
		}

		// 存在发送数据且上次发送已经结束，避免超出缓存
		if (this._write_as.length && !this._socket.bufferedAmount) {
			const data = this.config.codec ? await this.config.codec.encode(this._write_as.pop()) : this._write_as.pop();

			if ((data ?? null) !== null) {
				this._socket.send(data);
			}
		} else {
			this._write_sleep_b = true;
		}
	}

	/** 定时重连 */
	protected _timer_reconnect(): void {
		if (this._socket.readyState !== WebSocket.OPEN) {
			this._reset_socket();
		}
		// 重连成功
		else if (this._reconnect_timer !== null) {
			this._cancel_reconnect(true);
		}
	}

	/**
	 * 取消重连
	 * @param status_b_ 成功 | 失败
	 * @returns
	 */
	protected _cancel_reconnect(status_b_: boolean): void {
		if (this._reconnect_timer === null) {
			return;
		}

		this._log.warn("socket 重连" + (status_b_ ? "成功" : "失败"));

		// 事件通知
		this.event.emit(status_b_ ? this.event.key.reconnect_success : this.event.key.reconnect_fail);

		// 清理重连数据
		{
			clearInterval(this._reconnect_timer);
			this._reconnect_timer = null;
			this._reconnect_count_n = 0;
		}
	}

	/**
	 * 触发等待任务
	 * @param data_ 收到的消息
	 * @returns
	 */
	protected _trigger_wait_task(data_: any): void {
		/** 消息 id */
		const message_id = this.config.parse_message_id_f(data_);
		/** 消息序列号 */
		const message_sequence = this.config.parse_message_sequence_f(data_);

		if (message_id === undefined) {
			this._log.error("消息 id 解析错误");

			return;
		}

		// 触发等待任务
		if (message_sequence !== undefined) {
			const wait_tak = this._wait_task_map.get(message_sequence);

			if (!wait_tak) {
				return;
			}

			this._wait_task_map.delete(message_sequence);
			wait_tak.finish(true, data_);
		}
	}

	/** 初始化心跳 */
	protected _start_heartbeat(): void {
		if (!this.config.heartbeat_config) {
			return;
		}

		/** 心跳超时定时器 */
		let timeout_timer: any;

		/** 接收心跳回调 */
		const recv_f = (): void => {
			if (timeout_timer) {
				clearTimeout(timeout_timer);
			}

			// 超时检测
			timeout_timer = setTimeout(() => {
				// 心跳超时
				if (this.state !== mk_network_base_.status.open) {
					this.event.emit(this.event.key.heartbeat_timeout);
				}
			}, this.config.heartbeat_config!.timeout_ms_n);
		};

		/** 心跳数据获取函数 */
		const get_send_data_f = this.config.heartbeat_config.init_f(recv_f);

		// 服务端到客户端，清理心跳超时定时器，防止心跳期间重连导致误超时
		this.event.on(
			this.event.key.close,
			() => {
				clearTimeout(timeout_timer);
				timeout_timer = null;
			},
			this
		);

		// 客户端到服务端
		if (get_send_data_f) {
			/** 心跳定时器 */
			let timer: any;

			// 启动心跳
			this.event.on(
				this.event.key.open,
				() => {
					timer = setInterval(() => {
						this._socket.send(get_send_data_f());
					}, this.config.heartbeat_config!.interval_ms_n);
				},
				this
			);

			// 关闭心跳
			this.event.on(
				this.event.key.close,
				() => {
					clearInterval(timer);
					timer = null;
				},
				this
			);
		}
	}

	/* ------------------------------- get/set ------------------------------- */
	protected _set_write_sleep_b(value_b_: boolean): void {
		if (this._write_sleep2_b === value_b_) {
			return;
		}

		if (value_b_) {
			if (this._send_timer !== null) {
				clearInterval(this._send_timer);
				this._send_timer = null;
			}
		} else {
			this._send_timer = setInterval(this._timer_send.bind(this), this.config.send_interval_ms_n);
		}

		this._write_sleep2_b = value_b_;
	}

	/* ------------------------------- 全局事件 ------------------------------- */
	protected _event_restart(): void {
		// 写睡眠
		this._write_sleep_b = true;
		// 关闭网络事件
		this.event.emit(this.event.key.close, null);
		// 清理事件
		this.event.clear();
		this.message.clear();
		// 清理发送消息
		this._write_as.splice(0, this._write_as.length);

		// 清理等待消息
		{
			this._wait_task_map.forEach((v) => {
				v.finish(true, null);
			});

			this._wait_task_map.clear();
		}

		// 取消重连
		this._cancel_reconnect(false);
		// 关闭网络
		this.close();
	}
}

export namespace mk_network_base_ {
	/** 状态类型 */
	export enum status {
		/** 连接中 */
		connecting,
		/** 已连接 */
		open,
		/** 关闭中 */
		closing,
		/** 已关闭 */
		closed,
	}

	/** 初始化配置 */
	export class init_config<CT extends mk_codec_base = mk_codec_base> {
		constructor(init_?: Partial<init_config<CT>>) {
			Object.assign(this, init_);
		}

		/** 编解码器 */
		codec?: CT;
		/**
		 * 发送间隔
		 * @remarks
		 * 单位：毫秒
		 */
		send_interval_ms_n = 0;
		/**
		 * 重连间隔
		 * @remarks
		 * 单位：毫秒
		 */
		reconnect_interval_ms_n = 1000;
		/** 最大重连次数 */
		max_reconnect_n = 5;
		/**
		 * 等待消息超时时间
		 * @remarks
		 * 单位：毫秒
		 */
		wait_timeout_ms_n = 5000;
		/** 心跳配置 */
		heartbeat_config?: {
			/**
			 * 发送间隔
			 * @remarks
			 * 单位：毫秒
			 */
			interval_ms_n?: number;
			/**
			 * 超时时间
			 * @remarks
			 * 单位：毫秒
			 */
			timeout_ms_n: number;
			/**
			 * 初始化
			 * @param done_f 接收到心跳后手动调用，server -> client，用于心跳超时检测
			 * @returns 返回心跳数据的函数，client -> server，不为空则向服务器定时发送
			 */
			init_f(done_f: () => void): null | (() => any);
		};

		/**
		 * 解析消息 id
		 * @param data 接收的消息
		 * @returns 消息号
		 */
		parse_message_id_f(data: any): string | number {
			return data?.[global_config.network.proto_head_key_tab.__id];
		}

		/**
		 * 解析消息序列号
		 * @param data 接收的消息
		 * @returns 消息序列号
		 */
		parse_message_sequence_f(data: any): string | number | undefined {
			if (global_config.network.proto_head_key_tab.__sequence !== undefined) {
				return data?.[global_config.network.proto_head_key_tab.__sequence];
			}
		}
	}

	/** 发送潮 */
	export class send_tide<CT extends mk_codec_base = mk_codec_base> {
		/**
		 * @param network_ 网络实例
		 * @param interval_ms_n_ 发送间隔
		 *
		 * - -1：手动触发
		 *
		 * - 0-n：自动发送间隔毫秒
		 */
		constructor(network_: mk_network_base, interval_ms_n_: number) {
			this._network = network_;
			this._send_interval_ms_n = interval_ms_n_;

			// 事件监听
			global_event.on(global_event.key.restart, this._event_restart, this);
		}

		/** 网络节点 */
		private _network!: mk_network_base;
		/**
		 * 发送间隔
		 * @remarks
		 *
		 * - -1：手动触发
		 *
		 * - \>0：自动发送间隔毫秒
		 */
		private _send_interval_ms_n: number;
		/** 消息列表 */
		private _mess_as: any[] = [];
		/** 发送倒计时 */
		private _send_timer: any = null;
		/* ------------------------------- 功能 ------------------------------- */
		/** 发送 */
		send(data_: Parameters<CT["encode"]>[0]): void {
			if (this._send_interval_ms_n === 0) {
				this._network._send(data_);

				return;
			} else {
				this._mess_as.push(data_);
			}

			// 发送定时器
			if (this._send_interval_ms_n > 0 && !this._send_timer) {
				this._send_timer = setInterval(() => {
					// 没有消息取消定时任务
					if (!this._mess_as.length) {
						clearInterval(this._send_timer);
						this._send_timer = null;

						return;
					}

					while (this._mess_as.length) {
						this._network._send(this._mess_as.shift());
					}
				}, this._send_interval_ms_n);
			}
		}

		/** 触发发送 */
		trigger(): void {
			if (this._send_interval_ms_n !== -1) {
				return;
			}

			while (this._mess_as.length) {
				this._network._send(this._mess_as.shift());
			}
		}

		/* ------------------------------- 全局事件 ------------------------------- */
		private _event_restart(): void {
			clearInterval(this._send_timer);
			this._send_timer = null;
		}
	}
}

export default mk_network_base;
