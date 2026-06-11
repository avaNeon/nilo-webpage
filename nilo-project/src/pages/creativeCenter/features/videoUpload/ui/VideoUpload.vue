<script lang="ts" setup>
import { useSystemConfigStore } from '@/shared/store/SystemConfigStore';
import { UploadFilled } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
import message from '@/shared/lib/message'

const systemConfig = useSystemConfigStore()

const props = withDefaults(defineProps<{ fold?: boolean, disabled?: boolean }>(), { fold: false, disabled: false })

const emit = defineEmits<{
    'file-selected': [file: File]
}>()

/** Supported video file extensions (mirrors backend VIDEO_SUFFIXES) */
const ALLOWED_EXTENSIONS = new Set([
    '.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv',
    '.mpeg', '.mpg', '.3gp', '.ogv', '.m4v', '.ts',
])

/** accept string for el-upload */
const ACCEPT = Array.from(ALLOWED_EXTENSIONS).join(',')

function isValidExtension(name: string): boolean
{
    const lastDot = name.lastIndexOf('.')
    if (lastDot < 0) return false
    const ext = name.substring(lastDot).toLowerCase()
    return ALLOWED_EXTENSIONS.has(ext)
}

function handleChange(uploadFile: UploadFile)
{
    if (props.disabled) return

    if (uploadFile.status === 'ready' && uploadFile.raw)
    {
        if (!isValidExtension(uploadFile.name))
        {
            message.warning(`不支持的文件格式: ${uploadFile.name}`)
            return
        }
        emit('file-selected', uploadFile.raw)
    }
}
</script>

<template>
    <div class="content">
        <el-upload v-if="fold" action="" multiple :auto-upload="false" :show-file-list="false" :accept="ACCEPT"
            :disabled="disabled"
            @change="handleChange">
            <div class="upload-handler">
                <el-button type="primary" :disabled="disabled">上传更多文件</el-button>
            </div>
        </el-upload>
        <el-upload v-else class="upload-demo" action="" drag multiple :auto-upload="false" :show-file-list="false"
            :accept="ACCEPT" :disabled="disabled" @change="handleChange">
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
                <p>
                    将视频文件拖入此处
                </p>
                <p>
                    或
                </p>
            </div>
            <div class="upload-handler">
                <el-button type="primary" :disabled="disabled">上传文件</el-button>
            </div>
            <template #tip>
                <div class="tips">
                    <div class="size-limit">
                        <el-popover placement="bottom-end" :width="300">
                            <template #reference>
                                <span class="tip-text">大小限制</span>
                            </template>
                            <p>
                                单个视频文件大小上限为<em style="
                                font-weight: 600;
                                color: #00AEEC;
                                font-style: normal;
                                ">
                                    {{ systemConfig.videoFileMaxSize }}MB
                                </em>
                            </p>
                            <p>如果视频较长建议分P上传</p>
                        </el-popover>
                    </div>
                    <div class="format-limit">
                        <el-popover placement="bottom" :width="300">
                            <template #reference>
                                <span class="tip-text">格式显示</span>
                            </template>
                            <p style="font-weight: 600;">推荐上传的格式：</p>
                            <em style="
                                font-weight: 600;
                                color: #00AEEC;
                                font-style: normal;
                                ">mp4</em>（使用此格式处理速度最快）
                            <p style="font-weight: 600;">所有支持的文件格式：</p>
                            <em style="
                                font-weight: 600;
                                font-style: normal;
                                ">mp4, webm, avi, mov, mkv, flv, wmv, mpeg, mpg, 3gp, ogv, m4v, ts</em>
                        </el-popover>
                    </div>
                    <div class="bit-rate-limit">
                        <el-popover placement="bottom-start" :width="300">
                            <template #reference>
                                <span class="tip-text">码率限制</span>
                            </template>
                            <p>
                                最大分辨率支持：<em style="
                                font-weight: 600;
                                color: #00AEEC;
                                font-style: normal;
                                ">{{ systemConfig.maxResolutionRatio }}</em>
                            </p>
                            <p>
                                最大帧数支持：<em style="
                                font-weight: 600;
                                color: #00AEEC;
                                font-style: normal;
                                ">{{ systemConfig.maxBitRate }}fps</em>
                            </p>
                        </el-popover>
                    </div>
                </div>
            </template>
        </el-upload>
    </div>
</template>

<style lang="scss" scoped>
.content {

    .upload-demo {
        padding: 25px 200px;

        .tips {
            display: flex;
            column-gap: 60px;
            justify-content: center;

            margin: 20px 0;

            .tip-text {
                cursor: help;
                color: $color-text-secondary;
                font-weight: 600;
            }
        }
    }
}
</style>
