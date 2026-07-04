import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

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

        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                error: "Password required",
            });
        }

        const ip =
            req.headers["x-forwarded-for"]
                ?.toString()
                .split(",")[0]
                .trim()
            || req.socket?.remoteAddress
            || "unknown";

        const {
            data: existing,
            error: fetchError,
        } = await supabase
            .from("blog_attempts")
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

        if (password === process.env.BLOG_PASSWORD) {
            // Clear attempts
            if (existing) {
                await supabase
                    .from("blog_attempts")
                    .delete()
                    .eq("ip", ip);
            }

            // Generate session token
            const crypto = await import('crypto');
            const sessionToken = crypto.randomBytes(32).toString('hex');
            
            // Store session in database
            const { error: sessionError } = await supabase
                .from("blog_sessions")
                .insert({
                    session_token: sessionToken,
                    created_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                });

            if (sessionError) {
                console.error("Session creation error:", sessionError);
                return res.status(500).json({
                    success: false,
                    error: "Failed to create session",
                });
            }

            // Set HTTP-only cookie
            res.setHeader('Set-Cookie', [
                `blog_session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${24 * 60 * 60}`
            ]);

            return res.status(200).json({
                success: true,
            });
        }

        // FAILED ATTEMPT
        const attempts = (existing?.attempts || 0) + 1;

        if (attempts >= 4) {
            const lockedUntil = new Date(
                Date.now() + (3 * 60 * 60 * 1000)
            );

            const { error: lockError } = await supabase
                .from("blog_attempts")
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

        const { error: saveError } = await supabase
            .from("blog_attempts")
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
        console.error("Insights Unlock API Error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
}