import axios, { type AxiosProgressEvent, type ResponseType } from 'axios'
import { ElLoading } from 'element-plus'
import message from '../utils/useMessage'
import Cookies from 'js-cookie'
import { useLoginStateStore } from "../store/LoginStateStore"
import { ServiceType } from '../models/ServiceType'
import { ServicePrefixMap } from './api'

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
        if (responseType == "arraybuffer" || responseType == "blob") {
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
    method: "get" | "post",
    url: string,
    params?: Record<string, any>, // URL 查询参数（@RequestParam）
    data?: Record<string, any>,   // 请求体（@RequestBody）
    dataType?: string, // 'json' | 'form'，默认 'form'
    showLoading?: boolean,
    responseType?: ResponseType,
    showError?: boolean,
    uploadProgressCallback?: (event: AxiosProgressEvent) => void,
    errorCallback?: (data: any) => void,
    serviceType?: ServiceType, // 新增：指定服务类型
}

const request = (config: RequestConfig) => {
    const {
        method,
        url,
        params = {},
        data = {},
        dataType = 'form',
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
            errorCallback,
            showLoading,
            showError,
        }).catch(error => {
            if (error.showError) {
                message.error(error.msg);
            }
            return null;
        });
    } else if (method.toLowerCase() === 'post') {
        let postData: any = data;
        if (dataType === 'json') {
            headers['Content-Type'] = contentTypeJson;
        } else {
            // 默认用 FormData
            headers['Content-Type'] = contentTypeForm;
            const formData = new FormData();
            for (let key in data) {
                formData.append(key, data[key] == undefined ? "" : data[key]);
            }
            postData = formData;
        }
        return instance.post(realUrl, postData, {
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
        });
    } else {
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
