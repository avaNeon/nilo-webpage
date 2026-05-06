import axios, { type AxiosProgressEvent, type ResponseType } from 'axios'
import { ElLoading } from 'element-plus'
import message from '@/shared/lib/message'
import Cookies from 'js-cookie'
import { useLoginStateStore } from "@/shared/store/LoginStateStore"
import { ServiceType } from '@/shared/model/ServiceType'
import { ServicePrefixMap } from '@/shared/config/Api'
import type { BaseResponse } from '@/shared/model/BaseResponse'

const contentTypeForm = 'application/x-www-form-urlencoded;charset=UTF-8'
const contentTypeJson = 'application/json'

let loading: {
    close: () => void,
} | null = null;


// 默认使用 axios.create 基础配置，不设置固定 baseURL
const instance = axios.create({
    withCredentials: true,
    timeout: 10 * 1000,
});

//请求前拦截器
instance.interceptors.request.use(
    (config) => {
        if (config.showLoading) {
            loading = ElLoading.service({
                lock: true,
                text: '加载中......',
                background: 'rgba(0, 0, 0, 0.7)',
            });
        }
        return config;
    },
    (error) => {
        if (error.config.showLoading && loading) {
            loading.close();
        }
        message.error("请求发送失败");
        return Promise.reject("请求发送失败");
    }
);
//请求后拦截器
instance.interceptors.response.use(
    (response) => {
        const { showLoading, errorCallback, showError = true, responseType } = response.config;
        if (showLoading && loading) {
            loading.close()
        }
        const responseData = response.data;
        if (responseType == "arraybuffer" || responseType == "blob" || responseType == "text") {
            return responseData;
        }
        //正常请求
        if (responseData.code == 200) {
            return responseData;
        }
        else if (responseData.code == 1005) {
            const loginStore = useLoginStateStore();
            //登录超时
            loginStore.setLoginState(false);
            return Promise.reject({ showError: false });
        }
        else {
            //其他错误
            if (errorCallback) {
                errorCallback(responseData);
            }
            return Promise.reject({ showError: showError, msg: responseData.info });
        }
    },
    (error) => {
        if (error.config.showLoading && loading) {
            loading.close();
        }
        return Promise.reject({ showError: true, msg: "网络异常" })
    }
);

interface RequestConfig {
    /** 请求方法 */
    method: "get" | "post" | "put" | "delete",
    /** 请求路径（不含服务前缀） */
    url: string,
    /** URL 查询参数，对应后端 @RequestParam */
    params?: Record<string, any>,
    /** 请求体，对应后端 @RequestBody */
    data?: Record<string, any>,
    /** 请求体格式：'json' | 'form'，默认 'json' */
    dataType?: string,
    /** 是否显示全屏加载动画，默认 false */
    showLoading?: boolean,
    /** 响应类型，默认 'json' */
    responseType?: ResponseType,
    /** 是否自动弹出错误消息，默认 true */
    showError?: boolean,
    /** 上传进度回调 */
    uploadProgressCallback?: (event: AxiosProgressEvent) => void,
    /** 业务错误回调，响应 code 非 200 且非 1005 时触发 */
    errorCallback?: (data: any) => void,
    /** 目标服务类型，默认 ServiceType.web */
    serviceType?: ServiceType,
}

/**
 * 发起 HTTP 请求
 * @param config 请求配置
 */
const request = (config: RequestConfig): Promise<BaseResponse> => {
    const {
        method,
        url,
        params = {},
        data = {},
        dataType = 'json',
        showLoading = false,
        responseType = 'json',
        showError = true,
        uploadProgressCallback,
        errorCallback,
        serviceType = ServiceType.web // 默认 web 服务
    } = config;

    const token = Cookies.get('token_normal');
    let headers: Record<string, string> = {
        'X-Requested-With': 'XMLHttpRequest',
        'token': token || ''
    };


    // 拼接二级前缀，兼容 Vite 代理
    const prefix = `${import.meta.env.VITE_APP_BASE_URL}` + ServicePrefixMap[serviceType] || '';
    const realUrl = prefix + url;

    if (method.toLowerCase() === 'get') {
        return instance.get(realUrl, {
            params,
            headers,
            responseType,
            errorCallback,
            showLoading,
            showError,
        }).catch(error => {
            if (error.showError) {
                message.error(error.msg);
            }
            return null;
        }) as any;
    }
    else if (method.toLowerCase() === 'post' || method.toLowerCase() === 'put') {
        let bodyData: any = data;
        if (dataType === 'json') {
            headers['Content-Type'] = contentTypeJson;
        }
        else if (dataType === 'form') {
            // If payload contains File/Blob, use FormData (multipart/form-data)
            // otherwise use application/x-www-form-urlencoded
            let hasFile = false;
            for (const key in data) {
                const val = (data as any)[key];
                if (val instanceof File || val instanceof Blob) {
                    hasFile = true;
                    break;
                }
            }
            if (hasFile) {
                // Let browser set Content-Type with boundary for multipart
                delete headers['Content-Type'];
                const formData = new FormData();
                for (let key in data) {
                    formData.append(key, data[key] == undefined ? "" : data[key]);
                }
                bodyData = formData;
            }
            else {
                headers['Content-Type'] = contentTypeForm;
                const paramsBody = new URLSearchParams();
                for (let key in data) {
                    paramsBody.append(key, data[key] == undefined ? "" : String(data[key]));
                }
                bodyData = paramsBody.toString();
            }
        }

        return instance.request({
            method: method.toLowerCase() as 'post' | 'put',
            url: realUrl,
            data: bodyData,
            params, // 这样 params 会拼到 URL 上
            onUploadProgress: uploadProgressCallback,
            responseType,
            headers,
            errorCallback,
            showLoading,
            showError,
        }).catch(error => {
            if (error.showError) {
                message.error(error.msg);
            }
            return null;
        }) as any;
    }
    else if (method.toLowerCase() === 'delete') {
        return instance.delete(realUrl, {
            params,
            headers,
            responseType,
            errorCallback,
            showLoading,
            showError,
        }).catch(error => {
            if (error.showError) {
                message.error(error.msg);
            }
            return null;
        }) as any;
    }
    else {
        return Promise.reject("不支持的请求方式");
    }
};

// 扩展Axios的接口定义，添加自定义的配置项
declare module 'axios' {
    export interface AxiosRequestConfig {
        showLoading?: boolean;
        showError?: boolean;
        dataType?: string;
        errorCallback?: (data: any) => void;
    }
}


export default request;
