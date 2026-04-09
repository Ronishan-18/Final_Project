import stripe from '../config/stripe.js';
import db from '../config/db.js';
import { createNotification } from './notification.controller.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const CREATION_FEE = parseInt(process.env.STRIPE_TOURNAMENT_CREATION_FEE || '500');

const PLATFORM_COMMISSION_RATE = 0.05;

// ── CREATE CHECKOUT — TEAM ENTRY FEE ──
export const createTeamEntryCheckout = async (req, res) => {
  try {
    const { tournament_id, team_id } = req.body;
    const userId = req.user.id;

    if (!tournament_id) {
      return res.status(400).json({ success: false, message: 'Tournament ID is required!' });
    }

    const [tournaments] = await db.query(
      "SELECT * FROM tournaments WHERE id = ? AND status = 'open'",
      [tournament_id]
    );
    if (!tournaments.length) {
      return res.status(404).json({ success: false, message: 'Tournament not found or not open!' });
    }
    const tournament = tournaments[0];

    // SECURITY: amount always set server-side from DB
    const entryFeeAmount = Math.round(parseFloat(tournament.entry_fee || 0) * 100);
    if (entryFeeAmount <= 0) {
      return res.status(400).json({ success: false, message: 'This tournament has no entry fee!' });
    }

    const commissionAmount = Math.round(entryFeeAmount * PLATFORM_COMMISSION_RATE);
    const totalAmount = entryFeeAmount + commissionAmount;

    // Verify user is a team leader of the specified team
    let query = `SELECT t.* FROM teams t
                 JOIN team_members tm ON t.id = tm.team_id
                 WHERE tm.user_id = ? AND tm.role = 'leader' AND tm.status = 'approved' AND t.is_active = TRUE`;
    let params = [userId];

    if (team_id) {
      query += ` AND t.id = ?`;
      params.push(team_id);
    }

    const [leaderOf] = await db.query(query, params);
    if (!leaderOf.length) {
      return res.status(403).json({
        success: false,
        message: team_id ? 'You are not the leader of this team!' : 'Only team leaders can pay entry fees!'
      });
    }
    const team = leaderOf[0];

    // Check not already paid
    const [existingPayment] = await db.query(
      "SELECT id FROM payments WHERE user_id = ? AND tournament_id = ? AND status = 'succeeded'",
      [userId, tournament_id]
    );
    if (existingPayment.length) {
      return res.status(400).json({ success: false, message: 'Entry fee already paid for this tournament!' });
    }

    // Check not already registered
    const [existingReg] = await db.query(
      'SELECT id FROM tournament_registrations WHERE tournament_id = ? AND team_id = ?',
      [tournament_id, team.id]
    );
    if (existingReg.length) {
      return res.status(400).json({ success: false, message: 'Team already registered!' });
    }

    // Check tournament not full
    const [[{ count }]] = await db.query(
      "SELECT COUNT(*) as count FROM tournament_registrations WHERE tournament_id = ? AND status = 'approved'",
      [tournament_id]
    );
    if (count >= tournament.max_teams) {
      return res.status(400).json({ success: false, message: 'Tournament is full!' });
    }

    const [[user]] = await db.query('SELECT email, username FROM users WHERE id = ?', [userId]);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Entry fee — ${tournament.title}`,
              description: `Team: ${team.name} (${team.tag})`,
            },
            unit_amount: entryFeeAmount,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Platform fee (5%)',
              description: 'N-10 Wings platform service fee',
            },
            unit_amount: commissionAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'team_entry',
        user_id: String(userId),
        tournament_id: String(tournament_id),
        team_id: String(team.id),
        team_name: team.name,
        entry_fee_amount: String(entryFeeAmount),
        commission_amount: String(commissionAmount),
      },
      success_url: `${FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=entry`,
      cancel_url: `${FRONTEND_URL}/tournaments/${tournament_id}?payment=cancelled`,
    });

    await db.query(
      `INSERT INTO payments (user_id, tournament_id, team_id, stripe_session_id, amount, type, status, metadata)
       VALUES (?, ?, ?, ?, ?, 'team_entry', 'pending', ?)`,
      [
        userId, tournament_id, team.id, session.id, totalAmount,
        JSON.stringify({
          tournament_title: tournament.title,
          team_name: team.name,
          entry_fee: entryFeeAmount,
          commission: commissionAmount,
          total: totalAmount,
        })
      ]
    );

    res.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
      breakdown: {
        entry_fee: entryFeeAmount / 100,
        commission: commissionAmount / 100,
        total: totalAmount / 100,
      }
    });
  } catch (error) {
    console.error('Create Entry Checkout Error:', error);
    res.status(500).json({ success: false, message: 'Payment setup failed. Please try again.' });
  }
};

// ── CREATE CHECKOUT — TOURNAMENT CREATION FEE ──
export const createTournamentCreationCheckout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, game, description, rules, prize_pool, max_teams, entry_fee, start_date, end_date, tournament_type, entry_fee_required, mode, venue_address, registration_open_date, registration_close_date } = req.body;

    if (!title || !game) {
      return res.status(400).json({ success: false, message: 'Title and game are required!' });
    }

    const [[user]] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Tournament creation fee',
              description: `Create: ${title}`,
            },
            unit_amount: CREATION_FEE,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'tournament_creation',
        user_id: String(userId),
        title,
        game,
        description: description || '',
        rules: rules || '',
        prize_pool: String(prize_pool || 0),
        max_teams: String(max_teams || 16),
        entry_fee: String(entry_fee || 0),
        entry_fee_required: String(entry_fee_required || false),
        start_date: start_date || '',
        end_date: end_date || '',
        tournament_type: tournament_type || 'single elimination',
        mode: mode || 'online',
        venue_address: venue_address || '',
        registration_open_date: registration_open_date || '',
        registration_close_date: registration_close_date || '',
        organizer_id: String(userId),
      },
      success_url: `${FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=creation`,
      cancel_url: `${FRONTEND_URL}/tournaments/create?payment=cancelled`,
    });

    await db.query(
      `INSERT INTO payments (user_id, stripe_session_id, amount, type, status, metadata)
       VALUES (?, ?, ?, 'tournament_creation', 'pending', ?)`,
      [userId, session.id, CREATION_FEE, JSON.stringify({ title, game })]
    );

    res.json({ success: true, checkout_url: session.url, session_id: session.id });
  } catch (error) {
    console.error('Create Tournament Checkout Error:', error);
    res.status(500).json({ success: false, message: 'Payment setup failed. Please try again.' });
  }
};

// ── STRIPE WEBHOOK ──
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('Webhook: missing signature or secret');
    return res.status(400).json({ error: 'Missing signature' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    await handleCheckoutCompleted(event.data.object);
  }

  res.json({ received: true });
};

// ── INTERNAL: handle completed checkout ──
const handleCheckoutCompleted = async (session) => {
  const sessionId = session.id;
  const metadata = session.metadata || {};

  const [existing] = await db.query(
    "SELECT id, status FROM payments WHERE stripe_session_id = ?",
    [sessionId]
  );
  if (!existing.length) {
    console.warn(`Webhook: no payment record found for session ${sessionId}`);
    return;
  }
  if (existing[0].status === 'succeeded') {
    console.log(`Webhook: session ${sessionId} already processed, skipping`);
    return;
  }

  await db.query(
    "UPDATE payments SET status = 'succeeded', stripe_payment_intent = ? WHERE stripe_session_id = ?",
    [session.payment_intent || null, sessionId]
  );

  if (metadata.type === 'team_entry') {
    await processTeamEntryPayment(metadata, session);
  } else if (metadata.type === 'tournament_creation') {
    await processTournamentCreationPayment(metadata, session);
  }
};

// ── INTERNAL: register team after successful entry payment ──
// FIX: status is now 'approved' immediately — no organizer approval needed after payment
const processTeamEntryPayment = async (metadata, session) => {
  const { user_id, tournament_id, team_id, team_name } = metadata;

  try {
    const [[payment]] = await db.query(
      "SELECT id FROM payments WHERE stripe_session_id = ?",
      [session.id]
    );

    // Check tournament capacity
    const [[{ count }]] = await db.query(
      "SELECT COUNT(*) as count FROM tournament_registrations WHERE tournament_id = ? AND status = 'approved'",
      [tournament_id]
    );
    const [[tournament]] = await db.query('SELECT max_teams, title FROM tournaments WHERE id = ?', [tournament_id]);

    if (count >= tournament.max_teams) {
      console.warn(`Tournament ${tournament_id} is full — refund required for session ${session.id}`);
      await db.query("UPDATE payments SET status = 'refunded' WHERE id = ?", [payment.id]);
      // Notify user about refund
      await createNotification(
        parseInt(user_id),
        'tournament_registration',
        '⚠️ Tournament Full',
        `Sorry, "${tournament.title}" is now full. You will receive a refund shortly.`,
        { tournament_id: parseInt(tournament_id) }
      );
      return;
    }

    // FIX: Insert with status = 'approved' — payment confirms the spot instantly
    await db.query(
      `INSERT INTO tournament_registrations (tournament_id, user_id, team_id, team_name, status, payment_id, payment_status)
       VALUES (?, ?, ?, ?, 'approved', ?, 'paid')
       ON DUPLICATE KEY UPDATE
         status = 'approved',
         payment_id = VALUES(payment_id),
         payment_status = 'paid'`,
      [tournament_id, user_id, team_id, team_name || 'Unknown Team', payment.id]
    );

    await db.query(
      'UPDATE payments SET tournament_id = ?, team_id = ? WHERE id = ?',
      [tournament_id, team_id, payment.id]
    );

    // FIX: notification now says "You're in!" not "waiting for approval"
    await createNotification(
      parseInt(user_id),
      'tournament_registration',
      '🎮 You\'re in!',
      `Payment confirmed! Your team is now registered for "${tournament.title}". Good luck!`,
      { tournament_id: parseInt(tournament_id) }
    );

    console.log(`✅ Team ${team_id} auto-approved for tournament ${tournament_id} after payment`);
  } catch (error) {
    console.error('processTeamEntryPayment error:', error);
  }
};

// ── INTERNAL: create tournament after successful creation payment ──
const processTournamentCreationPayment = async (metadata, session) => {
  const {
    user_id, title, game, description, rules, prize_pool, max_teams,
    entry_fee, entry_fee_required, start_date, end_date, tournament_type,
    mode, venue_address, registration_open_date, registration_close_date
  } = metadata;

  try {
    const { createChallongeTournament } = await import('../config/challonge.js');

    let challongeData = null;
    try {
      challongeData = await createChallongeTournament({
        name: title,
        tournamentType: tournament_type || 'single elimination',
        startAt: start_date || null,
      });
    } catch (e) {
      console.warn('Challonge skip during creation:', e.message);
    }

    const [result] = await db.query(
      `INSERT INTO tournaments
        (organizer_id, title, game, description, rules, prize_pool, max_teams, entry_fee,
         entry_fee_required, start_date, end_date, tournament_type, status,
         challonge_id, challonge_url, creation_fee_paid, mode, venue_address, registration_open_date, registration_close_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, TRUE, ?, ?, ?, ?)`,
      [
        parseInt(user_id), title, game,
        description || null, rules || null,
        parseFloat(prize_pool) || 0,
        parseInt(max_teams) || 16,
        parseFloat(entry_fee) || 0,
        entry_fee_required === 'true' ? 1 : 0,
        start_date || null, end_date || null,
        tournament_type || 'single elimination',
        challongeData?.id || null,
        challongeData?.full_challonge_url || null,
        mode || 'online',
        venue_address || null,
        registration_open_date || null,
        registration_close_date || null,
      ]
    );

    await db.query(
      "UPDATE payments SET tournament_id = ? WHERE stripe_session_id = ?",
      [result.insertId, session.id]
    );

    await db.query(
      'UPDATE organizer_profiles SET tournaments_hosted = tournaments_hosted + 1 WHERE user_id = ?',
      [parseInt(user_id)]
    ).catch(() => {});

    await createNotification(
      parseInt(user_id),
      'tournament_registration',
      '🏆 Tournament Created!',
      `Your tournament "${title}" is now live and open for registrations.`,
      { tournament_id: result.insertId }
    );

    console.log(`✅ Tournament ${result.insertId} created for organizer ${user_id} after payment`);
  } catch (error) {
    console.error('processTournamentCreationPayment error:', error);
  }
};

// ── VERIFY PAYMENT ──
export const verifyPayment = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ success: false, message: 'Session ID required' });
    }

    const [payments] = await db.query(
      'SELECT * FROM payments WHERE stripe_session_id = ? AND user_id = ?',
      [session_id, req.user.id]
    );
    if (!payments.length) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const payment = payments[0];

    if (payment.status === 'pending') {
      try {
        const stripeSession = await stripe.checkout.sessions.retrieve(session_id);
        if (stripeSession.payment_status === 'paid') {
          await handleCheckoutCompleted(stripeSession);
          payment.status = 'succeeded';
        }
      } catch (e) {
        console.warn('Stripe session retrieval failed:', e.message);
      }
    }

    res.json({
      success: true,
      payment: {
        status: payment.status,
        type: payment.type,
        amount: payment.amount,
        tournament_id: payment.tournament_id,
        created_at: payment.created_at,
      }
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET MY PAYMENTS ──
export const getMyPayments = async (req, res) => {
  try {
    const [payments] = await db.query(
      `SELECT p.*, t.title as tournament_title FROM payments p
       LEFT JOIN tournaments t ON p.tournament_id = t.id
       WHERE p.user_id = ? ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};