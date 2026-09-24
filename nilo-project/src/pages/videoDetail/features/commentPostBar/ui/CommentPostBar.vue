<script lang="ts" setup>
import Avatar from '@/shared/entities/avatar/ui/Avatar.vue';
import { useLoginStateStore } from '@/shared/store/LoginStateStore';
import { useSystemConfigStore } from '@/shared/store/SystemConfigStore';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import Cover from '@/shared/ui/Cover.vue';
import { Delete } from '@element-plus/icons-vue';
import { useFileUpload } from '@/shared/composables/useFileUpload';
import { imageApi } from '@/shared/api/ImageApi';
import message from '@/shared/lib/message';
import type { AxiosProgressEvent } from 'axios';
import { CommentPostApi } from '../api/CommentPostApi';
import { useRoute } from 'vue-router';
import type { VideoComment } from '@/shared/model/VideoComment';
import { StringUtil } from '@/shared/utils/StringUtil';
import { emojiCategories } from '../data/emojiDatasource';

const props = withDefaults(defineProps<{
    parentCommentId: string,
    placeholder?: string,
    available?: boolean
}>(), {
    placeholder: '评论内容',
    available: true
})

const emit = defineEmits<{
    (e: 'commentPosted', comment: VideoComment): void
}>()

const loginStateStore = useLoginStateStore();
/** 顶层评论框 / 楼中楼回复框的头像尺寸 */
const AVATAR_WIDTH = 40
const REPLY_AVATAR_WIDTH = 30
const MAX_COMMENT_LENGTH = 1000
const PREVIEW_IMAGE_WIDTH = 120
/**
 * per video comment
 */
const MAX_IMAGE_UPLOAD_COUNT = 3

const userCommentText = ref('')

const route = useRoute()

/** 回复框（parentCommentId 不为 '0'）使用更小的头像 */
const isReply = computed(() => String(props.parentCommentId) !== '0')
const avatarWidth = computed(() => isReply.value ? REPLY_AVATAR_WIDTH : AVATAR_WIDTH)


// ========== 图片上传 ==========
const systemConfigStore = useSystemConfigStore();
// 从系统配置获取图片大小限制（单位 MB），转为字节传给 useFileUpload
const imageMaxSize = computed(() =>
{
    const mb = systemConfigStore.imageMaxSize;
    return mb > 0 ? mb * 1024 * 1024 : 10 * 1024 * 1024;
})

const {
    uploadItems,
    isUploading,
    selectFile,
    removeItem,
    uploadAll,
    reset,
} = useFileUpload({
    accept: 'image/*',
    maxSize: imageMaxSize,
    uploadFn: (file: File, onProgress?: (event: AxiosProgressEvent) => void) =>
        imageApi.uploadImage(file, onProgress),
})

const isPosting = ref(false)

// ========== Emoji 选择 ==========
const emojiPanelVisible = ref(false)
const emojiContainerRef = ref<HTMLElement | null>(null)
const commentPostBarRef = ref<HTMLElement | null>(null)

function toggleEmojiPanel()
{
    emojiPanelVisible.value = !emojiPanelVisible.value
}

function onDocumentClick(e: MouseEvent)
{
    if (emojiContainerRef.value && !emojiContainerRef.value.contains(e.target as Node))
    {
        emojiPanelVisible.value = false
    }
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() =>
{
    document.removeEventListener('click', onDocumentClick)
    reset()
})

const activeCategoryIndex = ref(0)
const categoryTabsRef = ref<HTMLElement | null>(null)

const activeEmojis = computed(() =>
{
    return emojiCategories[activeCategoryIndex.value]?.emojis ?? []
})

// ========== 分类选项卡横向滚动 ==========
function scrollCategories(direction: 'left' | 'right')
{
    if (!categoryTabsRef.value) return
    const scrollAmount = 120
    categoryTabsRef.value.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
    })
}

function insertEmoji(emoji: string)
{
    const textarea = commentPostBarRef.value?.querySelector('.textarea textarea') as HTMLTextAreaElement | null
    if (textarea)
    {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = userCommentText.value
        userCommentText.value = text.slice(0, start) + emoji + text.slice(end)
        nextTick(() =>
        {
            textarea.selectionStart = textarea.selectionEnd = start + emoji.length
        })
    } else
    {
        userCommentText.value += emoji
    }
}

