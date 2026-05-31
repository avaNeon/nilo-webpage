import axios, { type AxiosProgressEvent, type ResponseType } from "axios";
import { ElLoading } from "element-plus";
import message from "@/shared/lib/message";
import Cookies from "js-cookie";
import { useLoginStateStore } from "@/shared/store/LoginStateStore";
import { ServiceType } from "@/shared/model/ServiceType";
import { ServicePrefixMap } from "@/shared/config/Api";
import type { BaseResponse } from "@/shared/model/BaseResponse";

const contentTypeForm = "application/x-www-form-urlencoded;charset=UTF-8";
const contentTypeJson = "application/json";

let loading: {
  close: () => void;
} | null = null;

// 默认使用 axios.create 基础配置，不设置固定 baseURL
const instance = axios.create({
  withCredentials: true,
  timeout: 10 * 1000,
});

//请求前拦截器
instance.interceptors.request.use(
  config => {
    if (config.showLoading) {
      loading = ElLoading.service({
        lock: true,
        text: "加载中......",
        background: "rgba(0, 0, 0, 0.5)",
      });
    }
    return config;
  },
  error => {
    if (error.config.showLoading && loading) {
      loading.close();
    }

    message.error("请求发送失败");

    return Promise.reject("请求发送失败");
  },
);

//请求后拦截器
instance.interceptors.response.use(
  response => {
    const {
      showLoading,
      errorCallback,
      showError = true,
      responseType,
    } = response.config;

    if (showLoading && loading) {
      loading.close();
    }

    const responseData = response.data;

    if (
      responseType == "arraybuffer" ||
      responseType == "blob" ||
      responseType == "text"
    ) {
      return responseData;
    }

    //正常请求
    if (responseData.code == 200) {
      return responseData;
    }
    // 登录超时 / 未登录，不抛出错误提示
    else if (responseData.code == 1005) {
      const loginStore = useLoginStateStore();

      loginStore.setLoginState(false);
      return Promise.reject({ showError: false });
    }
    //其他业务异常
    else {
      if (errorCallback) {
        errorCallback(responseData);
      }
      return Promise.reject({ showError: showError, msg: responseData.info });
    }
  },
  error => {
    if (error.config.showLoading && loading) {
      loading.close();
    }
    return Promise.reject({ showError: true, msg: "网络异常" });
  },
);

interface RequestConfig {
  method: "get" | "post" | "put" | "delete";
  url: string;
  params?: Record<string, any>;
  /** 请求体 */
  data?: Record<string, any>;
  /** 请求体格式：'json' | 'form'，默认 'json' */
  dataType?: string;
  /** 是否显示全屏加载动画，默认 false */
  showLoading?: boolean;
  /** 响应类型，默认 'json' */
  responseType?: ResponseType;
  /** 是否自动弹出错误消息，默认 true */
  showError?: boolean;
  /** 上传进度回调 */
  uploadProgressCallback?: (event: AxiosProgressEvent) => void;
  /** 业务错误回调，响应 code 非 200 且非 1005 时触发 */
  errorCallback?: (data: any) => void;
  /** 目标服务类型，默认 ServiceType.web */
  serviceType?: ServiceType;
  /** 用于终止请求 */
  signal?: AbortSignal;
}

/**
 * 发起 HTTP 请求
 * @param config 请求配置
 */
const request = (config: RequestConfig): Promise<BaseResponse> => {
  // 请求参数分配给局部变量
  const {
    method,
    url,
    params = {},
    data = {},
    dataType = "json",
    showLoading = false,
    responseType = "json",
    showError = true,
    uploadProgressCallback,
    errorCallback,
    serviceType = ServiceType.web, // 默认 web 服务
    signal,
  } = config;

  // 默认在请求头中携带 token
  const token = Cookies.get("token_normal");
  const headers: Record<string, string> = {
    "X-Requested-With": "XMLHttpRequest",
    token: token || "",
  };

  // 拼接二级前缀，兼容 Vite 代理
  const prefix = `${import.meta.env.VITE_APP_BASE_URL}${ServicePrefixMap[serviceType] || ""}`;
  const completeUrl = prefix + url;

  // 构建 axios 配置（所有方法共用）
  const axiosConfig: Record<string, any> = {
    method: method.toLowerCase(),
    url: completeUrl,
    params,
    headers,
    responseType,
    errorCallback,
    showLoading,
    showError,
    signal,
  };

  // POST / PUT：序列化请求体
  if (method.toLowerCase() === "post" || method.toLowerCase() === "put") {
    // JSON
    if (dataType === "json") {
      headers["Content-Type"] = contentTypeJson;
      axiosConfig.data = data;
    }
    // FORM
    else if (dataType === "form") {
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
        delete headers["Content-Type"];
        const formData = new FormData();
        for (const key in data) {
          formData.append(key, data[key] == undefined ? "" : data[key]);
        }
        axiosConfig.data = formData;
      } else {
        headers["Content-Type"] = contentTypeForm;
        const paramsBody = new URLSearchParams();
        for (const key in data) {
          paramsBody.append(
            key,
            data[key] == undefined ? "" : String(data[key]),
          );
        }
        axiosConfig.data = paramsBody.toString();
      }
    }
    axiosConfig.onUploadProgress = uploadProgressCallback;
  }

  return instance.request(axiosConfig).catch((error: any) => {
    // 如果展示错误信息，则弹出一条后端返回的错误消息
    if (error.showError) {
      message.error(error.msg);
    }
    // 如果失败，返回null
    return null;
  }) as any;
};

// 扩展Axios的接口定义，添加自定义的配置项
declare module "axios" {
  export interface AxiosRequestConfig {
    showLoading?: boolean;
    showError?: boolean;
    dataType?: string;
    errorCallback?: (data: any) => void;
  }
}

export default request;
