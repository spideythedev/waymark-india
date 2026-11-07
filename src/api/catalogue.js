
import {
  collection,
  getDocs,
  limit,
  query,
  where
} from "firebase/firestore";

import { db } from "./firebase";

const CATALOGUE_COLLECTIONS = [
  { id: "courses", label: "Courses" },
  { id: "institutions", label: "Institutions" },
  { id: "scholarships", label: "Scholarships" },
  { id: "entranceExams", label: "Entrance examinations" }
];

async function loadCollection(collectionName) {
  const recordsQuery = query(
    collection(db, collectionName),
    where("status", "==", "verified"),
    limit(30)
  );

  const snapshot = await getDocs(recordsQuery);

  return snapshot.docs.map((document) => ({
    ...document.data(),
    id: document.id,
    type: collectionName
  }));
}

export async function loadDashboardCatalogue() {
  const results = await Promise.all(
    CATALOGUE_COLLECTIONS.map(async (item) => ({
      type: item.id,
      records: await loadCollection(item.id)
    }))
  );

  return {
    collections: CATALOGUE_COLLECTIONS,
    records: results.flatMap((item) => item.records),
    updatedAt: new Date()
  };
}