// ========== 输入框展开 ==========
const inputBoxRef = ref<HTMLElement | null>(null)
const isFocused = ref(false)

function onInputBoxFocusOut(e: FocusEvent)
{
    // 焦点仍留在输入框内部（图片 / 表情按钮）时保持展开
    if (inputBoxRef.value && inputBoxRef.value.contains(e.relatedTarget as Node | null)) return
    isFocused.value = false
}

/** 聚焦、已有内容、已选图片或打开表情面板时，输入框展开为多行 */
const isExpanded = computed(() =>
    isFocused.value || userCommentText.value.length > 0 || uploadItems.value.length > 0 || emojiPanelVisible.value)

function selectImage()
{
    if (uploadItems.value.length >= MAX_IMAGE_UPLOAD_COUNT)
    {
        message.warning(`每条评论最多只能上传 ${MAX_IMAGE_UPLOAD_COUNT} 张图片`)
    } else
    {
        selectFile()
    }
}

async function postComment()
{
    if (isPosting.value) return

    if (!loginStateStore.loginState)
    {
        message.warning("请先登录")
        loginStateStore.showPanel = true
        return
    }

    if (userCommentText.value.length > MAX_COMMENT_LENGTH)
    {
        message.warning(`评论内容不能超过 ${MAX_COMMENT_LENGTH} 字`)
        return
    }
    if (isUploading.value)
    {
        message.warning('图片正在上传，请稍后再试')
        return
    }
    if ((!uploadItems.value || uploadItems.value.length === 0) && StringUtil.isBlank(userCommentText.value))
    {
        message.warning('不能发送空白内容 😮')
        return
    }
    if (uploadItems.value.length > MAX_IMAGE_UPLOAD_COUNT)
    {
        message.warning(`每条评论最多只能上传 ${MAX_IMAGE_UPLOAD_COUNT} 张图片`)
        return
    }

    isPosting.value = true
    const uploadSuccess = await uploadAll()
    if (!uploadSuccess)
    {
        isPosting.value = false
        message.warning('图片上传失败，请重试')
        return
    }

    const content = userCommentText.value;
    const imgPaths = uploadItems.value ? uploadItems.value.map(item => item.relativePath).filter(Boolean).join(",") : '';
    try
    {
        const commentId = await CommentPostApi.postComment(route.params.videoId as string,
            content,
            imgPaths == '' ? undefined : imgPaths,
            props.parentCommentId);
        if (commentId)
        {
            message.success('评论发布成功！')
            emit('commentPosted', {
                commentId: commentId,
                parentCommentId: props.parentCommentId,
                content: userCommentText.value,
                imgPaths: imgPaths,
                userId: loginStateStore.userInfo?.userId ?? '',
                topType: 0,
                postTime: new Date(),
                upvoteCount: 0,
                downvoteCount: 0,
                replyCount: 0,
                deleted: 0,
                childCommentList: [],
                hasMoreChildren: false,
                isUpvoted: false,
                isDownvoted: false,
                nickName: loginStateStore.userInfo?.nickName ?? '',
                avatar: loginStateStore.userInfo?.avatar ?? '',
            })
            userCommentText.value = ''
            reset()
        }
    }
    finally
    {
        isPosting.value = false
    }
}
</script>

