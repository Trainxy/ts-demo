## ts 示例代码，已去除敏感内容及配置

使用 `NestJS` 基础框架，使用 `monorepo mode` 多应用模式。其中包括 `ai-art`, `discord`，`task-generator` 三个子应用，公共依赖在 `libs/legendary` 模块。

使用以下命令单独打包：
```
nest build task-generator
```

应用说明：
| App            | Description                                                                               |
| -------------- | ----------------------------------------------------------------------------------------- |
| ai-art         | Stable Diffusion API 封装                                                                 |
| discrod        | 通过 discord api 代理 midjourney 图片生成交互                                             |
| task-generator | 避免多实例 / 分布式布署时的 schedule 不重复执行，独立出任务生成器，该示例中消费部分已删除 |

