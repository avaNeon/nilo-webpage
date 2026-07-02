<script lang="ts" setup>
/**
 * VideoPlayerDialog —— 管理员视频预览 & 详情弹窗
 */
import { ref, computed, watch, onBeforeUnmount, nextTick, shallowRef } from "vue";
import Artplayer from "artplayer";
import Hls from "hls.js";
import artplayerPluginHlsControl from "artplayer-plugin-hls-control";
import { getHlsMasterUrl } from "../model/hlsUrl";
import { imgRequestUrl } from "@/shared/utils/ImgUtil";

/* —————— Props —————— */

const props = withDefaults(defineProps<{
  /** 控制弹窗显示/隐藏 */
  visible: boolean;
  /** 视频信息对象 */
  videoInfo: Record<string, any>;
  /** 分P文件列表 */
  fileList?: { fileIndex: number; fileName: string; fileSize: string; transferResult: number; updateType?: number }[];
  /**
   * 自定义 HLS master.m3u8 地址构建函数。
   * 默认使用普通视频的构建函数；存档视频需传入 getArchiveHlsMasterUrl。
   */
  getMasterUrl?: (videoId: string, index: number) => string;
}>(), {
  fileList: () => [],
  getMasterUrl: getHlsMasterUrl,
});

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
}>();

/* —————— 页签 —————— */

const activeTab = ref<"preview" | "detail">("preview");

/* —————— 分P选择 —————— */

const currentFileIndex = ref(1);

const fileListOptions = computed(() =>
  props.fileList.map(f => ({
    value: f.fileIndex,
    label: `P${f.fileIndex} ${f.fileName}`,
    updateType: f.updateType,
  })),
);

watch(() => props.fileList, (list) =>
{
  if (list.length > 0 && !list.some(f => f.fileIndex === currentFileIndex.value))
  {
    currentFileIndex.value = list[0]!.fileIndex;
  } else if (list.length === 0)
  {
    currentFileIndex.value = 1;
  }
}, { immediate: true });

/* —————— HLS 画质选择 —————— */

function getQualityName(level: any): string
{
  switch (level.height)
  {
    case 480:
      return "标清 480P";
    case 720:
      return "高清 720P";
    default:
      return `${level.height}P`;
  }
}

function buildQualitySelector(hls: Hls)
{
  const seen = new Set<string>();
  const selector = hls.levels
    .map((level, index) => ({
      html: getQualityName(level),
      value: index,
      default: hls.currentLevel === index,
    }))
    .filter(item =>
    {
      if (seen.has(item.html)) return false;
      seen.add(item.html);
      return true;
    })
    .sort((a, b) => b.value - a.value);

  selector.push({
    html: "自动",
    value: -1,
    default: hls.currentLevel === -1,
  });
  return selector;
}

function setupSmoothQualitySwitch(art: Artplayer, hls: Hls)
{
  let pendingLevel: number | null = null;

  const updateQualityUi = () =>
  {
    if (!hls.levels.length) return;
    const currentLevel = hls.levels[hls.currentLevel];
    const tooltip = currentLevel ? getQualityName(currentLevel) : "自动";
    const selector = buildQualitySelector(hls);

    const onSelect = (item: any) =>
    {
      const selectedLevel =
        typeof item?.value === "number" ? item.value : Number(item?.value);
      const selectedLabel = String(item?.html ?? "");

      if (selectedLevel === -1)
      {
        hls.nextLevel = -1;
        pendingLevel = null;
        art.notice.show = `画质: ${selectedLabel || "自动"}`;
        return selectedLabel;
      }

      hls.nextLevel = selectedLevel;
      pendingLevel = selectedLevel;
      art.notice.show = `画质: ${selectedLabel}（切换中）`;
      return selectedLabel;
    };

    art.controls.update({
      name: "hls-quality",
      position: "right",
      html: tooltip,
      style: { padding: "0 10px" },
      selector,
      onSelect,
    } as any);

    art.setting.update({
      name: "hls-quality",
      tooltip,
      html: "画质",
      width: 200,
      selector,
      onSelect,
    } as any);
  };

  const onManifestParsed = () =>
  {
    updateQualityUi();
  };

  const onLevelSwitched = (_event: string, data: { level: number }) =>
  {
    updateQualityUi();
    if (data.level === -1) return;
    const label = getQualityName(hls.levels[data.level]);

    if (pendingLevel !== null && data.level === pendingLevel)
    {
      art.notice.show = `已切换到：${label}`;
      pendingLevel = null;
    } else if (pendingLevel === null)
    {
      art.notice.show = `自动切换到：${label}`;
    }
  };

  hls.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);
  hls.on(Hls.Events.LEVEL_SWITCHED, onLevelSwitched);

  const onDestroy = () =>
  {
    hls.off(Hls.Events.MANIFEST_PARSED, onManifestParsed);
    hls.off(Hls.Events.LEVEL_SWITCHED, onLevelSwitched);
    art.off("destroy", onDestroy);
  };
  art.on("destroy", onDestroy);
}

