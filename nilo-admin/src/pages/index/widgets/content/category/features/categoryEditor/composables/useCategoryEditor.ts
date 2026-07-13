import { ref, reactive, computed, type Ref, useTemplateRef } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { CategoryInfo } from "@/pages/index/widgets/content/category/model/CategoryInfo";
import { CategoryApi } from "@/pages/index/widgets/content/category/api/CategoryApi";
import { FileApi } from "@/shared/api/FileApi";
import { imgRequestUrl } from "@/shared/utils/ImgUtil";
import message from "@/shared/lib/message";

/**
 * 分类编辑器核心逻辑
 *
 * @param pCategoryId   父级分类 ID（Ref，0 = 一级分类）
 * @param categoryId    待编辑的分类 ID（Ref，0 = 新增模式，>0 = 修改模式）
 * @param categoryTree  全量分类树
 * @param onSaved       保存成功后的回调
 */
export function useCategoryEditor(
  pCategoryId: Ref<number>,
  categoryId: Ref<number>,
  categoryTree: Ref<CategoryInfo[]>,
  onSaved: () => void,
) {
  // 表单对象
  const formRef = useTemplateRef<FormInstance>("formRef");

  /** 是否为修改模式 */
  const isEditMode = computed(() => categoryId.value > 0);

  /* ————————————表单数据—————————— */
  const form = reactive({
    categoryNumber: "",
    categoryName: "",
    pCategoryId: pCategoryId.value,
    icon: "",
    background: "",
    color: "",
  });

  /* ————————————图片上传—————————— */
  const iconFile = ref<File | null>(null);
  const backgroundFile = ref<File | null>(null);
  const iconPreview = ref("");
  const backgroundPreview = ref("");
  const submitting = ref(false);

  /* ————————————图片选择—————————— */
  function selectIcon(file: File) {
    iconFile.value = file;
    iconPreview.value = URL.createObjectURL(file);
  }

  function selectBackground(file: File) {
    backgroundFile.value = file;
    backgroundPreview.value = URL.createObjectURL(file);
  }

  /* ————————————在树中查找分类—————————— */
  function findCategoryInTree(
    tree: CategoryInfo[],
    targetId: number,
  ): CategoryInfo | null {
    for (const node of tree) {
      if (node.categoryId === targetId) return node;
      if (node.children && node.children.length > 0) {
        const found = findCategoryInTree(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  }

  /** 检查 categoryNumber 是否与树中其他分类重复（修改模式排除自身） */
  function isCategoryNumberDuplicate(number: string): boolean {
    const trimmed = number.trim();
    if (!trimmed) return false;
    const selfId = categoryId.value; // 0 = 新增

    function check(tree: CategoryInfo[]): boolean {
      for (const node of tree) {
        if (node.categoryNumber === trimmed && node.categoryId !== selfId) {
          return true;
        }
        if (node.children && node.children.length > 0) {
          if (check(node.children)) return true;
        }
      }
      return false;
    }

    return check(categoryTree.value);
  }

  /**
   * 提交按钮是否可用
   * 规则与表单校验规则相同
   * 使用 computed 自动追踪 form.categoryNumber / form.categoryName / categoryTree 依赖
   */
  const formValid = computed(() => {
    const num = form.categoryNumber.trim();
    const name = form.categoryName.trim();

    // num和name不为空
    if (!num || !name) {
      return false;
    }

    // num和name不能过长
    if (num.length > 30 || name.length > 30) {
      return false;
    }

    // num不可重复
    if (isCategoryNumberDuplicate(num)) {
      return false;
    }
    return true;
  });

  /** 表单校验规则 */
  const rules = computed<FormRules>(() => ({
    categoryNumber: [
      { required: true, message: "请输入分类编号", trigger: "blur" },
      { max: 30, message: "分类编号不能超过 30 个字符", trigger: "blur" },
      {
        validator: (_rule, value, callback) => {
          if (isCategoryNumberDuplicate(value as string)) {
            callback(new Error("分类编号已存在，请更换"));
          } else {
            callback();
          }
        },
        trigger: "change",
      },
    ],
    categoryName: [
      { required: true, message: "请输入分类名称", trigger: "blur" },
      { max: 30, message: "分类名称不能超过 30 个字符", trigger: "blur" },
    ],
  }));

  /** 打开表单前重置表单 */
  function resetForm() {
    if (isEditMode.value) {
      // 编辑模式：从树中查找分类并回填
      const target = findCategoryInTree(categoryTree.value, categoryId.value);
      if (target) {
        form.categoryNumber = target.categoryNumber ?? "";
        form.categoryName = target.categoryName ?? "";
        form.pCategoryId = target.pCategoryId ?? pCategoryId.value;
        form.icon = target.icon ?? "";
        form.background = target.background ?? "";
        form.color = target.color ?? "";
        // 回填已有图片的预览
        iconPreview.value = target.icon ? imgRequestUrl(target.icon) : "";
        backgroundPreview.value = target.background
          ? imgRequestUrl(target.background)
          : "";
      }
    } else {
      // 新增模式：清空表单
      form.categoryNumber = "";
      form.categoryName = "";
      form.pCategoryId = pCategoryId.value;
      form.icon = "";
      form.background = "";
      form.color = "";
      iconFile.value = null;
      backgroundFile.value = null;
      iconPreview.value = "";
      backgroundPreview.value = "";
    }
  }

  /* ————————————提交—————————— */
  async function submit() {
    // 通过 Element Plus 表单校验（含重复编号检查）
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) return;

    submitting.value = true;

    try {
      // 先上传图片（仅当用户重新选择了文件时才上传）
      if (iconFile.value) {
        const path = await FileApi.uploadImage(iconFile.value);
        if (path) form.icon = path;
      }
      if (backgroundFile.value) {
        const path = await FileApi.uploadImage(backgroundFile.value);
        if (path) form.background = path;
      }

      // 组装 CategoryInfo
      const categoryInfo: CategoryInfo = {
        categoryNumber: form.categoryNumber.trim(),
        categoryName: form.categoryName.trim(),
        pCategoryId: form.pCategoryId,
      };
      // 修改模式：附加 categoryId
      if (isEditMode.value) {
        categoryInfo.categoryId = categoryId.value;
      }
      if (form.icon) categoryInfo.icon = form.icon;
      if (form.background) categoryInfo.background = form.background;
      if (form.color) categoryInfo.color = form.color;

      await CategoryApi.saveCategory(categoryInfo);

      message.success(isEditMode.value ? "分类修改成功" : "分类添加成功");

      onSaved();
      resetForm();
    } catch {
      message.error(isEditMode.value ? "分类修改失败" : "分类添加失败");
    } finally {
      submitting.value = false;
    }
  }

  return {
    form,
    rules,
    formValid,
    isEditMode,
    iconFile,
    backgroundFile,
    iconPreview,
    backgroundPreview,
    submitting,
    resetForm,
    selectIcon,
    selectBackground,
    submit,
  };
}
