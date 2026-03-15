import { ElMessage } from 'element-plus'

type MessageType = 'success' | 'warning' | 'info' | 'error';

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
    error(msg: string, callback?: () => void) {
        showMessage(msg, callback, "error");
    },
    warning(msg: string, callback?: () => void) {
        showMessage(msg, callback, "warning");
    },
    success(msg: string, callback?: () => void) {
        showMessage(msg, callback, "success");
    },
}

export default message;