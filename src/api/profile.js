
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "./firebase";

export async function getStudentProfile(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));

  return snapshot.exists() ? snapshot.data() : null;
}

export async function saveStudentProfile(uid, profile) {
  const userRef = doc(db, "users", uid);

  const payload = {
    educationLevel: profile.educationLevel,
    classStandard: profile.classStandard || null,
    stream: profile.stream || null,
    interests: profile.interests,
    goals: profile.goals,
    preferredStates: profile.preferredStates,
    preferredLanguage: profile.preferredLanguage,
    onboardingCompleted: true,
    updatedAt: serverTimestamp()
  };

  await setDoc(userRef, payload, { merge: true });

  return getStudentProfile(uid);
}
