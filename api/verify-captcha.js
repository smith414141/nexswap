module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const { token } = req.body;
  if (!token) {
    return res
      .status(400)
      .json({ success: false, error: "Captcha token required" });
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.error("RECAPTCHA_SECRET_KEY environment variable is not set");
    return res
      .status(500)
      .json({ success: false, error: "Server misconfiguration" });
  }

  try {
    const verifyRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
      }
    );
    const data = await verifyRes.json();
    return res.status(200).json({ success: !!data.success });
  } catch (err) {
    console.error("reCAPTCHA verification failed:", err);
    return res.status(500).json({ success: false, error: "Verification request failed" });
  }
};
