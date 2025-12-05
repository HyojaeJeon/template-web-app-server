/**
 * StyledLinearGradient - NativeWind와 호환되는 LinearGradient 컴포넌트
 * cssInterop를 사용하여 className을 style prop으로 매핑
 */
import LinearGradient from 'react-native-linear-gradient';
import { cssInterop } from 'nativewind';

// LinearGradient를 NativeWind와 호환되도록 설정
const StyledLinearGradient = cssInterop(LinearGradient, {
  className: {
    target: 'style',
    // LinearGradient에서 사용하는 스타일 속성들 매핑
    nativeStyleToProp: {
      // 크기 관련
      height: true,
      width: true,
      flex: true,
      // 위치 관련
      position: true,
      top: true,
      left: true,
      right: true,
      bottom: true,
      // 정렬 관련
      alignItems: true,
      justifyContent: true,
      flexDirection: true,
      // 패딩/마진
      padding: true,
      paddingTop: true,
      paddingBottom: true,
      paddingLeft: true,
      paddingRight: true,
      margin: true,
      marginTop: true,
      marginBottom: true,
      marginLeft: true,
      marginRight: true,
      // 기타
      overflow: true,
      borderRadius: true}}});

export default StyledLinearGradient;
