import api from './api';

export const sendFriendRequest = async (username: string) => {
  const res = await api.post('/friends/request', { username });
  return res.data;
};

export const respondToRequest = async (friendship_id: number, action: 'accept' | 'decline') => {
  const res = await api.post('/friends/respond', { friendship_id, action });
  return res.data;
};

export const getMyFriends = async () => {
  const res = await api.get('/friends/my-friends');
  return res.data.friends;
};

export const getPendingRequests = async () => {
  const res = await api.get('/friends/pending');
  return res.data;
};

export const removeFriend = async (friendship_id: number) => {
  const res = await api.delete(`/friends/${friendship_id}`);
  return res.data;
};

export const getFriendshipStatus = async (targetId: number) => {
  const res = await api.get(`/friends/status/${targetId}`);
  return res.data;
};

export const getConversations = async () => {
  const res = await api.get('/messages/conversations');
  return res.data.conversations;
};

export const getChatHistory = async (friendId: number) => {
  const res = await api.get(`/messages/${friendId}`);
  return res.data.messages;
};