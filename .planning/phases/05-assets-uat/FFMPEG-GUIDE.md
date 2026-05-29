# FFmpeg 工业级互动视频无缝转码指南

在双播放器物理瞬间硬切架构中，为了达成 **零黑帧、零卡顿、时差 < 50ms** 的无缝流切换，视频资产在编码阶段必须满足严格的物理层对齐。
如果后续分支视频的 GOP（图片群组）没有在切入点绝对对齐，或者存在开放式 B 帧（Open GOP），浏览器在解码切换瞬间就会因为寻找关键帧（I-Frame）而引发短暂的解码卡顿或黑屏。

本指南提供了针对互动视频资产的工业级 FFmpeg 转码基准命令，建议项目资产库（Assets Repository）在归档所有视频资产时强制执行此标准。

---

## 核心编码技术指标

| 指标维度 | 工业规范要求 | 物理学原理与目的 |
| :--- | :--- | :--- |
| **视频编码器** | H.264 / AVC (High Profile) | 确保全终端、全主流浏览器（包括移动端 iOS/Android）的高硬件加速解码兼容性，降低 CPU/GPU 负载。 |
| **音频编码器** | AAC-LC | 互动音轨标准，提供低延迟、高保真的双声道音频流。 |
| **帧率 (FPS)** | 30.00 fps (Constant Frame Rate) | 消除可变帧率 (VFR) 带来的音视频同步飘移，确保帧对齐的时间轴计算绝对精确。 |
| **GOP 长度** | 60 帧（即严格的 2.0 秒间隔） | 在 30fps 下，设定 60 帧一个 GOP。预加载和硬切切换均在关键帧边界进行，提供最快的数据寻址。 |
| **GOP 闭合性** | 严格闭合 (Closed GOP) | 禁用跨 GOP 的帧间预测，强制每个 GOP 自主解码。彻底消除切换瞬间由于缺失前置参考帧导致的花屏或解码阻塞。 |
| **场景切换检测** | 禁用 (`-sc_threshold 0`) | 防止 FFmpeg 在画面剧烈变动处自动插入非周期性 I 帧，确保所有视频的 Keyframe 物理位置绝对重合。 |
| **码率控制** | 恒定质量 (CRF 20) + 漏斗限制 (VBV) | 在保障极其细腻画质的同时，限制最高瞬时码率，防止突发大流量冲垮移动端网路缓冲，降低抢占性加载的时延。 |

---

## 标准转码命令行

请在终端中执行以下 FFmpeg 工业转码命令对互动视频（如 `intro.mp4`, `branch_a.mp4`）进行处理：

```bash
ffmpeg -i input.mp4 \
  -c:v libx264 -profile:v high -level:v 4.1 \
  -preset:v slow -crf 20 \
  -maxrate 4M -bufsize 8M \
  -r 30 -g 60 -keyint_min 60 -sc_threshold 0 -bf 2 \
  -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart \
  output.mp4
```

### 参数详解深度剖析

*   **`-c:v libx264 -profile:v high -level:v 4.1`**: 采用标准 H.264 High Profile 4.1 编码，提供优异的画质压缩比并开启全部主流平台的硬件解码（GPU）加速。
*   **`-preset:v slow`**: 慢速预设编码。牺牲编码时长换取极高的数据压缩比，保证文件体积极小。
*   **`-crf 20`**: 设定恒定质量因子为 20。在人眼无感画质损失的前提下，极大精简空间冗余。
*   **`-maxrate 4M -bufsize 8M`**: 限制最大瞬时码率为 4 Mbps，配合 8 Mb 漏斗缓冲区。防范视频突发高动效画面时的“码率尖峰”，预防网络阻塞。
*   **`-r 30`**: 强制使用 30 fps 恒定帧率 (CFR)。
*   **`-g 60 -keyint_min 60`**: 强行锁定 GOP 长度为 60 帧。最大和最小关键帧间隔完全对齐为 60 帧（即 2 秒一个 I 帧）。
*   **`-sc_threshold 0`**: 场景切换敏感度设为 0。**这是最关键的参数**，它禁止 FFmpeg 在检测到镜头切换时额外插入关键帧，保障全链路多端素材在 2.0s 物理边界上对齐。
*   **`-bf 2`**: 限制连续 B 帧最大个数为 2。在保证高压缩率的同时，降低浏览器的解码缓冲深度（Reorder buffer queue），减少切换响应延时。
*   **`-c:a aac -b:a 192k -ar 48000 -ac 2`**: 音轨转为高保真 AAC，192kbps 码率，48kHz 采样率，双声道。
*   **`-movflags +faststart`**: 将 MP4 的元数据索引（moov atom）移动到文件头部。**这使得视频在网络请求时可以“首帧秒开”，不需要下载完整个视频即可立即触发 canplaythrough 并完成静默预缓冲。**

---

## 多分辨率适配方案 (HTTP 渐进式 / HLS 流式对齐)

若后期需要支持多码率自适应切换（如 Dash / HLS），必须保证所有分辨率等级下的 GOP 物理参数一致。可以使用以下统一转码脚本批量生成分发格式：

```bash
# 720p 标清转码 (适用于移动端/慢网环境)
ffmpeg -i input.mp4 -c:v libx264 -profile:v high -level:v 4.1 -preset:v slow -crf 22 -maxrate 2.5M -bufsize 5M -vf "scale=1280:720" -r 30 -g 60 -keyint_min 60 -sc_threshold 0 -bf 2 -c:a aac -b:a 128k -ar 48000 -ac 2 -movflags +faststart output_720p.mp4

# 1080p 高清转码 (基准格式)
ffmpeg -i input.mp4 -c:v libx264 -profile:v high -level:v 4.1 -preset:v slow -crf 20 -maxrate 4.5M -bufsize 9M -vf "scale=1920:1080" -r 30 -g 60 -keyint_min 60 -sc_threshold 0 -bf 2 -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart output_1080p.mp4
```

---

## 视频对齐一致性自检验证

在视频归档至互动视频项目前，开发人员或 QC 人员可使用 `ffprobe` 工具对转码文件进行静态检验，确保其 GOP 确实严格锁定在 60 帧：

```bash
# 查看所有关键帧 (I-Frame) 的呈现时间点戳 (PTS)
ffprobe -v error -select_streams v:0 -show_entries frame=pict_type,pts_time -of csv=p=0 input_transcoded.mp4 | grep -n "I"

# 预期输出 (完美对齐为每 2 秒一个 I 帧，不包含非整数场景切换帧)：
# 1:I,0.000000
# 61:I,2.000000
# 121:I,4.000000
# 181:I,6.000000
# ...
```

若 `pts_time` 输出中存在如 `3.456000` 或 `5.123000` 等非 2 秒整数倍的关键帧，代表 GOP 对齐失效，必须重新使用本转码指南进行压制。
