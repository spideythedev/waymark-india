import {
  uid,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "./firebase";

export async function getStudentProfile(uid) {
  if (!uid) {
    throw new Error("A user ID is required.");
  }

  const snapshot = await getDoc(doc(db, "users", uid));

  return snapshot.exists() ? snapshot.data() : null;
}

export async function saveStudentProfile(uid, profile) {
  if (!uid) {
    throw new Error("A user ID is required.");
  }

  if (!profile?.educationLevel) {
    throw new Error("Select your education level.");
  }

  const interests = Array.isArray(profile.interests)
    ? profile.interests.slice(0, 8)
    : [];

  const goals = Array.isArray(profile.goals)
    ? profile.goals.slice(0, 5)
    : [];

  const preferredStates = Array.isArray(profile.preferredStates)
    ? profile.preferredStates.slice(0, 5)
    : [];

  if (!interests.length || !goals.length || !preferredStates.length) {
    throw new Error(
      "Complete your interests, goals, and preferred locations."
    );
  }

  const userRef = doc(db, "users", uid);

  const payload = {
    educationLevel: profile.educationLevel,
    classStandard: profile.classStandard?.trim() || null,
    stream: profile.stream || null,
    interests,
    goals,
    preferredStates,
    preferredLanguage: profile.preferredLanguage || "English",
    onboardingCompleted: true,
    updatedAt: serverTimestamp()
  };

  await setDoc(userRef, payload, { merge: true });

  return getStudentProfile(uid);
}