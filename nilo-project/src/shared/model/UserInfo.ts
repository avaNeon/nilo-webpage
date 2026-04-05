export interface UserInfo {
    userId: string | null;
    nickName: string | null;
    avatar: string | null;
    gender: number | null;
    birthday: string | null;
    school: string | null;
    personalIntroduction: string | null;
    status: number | null;
    noticeInfo: string | null;
    theme: number | null;
    followerCount: number;
    currentCoin: number;
    followingCount: number;
    expireTime: number;
    token: string;
}
