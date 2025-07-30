// 引擎不支持 export * as string from "./data_method_string";

import * as data_method_string from "./tool_monitor_data_method_string";
import * as data_method_array from "./tool_monitor_data_method_array";
import * as data_method_boolean from "./tool_monitor_data_method_boolean";
import * as data_method_number from "./tool_monitor_data_method_number";

export const string = data_method_string;
export const array = data_method_array;
export const boolean = data_method_boolean;
export const number = data_method_number;
