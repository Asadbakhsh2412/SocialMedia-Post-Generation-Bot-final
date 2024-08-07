const { Telegraf } = require("telegraf");
const userModel = require("./src/models/User");
const eventModel = require("./src/models/events");
const connectDb = require("./src/config/db");
const Groq = require("groq-sdk");
const { message } = require("telegraf/filters");
const dotenv = require("dotenv");

const express = require("express");

const app = express();

app.get("/", (req, res) => {
  // console.log("Bot is running...");
  res.send("Bot is running...");
});

app.listen(5000, () => {
  console.log(`Server running at http://localhost:${5000}`);
});

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const bot = new Telegraf(process.env.BOT_TOKEN);

try {
  connectDb();
  // console.log('Connected to db');
} catch (error) {
  console.error(error);
  process.kill(process.pid, "SIGTERM");
}
bot.start(async (ctx) => {
  const from = ctx.update.message.from;
  console.log("from", from);
  try {
    await userModel.findOneAndUpdate(
      { tgId: from.id },
      {
        $setOnInsert: {
          firstName: from.first_name,
          lastName: from.last_name,
          username: from.username,
          isBot: from.is_bot,
        },
      },
      { upsert: true, new: true }
    );

    await ctx.reply(
      `hey ${from.first_name}, Welcome I will be Social post for you!`
    );
  } catch (error) {
    console.log(error);
    await ctx.reply("Facing issues");
  }

  await ctx.reply("Hello, welcome to my bot!");
});

bot.command("generate", async (ctx) => {
  const from = ctx.update.message.from;

  const startDay = new Date();
  startDay.setHours(0, 0, 0, 0);

  const endDay = new Date();
  endDay.setHours(23, 59, 59, 999);

  const events = await eventModel.find({
    tgId: from.id,
    // createdAt : {
    //     $gte: startDay,
    //     $lte: endDay,
    // }
  });

  if (events.length == 0) {
    await ctx.reply("No events found for today");
    return;
  }
  console.log("events", events);

  try {
    const chatComplete = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Act as a senior copywriter, you write highly engaging posts for Linkedin, facebook and twitter using provided thoughts/events throught the day.",
        },
        {
          role: "user",
          content: `Write like a human, for humans. Craft three engaging social media posts tailored for LinkedIn, Facebook, and Twitter
                 audiences. Use simple language. Use given time labels just to understand the order of the event, don't mention the time in the posts. 
                 Each post should creatively highlight the following events. Ensure the tone is conversational and impactful. 
                 Focus on engaging the respective platform's audience, encouraging interaction, and driving interest in the events:
                ${events.map((event) => event.text).join(",")}`,
        },
      ],
      model: "llama3-8b-8192",
    });

    console.log("copletion: ", chatComplete);
    await ctx.reply(chatComplete.choices[0].message.content);
  } catch (error) {
    console.log("error: ", error);
  }
});

bot.on(message("text"), async (ctx) => {
  ctx.reply("Got the message!!");
  const from = ctx.update.message.from;
  const message = ctx.update.message.text;
  try {
    await eventModel.create({
      tgId: from.id,
      text: message,
    });

    await ctx.reply(
      "Noted: keep sending me your thought and I will generate messages from them"
    );
    await ctx.reply("to generate messages type: /generate");
  } catch (error) {
    console.log(error);
    await ctx.reply("Facing issues");
  }
});
bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
