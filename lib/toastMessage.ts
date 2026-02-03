import Toast from "react-native-toast-message";

type ToastConfig = {
  visibilityTime?: number;
  position?: 'top' | 'bottom';
  topOffset?: number;
  bottomOffset?: number;
};

const defaultConfig: ToastConfig = {
  visibilityTime: 4000,
  position: 'top',
  topOffset: 60,
  bottomOffset: 40,
};

export const showError = (title: string, message: string): void => {
  Toast.show({
    type: 'error',
    text1: title || getErrorTitle(message),
    text2: message,
    ...defaultConfig,
    props: {
      onHide: () => Toast.hide(),
    },
  });
};

export const showSuccess = (title: string, message: string,): void => {
  Toast.show({
    type: 'success',
    text1: title || getSuccessTitle(message),
    text2: message,
    ...defaultConfig,
    props: {
      onHide: () => Toast.hide(),
    },
  });
};

export const showInfo = (title: string, message: string): void => {
  Toast.show({
    type: 'info',
    text1: title || getInfoTitle(message),
    text2: message,
    ...defaultConfig,
    props: {
      onHide: () => Toast.hide(),
    },
  });
};

// Helper functions to generate contextual titles
const getErrorTitle = (message: string): string => {
  if (message.toLowerCase().includes('network')) return 'Network Error';
  if (message.toLowerCase().includes('validation')) return 'Validation Failed';
  if (message.toLowerCase().includes('unauthorized')) return 'Authentication Required';
  if (message.toLowerCase().includes('permission')) return 'Access Denied';
  if (message.toLowerCase().includes('not found')) return 'Not Found';
  if (message.toLowerCase().includes('duplicate')) return 'Already Exists';
  if (message.toLowerCase().includes('invalid')) return 'Invalid Input';
  return 'Operation Failed';
};

const getSuccessTitle = (message: string): string => {
  if (message.toLowerCase().includes('create')) return 'Successfully Created';
  if (message.toLowerCase().includes('update')) return 'Successfully Updated';
  if (message.toLowerCase().includes('delete')) return 'Successfully Deleted';
  if (message.toLowerCase().includes('upload')) return 'Upload Complete';
  if (message.toLowerCase().includes('download')) return 'Download Complete';
  if (message.toLowerCase().includes('save')) return 'Changes Saved';
  if (message.toLowerCase().includes('login')) return 'Welcome Back';
  return 'Operation Successful';
};

const getInfoTitle = (message: string): string => {
  if (message.toLowerCase().includes('update')) return 'Update Available';
  if (message.toLowerCase().includes('sync')) return 'Syncing Data';
  if (message.toLowerCase().includes('process')) return 'In Progress';
  if (message.toLowerCase().includes('wait')) return 'Please Wait';
  if (message.toLowerCase().includes('tip')) return 'Helpful Tip';
  if (message.toLowerCase().includes('notice')) return 'Important Notice';
  return 'Just So You Know';
};