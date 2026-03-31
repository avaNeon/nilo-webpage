// 服务类型常量和类型，推荐全局复用
export const ServiceType = {
  web: 'web',    // 7071
  admin: 'admin' // 7070
} as const;

export type ServiceType = keyof typeof ServiceType; // 'web' | 'admin'
