export interface PublicUserInfo {
    userId: string | null;
    nickName: string | null;
    avatar: string | null;
    gender: number | null; // e.g. 0 unknown, 1 male, 2 female (follow backend)
    birthday: string | null; // ISO date string e.g. "1990-01-01"
    school: string | null;
    personalIntroduction: string | null;
    status: number | null;
    noticeInfo: string | null;
    theme: number | null;
}