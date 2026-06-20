module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: "No token provided" });
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${secretKey}&response=${token}`,
      }
    );
    const data = await response.json();

    // v2 checkbox responses have no "score" field (that's v3 only).
    // If score is present, enforce the v3 threshold; otherwise just trust
    // Google's pass/fail "success" flag, which is what v2 returns.
    const passesScore = data.score === undefined || data.score >= 0.5;

    if (data.success && passesScore) {
      return res.status(200).json({ success: true, score: data.score ?? null });
    } else {
      return res.status(200).json({ success: false, score: data.score || 0 });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
