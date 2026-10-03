const { query } = require('../config/db');

// Helper to add a notification to the database
async function createNotification(userId, orderId, title, message, type = 'order_update') {
  try {
    if (!userId || !title || !message) return null;
    const res = await query(`
      INSERT INTO notifications (user_id, order_id, title, message, type)
      VALUES (?, ?, ?, ?, ?)
    `, [Number(userId), orderId ? Number(orderId) : null, title.trim(), message.trim(), type]);
    return res;
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
}

// GET /api/notifications - Get all notifications for logged-in user
async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const notifications = await query(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY id DESC 
      LIMIT 40
    `, [userId]);

    const unreadList = (notifications || []).filter(n => !n.is_read || n.is_read === 0 || n.is_read === '0');

    return res.json({
      success: true,
      count: (notifications || []).length,
      unreadCount: unreadList.length,
      notifications: notifications || []
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
}

// PUT /api/notifications/:id/read - Mark single notification as read
async function markNotificationAsRead(req, res) {
  try {
    const userId = req.user.id;
    const notifId = Number(req.params.id);

    await query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notifId, userId]);

    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    console.error('markNotificationAsRead error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
}

// PUT /api/notifications/read-all - Mark all notifications as read
async function markAllNotificationsAsRead(req, res) {
  try {
    const userId = req.user.id;
    await query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);

    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('markAllNotificationsAsRead error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
}

module.exports = {
  createNotification,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};
