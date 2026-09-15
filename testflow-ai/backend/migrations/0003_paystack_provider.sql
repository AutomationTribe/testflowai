-- AD-028: Paystack replaces Stripe as the payment provider (Stripe does not
-- support payouts to Nigeria-based merchants). No production data exists yet for
-- this table, so it is renamed rather than migrated in place.

ALTER TABLE processed_stripe_events RENAME TO processed_payment_events;
COMMENT ON TABLE processed_payment_events IS 'Webhook idempotency: a Paystack transaction reference is recorded before side effects run, so a redelivered event is a no-op.';
