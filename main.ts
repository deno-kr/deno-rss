import { parseFeed } from "https://deno.land/x/rss@0.5.3/mod.ts";

const link = "https://buttondown.email/denonews/rss";
const response = await fetch(link);

const xml = await response.text();
const { entries } = await parseFeed(xml);

<<<<<<< HEAD
console.log(entries);
=======
const lastPublishedText = (await Deno.readTextFile("./last_published.txt")).trim();
const lastPublished = new Date(lastPublishedText);

const newEntries = entries.filter((it) => it.published !== undefined && it.published > lastPublished);
console.log(newEntries)
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
console.log(embeds)

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

>>>>>>> 26cd4bd (test:add request log)
