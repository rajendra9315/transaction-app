import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  const { data: user } = await supabase.auth.getUser(token);
  if (!user?.user) return res.status(401).json({ error: "Invalid user" });

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.user.id);

    if (error) return res.status(400).json(error);
    return res.json(data);
  }

  if (req.method === "POST") {
    const { amount, type, note } = req.body;
    const { error } = await supabase.from("transactions").insert({
      user_id: user.user.id,
      amount,
      type,
      note
    });
    if (error) return res.status(400).json(error);
    return res.json({ ok: true });
  }
}

