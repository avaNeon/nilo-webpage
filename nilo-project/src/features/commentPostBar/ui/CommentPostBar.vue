<script lang="ts" setup>
import Avatar from '@/entities/avatar/ui/Avatar.vue';
import { useLoginStateStore } from '@/shared/store/LoginStateStore';
import { useSystemConfigStore } from '@/shared/store/SystemConfigStore';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import imageIconSrc from '@/assets/icon/img/image.svg';
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
const AVATAR_WIDTH = 64
const MAX_COMMENT_LENGTH = 1000
const PREVIEW_IMAGE_WIDTH = 200
/**
 * per video comment
 */
const MAX_IMAGE_UPLOAD_COUNT = 3

const userCommentText = ref('')

const route = useRoute()


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
    onFilesSelected,
    removeItem,
} = useFileUpload({
    accept: 'image/*',
    maxSize: imageMaxSize.value,
    autoUpload: true,
    uploadFn: (file: File, onProgress?: (event: AxiosProgressEvent) => void) =>
        imageApi.uploadImage(file, true, onProgress),
})

// ========== Emoji 选择 ==========
const emojiPanelVisible = ref(false)
const emojiContainerRef = ref<HTMLElement | null>(null)

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
onUnmounted(() => document.removeEventListener('click', onDocumentClick))

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
    const textarea = document.querySelector('.comment-post-bar .textarea textarea') as HTMLTextAreaElement | null
    if (textarea)
    {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = userCommentText.value
        userCommentText.value = text.slice(0, start) + emoji + text.slice(end)
        nextTick(() =>
        {
            textarea.selectionStart = textarea.selectionEnd = start + emoji.length
            textarea.focus()
        })
    } else
    {
        userCommentText.value += emoji
    }
}

function selectImage()
{
    if (uploadItems.value.length > MAX_IMAGE_UPLOAD_COUNT)
    {
        message.warning(`每条评论最多只能上传 ${MAX_IMAGE_UPLOAD_COUNT} 张图片`)
    } else
    {
        selectFile()
    }
}

async function postComment()
{
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
    }
    const content = userCommentText.value;
    const imgPaths = uploadItems.value ? uploadItems.value.map(item => item.relativePath).filter(Boolean).join(",") : '';
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
            currentUserAction: null,
        })
        userCommentText.value = ''
        uploadItems.value = []
    }
}
</script>

<template>
    <div class="comment-post-bar">
        <Avatar class="user-avatar" :user-id="loginStateStore.userInfo?.userId ?? null"
            :src="imgRequestUrl(loginStateStore.userInfo?.avatar ?? '')" :width="AVATAR_WIDTH" :lazy="true"
            :user-panel="false" :mobile="false" />
        <div class="comment-section">
            <el-input class="textarea" v-model="userCommentText" :maxlength="MAX_COMMENT_LENGTH"
                :placeholder="available ? props.placeholder : '评论区已关闭'" show-word-limit type="textarea" :rows="3"
                :disabled="!available" />
            <div class="tool-bar">
                <div class="tool" v-if="available">
                    <!-- 点击图片图标 → 打开文件选择器 -->
                    <div class="image" @click="selectImage">
                        <img class="image-icon" :src="imageIconSrc" alt="选择图片">
                    </div>
                    <!-- 表情选择 -->
                    <div class="emoji-wrapper" ref="emojiContainerRef">
                        <div class="emoji-btn" @click.stop="toggleEmojiPanel">
                            <span class="iconfont icon-emoji"></span>
                        </div>
                        <Transition name="emoji-fade">
                            <div v-if="emojiPanelVisible" class="emoji-panel" @click.stop>
                                <!-- 分类选项栏 -->
                                <div class="category-bar">
                                    <button class="category-scroll-btn category-scroll-left"
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
                                    <button class="category-scroll-btn category-scroll-right"
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
                <div class="submit">
                    <el-button type="primary" round @click="postComment" :disabled="!available">发布</el-button>
                </div>
            </div>

            <!-- 图片预览区 -->
            <div v-if="uploadItems.length > 0" class="preview-images">
                <div class="preview-image" v-for="item in uploadItems" :key="item.id">
                    <!-- 上传成功后显示服务器路径，否则显示本地预览 -->
                    <Cover :src="item.relativePath ? imgRequestUrl(item.relativePath, true) : item.localUrl"
                        :width="PREVIEW_IMAGE_WIDTH" fit="scale-down" :preview="!!item.relativePath" :auto-height="true"
                        :thumbnail="true" />
                    <!-- 上传中显示进度条 -->
                    <el-progress v-if="item.status === 'uploading'" :percentage="item.progress" :stroke-width="6" />
                    <!-- 上传失败显示错误信息 -->
                    <span v-else-if="item.status === 'error'" class="error-text">
                        {{ item.errorMsg }}
                    </span>
                    <!-- 删除按钮 -->
                    <el-button type="danger" :icon="Delete" circle size="small" :disabled="item.status === 'uploading'"
                        @click="removeItem(item.id)" />
                </div>
            </div>

        </div>
    </div>
