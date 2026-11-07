
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import { createHmac, randomInt, createHash } from "node:crypto";

initializeApp();

const db = getFirestore();

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");
const OTP_HASH_SECRET = defineSecret("OTP_HASH_SECRET");
const EMAIL_FROM = defineString("EMAIL_FROM");

const REGION = "asia-south1";
const OTP_TTL = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN = 60 * 1000;
const MAX_HOURLY_SENDS = 5;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function emailId(email) {
  return createHash("sha256")
    .update(email)
    .digest("hex");
}

function hashOtp(email, code) {
  return createHmac("sha256", OTP_HASH_SECRET.value())
    .update(`${email}:${code}`)
    .digest("hex");
}

async function sendEmail(email, code) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY.value()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: EMAIL_FROM.value(),
      to: [email],
      subject: "Your WAYMARK verification code",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;color:#17202a">
          <h1>WAYMARK</h1>
          <p>Your verification code is:</p>
          <div style="font-size:34px;font-weight:bold;letter-spacing:10px;padding:20px 0">
            ${code}
          </div>
          <p>This code expires in 5 minutes.</p>
          <p>If you did not request this code, ignore this email.</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    throw new HttpsError(
      "internal",
      "Unable to send verification email."
    );
  }
}

export const sendEmailOtp = onCall(
  {
    region: REGION,
    secrets: [RESEND_API_KEY, OTP_HASH_SECRET]
  },
  async (request) => {
    const email = normalizeEmail(request.data?.email);

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      throw new HttpsError("invalid-argument", "Enter a valid email.");
    }

    const id = emailId(email);
    const ref = db.collection("emailOtps").doc(id);
    const now = Date.now();

    const code = String(randomInt(100000, 1000000));

    await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      const previous = snapshot.data();

      const windowStart = previous?.windowStart || now;
      const hourlySends =
        now - windowStart > 60 * 60 * 1000
          ? 0
          : previous?.hourlySends || 0;

      if (
        previous?.lastSentAt &&
        now - previous.lastSentAt < RESEND_COOLDOWN
      ) {
        throw new HttpsError(
          "resource-exhausted",
          "Please wait before requesting another code."
        );
      }

      if (hourlySends >= MAX_HOURLY_SENDS) {
        throw new HttpsError(
          "resource-exhausted",
          "Too many requests. Try again later."
        );
      }

      tx.set(ref, {
        email,
        otpHash: hashOtp(email, code),
        expiresAt: now + OTP_TTL,
        attempts: 0,
        lastSentAt: now,
        hourlySends: hourlySends + 1,
        windowStart: hourlySends === 0 ? now : windowStart
      });
    });

    await sendEmail(email, code);

    return { success: true };
  }
);

export const verifyEmailOtp = onCall(
  {
    region: REGION,
    secrets: [OTP_HASH_SECRET]
  },
  async (request) => {
    const email = normalizeEmail(request.data?.email);
    const code = String(request.data?.code || "").trim();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^\d{6}$/.test(code)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid email or verification code."
      );
    }

    const id = emailId(email);
    const ref = db.collection("emailOtps").doc(id);

    const valid = await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);

      if (!snapshot.exists) return false;

      const data = snapshot.data();

      if (
        Date.now() > data.expiresAt ||
        data.attempts >= MAX_ATTEMPTS
      ) {
        tx.delete(ref);
        return false;
      }

      const expected = Buffer.from(data.otpHash, "hex");
      const actual = Buffer.from(hashOtp(email, code), "hex");

      const matches =
        expected.length === actual.length &&
        expected.length > 0 &&
        (await import("node:crypto")).timingSafeEqual(
          expected,
          actual
        );

      if (!matches) {
        const attempts = data.attempts + 1;

        if (attempts >= MAX_ATTEMPTS) {
          tx.delete(ref);
        } else {
          tx.update(ref, { attempts });
        }

        return false;
      }

      tx.delete(ref);
      return true;
    });

    if (!valid) {
      throw new HttpsError(
        "permission-denied",
        "Invalid or expired verification code."
      );
    }

    const adminAuth = getAuth();

    let user;

    try {
      user = await adminAuth.getUserByEmail(email);
      if (!user.emailVerified) {
        user = await adminAuth.updateUser(user.uid, {
          emailVerified: true
        });
      }
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }

      user = await adminAuth.createUser({
        email,
        emailVerified: true
      });
    }

    const token = await adminAuth.createCustomToken(user.uid);

    return { token };
  }
);
