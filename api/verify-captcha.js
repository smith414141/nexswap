const crypto = require("crypto");

// Base32 decode (reverse of the encode in generate-2fa-secret.js)
function base32Decode(base32) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of base32.toUpperCase().replace(/=+$/, "")) {
    const val = alphabet.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

// Standard TOTP (RFC 6238): HMAC-SHA1 over a 30-second time counter,
// truncated to a 6-digit code. This is exactly what Google Authenticator,
// Authy, and similar apps compute on their end.
function generateTOTP(
  secretBase32,
  timeStep = 30,
  digits = 6,
  counterOffset = 0
) {
  const key = base32Decode(secretBase32);
  const counter = Math.floor(Date.now() / 1000 / timeStep) + counterOffset;

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (binary % 10 ** digits).toString().padStart(digits, "0");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const { secret, code } = req.body;
  if (!secret || !code) {
    return res
      .status(400)
      .json({ success: false, error: "Secret and code required" });
  }

  // Check current window plus one step before/after, so a code typed right
  // at a 30-second boundary still works (standard TOTP tolerance).
  const isValid = [-1, 0, 1].some(
    (offset) => generateTOTP(secret, 30, 6, offset) === String(code).trim()
  );

  return res.status(200).json({ success: isValid });
};
