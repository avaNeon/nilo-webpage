export interface UserInfo {
    userId: string | null; // 用户ID
    nickName: string | null; // 昵称
    avatar: string | null; // 头像
    gender: number | null; // 性别
    birthday: string | null; // 生日
    school: string | null; // 学校
    personalIntroduction: string | null; // 个人简介
    status: number | null; // 状态
    noticeInfo: string | null; // 通知信息
    theme: number | null; // 主题
    followerCount: number;
    currentCoin: number;
    followingCount: number;
    expireTime: number;
    token: string;
}