import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method !== "POST") {
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

        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                error: "Password required",
            });
        }

        const {
            data: existing,
            error: fetchError,
        } = await supabase
            .from("vault_attempts")
            .select("*")
            .eq("ip", ip)
            .maybeSingle();

        if (fetchError) {
            console.error("Fetch error:", fetchError);
            return res.status(500).json({
                success: false,
                error: "Database lookup failed",
            });
        }

        // CHECK IF LOCKED
        if (
            existing?.locked_until &&
            new Date(existing.locked_until) > new Date()
        ) {
            return res.status(429).json({
                success: false,
                locked: true,
                lockedUntil: existing.locked_until,
            });
        }

        // CORRECT PASSWORD
        if (password === process.env.VAULT_PASSWORD) {
            // Clear attempts
            if (existing) {
                await supabase
                    .from("vault_attempts")
                    .delete()
                    .eq("ip", ip);
            }

            // Create or update session
            const { error: sessionError } = await supabase
                .from("vault_sessions")
                .upsert({
                    ip,
                    created_at: new Date().toISOString(),
                }, {
                    onConflict: 'ip'
                });

            if (sessionError) {
                console.error("Session creation error:", sessionError);
                // Still return success even if session creation fails
            }

            return res.status(200).json({
                success: true,
            });
        }

        // FAILED ATTEMPT
        const attempts = (existing?.attempts || 0) + 1;

        // LOCK AFTER 4 FAILURES
        if (attempts >= 4) {
            const lockedUntil = new Date(
                Date.now() + (3 * 60 * 60 * 1000) // 3 hours
            );

            const { error: lockError } = await supabase
                .from("vault_attempts")
                .upsert({
                    ip,
                    attempts,
                    locked_until: lockedUntil.toISOString(),
                }, {
                    onConflict: 'ip'
                });

            if (lockError) {
                console.error("Lock error:", lockError);
                return res.status(500).json({
                    success: false,
                    error: "Failed to save lock",
                });
            }

            return res.status(429).json({
                success: false,
                locked: true,
                lockedUntil: lockedUntil.toISOString(),
            });
        }

        // SAVE FAILED ATTEMPT
        const { error: saveError } = await supabase
            .from("vault_attempts")
            .upsert({
                ip,
                attempts,
            }, {
                onConflict: 'ip'
            });

        if (saveError) {
            console.error("Save error:", saveError);
            return res.status(500).json({
                success: false,
                error: "Failed to save attempt",
            });
        }

        return res.status(401).json({
            success: false,
            remaining: 4 - attempts,
        });

    } catch (error) {
        console.error("Unlock API Error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
}