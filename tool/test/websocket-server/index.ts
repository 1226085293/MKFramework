import WebSocket, { WebSocketServer } from "ws";
import { common } from "./proto/common.js";

// 网络 1
{
	const wss = new WebSocketServer({ port: 8848 });

	wss.on("connection", function connection(ws) {
		ws.on("message", function message(data, binary_b) {
			const message = common.Package.decode(new Uint8Array(Buffer.from(data as any)));
			let result: common.Package | null = null;

			switch (message.id) {
				case common.MessageID.Test: {
					let data = common.TestC.decode(message.data);

					// 回信
					result = common.Package.create({
						id: message.id,
						sequence: message.sequence,
						data: common.TestS.encode(
							common.TestS.create({
								data: data.data,
							})
						).finish(),
					});

					// 主动推送
					setTimeout(() => {
						const push_message = common.Package.encode(
							common.Package.create({
								id: common.MessageID.Test2,
								sequence: -1,
								data: common.Test2B.encode(
									common.Test2B.create({
										data: data.data + "",
									})
								).finish(),
							})
						).finish();

						ws.send(push_message, { binary: true });
					}, 0);
					break;
				}
			}

			// 回信
			if (result && ws.readyState === WebSocket.OPEN) {
				const message = common.Package.encode(result).finish();

				ws.send(message, { binary: true });
			}
		});
	});
}

// 网络 2
{
	const wss2 = new WebSocketServer({ port: 8849 });

	wss2.on("connection", function connection(ws) {
		ws.on("message", function message(data, binary_b) {
			wss2.clients.forEach(function each(client) {
				if (client.readyState === WebSocket.OPEN) {
					client.send(data, { binary: binary_b });
				}
			});
		});
	});
}

console.log("启动成功");
