import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
import FirebaseMessaging
import GoogleMaps
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Initialize Firebase
    FirebaseApp.configure()

    // Initialize Google Maps (iOS 전용 API 키)
    GMSServices.provideAPIKey("AIzaSyBf5rEDE0SKWYrYXPgcoWHayqgJRo6Fgmc")

    // Firebase Messaging Delegate
    Messaging.messaging().delegate = self

    // Push Notification 권한 요청
    UNUserNotificationCenter.current().delegate = self
    let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
    UNUserNotificationCenter.current().requestAuthorization(
      options: authOptions,
      completionHandler: { granted, error in
        if granted {
          print("[AppDelegate] Push notification permission granted")
        } else if let error = error {
          print("[AppDelegate] Push notification permission error: \(error.localizedDescription)")
        }
      }
    )

    application.registerForRemoteNotifications()

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "DeliveryApp",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  // APNs 토큰 등록 성공
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    print("[AppDelegate] APNs token registered")
    Messaging.messaging().apnsToken = deviceToken
  }

  // APNs 토큰 등록 실패
  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("[AppDelegate] Failed to register for remote notifications: \(error.localizedDescription)")
  }

  // FCM 토큰 갱신
  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    print("[AppDelegate] FCM token: \(fcmToken ?? "nil")")

    // FCM 토큰을 React Native로 전달
    if let token = fcmToken {
      NotificationCenter.default.post(
        name: Notification.Name("FCMTokenRefreshed"),
        object: nil,
        userInfo: ["token": token]
      )
    }
  }

  // 포그라운드 알림 수신
  func userNotificationCenter(_ center: UNUserNotificationCenter,
                            willPresent notification: UNNotification,
                            withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    completionHandler([[.banner, .badge, .sound]])
  }

  // 알림 클릭 시
  func userNotificationCenter(_ center: UNUserNotificationCenter,
                            didReceive response: UNNotificationResponse,
                            withCompletionHandler completionHandler: @escaping () -> Void) {
    let userInfo = response.notification.request.content.userInfo
    print("[AppDelegate] Notification clicked: \(userInfo)")
    completionHandler()
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
