import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { CategoryInfo } from "@/pages/index/widgets/content/category/model/CategoryInfo";
import type { CategoryInfoQuery } from "@/pages/index/widgets/content/category/model/CategoryInfoQuery";

export const CategoryApi = {
  /**
   * 分页获取分类（结果平铺，不分层）<hr/>
   * 后端默认按 sort asc 排序
   *
   * @param query 分页查询参数
   * @returns 分类列表
   */
  async getCategories(
    query: CategoryInfoQuery,
  ): Promise<CategoryInfo[] | null> {
    const result = await request({
      method: "post",
      url: Api.categoryPage,
      data: query,
      dataType: "json",
    });
    if (!result) return null;
    return result.data as CategoryInfo[];
  },

  /**
   * 分层获取指定分类及其子分类（只能获取下面一层）<hr/>
   * 返回一个树形结构的分类列表
   *
   * @param parentIds 要获取的父级分类 ID 列表
   * @returns 指定分类及其子分类
   */
  async getCategoriesWithChildren(
    parentIds: number[],
  ): Promise<CategoryInfo[] | null> {
    const result = await request({
      method: "get",
      url: Api.categoryChildren,
      params: { parentIds },
    });
    if (!result) return null;
    return result.data as CategoryInfo[];
  },

  /**
   * 分层获取所有分类（只能获取下面一层）<hr/>
   * 返回一个树形结构的分类列表
   *
   * @returns 所有分类及其子分类
   */
  async getAllCategoriesWithChildren(): Promise<CategoryInfo[] | null> {
    const result = await request({
      method: "get",
      url: Api.categoryAll,
    });
    if (!result) return null;
    return result.data as CategoryInfo[];
  },

  /**
   * 增加或修改分类<hr/>
   * 如果要修改分类，必须指定 `categoryId`
   *
   * @param categoryInfo 分类信息
   */
  async saveCategory(categoryInfo: CategoryInfo): Promise<void> {
    const result = await request({
      method: "put",
      url: Api.categorySave,
      data: categoryInfo,
      dataType: "json",
    });
    if (!result) return;
  },

  /**
   * 删除分类
   *
   * @param id 分类 ID
   */
  async deleteCategory(id: number): Promise<void> {
    const result = await request({
      method: "delete",
      url: Api.categoryDelete,
      params: { id },
    });
    if (!result) return;
  },

  /**
   * 重新排序分类
   *
   * @param categoryIds 排序后的分类 ID 列表
   * @param parentId    所属父级分类 ID（防止输入成不同分类下的子分类）
   */
  async sortCategory(categoryIds: number[], parentId: number): Promise<void> {
    const result = await request({
      method: "post",
      url: Api.categorySort,
      params: { categoryIds, parentId },
    });
    if (!result) return;
  },
};
