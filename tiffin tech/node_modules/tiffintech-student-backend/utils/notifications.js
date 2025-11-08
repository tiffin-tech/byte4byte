import Notification from '../models/Notification.js';

// Create notification helper
const createNotification = async (studentId, type, category, title, message, metadata = {}) => {
  try {
    const notification = new Notification({
      studentId,
      type,
      category,
      title,
      message,
      metadata,
      actionUrl: getActionUrl(type, metadata)
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get appropriate action URL based on notification type
const getActionUrl = (type, metadata) => {
  switch (type) {
    case 'order':
      return `/orders/${metadata.orderId}`;
    case 'subscription':
      return `/subscriptions/${metadata.subscriptionId}`;
    case 'message':
      return `/messages/threads/${metadata.vendorId}`;
    case 'holiday':
      return '/holidays';
    default:
      return '/notifications';
  }
};

// Bulk create notifications
const createBulkNotifications = async (notificationsData) => {
  try {
    const notifications = await Notification.insertMany(notificationsData);
    return notifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

// Mark notifications as delivered for specific channels
const markAsDelivered = async (notificationId, channel) => {
  try {
    await Notification.findByIdAndUpdate(notificationId, {
      $addToSet: { deliveredChannels: channel },
      status: 'delivered'
    });
  } catch (error) {
    console.error('Error marking notification as delivered:', error);
    throw error;
  }
};

export {
  createNotification,
  createBulkNotifications,
  markAsDelivered,
  getActionUrl
};