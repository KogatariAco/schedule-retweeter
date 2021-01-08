import * as admin from "firebase-admin";
import { Tweet } from "./domain";

const tweetsCollection = (): FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData> => {
  return admin.firestore().collection("tweets");
};

export const insert = async (
  tweet: string,
  tweetAt: Date
): Promise<void> => {
  const doc = tweetsCollection().doc(tweet);
  const snapshot = await doc.get();
  if (snapshot.exists === false) {
    await doc.create({
      tweetAt: admin.firestore.Timestamp.fromDate(tweetAt),
    });
  }
};

export const select = async (
  start: Date,
  end: Date
): Promise<Tweet[]> => {
  const snapshot = await tweetsCollection()
    .orderBy("tweetAt", "asc")
    .startAt(start)
    .endAt(end)
    .get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    if (!data.tweetAt) {
      return undefined;
    }
    return {
      id: doc.id,
      tweetAt: (data.tweetAt as FirebaseFirestore.Timestamp).toDate(),
    };
  }).filter((tweet): tweet is Tweet => tweet !== undefined);
};
