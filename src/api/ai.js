
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

const askFunction = httpsCallable(functions, "askWaymark");

export async function askWaymark(question, context = {}) {
  if (!question?.trim()) {
    throw new Error("Enter a question first.");
  }

  const result = await askFunction({
    question: question.trim(),
    context
  });

  return result.data;
}
