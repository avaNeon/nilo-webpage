export interface BaseResponse<T = any> {
    status: string;
    code: number;
    info: string;
    data: T;
}
