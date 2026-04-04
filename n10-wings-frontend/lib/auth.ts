import api from './api';

export const register = async (data: {
  username: string;
  email: string;
  password: string;
  role?: string;
}) => {
  const res = await api.post('/auth/register', data);
  return res.data;
};

export const verifyEmail = async (data: {
  email: string;
  otp: string;
  pendingToken?: string;
}) => {
  const res = await api.post('/auth/verify-email', data);
  return res.data;
};

export const resendVerification = async (email: string) => {
  const res = await api.post('/auth/resend-verification', { email });
  return res.data;
};

export const login = async (data: {
  email: string;
  password: string;
}) => {
  const res = await api.post('/auth/login', data);
  return res.data;
};

export const forgotPassword = async (email: string) => {
  const res = await api.post('/auth/forgot-password', { email });
  return res.data;
};

export const verifyResetOtp = async (data: {
  email: string;
  otp: string;
}) => {
  const res = await api.post('/auth/verify-reset-otp', data);
  return res.data;
};

export const resetPassword = async (data: {
  email: string;
  otp: string;
  newPassword: string;
}) => {
  const res = await api.post('/auth/reset-password', data);
  return res.data;
};

export const logout = async () => {
  const res = await api.post('/auth/logout');
  return res.data;
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const getMyProfile = async () => {
  const res = await api.get('/profile/me');
  return res.data;
};

export const updateMyProfile = async (data: Record<string, unknown>) => {
  const res = await api.put('/profile/me', data);
  return res.data;
};

export const applyForOrganizer = async () => {
  const res = await api.post('/profile/apply-organizer');
  return res.data;
};