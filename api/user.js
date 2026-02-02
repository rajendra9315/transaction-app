import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });

  const token = auth.replace("Bearer ", "");

  const { data: { user }, error } =
    await supabase.auth.getUser(token);

  if (error || !user)
    return res.status(401).json({ error: "Invalid user" });

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json(error);
    return res.json(data);
  }

  if (req.method === "POST") {
    const { amount, type, note } = req.body;

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      amount,
      type,
      note
    });

    if (error) return res.status(400).json(error);
    return res.json({ success: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}
