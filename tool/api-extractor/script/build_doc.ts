import path from "path";
import child_process from "child_process";
import fs from "fs-extra";
import { argv } from "process";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jsonc = require("jsonc-parser");

// 参数：[ (0: 不输出, 1: 输出) ]
(async () => {
	console.log(argv);
	// 更新声明文件
	child_process.execSync(`npx ts-node ./script/build_dts.ts`);
	// 删除输出文件夹
	fs.removeSync(path.join("./temp", "md"));
	// 生成 md 文件
	child_process.execSync(`npx api-documenter markdown -i ./temp -o ./dist/docs`);
})();
