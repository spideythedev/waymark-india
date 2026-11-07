
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithCustomToken
} from "firebase/auth";

import { httpsCallable } from "firebase/functions";
import { auth, functions } from "./firebase";

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account"
});

let recaptcha = null;
let confirmation = null;

const sendEmailOtpFunction = httpsCallable(
  functions,
  "sendEmailOtp"
);

const verifyEmailOtpFunction = httpsCallable(
  functions,
  "verifyEmailOtp"
);

export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function signInGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function requestEmailOtp(email) {
  const result = await sendEmailOtpFunction({
    email: email.trim().toLowerCase()
  });

  return result.data;
}

export async function confirmEmailOtp(email, code) {
  const result = await verifyEmailOtpFunction({
    email: email.trim().toLowerCase(),
    code: code.trim()
  });

  const credential = await signInWithCustomToken(
    auth,
    result.data.token
  );

  return credential.user;
}

export async function requestPhoneOtp(phone) {
  if (recaptcha) {
    recaptcha.clear();
    recaptcha = null;
  }

  recaptcha = new RecaptchaVerifier(
    auth,
    "recaptcha-container",
    {
      size: "invisible"
    }
  );

  await recaptcha.render();

  confirmation = await signInWithPhoneNumber(
    auth,
    phone,
    recaptcha
  );

  return true;
}

export async function confirmPhoneOtp(code) {
  if (!confirmation) {
    throw new Error("Request a phone verification code first.");
  }

  const result = await confirmation.confirm(code);

  confirmation = null;

  if (recaptcha) {
    recaptcha.clear();
    recaptcha = null;
  }

  return result.user;
}

export async function logout() {
  await signOut(auth);
  confirmation = null;

  if (recaptcha) {
    recaptcha.clear();
    recaptcha = null;
  }
}