<template>
    <div class="comment-post-bar" ref="commentPostBarRef" :style="{ '--avatar-size': avatarWidth + 'px' }"
        :class="{ reply: isReply, expanded: isExpanded, disabled: !available }">
        <div class="avatar-wrap">
            <Avatar class="user-avatar" :user-id="loginStateStore.userInfo?.userId ?? null"
                :src="imgRequestUrl(loginStateStore.userInfo?.avatar ?? '', true)" :width="avatarWidth" :lazy="true"
                :user-panel="false" :mobile="false" />
        </div>

        <div class="composer">
            <div class="input-box" ref="inputBoxRef" @focusin="isFocused = true" @focusout="onInputBoxFocusOut">
                <el-input class="textarea" v-model="userCommentText" :maxlength="MAX_COMMENT_LENGTH"
                    :placeholder="available ? props.placeholder : '评论区已关闭'" type="textarea"
                    :autosize="{ minRows: 1, maxRows: 8 }" :disabled="!available" />
                <div class="tool-bar" v-if="available">
                    <span v-if="isExpanded" class="word-count">{{ userCommentText.length }}/{{ MAX_COMMENT_LENGTH
                        }}</span>
                    <!-- 点击图片图标 → 打开文件选择器 -->
                    <button type="button" class="tool-btn" title="添加图片" aria-label="添加图片" @click="selectImage">
                        <svg class="tool-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"
                            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <rect x="2.75" y="3.75" width="14.5" height="12.5" rx="2.5" />
                            <circle cx="7.25" cy="8.25" r="1.5" />
                            <path d="M3.25 14.25 7.5 10.5l3 2.5 2.75-2.25 3.75 3.25" />
                        </svg>
                    </button>
                    <!-- 表情选择 -->
                    <div class="emoji-wrapper" ref="emojiContainerRef">
                        <button type="button" class="tool-btn" :class="{ active: emojiPanelVisible }" title="表情"
                            aria-label="表情" @click.stop="toggleEmojiPanel">
                            <svg class="tool-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor"
                                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <circle cx="10" cy="10" r="7.25" />
                                <path d="M7.25 11.75c.7.9 1.65 1.35 2.75 1.35s2.05-.45 2.75-1.35" />
                                <circle cx="7.6" cy="8.1" r="0.6" fill="currentColor" />
                                <circle cx="12.4" cy="8.1" r="0.6" fill="currentColor" />
                            </svg>
                        </button>
                        <Transition name="emoji-fade">
                            <div v-if="emojiPanelVisible" class="emoji-panel" @click.stop>
                                <!-- 分类选项栏 -->
                                <div class="category-bar">
                                    <button type="button" class="category-scroll-btn category-scroll-left"
                                        @click="scrollCategories('left')">
                                        <span>‹</span>
                                    </button>
                                    <div class="category-tabs" ref="categoryTabsRef">
                                        <span v-for="(cat, index) in emojiCategories" :key="cat.label"
                                            class="category-tab" :class="{ active: index === activeCategoryIndex }"
                                            @click="activeCategoryIndex = index">
                                            {{ cat.label }}
                                        </span>
                                    </div>
                                    <button type="button" class="category-scroll-btn category-scroll-right"
                                        @click="scrollCategories('right')">
                                        <span>›</span>
                                    </button>
                                </div>
                                <!-- 表情网格 -->
                                <div class="emoji-grid">
                                    <span v-for="emoji in activeEmojis" :key="emoji" class="emoji-item"
                                        @click="insertEmoji(emoji)">
                                        {{ emoji }}
                                    </span>
                                </div>
                            </div>
                        </Transition>
                    </div>
                </div>
            </div>

            <!-- 图片预览区 -->
            <div v-if="uploadItems.length > 0" class="preview-images">
                <div class="preview-image" v-for="item in uploadItems" :key="item.id">
                    <div class="preview-thumb">
                        <!-- 上传成功后显示服务器路径，否则显示本地预览 -->
                        <Cover :src="item.relativePath ? imgRequestUrl(item.relativePath) : item.localUrl"
                            :width="PREVIEW_IMAGE_WIDTH" fit="scale-down" :preview="!!item.relativePath"
                            :auto-height="true" :thumbnail="true" :border-radius="10" />
                        <!-- 删除按钮 -->
                        <button type="button" class="remove-btn" title="移除图片" aria-label="移除图片"
                            :disabled="item.status === 'uploading'" @click="removeItem(item.id)">
                            <el-icon :size="12">
                                <Delete />
                            </el-icon>
                        </button>
                    </div>
                    <!-- 上传中显示进度条 -->
                    <el-progress v-if="item.status === 'uploading'" class="upload-progress" :percentage="item.progress"
                        :stroke-width="4" :show-text="false" />
                    <span v-else-if="item.status === 'selected'" class="pending-text">
                        待发布
                    </span>
                    <!-- 上传失败显示错误信息 -->
                    <span v-else-if="item.status === 'error'" class="error-text">
                        {{ item.errorMsg }}
                    </span>
                </div>
            </div>
        </div>

        <button type="button" class="submit-btn" :disabled="!available || isPosting" @click="postComment">
            <span v-if="isPosting" class="spinner" aria-hidden="true"></span>
            发布
        </button>
    </div>
</template>

<style lang="scss" scoped>
$bar-height: 48px;

