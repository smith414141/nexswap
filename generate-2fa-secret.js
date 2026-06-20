const crypto = require("crypto");

// Base32 encode (RFC 4648), needed because TOTP secrets are shared with
// authenticator apps as base32 text, not raw bytes.
function base32Encode(buffer) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");
  let output = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    output += alphabet[parseInt(bits.substring(i, i + 5), 2)];
  }
  return output;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: "Email required" });
  }

  // 20 random bytes = 160-bit secret, standard for TOTP
  const secretBuffer = crypto.randomBytes(20);
  const secretBase32 = base32Encode(secretBuffer);

  const issuer = "Kripex";
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(
    issuer
  )}:${encodeURIComponent(
    email
  )}?secret=${secretBase32}&issuer=${encodeURIComponent(
    issuer
  )}&algorithm=SHA1&digits=6&period=30`;

  // Secret is returned once here so it can be saved to Firestore by the
  // client and shown in the QR code. It is never logged.
  return res.status(200).json({
    success: true,
    secret: secretBase32,
    otpauthUrl,
  });
};
