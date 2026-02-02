export default function handler(req, res) {
  res.json({ status: "OK", env: !!process.env.SUPABASE_URL });
}
