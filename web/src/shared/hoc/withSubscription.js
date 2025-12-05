/**
 * withSubscription.js - 실시간 구독 HOC
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 */

'use client'

import { useWebSocket } from '../hooks/data/useWebSocket'

export const withSubscription = (WrappedComponent, options = {}) => {
  const { url, events = [] } = options

  const SubscriptionWrapper = (props) => {
    const { 
      isConnected, 
      sendMessage, 
      subscribe, 
      unsubscribe 
    } = useWebSocket(url)

    return (
      <WrappedComponent 
        {...props}
        isConnected={isConnected}
        sendMessage={sendMessage}
        subscribe={subscribe}
        unsubscribe={unsubscribe}
      />
    )
  }

  SubscriptionWrapper.displayName = `withSubscription(${WrappedComponent.displayName || WrappedComponent.name})`
  return SubscriptionWrapper
}

export default withSubscription