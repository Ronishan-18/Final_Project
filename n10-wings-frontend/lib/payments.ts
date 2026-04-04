import api from './api';

export const createEntryCheckout = async (tournament_id: number): Promise<string> => {
  const res = await api.post('/payments/entry-checkout', { tournament_id });
  return res.data.checkout_url;
};

export const createCreationCheckout = async (tournamentData: {
  title: string;
  game: string;
  description?: string;
  rules?: string;
  prize_pool?: number;
  max_teams?: number;
  entry_fee?: number;
  entry_fee_required?: boolean;
  start_date?: string;
  end_date?: string;
  tournament_type?: string;
}): Promise<string> => {
  const res = await api.post('/payments/creation-checkout', tournamentData);
  return res.data.checkout_url;
};

export const verifyPayment = async (session_id: string) => {
  const res = await api.get(`/payments/verify?session_id=${session_id}`);
  return res.data;
};

export const getMyPayments = async () => {
  const res = await api.get('/payments/my-payments');
  return res.data.payments;
};