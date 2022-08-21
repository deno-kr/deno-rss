import { parseFeed } from "https://deno.land/x/rss@0.5.3/mod.ts";
import * as discordeno from "https://deno.land/x/discordeno@13.0.0-rc45/mod.ts";
import type { Embed } from "https://deno.land/x/discordeno@13.0.0-rc45/transformers/embed.ts";
import { unescape } from "https://deno.land/x/html_escape@v1.1.5/unescape.ts";
import textClipper from "https://deno.land/x/text_clipper@2.1.0/mod.ts";

const token = Deno.env.get("BOT_TOKEN") ?? "";
const botId = BigInt(Deno.env.get("BOT_ID") ?? "");
const channelId = BigInt(Deno.env.get("CHANNEL_ID") ?? "");

const link = Deno.env.get("RSS_LINK") ?? "";
const response = await fetch(link);
const xml = await response.text();

try {
  const { entries } = await parseFeed(xml);

  const lastPublishedText = (await Deno.readTextFile("./last_published.txt")).trim();
  const lastPublished = new Date(lastPublishedText);

  const newEntries = entries.filter((it) => it.published !== undefined && it.published > lastPublished);
  console.log(newEntries);
  const embeds: Embed[] = newEntries.map((it) => ({
    title: it.title?.value,
    description: textClipper(
      unescape(it.description?.value ?? '')
        .replace(/<[^>]*>/g, "")
      , 100,
      { html: false, indicator: '...' },
    ),
    url: it.links[0].href,
  }))

  if (embeds.length > 0) {
    const bot = discordeno.createBot({
      token,
      botId,
    })
    discordeno.sendMessage(
      bot,
      channelId,
      {
        embeds,
      }
    )
  }
} catch (e) {
  console.error(JSON.stringify({
    errorMessage: e.message,
    xml,
  }));
  Deno.exit(1);
}