/* —————— 播放器 (声明必须在 destroyPlayer 调用之前) —————— */

const $container = ref<HTMLDivElement>();
const art = shallowRef<Artplayer | null>(null);

const videoId = computed(() => String(props.videoInfo.videoId ?? ""));
const coverSrc = computed(() => imgRequestUrl(props.videoInfo.videoCover ?? ""));
const hlsUrl = computed(() => (props.getMasterUrl ?? getHlsMasterUrl)(videoId.value, currentFileIndex.value));

function createHls(video: HTMLVideoElement, url: string, artInstance: Artplayer)
{
  if (!Hls.isSupported())
  {
    if (video.canPlayType("application/vnd.apple.mpegurl"))
    {
      video.src = url;
    }
    return;
  }

  const hls = new Hls({
    fragLoadingTimeOut: 5000,
    fragLoadingMaxRetry: 2,
    manifestLoadingMaxRetry: 2,
    startLevel: -1,
  });
  hls.loadSource(url);
  hls.attachMedia(video);
  (artInstance as any).hls = hls;
  setupSmoothQualitySwitch(artInstance, hls);

  const onDestroy = () =>
  {
    hls.destroy();
    artInstance.off("destroy", onDestroy);
  };
  artInstance.on("destroy", onDestroy);
}

function initPlayer()
{
  if (!videoId.value) return;

  destroyPlayer();

  nextTick(() =>
  {
    if (!$container.value) return;

    art.value = new Artplayer({
      container: $container.value,
      url: hlsUrl.value,
      type: "m3u8",
      customType: {
        m3u8: function (video, url, artInstance)
        {
          createHls(video, url, artInstance);
        },
      },
      poster: coverSrc.value,
      volume: 0.6,
      isLive: false,
      muted: false,
      autoplay: false,
      pip: true,
      autoSize: false,
      autoMini: true,
      screenshot: false,
      setting: true,
      loop: true,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: "#23ade5",
      lang: navigator.language.toLowerCase(),
      moreVideoAttr: { crossOrigin: "anonymous" },
      plugins: [
        artplayerPluginHlsControl({
          quality: { control: false, setting: false, title: "画质", auto: "自动" },
          audio: { control: true, setting: true, title: "Audio", auto: "Auto" },
        }),
      ],
    });
  });
}

function destroyPlayer()
{
  if (art.value)
  {
    art.value.destroy(false);
    art.value = null;
  }
}

/* —————— 弹窗显隐 —————— */

const localVisible = ref(false);

watch(() => props.visible, (val) =>
{
  localVisible.value = val;
  if (val)
  {
    activeTab.value = "preview";
    if (props.fileList.length > 0)
    {
      currentFileIndex.value = props.fileList[0]!.fileIndex;
    }
    // 直接初始化播放器，不再依赖下游 watcher 链式触发（解决首次黑屏）
    nextTick(() => initPlayer());
  } else
  {
    destroyPlayer();
  }
}, { immediate: true });

function close()
{
  localVisible.value = false;
  emit("update:visible", false);
}

/* —————— 切换监听 —————— */

/** 手动切换分P → 重建播放器 */
watch(currentFileIndex, (newIdx, oldIdx) =>
{
  if (newIdx !== oldIdx && localVisible.value && activeTab.value === "preview")
  {
    nextTick(() => initPlayer());
  }
});

/** 切换到"视频预览"页签 → 初始化播放器 */
watch(activeTab, (tab) =>
{
  if (tab === "preview" && localVisible.value)
  {
    nextTick(() => initPlayer());
  } else
  {
    destroyPlayer();
  }
});

/**
 * 视频ID变化（弹窗已打开时点击其它视频行）→ 重建播放器
 * 这是解决"隐藏后点击其它视频行不切换播放"的关键
 */
watch(videoId, (newId, oldId) =>
{
  if (newId && newId !== oldId && localVisible.value && activeTab.value === "preview")
  {
    nextTick(() => initPlayer());
  }
});

