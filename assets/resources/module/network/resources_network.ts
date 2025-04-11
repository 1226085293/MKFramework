import * as cc from "cc";
import { _decorator } from "cc";
import mk from "mk";
import tool from "../../../tool/tool";
import { test } from "../../bundle/proto/test.js";
import { common } from "../../bundle/proto/common";
const { ccclass, property } = _decorator;

@ccclass("resources_network")
export class resources_network extends mk.view_base {
	/* --------------- static --------------- */
	/* --------------- 属性 --------------- */
	/* --------------- public --------------- */
	data = {
		/** 聊天列表 */
		chat_ss: [] as string[],
		/** 聊天2列表 */
		chat2_ss: [] as string[],
		/** 头像 */
		head_s: "https://img2.baidu.com/it/u=1453157121,575455426&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500",
	};

	/* --------------- protected --------------- */
	/* --------------- private --------------- */
	private _ws!: mk.network.websocket<tool.codec.proto_static_common>;
	private _ws2 = new mk.network.websocket<tool.codec.proto_static>({
		codec: new tool.codec.proto_static(test, {
			name_s: "test",
		}),
		// get_message_mark_f: (data) => {
		// 	return !data ? null : data.data.constructor;
		// },
	});

	/* ------------------------------- 生命周期 ------------------------------- */
	// create(): void {}
	// init(init_?: typeof this.init_data): void {}
	open(): void {
		{
			const codec = new tool.codec.proto_static_common();

			this._ws = new mk.network.websocket<tool.codec.proto_static_common>({
				codec: codec,
				parse_message_id_f: (data) => {
					return data.constructor.getTypeUrl("");
				},
				parse_message_sequence_f(data) {
					if (data["__sequence_n"] === undefined) {
						data["__sequence_n"] = codec.sequence_n++;
					}

					return data["__sequence_n"];
				},
			});

			this._ws.codec!.init(common, {
				package: common.Package,
				message_id_tab: common.MessageID,
			});

			this.data.chat_ss.push("网络 1 连接中...");
			// 连接网络
			this._ws.connect("ws://127.0.0.1:8848").then(() => {
				this.data.chat_ss.push("网络 1 连接成功！");
				this.data.chat_ss.push("网络 1 发送消息 123");
				// 发送并等待消息返回
				this._ws.message
					.request(
						common.TestC.create({
							data: 123,
						})
					)
					?.then((data: typeof common.TestS.prototype) => {
						this.data.chat_ss.push("网络 1 收到回复消息", data?.data + "");
					});
			});
		}

		{
			this._ws2.connect("ws://127.0.0.1:8849");

			this._ws2.event.on(this._ws.event.key.recv, this._network_recv2, this);
			// 发送消息
			this._ws2.message.send(test.test_c.create());

			// 请求指定消息（等待返回、需在消息体添加消息序号并修改对应编解码）
			this._ws2.message.request(test.test_c.create())?.then((value) => {
				this._log.log("收到请求消息", value);
			});

			// 监听指定消息
			this._ws2.message.on(test.test_c, (value) => {
				this.data.chat2_ss.push("网络 2 收到：" + value.data);
			});
		}
	}

	close(): void {
		this._ws.close();
		this._ws2.close();
		this._ws.event.targetOff(this);
		this._ws2.event.targetOff(this);
	}

	/* ------------------------------- 编辑器事件 ------------------------------- */
	/** item 更新函数 */
	event_item_update(node_: cc.Node, data_s_: string): void {
		mk.N(node_).label.string = data_s_ + "";
	}

	/* ------------------------------- 功能 ------------------------------- */
	/* ------------------------------- 网络事件 ------------------------------- */
	private _network_recv(event_s_: string): void {
		this.data.chat_ss.push("网络 1 收到：" + event_s_);
	}

	private _network_recv2(event_: any): void {
		this.data.chat2_ss.push("网络 2 收到：" + event_.data);
	}
	/* ------------------------------- 自定义事件 ------------------------------- */
}
