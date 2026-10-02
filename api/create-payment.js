const crypto = require("crypto");

const PACKAGES = {
  "launch-day": { name: "Launch Day", days: "1 day", amount: 750 },
  "quick-start": { name: "Quick Start", days: "7 days", amount: 4725 },
  "growth-sprint": { name: "Growth Sprint", days: "10 days", amount: 6375 },
  "momentum": { name: "Momentum", days: "15 days", amount: 9000 },
  "monthly-growth": { name: "Monthly Growth", days: "30 days", amount: 15750 },
  "business-builder": { name: "Business Builder", days: "3 months", amount: 40500 }
};

function urlencode(value) {
  return encodeURIComponent(String(value).trim())
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function signature(data, passphrase) {
  const parts = [];
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && String(value) !== "") {
      parts.push(key + "=" + urlencode(value));
    }
  }
  if (passphrase) parts.push("passphrase=" + urlencode(passphrase));
  return crypto.createHash("md5").update(parts.join("&")).digest("hex");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const pkg = PACKAGES[body.packageId];
    if (!pkg) return res.status(400).json({ error: "Invalid package" });

    const mode = (process.env.PAYFAST_MODE || "sandbox").toLowerCase();
    const sandbox = mode !== "live";
    const merchantId = process.env.PAYFAST_MERCHANT_ID || (sandbox ? "10000100" : "");
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY || (sandbox ? "46f0cd694581a" : "");
    const passphrase = process.env.PAYFAST_PASSPHRASE || (sandbox ? "jt7NOE43FZPn" : "");

    if (!merchantId || !merchantKey) {
      return res.status(500).json({ error: "PayFast merchant credentials are not configured" });
    }

    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const proto = req.headers["x-forwarded-proto"] || "https";
    const baseUrl = proto + "://" + host;

    const fullName = String(body.fullName || "").trim();
    const bits = fullName.split(/\s+/).filter(Boolean);
    const firstName = bits.shift() || "Prime";
    const lastName = bits.join(" ") || "Digital";
    const orderId = "PD-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2,6).toUpperCase();

    const data = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: baseUrl + "/payment-success.html?order=" + encodeURIComponent(orderId),
      cancel_url: baseUrl + "/payment-cancelled.html?order=" + encodeURIComponent(orderId),
      notify_url: baseUrl + "/api/payfast-itn",
      name_first: firstName.slice(0,100),
      name_last: lastName.slice(0,100),
      email_address: String(body.email || "").trim().slice(0,100),
      m_payment_id: orderId,
      amount: pkg.amount.toFixed(2),
      item_name: ("Prime Digital - " + pkg.name).slice(0,100),
      item_description: (pkg.days + " Google Ads campaign management").slice(0,255),
      custom_str1: body.packageId,
      custom_str2: String(body.businessName || "").trim().slice(0,255),
      custom_str3: String(body.phone || "").trim().slice(0,255),
      custom_str4: String(body.targetArea || "").trim().slice(0,255)
    };

    data.signature = signature(data, passphrase);

    return res.status(200).json({
      orderId,
      action: sandbox ? "https://sandbox.payfast.co.za/eng/process" : "https://www.payfast.co.za/eng/process",
      fields: data
    });
  } catch (err) {
    console.error("create-payment error", err);
    return res.status(500).json({ error: "Unable to start payment" });
  }
};