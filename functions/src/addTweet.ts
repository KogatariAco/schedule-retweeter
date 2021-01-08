import * as functions from "firebase-functions";
import { region } from "./constants";
import { insert } from "./database";

const addTweet = functions.region(region).https.onRequest(async (req, res) => {
  const body = req.body;
  let error: { message: string } | undefined;
  if (!body) {
    error = {
      message: "Undefined body",
    };
  }
  if (!body.tweet) {
    error = {
      message: "tweet not found",
    };
  }
  if (typeof body.tweetAt !== "number") {
    error = {
      message: "tweetAt is not number",
    };
  }
  if (error) {
    res.status(400).send(error);
    return;
  }

  await insert(body.tweet, new Date(body.tweetAt));
  res.status(200).send({});
});

export default addTweet;
