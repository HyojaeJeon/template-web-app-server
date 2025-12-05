import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function isReady() {
  return navigationRef?.current && navigationRef.current.isReady();
}

export function navigate(name, params) {
  if (isReady()) {
    navigationRef.current?.navigate(name, params);
  }
}

export function reset(config) {
  if (isReady()) {
    navigationRef.current?.reset(config);
  }
}

export function getCurrentRoute() {
  if (isReady()) {
    return navigationRef.current?.getCurrentRoute();
  }
  return null;
}

export function goBack() {
  if (isReady()) {
    navigationRef.current?.goBack();
  }
}
