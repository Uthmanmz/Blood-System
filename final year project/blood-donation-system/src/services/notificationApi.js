import {
  apiGet,
  apiPost,
} from './api';


export function getNotificationRecipients() {
  return apiGet(
    '/notifications/recipients.php'
  );
}


export function getMyNotifications() {
  return apiGet(
    '/notifications/my-notifications.php'
  );
}


export function sendNotification(data) {
  return apiPost(
    '/notifications/send.php',
    data
  );
}


export function markNotificationRead(
  notificationId
) {
  return apiPost(
    '/notifications/mark-read.php',
    {
      notification_id: notificationId,
    }
  );
}


export function markAllNotificationsRead() {
  return apiPost(
    '/notifications/mark-all-read.php',
    {}
  );
}