import { ElMessage } from 'element-plus'

type MessageType = 'success' | 'warning' | 'info' | 'error';

/**
 * 显示消息提示
 * @param msg 提示内容
 * @param callback 消息关闭后的回调函数
 * @param type 消息类型，默认 'info'
 */
const showMessage = (msg: string, callback?: () => void, type: MessageType = 'info') => {
    ElMessage({
        type: type,
        message: msg,
        duration: 2000,
        offset: 200,
        onClose: () => {
            if (callback) {
                callback();
            }
        }
    })
}

const message = {
    /**
     * 显示提示消息
     * @param msg 提示内容
     * @param callback 消息关闭后的回调函数
     */
    info(msg: string, callback?: () => void) {
        showMessage(msg, callback, "info");
    },
    /**
     * 显示错误消息
     * @param msg 提示内容
     * @param callback 消息关闭后的回调函数
     */
    error(msg: string, callback?: () => void) {
        showMessage(msg, callback, "error");
    },
    /**
     * 显示警告消息
     * @param msg 提示内容
     * @param callback 消息关闭后的回调函数
     */
    warning(msg: string, callback?: () => void) {
        showMessage(msg, callback, "warning");
    },
    /**
     * 显示成功消息
     * @param msg 提示内容
     * @param callback 消息关闭后的回调函数
     */
    success(msg: string, callback?: () => void) {
        showMessage(msg, callback, "success");
    },
}

export default message;
