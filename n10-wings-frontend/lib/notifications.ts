import api from './api';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  is_read: boolean;
  is_acted: boolean;
  created_at: string;
}

export const fetchNotifications = async (): Promise<{ notifications: Notification[]; unreadCount: number }> => {
  const res = await api.get('/notifications');
  return res.data;
};

export const markRead = async (id: number) => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllRead = async () => {
  await api.patch('/notifications/read-all');
};