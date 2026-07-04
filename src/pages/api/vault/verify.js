import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    try {
        if (req.method !== "GET") {
            return res.status(405).json({
                success: false,
                error: "Method not allowed",
            });
        }

        const ip =
            req.headers["x-forwarded-for"]
                ?.toString()
                .split(",")[0]
                .trim()
            || req.socket?.remoteAddress
            || "unknown";

        // Check if this IP has successfully unlocked before
        const { data: session, error } = await supabase
            .from("vault_sessions")
            .select("*")
            .eq("ip", ip)
            .maybeSingle();

        if (error) {
            console.error("Session lookup error:", error);
            return res.status(500).json({
                valid: false,
                error: "Session verification failed",
            });
        }

        // Check if session exists and is not expired (24 hours)
        if (session) {
            const sessionAge = Date.now() - new Date(session.created_at).getTime();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (sessionAge < maxAge) {
                return res.status(200).json({ valid: true });
            } else {
                // Session expired, delete it
                await supabase
                    .from("vault_sessions")
                    .delete()
                    .eq("ip", ip);
            }
        }

        return res.status(200).json({ valid: false });
    } catch (error) {
        console.error("Session verification error:", error);
        return res.status(500).json({
            valid: false,
            error: "Internal server error",
        });
    }
}