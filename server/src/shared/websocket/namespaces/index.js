/**
 * 네임스페이스 통합 인덱스
 * 모든 네임스페이스 클래스들을 통합 export
 */

// 기본 베이스 클래스
export { BaseNamespace } from './baseNamespace.js';

// 개별 네임스페이스들
export { MainNamespace } from './mainNamespace.js';
export { NotificationNamespace } from './notificationNamespace.js';
export { OrderNamespace } from './orderNamespace.js';
export { ChatNamespace } from './chatNamespace.js';
export { PosNamespace } from './posNamespace.js';
export { TrackingNamespace } from './trackingNamespace.js';

// 추가 네임스페이스들
export { StoreChatNamespace } from './storeChatNamespace.js';
export { PaymentNamespace } from './paymentNamespace.js';
export { DashboardNamespace } from './dashboardNamespace.js';

/**
 * 네임스페이스 팩토리
 * 네임스페이스 타입에 따라 적절한 인스턴스 생성
 */
import { MainNamespace } from './mainNamespace.js';
import { NotificationNamespace } from './notificationNamespace.js';
import { OrderNamespace } from './orderNamespace.js';
import { ChatNamespace } from './chatNamespace.js';
import { PosNamespace } from './posNamespace.js';
import { TrackingNamespace } from './trackingNamespace.js';
import { StoreChatNamespace } from './storeChatNamespace.js';
import { PaymentNamespace } from './paymentNamespace.js';
import { DashboardNamespace } from './dashboardNamespace.js';

export class NamespaceFactory {
  static create(type, io, eventLogger, options = {}) {
    switch (type) {
      case 'main':
        return new MainNamespace(io, options);
      case 'notifications':
        return new NotificationNamespace(io, eventLogger, options);
      case 'orders':
        return new OrderNamespace(io, eventLogger, options);
      case 'chat':
        return new ChatNamespace(io, eventLogger, options);
      case 'pos':
        return new PosNamespace(io, eventLogger, options);
      case 'tracking':
        return new TrackingNamespace(io, eventLogger, options);
      case 'store-chat':
        return new StoreChatNamespace(io, eventLogger, options);
      case 'payment':
        return new PaymentNamespace(io, eventLogger, options);
      case 'dashboard':
        return new DashboardNamespace(io, eventLogger, options);
      default:
        throw new Error(`Unknown namespace type: ${type}`);
    }
  }

  /**
   * 사용 가능한 모든 네임스페이스 타입 반환
   */
  static getSupportedTypes() {
    return [
      'main',
      'notifications', 
      'orders',
      'chat',
      'pos',
      'tracking',
      'store-chat',
      'payment',
      'dashboard'
    ];
  }
}

export default NamespaceFactory;