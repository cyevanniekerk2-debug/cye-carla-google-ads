# Prime Digital PayFast deployment

The PayFast integration is committed to this repository and defaults to sandbox mode.

## Vercel environment variables for live mode

Create these variables in the Vercel project settings. Never commit their values to GitHub.

- PAYFAST_MODE = live
- PAYFAST_MERCHANT_ID = your live PayFast Merchant ID
- PAYFAST_MERCHANT_KEY = your live PayFast Merchant Key
- PAYFAST_PASSPHRASE = your PayFast security passphrase

For sandbox testing, PAYFAST_MODE may be omitted or set to sandbox. The integration uses PayFast's documented shared sandbox credentials.

## Endpoints

- /api/create-payment
- /api/payfast-itn
- /api/payfast-status
- /checkout.html
- /payment-success.html
- /payment-cancelled.html

The public status endpoint only reports whether secrets are configured. It never returns secret values.

## Before switching live

1. Deploy the repository to Vercel.
2. Test a complete sandbox checkout.
3. Confirm /api/payfast-status reports sandbox.
4. Confirm the PayFast ITN reaches /api/payfast-itn successfully.
5. Add the live environment variables in Vercel.
6. Change PAYFAST_MODE to live.
7. Redeploy.
8. Run a small real payment test before accepting customer orders.