onBeforeUnmount(() => { destroyPlayer(); });

/* —————— 详情字段列表 —————— */

const detailFields = computed(() =>
{
  const info = props.videoInfo;
  const entries: { label: string; value: any }[] = [];
  if (!info) return entries;

  const fieldMap: Record<string, string> = {
    videoId: "视频ID", videoName: "视频名称", videoCover: "封面路径",
    userId: "用户ID", nickName: "用户昵称",
    createTime: "创建时间", lastUpdateTime: "最后更新时间",
    deleteTime: "删除时间", deleteDetail: "删除原因", deleterType: "删除者类型",
    pCategoryId: "父级分类ID", categoryId: "分类ID",
    postType: "类型", originInfo: "原资源说明", tags: "标签",
    introduction: "简介", interaction: "互动设置", duration: "时长(秒)",
    playCount: "播放数", likeCount: "点赞数", danmakuCount: "弹幕数",
    commentCount: "评论数", coinCount: "投币数", collectCount: "收藏数",
    recommendType: "推荐状态", status: "状态", avatar: "头像路径",
  };

  for (const [key, label] of Object.entries(fieldMap))
  {
    if (key in info) entries.push({ label, value: info[key] });
  }
  for (const key of Object.keys(info))
  {
    if (!(key in fieldMap)) entries.push({ label: key, value: info[key] });
  }
  return entries;
});

const playerHeight = 480;
</script>

<template>
  <el-dialog :model-value="localVisible" title="视频管理" width="1000px" top="10vh" :close-on-click-modal="false"
    @update:model-value="(val: boolean) => { if (!val) close(); }" @closed="destroyPlayer">

    <!-- 页签 -->
    <el-tabs v-model="activeTab" class="player-tabs">
      <el-tab-pane label="视频预览" name="preview" />
      <el-tab-pane label="视频详情" name="detail" />
    </el-tabs>

    <!-- ===== 视频预览 ===== -->
    <div v-show="activeTab === 'preview'" class="preview-panel">
      <div v-if="!videoId" class="empty-hint">暂无视频信息</div>
      <div v-else class="preview-layout">
        <div ref="$container" class="player-container" :style="{ height: playerHeight + 'px' }" />
        <div class="partition-panel" v-if="fileListOptions.length > 0">
          <h4 class="partition-title">分P列表</h4>
          <div class="partition-list">
            <div v-for="opt in fileListOptions" :key="opt.value"
              :class="['partition-item', { active: opt.value === currentFileIndex }]"
              @click="currentFileIndex = opt.value">
              <span class="partition-label">{{ opt.label }}</span>
              <el-tag v-if="opt.updateType === 1" type="warning" size="small" effect="light"
                class="update-tag">有更新</el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 视频详情 ===== -->
    <div v-show="activeTab === 'detail'" class="detail-panel">
      <div v-if="detailFields.length === 0" class="empty-hint">暂无视频信息</div>
      <el-table v-else :data="detailFields" stripe border size="large" max-height="480">
        <el-table-column label="字段" prop="label" width="180" />
        <el-table-column label="值" prop="value">
          <template #default="{ row }">
            <span class="field-value">{{ row.value ?? "-" }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <el-button @click="close">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.player-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }
}

.preview-panel {
  .empty-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: $color-text-muted;
    font-size: 15px;
  }

  .preview-layout {
    display: flex;
    gap: 16px;

    .player-container {
      flex: 1;
      min-width: 0;
      border-radius: 8px;
      overflow: hidden;
      background: #000;
    }

    .partition-panel {
      width: 200px;
      flex-shrink: 0;
      border: 1px solid $color-border;
      border-radius: 8px;
      padding: 12px;
      overflow-y: auto;
      max-height: 480px;
      background: #fafafa;

      .partition-title {
        font-size: 14px;
        font-weight: 600;
        color: $color-text-primary;
        margin: 0 0 10px;
      }

      .partition-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .partition-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        color: $color-text-secondary;
        transition: background-color 0.2s;

        &:hover {
          background-color: $color-mask-10;
        }

        &.active {
          background-color: $color-badge-blue-bg;
          color: $color-bilibili-blue;
          font-weight: 600;
        }

        .partition-label {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .update-tag {
          flex-shrink: 0;
        }
      }
    }
  }
}

.detail-panel {
  .empty-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: $color-text-muted;
    font-size: 15px;
  }

  .field-value {
    word-break: break-all;
    font-size: 13px;
    color: $color-text-primary;
  }
}
</style>
