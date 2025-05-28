import * as cc from "cc";
import { _decorator } from "cc";
import mk from "mk";
import tool from "../../../tool/tool";
import { test } from "../../bundle/proto/test.js";
import { common } from "../../bundle/proto/common.js";
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
	private _ws2!: mk.network.websocket<tool.codec.proto_static>;

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

				// 发送并等待消息返回
				this.data.chat_ss.push("网络 1 发送消息 123");
				this._ws.message
					.request(
						common.TestC.create({
							data: 123,
						})
					)
					?.then((data: common.TestS) => {
						this.data.chat_ss.push("网络 1 收到回复消息", data?.data + "");
					});

				// 发送并等待消息返回
				this.data.chat_ss.push("网络 1 发送消息 456");
				this._ws.message
					.request(
						common.TestC.create({
							data: 456,
						})
					)
					?.then((data: common.TestS) => {
						this.data.chat_ss.push("网络 1 收到回复消息", data?.data + "");
					});

				// 监听推送
				this._ws.message.on(
					common.Test2B,
					(data) => {
						this.data.chat_ss.push("网络 1 收到监听消息", data?.data + "");
					},
					this
				);
			});
		}

		{
			this._ws2 = new mk.network.websocket<tool.codec.proto_static>({
				codec: new tool.codec.proto_static(test),
				parse_message_id_f: (data) => {
					return data.__id;
				},
				parse_message_sequence_f: (data) => {
					return data.__sequence;
				},
			});

			this.data.chat2_ss.push("网络 2 连接中...");

			this._ws2.connect("ws://127.0.0.1:8849").then(() => {
				this.data.chat2_ss.push("网络 2 连接成功！");

				// 请求指定消息（等待返回）
				this.data.chat2_ss.push("网络 2 发送消息 123");
				this._ws2.message
					.request(
						test.test_c.create({
							data: "123",
						})
					)
					?.then((value: test.test_c) => {
						this.data.chat2_ss.push("网络 2 收到回复消息", value.data);
					});

				// 发送消息
				this.data.chat2_ss.push("网络 2 发送消息 456");
				this._ws2.message.send(
					test.test_c.create({
						data: "456",
					})
				);

				// 监听指定消息
				this._ws2.message.on(test.test_c, (value) => {
					this.data.chat2_ss.push("网络 2 收到监听消息" + value.data);
				});
			});
		}
	}

	close(): void {
		this._ws.close();
		this._ws2.close();
		this._ws.event.targetOff(this);
		this._ws2.event.targetOff(this);
	}

	/* ------------------------------- 自定义事件 ------------------------------- */
	/** item 更新函数 */
	event_item_update(node_: cc.Node, data_s_: string): void {
		mk.N(node_).label.string = data_s_ + "";
	}
}
