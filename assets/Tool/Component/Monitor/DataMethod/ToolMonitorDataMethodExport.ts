// 引擎不支持 export * as string from "./data_method_string";

import * as dataMethodString from "./ToolMonitorDataMethodString";
import * as dataMethodArray from "./ToolMonitorDataMethodArray";
import * as dataMethodBoolean from "./ToolMonitorDataMethodBoolean";
import * as dataMethodNumber from "./ToolMonitorDataMethodNumber";

export const string = dataMethodString;
export const array = dataMethodArray;
export const boolean = dataMethodBoolean;
export const number = dataMethodNumber;
