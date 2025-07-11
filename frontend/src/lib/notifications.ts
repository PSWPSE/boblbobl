// 알림 시스템 공통 유틸리티
import { toast } from 'sonner';

/**
 * 성공 알림
 */
export const showSuccess = (message: string) => {
  toast.success(message);
};

/**
 * 오류 알림
 */
export const showError = (message: string) => {
  toast.error(message);
};

/**
 * 정보 알림
 */
export const showInfo = (message: string) => {
  toast.info(message);
};

/**
 * 경고 알림
 */
export const showWarning = (message: string) => {
  toast.warning(message);
};

/**
 * 확인 대화상자
 */
export const showConfirm = (message: string): boolean => {
  return confirm(message);
};

/**
 * API 에러 처리
 */
export const handleApiError = (error: Error | string) => {
  const message = typeof error === 'string' ? error : error.message;
  showError(message);
  console.error('API 오류:', error);
};

/**
 * 로딩 상태 관리를 위한 toast
 */
export const showLoading = (message: string = '처리 중...') => {
  return toast.loading(message);
};

/**
 * 로딩 toast 업데이트
 */
export const updateLoading = (toastId: string | number, type: 'success' | 'error', message: string) => {
  if (type === 'success') {
    toast.success(message, { id: toastId });
  } else {
    toast.error(message, { id: toastId });
  }
}; 