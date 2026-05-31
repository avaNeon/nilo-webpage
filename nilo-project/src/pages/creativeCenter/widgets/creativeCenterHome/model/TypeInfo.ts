export interface statisticsType {
  name: string;
  value: number;
  icon: string;
}

export const TypeInfo: statisticsType[] = [
  {
    name: "关注",
    value: 1,
    icon: "iconfont icon-zhuanqu_huabanfuben",
  },
  {
    name: "播放",
    value: 2,
    icon: "iconfont icon-play2",
  },
  {
    name: "评论",
    value: 3,
    icon: "iconfont icon-Chat-1",
  },
  {
    name: "弹幕",
    value: 4,
    icon: "iconfont icon-danmu",
  },
  {
    name: "点赞",
    value: 5,
    icon: "iconfont icon-like-solid",
  },
  {
    name: "收藏",
    value: 6,
    icon: "iconfont icon-collection-solid",
  },
  {
    name: "投币",
    value: 7,
    icon: "iconfont icon-toubi untoggled",
  },
];
