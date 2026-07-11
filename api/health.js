module.exports = (req, res) => {
  res.status(200).json({ ok: true, key: Boolean(process.env.GEMINI_API_KEY), auth: false });
};
