import type { UserHomeCountKind } from "@/shared/store/HostUserDetailStore";

export interface NavItem
{
    label: string;
    routeName: string;
    /** 标签旁显示的数量，null 表示不显示 */
    countKind: UserHomeCountKind | null;
}
