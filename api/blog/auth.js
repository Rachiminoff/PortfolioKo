import crypto from "crypto";

const COOKIE = "blog_admin_session";
const MAX_AGE = 24 * 60 * 60;

function sign(value) {
  return crypto.createHmac("sha256", process.env.BLOG_SESSION_SECRET).update(value).digest("hex");
}

function createToken() {
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE;
  const nonce = crypto.randomBytes(32).toString("hex");
  const payload = `${expires}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

function isValidToken(token) {
  if (!token || !process.env.BLOG_SESSION_SECRET) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expires, nonce, signature] = parts;
  if (!/^\d+$/.test(expires) || Number(expires) < Math.floor(Date.now() / 1000)) return false;
  const expected = sign(`${expires}.${nonce}`);
  const suppliedSignature = Buffer.from(signature);
  const expectedSignature = Buffer.from(expected);
  return suppliedSignature.length === expectedSignature.length &&
    crypto.timingSafeEqual(suppliedSignature, expectedSignature);
}

function getCookie(req) {
  return (req.headers.cookie || "")
    .split(";")
    .map(value => value.trim())
    .find(value => value.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
}

export function isBlogAdmin(req) {
  return isValidToken(getCookie(req));
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    return res.status(200).json({ valid: isBlogAdmin(req) });
  }

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
    return res.status(200).json({ success: true });
  }

  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

  const { password } = req.body || {};
  if (!password || !process.env.BLOG_PASSWORD || !process.env.BLOG_SESSION_SECRET) {
    return res.status(400).json({ success: false, error: "Authentication is not configured." });
  }

  const supplied = Buffer.from(String(password));
  const expected = Buffer.from(String(process.env.BLOG_PASSWORD));
  const matches = supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);

  if (!matches) return res.status(401).json({ success: false, error: "Invalid password." });

  const token = createToken();
  res.setHeader("Set-Cookie", `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`);
  return res.status(200).json({ success: true });
}
