"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
const BuildDTS_1 = __importDefault(require("./BuildDTS"));
const TreeShaking_1 = __importDefault(require("./TreeShaking"));
global.Editor = {
    Project: {
        path: (0, process_1.cwd)(),
    },
};
switch (process_1.argv.slice(2)[0]) {
    case "build-dts": {
        (0, BuildDTS_1.default)();
        break;
    }
    case "tree-shaking": {
        (0, TreeShaking_1.default)().then((isChanged) => {
            if (isChanged) {
                return (0, BuildDTS_1.default)();
            }
        });
        break;
    }
}
