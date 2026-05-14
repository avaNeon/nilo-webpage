export interface CategoryNodeOption {
  value: string;
  children: Array<{ value: string }>;
}

export const CategoryUtil = {
  resolveSelectionByValue(
    value: string,
    options: CategoryNodeOption[],
  ): { parentValue: string; childValue: string } | null {
    if (!value) return null;
    const parent = options.find(p => {
      if (p.value === value) return true;
      return p.children.some(c => c.value === value);
    });
    if (!parent) return null;
    const child = parent.children.find(c => c.value === value);
    return {
      parentValue: parent.value,
      childValue: child?.value ?? "",
    };
  },
};
