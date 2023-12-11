import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8848 });
const wss2 = new WebSocketServer({ port: 8849 });

wss.on("connection", function connection(ws) {
	ws.on("message", function message(data, binary_b) {
		wss.clients.forEach(function each(client) {
			if (client.readyState === WebSocket.OPEN) {
				console.log("发送", data.toString());
				client.send(data, { binary: binary_b });
			}
		});
	});
});

wss2.on("connection", function connection(ws) {
	ws.on("message", function message(data, binary_b) {
		wss2.clients.forEach(function each(client) {
			if (client.readyState === WebSocket.OPEN) {
				console.log("发送2", data.toString());
				client.send(data, { binary: binary_b });
			}
		});
	});
});

console.log("启动成功");
