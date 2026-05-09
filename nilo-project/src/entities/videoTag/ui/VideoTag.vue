<script lang="ts" setup>
import { ref } from 'vue';

interface Props
{
    tags?: string[]
}

const props = withDefaults(defineProps<Props>(), {

})
const emit = defineEmits<{
    (e: 'update:tags', tags: string[]): void,
}>()

const MAX_TAG_NUMBER = 10

const tagList = ref()

</script>

<template>
    <div class="content">
        <el-input-tag v-model="tagList" tag-type="primary" tag-effect="plain" :max="MAX_TAG_NUMBER"
            :placeholder="`请使用回车进行分隔，最多添加${MAX_TAG_NUMBER}个标签`" maxlength="29" @blur="emit('update:tags', tagList)">
            <template #tag="{ value }">
                <div class="flex items-center">
                    <span>{{ value }}</span>
                </div>
            </template>
        </el-input-tag>
    </div>
</template>

<style lang="scss" scoped>
.content {
    display: flex;
    flex: 1;
}
</style>