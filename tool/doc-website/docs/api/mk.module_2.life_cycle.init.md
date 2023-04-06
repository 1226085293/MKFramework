---
id: mk.module_2.life_cycle.init
title: module\_2.life\_cycle.init() method
hide_title: true
---
<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[mk](./mk.md) &gt; [module\_2](./mk.module_2.md) &gt; [life\_cycle](./mk.module_2.life_cycle.md) &gt; [init](./mk.module_2.life_cycle.init.md)

## module\_2.life\_cycle.init() method

初始化（所有依赖 init\_data 初始化的逻辑都应在此进行）

**Signature:**

```typescript
init(data_?: any): void | Promise<void>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  data\_ | any | _(Optional)_ 初始化数据 - 静态模块：外部自行调用，常用于更新 item 或者静态模块 - 动态模块：onLoad 后，open 前调用 |

**Returns:**

void \| Promise&lt;void&gt;