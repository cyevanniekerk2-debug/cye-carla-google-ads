module.exports = async function handler(req, res) {
  const mode = (process.env.PAYFAST_MODE || "sandbox").toLowerCase();
  const live = mode === "live";
  const configured = live
    ? Boolean(process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_MERCHANT_KEY)
    : true;

  res.status(200).json({
    service: "Prime Digital PayFast",
    mode: live ? "live" : "sandbox",
    configured,
    merchantIdConfigured: live ? Boolean(process.env.PAYFAST_MERCHANT_ID) : true,
    merchantKeyConfigured: live ? Boolean(process.env.PAYFAST_MERCHANT_KEY) : true,
    passphraseConfigured: live ? Boolean(process.env.PAYFAST_PASSPHRASE) : true
  });
};