const db = require('../config/database');

/**
 * Push Notification Service
 * Handles sending push notifications to mobile devices
 *
 * Note: This is a basic implementation. In production, you would integrate with:
 * - Firebase Cloud Messaging (FCM) for Android
 * - Apple Push Notification Service (APNS) for iOS
 * - OneSignal, Pusher, or similar service for cross-platform
 */

/**
 * Send push notification to user's registered devices
 * @param {string} userId - User ID to send notification to
 * @param {object} notification - Notification data
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {object} notification.data - Additional data to send with notification
 */
async function sendPushNotification(userId, notification) {
  try {
    // Get active device tokens for user
    const result = await db.query(`
      SELECT device_token, device_type
      FROM push_notification_tokens
      WHERE user_id = $1 AND is_active = true
    `, [userId]);

    const devices = result.rows;

    if (devices.length === 0) {
      console.log(`No active devices found for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    console.log(`📱 Sending push notification to ${devices.length} device(s) for user ${userId}`);
    console.log(`   Title: ${notification.title}`);
    console.log(`   Body: ${notification.body}`);

    // TODO: Implement actual push notification sending
    // For now, we'll just log that notifications would be sent
    // In production, integrate with FCM/APNS:

    /*
    const admin = require('firebase-admin');

    for (const device of devices) {
      try {
        await admin.messaging().send({
          token: device.device_token,
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: notification.data || {},
          android: {
            priority: 'high',
          },
          apns: {
            headers: {
              'apns-priority': '10',
            },
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
        });
        console.log(`✅ Sent to ${device.device_type} device`);
      } catch (error) {
        console.error(`❌ Failed to send to device:`, error.message);
      }
    }
    */

    return { sent: devices.length, failed: 0 };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { sent: 0, failed: 1, error: error.message };
  }
}

/**
 * Send notification to multiple users
 */
async function sendBulkPushNotifications(userIds, notification) {
  const results = { sent: 0, failed: 0 };

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, notification);
    results.sent += result.sent;
    results.failed += result.failed;
  }

  return results;
}

/**
 * Send shift assignment notification
 */
async function sendShiftAssignmentNotification(userId, shiftData) {
  const notification = {
    title: 'New Shift Assignment',
    body: `You've been assigned to ${shiftData.jobTitle} on ${shiftData.startTime}`,
    data: {
      type: 'shift_assignment',
      assignmentId: shiftData.assignmentId,
      jobId: shiftData.jobId,
      startTime: shiftData.startTime,
      role: shiftData.role,
    },
  };

  return await sendPushNotification(userId, notification);
}

/**
 * Send shift reminder notification (for scheduled jobs)
 */
async function sendShiftReminderNotification(userId, shiftData) {
  const notification = {
    title: 'Upcoming Shift Reminder',
    body: `Your shift "${shiftData.jobTitle}" starts in ${shiftData.minutesUntilStart} minutes`,
    data: {
      type: 'shift_reminder',
      assignmentId: shiftData.assignmentId,
      jobId: shiftData.jobId,
      startTime: shiftData.startTime,
    },
  };

  return await sendPushNotification(userId, notification);
}

module.exports = {
  sendPushNotification,
  sendBulkPushNotifications,
  sendShiftAssignmentNotification,
  sendShiftReminderNotification,
};
