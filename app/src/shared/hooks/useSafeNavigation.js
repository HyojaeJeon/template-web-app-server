/**
 * useSafeNavigation Hook
 * Navigation context 에러를 방지하는 안전한 navigation hook
 */
import { useNavigation } from '@react-navigation/native';

export const useSafeNavigation = () => {
  try {
    const navigation = useNavigation();
    return navigation;
  } catch (error) {
    console.warn('useSafeNavigation: Navigation context not found, returning null');
    return null;
  }
};

export default useSafeNavigation;
