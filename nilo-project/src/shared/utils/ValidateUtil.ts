/**
 * 前端参数校验工具，对应后端 Jakarta Validation 注解：
 * - @NotEmpty   → notEmpty()
 * - @NotNull    → notNull()
 * - @Size       → size()
 * - @Min        → min()
 * - @Max        → max()
 * - @Min / @Max → range()
 *
 * 校验失败时抛出 Error，调用方可捕获并处理。
 */

/** @NotEmpty：校验字符串不能为空（null / undefined / 空字符串 / 纯空白） */
export function notEmpty(value: string | null | undefined, fieldName: string): void {
  if (value === null || value === undefined || value.trim() === "") {
    throw new Error(`${fieldName} 不能为空`);
  }
}

/** @NotNull：校验值不能为 null / undefined */
export function notNull<T>(value: T | null | undefined, fieldName: string): void {
  if (value === null || value === undefined) {
    throw new Error(`${fieldName} 不能为空`);
  }
}

/** @Size(min, max)：校验字符串长度是否在指定范围内 */
export function size(value: string, min: number, max: number, fieldName: string): void {
  notEmpty(value, fieldName);
  const len = value.trim().length;
  if (len < min || len > max) {
    throw new Error(`${fieldName} 长度必须在 ${min}-${max} 之间`);
  }
}

/** @Min(value)：校验数值是否大于等于指定最小值 */
export function min(value: number, minimum: number, fieldName: string): void {
  if (value < minimum) {
    throw new Error(`${fieldName} 必须大于等于 ${minimum}`);
  }
}

/** @Max(value)：校验数值是否小于等于指定最大值 */
export function max(value: number, maximum: number, fieldName: string): void {
  if (value > maximum) {
    throw new Error(`${fieldName} 必须小于等于 ${maximum}`);
  }
}

/** @Min + @Max：校验数值是否在指定闭区间内 */
export function range(value: number, minimum: number, maximum: number, fieldName: string): void {
  if (value < minimum || value > maximum) {
    throw new Error(`${fieldName} 必须在 ${minimum}-${maximum} 之间`);
  }
}

/** 校验非空数组 */
export function notEmptyArray<T>(value: T[] | null | undefined, fieldName: string): void {
  notNull(value, fieldName);
  if ((value as T[]).length === 0) {
    throw new Error(`${fieldName} 不能为空`);
  }
}
