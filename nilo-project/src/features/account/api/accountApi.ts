import request from '@/shared/lib/request'
import { Api } from '@/shared/config/Api'

/**
 * 登录
 * @param data 请求体
 * @param errorCallback 请求失败回调函数 
 * @returns 
 */
export function login(data: any, errorCallback?: () => void) {
    return request({
        method: 'post',
        url: Api.login,
        data,
        dataType: 'json',
        errorCallback
    })
}

/**
 * 注册
 * @param data 请求体
 * @param errorCallback 请求失败回调函数
 * @returns 
 */
export function register(data: any, errorCallback?: () => void) {
    return request({
        method: 'post',
        url: Api.register,
        data,
        dataType: 'json',
        errorCallback
    })
}
