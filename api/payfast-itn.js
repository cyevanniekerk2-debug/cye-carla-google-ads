const crypto = require("crypto");
const dns = require("dns").promises;

const PACKAGES = {
  "quick-boost-daily": 600,
  "morning-boost-daily": 1000,
  "daily-drive-daily": 1600,
  "lead-rush-daily": 2500,
  "prime-day-daily": 4000,
  "quick-boost-weekly": 3990,
  "morning-boost-weekly": 6720,
  "daily-drive-weekly": 10780,
  "lead-rush-weekly": 16975,
  "prime-day-weekly": 27370,
  "quick-boost-monthly": 16200,
  "morning-boost-monthly": 27750,
  "daily-drive-monthly": 45300,
  "lead-rush-monthly": 71400,
  "prime-day-monthly": 115500
};

function urlencode(value) {
  return encodeURIComponent(String(value).trim())
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return Object.fromEntries(new URLSearchParams(req.body));
  return {};
}

const ITN_FIELDS = [
  "m_payment_id",
  "pf_payment_id",
  "payment_status",
  "item_name",
  "item_description",
  "amount_gross",
  "amount_fee",
  "amount_net",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "name_first",
  "name_last",
  "email_address",
  "merchant_id"
];

function parameterString(data) {
  return ITN_FIELDS
    .filter(key => data[key] !== undefined && data[key] !== null && String(data[key]) !== "")
    .map(key => key + "=" + urlencode(data[key]))
    .join("&");
}

function normalizeIp(ip) {
  return String(ip || "").replace(/^::ffff:/, "").trim();
}

async function validPayfastSource(req, sandbox) {
  const forwarded = normalizeIp(String(req.headers["x-forwarded-for"] || "").split(",")[0]);
  if (!forwarded) return false;

  const hosts = sandbox
    ? ["sandbox.payfast.co.za"]
    : ["www.payfast.co.za", "w1w.payfast.co.za", "w2w.payfast.co.za"];

  const allowed = new Set();
  for (const host of hosts) {
    try {
      const addresses = await dns.lookup(host, { all: true });
      addresses.forEach(a => allowed.add(normalizeIp(a.address)));
    } catch (_) {}
  }
  return allowed.has(forwarded);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const data = parseBody(req);
    const mode = (process.env.PAYFAST_MODE || "sandbox").toLowerCase();
    const sandbox = mode !== "live";
    const passphrase = process.env.PAYFAST_PASSPHRASE || (sandbox ? "payfast" : "");
    const payfastHost = sandbox ? "sandbox.payfast.co.za" : "www.payfast.co.za";

    const params = parameterString(data);
    const signed = passphrase ? params + "&passphrase=" + urlencode(passphrase) : params;
    const expectedSig = crypto.createHash("md5").update(signed).digest("hex");
    const sigOk = String(data.signature || "").toLowerCase() === expectedSig.toLowerCase();

    const sourceOk = sandbox ? true : await validPayfastSource(req, sandbox);

    const expectedAmount = PACKAGES[data.custom_str1];
    const amountOk = Number.isFinite(expectedAmount) &&
      Number.isFinite(Number(data.amount_gross)) &&
      Math.abs(Number(data.amount_gross) - expectedAmount) <= 0.01;

    const validation = await fetch("https://" + payfastHost + "/eng/query/validate", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params
    });
    const confirmation = (await validation.text()).trim() === "VALID";

    const completed = String(data.payment_status || "").toUpperCase() === "COMPLETE";

    if (!(sigOk && sourceOk && amountOk && confirmation && completed)) {
      console.error("PAYFAST_ITN_DEBUG " + JSON.stringify({
        orderId: data.m_payment_id || null,
        sigOk,
        sourceOk,
        amountOk,
        confirmation,
        completed,
        paymentStatus: data.payment_status || null,
        packageId: data.custom_str1 || null,
        amountGross: data.amount_gross || null
      }));
      return res.status(400).send("Invalid");
    }

    console.log("PAYFAST_PAYMENT_VERIFIED", {
      orderId: data.m_payment_id,
      paymentId: data.pf_payment_id,
      packageId: data.custom_str1,
      businessName: data.custom_str2,
      phone: data.custom_str3,
      targetArea: data.custom_str4,
      email: data.email_address,
      amountGross: data.amount_gross
    });

    return res.status(200).send("OK");
  } catch (err) {
    console.error("PayFast ITN error", err);
    return res.status(500).send("Error");
  }
};