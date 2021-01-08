import * as functions from "firebase-functions";
import { SecretManagerServiceClient, v1 } from "@google-cloud/secret-manager";
import Twitter from "twitter-lite";
import setSeconds from "date-fns/setSeconds";
import setMilliseconds from "date-fns/setMilliseconds";
import setMinutes from "date-fns/setMinutes";
import { region, timeZone } from "./constants";
import { select } from "./database";

const accessSecret = async (
  client: v1.SecretManagerServiceClient,
  projectId: string,
  key: string
): Promise<string> => {
  // https://firebase.google.com/docs/functions/config-env?hl=ja#automatically_populated_environment_variables
  const [accessResponse] = await client.accessSecretVersion({
    name: `projects/${projectId}/secrets/${key}/versions/latest`,
  });
  if (accessResponse.payload === null || accessResponse.payload === undefined) {
    throw new Error(`Undefined secret key: "${key}"`);
  }
  if (
    accessResponse.payload.data === null ||
    accessResponse.payload.data === undefined
  ) {
    throw new Error(`Undefined secret key: "${key}"`);
  }
  if (typeof accessResponse.payload.data === "string") {
    return accessResponse.payload.data;
  }
  return Buffer.from(accessResponse.payload.data).toString("utf8");
};

const initTwitterClient = async (): Promise<Twitter> => {
  const firebaseConfig = process.env.FIREBASE_CONFIG;
  if (!firebaseConfig) {
    throw new Error("Undefined env: FIREBASE_CONFIG");
  }
  const { projectId } = JSON.parse(firebaseConfig);
  const secretClient = new SecretManagerServiceClient();
  return new Twitter({
    consumer_key: await accessSecret(secretClient, projectId, "twitter-consumer-key"),
    consumer_secret: await accessSecret(
      secretClient,
      projectId,
      "twitter-consumer-secret"
    ),
    access_token_key: await accessSecret(
      secretClient,
      projectId,
      "twitter-access-token-key"
    ),
    access_token_secret: await accessSecret(
      secretClient,
      projectId,
      "twitter-access-token-secret"
    ),
  })
};

export const scheduledRetweeets = functions.region(region).pubsub
  .schedule("every 30 minutes")
  .timeZone(timeZone)
  .onRun(async (context) => {
    const twitter = await initTwitterClient();
    const start = setSeconds(
      setMilliseconds(new Date(context.timestamp), 0),
      0
    );
    const end = setMinutes(start, 29);
    const tweets = await select(start, end);
    // TODO: rate limitを考慮する
    await Promise.all(
      tweets.map((tweet) => twitter.post(`statuses/retweet/${tweet.id}`, {}))
    );
  });

export default scheduledRetweeets;
