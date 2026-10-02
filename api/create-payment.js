const crypto = require("crypto");

const PACKAGES = {
  "quick-boost-daily": { name: "Quick Boost", days: "Daily campaign", amount: 600 },
  "morning-boost-daily": { name: "Morning Boost", days: "Daily campaign", amount: 1000 },
  "daily-drive-daily": { name: "Daily Drive", days: "Daily campaign", amount: 1600 },
  "lead-rush-daily": { name: "Lead Rush", days: "Daily campaign", amount: 2500 },
  "prime-day-daily": { name: "Prime Day", days: "Daily campaign", amount: 4000 },
  "quick-boost-weekly": { name: "Quick Boost Weekly", days: "7-day campaign plan", amount: 3990 },
  "morning-boost-weekly": { name: "Morning Boost Weekly", days: "7-day campaign plan", amount: 6720 },
  "daily-drive-weekly": { name: "Daily Drive Weekly", days: "7-day campaign plan", amount: 10780 },
  "lead-rush-weekly": { name: "Lead Rush Weekly", days: "7-day campaign plan", amount: 16975 },
  "prime-day-weekly": { name: "Prime Day Weekly", days: "7-day campaign plan", amount: 27370 },
  "quick-boost-monthly": { name: "Quick Boost Monthly", days: "30-day campaign plan", amount: 16200 },
  "morning-boost-monthly": { name: "Morning Boost Monthly", days: "30-day campaign plan", amount: 27750 },
  "daily-drive-monthly": { name: "Daily Drive Monthly", days: "30-day campaign plan", amount: 45300 },
  "lead-rush-monthly": { name: "Lead Rush Monthly", days: "30-day campaign plan", amount: 71400 },
  "prime-day-monthly": { name: "Prime Day Monthly", days: "30-day campaign plan", amount: 115500 }
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

  if (process.env.PAYFAST_ENABLED !== "true") {
    return res.status(503).json({ error: "PayFast is temporarily disabled. Please use EFT checkout.", eftCheckoutUrl: "/eft-checkout.html" });
  }

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
