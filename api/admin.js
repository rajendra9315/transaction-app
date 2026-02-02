import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export default async function handler(req, res) {
  // 🔐 Verify admin
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });

  const token = auth.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user || user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: "Not admin" });
  }

  // 🔹 GET requests
  if (req.method === "GET") {
    const action = req.query.action;

    // 👉 Get all users
    if (action === "users") {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,email,approved")
        .order("created_at", { ascending: false });

      if (error) return res.status(400).json(error);
      return res.json(data);
    }

    // 👉 Get all transactions
    if (action === "transactions") {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          id,
          amount,
          type,
          note,
          created_at,
          user_id,
          profiles(email)
        `)
        .order("created_at", { ascending: false });

      if (error) return res.status(400).json(error);

      const result = data.map(t => ({
        ...t,
        user_email: t.profiles?.email || ""
      }));

      return res.json(result);
    }

    return res.status(400).json({ error: "Invalid action" });
  }

  // 🔹 POST requests
  if (req.method === "POST") {
    const { action, userId, approved } = req.body;

    // 👉 Approve / block user
    if (action === "approveUser") {
      const { error } = await supabase
        .from("profiles")
        .update({ approved })
        .eq("id", userId);

      if (error) return res.status(400).json(error);
      return res.json({ success: true });
    }

    return res.status(400).json({ error: "Invalid action" });
  }

  res.status(405).json({ error: "Method not allowed" });
}