.comment-post-bar {
    display: flex;
    align-items: flex-start;
    gap: 14px;

    // 按钮统一去掉默认样式
    button {
        padding: 0;
        border: none;
        background: transparent;
        font: inherit;
        color: inherit;
        cursor: pointer;
    }

    // 头像与单行输入框垂直居中；输入框展开为多行时仍停在第一行
    .avatar-wrap {
        position: relative;
        flex-shrink: 0;
        width: var(--avatar-size);
        height: var(--avatar-size);
        margin-top: calc((#{$bar-height} - var(--avatar-size)) / 2);
        border-radius: 50%;
        background: $warm-sunken;

        // 细描边压在图片上方
        &::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 50%;
            box-shadow: inset 0 0 0 1px rgba(11, 12, 18, 0.06);
            pointer-events: none;
        }

        // Avatar 自带 z-index: 500（给用户面板用），这里不需要，去掉以免盖住表情面板等浮层
        .user-avatar {
            z-index: auto;
        }

        .user-avatar :deep(.avatar) {
            display: block;
            z-index: auto;
        }

        :deep(.image-container) {
            border: none !important;
            background: $warm-sunken;
        }
    }

    .composer {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    // ===== 输入框 =====
    .input-box {
        display: flex;
        align-items: flex-end;
        min-height: $bar-height;
        border-radius: calc(#{$bar-height} / 2);
        background: $warm-sunken;
        transition: background-color 0.2s ease, box-shadow 0.2s ease;

        // 浅灰胶囊，聚焦时换白底 + 蓝色描边
        &:focus-within {
            background: #FFFFFF;
            box-shadow: inset 0 0 0 1.5px $warm-accent;
        }

        .textarea {
            flex: 1;
            min-width: 0;

            :deep(.el-textarea__inner) {
                min-height: $bar-height;
                padding: 14px 20px;
                border-radius: calc(#{$bar-height} / 2);
                font-size: 13px;
                line-height: 20px;
                color: $warm-ink;
                background: transparent;
                resize: none;
                transition: min-height 0.2s ease;

                &,
                &:hover,
                &:focus {
                    box-shadow: none;
                }

                &::placeholder {
                    color: $warm-ink-4;
                }
            }

            // 禁用态（评论区关闭）
            &.is-disabled :deep(.el-textarea__inner) {
                color: $warm-ink-4;
                background: transparent;
                cursor: not-allowed;
            }
        }
    }

    // 展开态：至少三行高度
    &.expanded .input-box .textarea :deep(.el-textarea__inner) {
        min-height: 84px !important;
    }

    &.disabled .input-box {
        opacity: 0.6;
        box-shadow: none;
    }

    // ===== 工具栏（输入框右下角） =====
    .tool-bar {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 2px;
        height: $bar-height;
        padding: 0 10px 0 4px;

        .word-count {
            margin-right: 6px;
            font-family: $warm-font-mono;
            font-size: 11px;
            color: $warm-ink-4;
        }

        .tool-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            color: $warm-ink-3;
            transition: color 0.15s ease, background-color 0.15s ease;

            .tool-icon {
                width: 18px;
                height: 18px;
            }

            &:hover,
            &:focus-visible,
            &.active {
                color: $warm-accent;
                background-color: rgba(11, 12, 18, 0.06);
                outline: none;
            }
        }
    }

    // ===== 发布按钮 =====
    .submit-btn {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        height: $bar-height;
        padding: 0 24px;
        border-radius: 999px;
        background: $warm-accent;
        color: #FFFFFF;
        font-size: 14px;
        font-weight: 600;
        transition: background-color 0.2s ease, opacity 0.2s ease;

        &:hover:not(:disabled),
        &:focus-visible {
            background: $warm-ink;
            outline: none;
        }

        &:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        .spinner {
            width: 12px;
            height: 12px;
            border: 1.5px solid rgba(255, 255, 255, 0.35);
            border-top-color: #FFFFFF;
            border-radius: 50%;
            animation: post-bar-spin 0.8s linear infinite;
        }
    }

    // ===== Emoji 选择面板 =====
    .emoji-wrapper {
        position: relative;

        .emoji-panel {
            position: absolute;
            top: calc(100% + 10px);
            right: -8px;
            z-index: 550;
            width: 380px;
            padding: 12px;
            border-radius: 20px;
            background: $warm-card;
            box-shadow: $warm-shadow-card;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .emoji-fade-enter-active,
        .emoji-fade-leave-active {
            transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .emoji-fade-enter-from,
        .emoji-fade-leave-to {
            opacity: 0;
            transform: translateY(-4px);
        }

        // ===== 分类选项栏 =====
        .category-bar {
            display: flex;
            align-items: center;
            gap: 4px;
            flex-shrink: 0;
            margin-bottom: 10px;
            position: relative;
        }

        .category-scroll-btn {
            flex-shrink: 0;
            width: 24px;
            height: 28px;
            border-radius: 999px;
            background: $warm-sunken;
            display: flex;
            align-items: center;
            justify-content: center;
            color: $warm-ink-3;
            font-size: 18px;
            line-height: 1;
            transition: background-color 0.2s ease, color 0.2s ease;

            &:hover {
                background: #E9EBF0;
                color: $warm-ink;
            }

            span {
                pointer-events: none;
            }
        }

        .category-tabs {
            flex: 1;
            display: flex;
            gap: 4px;
            overflow-x: auto;
            overflow-y: hidden;
            scrollbar-width: none; // Firefox
            -ms-overflow-style: none; // IE/Edge
            white-space: nowrap;
            padding: 2px 0;

            &::-webkit-scrollbar {
                display: none; // Chrome/Safari
            }
        }

        .category-tab {
            display: inline-flex;
            align-items: center;
            flex-shrink: 0;
            height: 26px;
            padding: 0 10px;
            font-size: 12px;
            border-radius: 999px;
            cursor: pointer;
            user-select: none;
            background: $warm-sunken;
            color: $warm-ink-3;
            transition: background-color 0.2s ease, color 0.2s ease;
            white-space: nowrap;

            &:hover {
                background: #E9EBF0;
                color: $warm-ink;
            }

            &.active {
                background: $warm-accent;
                color: #FFFFFF;
                font-weight: 500;
            }
        }

        // ===== 表情网格 =====
        .emoji-grid {
            display: grid;
            grid-template-columns: repeat(8, minmax(0, 1fr));
            gap: 4px;
            max-height: 240px;
            overflow-y: auto;
            overflow-x: hidden;
            transform: translateZ(0); // GPU 合成层，消除 hover 卡顿
            // 滚动条整体右移 5px，左边留空白
            padding-right: 5px;
            margin-right: -5px;

            // 自定义滚动条样式，实现右移效果
            &::-webkit-scrollbar {
                width: 6px;
            }

            &::-webkit-scrollbar-track {
                background: transparent;
                margin-left: 5px; // 左边留 5px 空白
            }

            &::-webkit-scrollbar-thumb {
                background: rgba(11, 12, 18, 0.16);
                border-radius: 3px;

                &:hover {
                    background: rgba(11, 12, 18, 0.28);
                }
            }

            // Firefox 滚动条样式
            scrollbar-width: thin;
            scrollbar-color: rgba(11, 12, 18, 0.16) transparent;

            .emoji-item {
                display: flex;
                align-items: center;
                justify-content: center;
                aspect-ratio: 1;
                min-width: 0;
                font-size: 24px;
                border-radius: 8px;
                cursor: pointer;
                user-select: none;
                background-color: transparent;
                transition: transform 0.1s ease;

                &:hover {
                    background-color: #F3F4F7; // 硬编码颜色，避免 CSS 变量过渡开销
                }

                &:active {
                    transform: scale(0.85);
                }
            }
        }
    }

    // ===== 图片预览 =====
    .preview-images {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;

        .preview-image {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            width: 120px;
        }

        .preview-thumb {
            position: relative;
            border-radius: 10px;
            background: $warm-sunken;

            :deep(.image-container) {
                background: $warm-sunken;
            }
        }

        .remove-btn {
            position: absolute;
            top: 6px;
            right: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: rgba(11, 12, 18, 0.62);
            color: #FFFFFF;
            backdrop-filter: blur(8px);
            transition: background-color 0.2s ease;

            &:hover:not(:disabled) {
                background: rgba(11, 12, 18, 0.85);
            }

            &:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }
        }

        .upload-progress {
            width: 100%;
        }
    }

    .error-text {
        max-width: 120px;
        font-size: 12px;
        color: $warm-accent-text;
        text-align: center;
    }

    .pending-text {
        font-size: 12px;
        color: $warm-ink-4;
    }

    // 回复框：头像更小，其余一致
    &.reply {
        gap: 12px;
    }
}

@keyframes post-bar-spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