</template>

<style lang="scss" scoped>
$icon-size: 24px;

.comment-post-bar {
    display: flex;
    gap: 20px;
    margin: 20px;

    .comment-section {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        row-gap: 10px;
        flex: 1;

        .textarea {
            flex: 1;
            font-size: 16px;
        }

        .tool-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .tool {
                display: flex;
                column-gap: 10px;

                .image {
                    width: calc($icon-size + 4px);
                    height: calc($icon-size + 4px);
                    transition: all 0.4s ease;

                    .image-icon {
                        width: $icon-size;
                        margin: 2px;
                    }

                    &:hover {
                        cursor: pointer;
                        background-color: $color-neutral-2;
                        border-radius: 5px;
                    }
                }

                .emoji-btn {
                    width: calc($icon-size + 4px);
                    height: calc($icon-size + 4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.4s ease;
                    font-size: $icon-size;
                    color: #8a8a8a;

                    .icon-emoji {
                        font-size: 22px;
                    }

                    &:hover {
                        cursor: pointer;
                        background-color: $color-neutral-2;
                        border-radius: 5px;
                    }
                }
            }
        }

        // ===== Emoji 选择面板 =====
        .emoji-wrapper {
            position: relative;

            .emoji-panel {
                position: absolute;
                top: calc(100% + 8px);
                left: 0;
                z-index: 1000;
                width: 380px;
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
                padding: 12px;
                box-sizing: border-box;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            .emoji-fade-enter-active,
            .emoji-fade-leave-active {
                transition: opacity 0.2s ease;
            }

            .emoji-fade-enter-from,
            .emoji-fade-leave-to {
                opacity: 0;
            }

            // ===== 分类选项栏 =====
            .category-bar {
                display: flex;
                align-items: center;
                flex-shrink: 0;
                margin-bottom: 8px;
                position: relative;
            }

            .category-scroll-btn {
                flex-shrink: 0;
                width: 24px;
                height: 32px;
                border: none;
                background: #f5f5f5;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #666;
                font-size: 18px;
                line-height: 1;
                padding: 0;
                transition: background 0.2s ease;
                z-index: 2;

                &:hover {
                    background: #e0e0e0;
                    color: #333;
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
                padding: 2px 4px;

                &::-webkit-scrollbar {
                    display: none; // Chrome/Safari
                }
            }

            .category-tab {
                display: inline-flex;
                align-items: center;
                flex-shrink: 0;
                padding: 4px 10px;
                font-size: 13px;
                border-radius: 14px;
                cursor: pointer;
                user-select: none;
                background: #f5f5f5;
                color: #666;
                transition: background 0.2s ease, color 0.2s ease;
                white-space: nowrap;

                &:hover {
                    background: #e8e8e8;
                    color: #333;
                }

                &.active {
                    background: #e6f0ff;
                    color: #1a73e8;
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
                    background: #c1c1c1;
                    border-radius: 3px;

                    &:hover {
                        background: #a0a0a0;
                    }
                }

                // Firefox 滚动条样式
                scrollbar-width: thin;
                scrollbar-color: #c1c1c1 transparent;

                .emoji-item {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    aspect-ratio: 1;
                    min-width: 0;
                    font-size: 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    user-select: none;
                    background-color: transparent;
                    transition: transform 0.1s ease;

                    &:hover {
                        background-color: #f0f0f0; // 硬编码颜色，避免 CSS 变量过渡开销
                    }

                    &:active {
                        transform: scale(0.85);
                    }
                }
            }
        }

        .preview-images {
            display: flex;
            column-gap: 10px;

            .preview-image {
                display: flex;
                flex-direction: column;
                row-gap: 10px;
                align-items: center;
            }
        }

        .error-text {
            font-size: 12px;
            color: #f56c6c;
            max-width: 200px;
            text-align: center;
        }
    }
}
</style>
