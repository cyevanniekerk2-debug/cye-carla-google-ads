const crypto = require("crypto");

const PACKAGES = {
  "launch-day": 750,
  "quick-start": 4725,
  "growth-sprint": 6375,
  "momentum": 9000,
  "monthly-growth": 15750,
  "business-builder": 40500
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

function paramString(data) {
  const parts = [];
  for (const [key, value] of Object.entries(data)) {
    if (key === "signature") break;
    if (value !== undefined && value !== null && String(value) !== "") {
      parts.push(key + "=" + urlencode(value));
    }
  }
  return parts.join("&");
}

function ipToInt(ip) {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return (((p[0]<<24)>>>0) + (p[1]<<16) + (p[2]<<8) + p[3]) >>> 0;
}
function inCidr(ip, cidr) {
  const [net, bitsStr] = cidr.split("/");
  const bits = Number(bitsStr);
  const a = ipToInt(ip), n = ipToInt(net);
  if (a === null || n === null) return false;
  const mask = bits === 0 ? 0 : (0xFFFFFFFF << (32-bits)) >>> 0;
  return (a & mask) === (n & mask);
}
function validPayfastIp(ip) {
  const ranges = ["197.97.145.144/28","41.74.179.192/27","102.216.36.0/28","102.216.36.128/28","144.126.193.139/32"];
  return ranges.some(r => inCidr(ip, r));
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const data = parseBody(req);
    const mode = (process.env.PAYFAST_MODE || "sandbox").toLowerCase();
    const sandbox = mode !== "live";
    const passphrase = process.env.PAYFAST_PASSPHRASE || (sandbox ? "payfast" : "");
    const host = sandbox ? "sandbox.payfast.co.za" : "www.payfast.co.za";

    const params = paramString(data);
    const signed = passphrase ? params + "&passphrase=" + urlencode(passphrase) : params;
    const expectedSig = crypto.createHash("md5").update(signed).digest("hex");
    const sigOk = String(data.signature || "") === expectedSig;

    const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    const ipOk = validPayfastIp(forwarded);

    const expectedAmount = PACKAGES[data.custom_str1];
    const amountOk = Number.isFinite(expectedAmount) &&
      Math.abs(Number(data.amount_gross) - expectedAmount) <= 0.01;

    const validation = await fetch("https://" + host + "/eng/query/validate", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params
    });
    const confirmation = (await validation.text()).trim() === "VALID";

    if (!(sigOk && ipOk && amountOk && confirmation)) {
      console.error("Rejected PayFast ITN", {
        orderId: data.m_payment_id, sigOk, ipOk, amountOk, confirmation, sourceIp: forwarded
      });
      return res.status(400).send("Invalid");
    }

    console.log("PAYFAST_PAYMENT_VERIFIED", {
      orderId: data.m_payment_id,
      paymentId: data.pf_payment_id,
      status: data.payment_status,
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