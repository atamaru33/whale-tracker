// Orynth Whale Tracker - 超低レイテンシ通知システム
// フォローユーザーの新規プロダクトローンチを即座に検知

const API_URL = 'https://www.orynth.dev/api/notifications?limit=10';
const DEFAULT_INTERVAL = 3; // 秒
const ALARM_NAME = 'orynth-poll';

let lastNotificationId = null;
let currentInterval = DEFAULT_INTERVAL;
let isPolling = false;

// Service Worker起動時の初期化
chrome.runtime.onInstalled.addListener(() => {
  console.log('🐋 Orynth Whale Tracker installed');
  initializePolling();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('🐋 Orynth Whale Tracker started');
  initializePolling();
});

// ポーリング初期化
function initializePolling() {
  // 既存のアラームをクリア
  chrome.alarms.clear(ALARM_NAME, () => {
    // 新しいアラームを作成（3秒ごと）
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: currentInterval / 60,
      delayInMinutes: 0
    });
    console.log(`⏰ Polling initialized: ${currentInterval}s interval`);
  });

  // 即座に最初のチェックを実行
  checkNotifications();
}

// アラームイベントリスナー
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    checkNotifications();
  }
});

// 通知チェック（メインロジック）
async function checkNotifications() {
  // 既にポーリング中の場合はスキップ（競合回避）
  if (isPolling) {
    console.log('⏭️  Skipping - already polling');
    return;
  }

  isPolling = true;

  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      credentials: 'include', // auth_token cookieを含める
      headers: {
        'Accept': 'application/json'
      }
    });

    // レート制限エラー（429）のハンドリング
    if (response.status === 429) {
      handleRateLimit();
      return;
    }

    // その他のエラー
    if (!response.ok) {
      console.error(`❌ API Error: ${response.status}`);
      isPolling = false;
      return;
    }

    const data = await response.json();

    // レスポンスが配列でない場合はエラー
    if (!Array.isArray(data)) {
      console.error('❌ Invalid API response format');
      isPolling = false;
      return;
    }

    // 通知が存在する場合
    if (data.length > 0) {
      const latestNotification = data[0];
      const newNotificationId = latestNotification.id;

      // 初回の場合はIDを保存するだけ
      if (lastNotificationId === null) {
        lastNotificationId = newNotificationId;
        console.log(`📌 Initial notification ID: ${newNotificationId}`);
      }
      // 新しい通知を検知
      else if (newNotificationId !== lastNotificationId) {
        console.log(`🚨 NEW NOTIFICATION DETECTED!`);
        console.log(`   Old ID: ${lastNotificationId}`);
        console.log(`   New ID: ${newNotificationId}`);

        // 通知を表示
        showNotification(latestNotification);

        // IDを更新
        lastNotificationId = newNotificationId;

        // レート制限が緩和されていた場合、デフォルトに戻す
        if (currentInterval !== DEFAULT_INTERVAL) {
          resetInterval();
        }
      } else {
        console.log(`✅ No new notifications (ID: ${newNotificationId})`);
      }
    }

  } catch (error) {
    console.error('❌ Fetch error:', error);
  } finally {
    isPolling = false;
  }
}

// レート制限ハンドリング
function handleRateLimit() {
  currentInterval = currentInterval * 2;
  console.warn(`⚠️  Rate limited! Increasing interval to ${currentInterval}s`);

  // アラームを再作成
  chrome.alarms.clear(ALARM_NAME, () => {
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: currentInterval / 60,
      delayInMinutes: 0
    });
  });

  isPolling = false;
}

// インターバルをデフォルトに戻す
function resetInterval() {
  currentInterval = DEFAULT_INTERVAL;
  console.log(`🔄 Resetting interval to ${currentInterval}s`);

  chrome.alarms.clear(ALARM_NAME, () => {
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: currentInterval / 60,
      delayInMinutes: 0
    });
  });
}

// 通知表示
function showNotification(notification) {
  const title = '🐋 NEW LAUNCH DETECTED!';
  let message = 'A followed user launched a new product!';

  // 通知内容を解析
  if (notification.content) {
    message = notification.content;
  } else if (notification.message) {
    message = notification.message;
  }

  // Chrome通知を表示
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">🐋</text></svg>',
    title: title,
    message: message,
    priority: 2,
    requireInteraction: true // ユーザーが閉じるまで表示
  });

  // 音を再生（システム通知音）
  playNotificationSound();

  console.log('📢 Notification shown:', message);
}

// 通知音を再生
function playNotificationSound() {
  // Audio APIを使用してビープ音を生成
  try {
    // OffscreenDocument APIまたはAudio Context経由で音を再生
    // Manifest V3ではService Workerから直接AudioContextを使えないため、
    // 代替としてchrome.ttsを使用
    chrome.tts.speak('New launch', {
      rate: 10,
      pitch: 2,
      volume: 0.01 // 極小音量でビープ的な効果
    });
  } catch (error) {
    console.log('🔇 Could not play sound:', error);
  }
}

// 通知クリックイベント
chrome.notifications.onClicked.addListener((notificationId) => {
  // Orynthのページを開く
  chrome.tabs.create({
    url: 'https://www.orynth.dev/notifications'
  });
  chrome.notifications.clear(notificationId);
});

// デバッグ用：現在の状態を確認
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStatus') {
    sendResponse({
      lastNotificationId: lastNotificationId,
      currentInterval: currentInterval,
      isPolling: isPolling
    });
  }
});

console.log('🐋 Orynth Whale Tracker background service loaded');
