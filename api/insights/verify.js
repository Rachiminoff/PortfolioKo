import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method !== "GET") {
            return res.status(405).json({
                valid: false,
                error: "Method not allowed",
            });
        }

        // Get session token from cookie
        const cookies = req.headers.cookie || '';
        const sessionToken = cookies
            .split(';')
            .find(c => c.trim().startsWith('blog_session='))
            ?.split('=')[1];

        console.log('Insights Verify - Session token found:', !!sessionToken);

        if (!sessionToken) {
            return res.status(200).json({ valid: false });
        }

        // Check if session exists in database
        const { data: session, error } = await supabase
            .from("blog_sessions")
            .select("*")
            .eq("session_token", sessionToken)
            .maybeSingle();

        if (error) {
            console.error("Session lookup error:", error);
            return res.status(200).json({ valid: false });
        }

        if (!session) {
            console.log('Insights Verify - No session found for token:', sessionToken);
            return res.status(200).json({ valid: false });
        }

        console.log('Insights Verify - Session found:', session);

        // Check if session is expired
        if (new Date(session.expires_at) < new Date()) {
            console.log('Insights Verify - Session expired');
            await supabase
                .from("blog_sessions")
                .delete()
                .eq("session_token", sessionToken);
            return res.status(200).json({ valid: false });
        }

        console.log('Insights Verify - Session valid');
        return res.status(200).json({ valid: true });
    } catch (error) {
        console.error("Insights session verification error:", error);
        return res.status(500).json({
            valid: false,
            error: "Internal server error",
        });
    }
}