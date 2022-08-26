import { parseFeed } from "https://deno.land/x/rss@0.5.3/mod.ts";
import * as discordeno from "https://deno.land/x/discordeno@13.0.0-rc45/mod.ts";
import type { Embed } from "https://deno.land/x/discordeno@13.0.0-rc45/transformers/embed.ts";
import { unescape } from "https://deno.land/x/html_escape@v1.1.5/unescape.ts";
import textClipper from "https://deno.land/x/text_clipper@2.1.0/mod.ts";
import { FeedEntry } from "https://deno.land/x/rss@0.5.3/src/types/feed.ts";
import { parse, stringify } from "https://deno.land/x/yaml@v2.1.1/src/index.ts";

const token = Deno.env.get("BOT_TOKEN") ?? "";
const botId = BigInt(Deno.env.get("BOT_ID") ?? "");
const channelId = BigInt(Deno.env.get("CHANNEL_ID") ?? "");

const linksRaw = Deno.env.get("RSS_LINKS") ?? "";
const lastPublishedFilePath = "./last_published.yaml"

const lastPublishedRaw: Record<string, Date> = parse((await Deno.readTextFile(lastPublishedFilePath)).trim());

console.log(`lastPublishedRaw: ${lastPublishedRaw}`);

const links: string[] = JSON.parse(linksRaw);
links.map(async (link) => {
  const entries = await fetchRSS(link);
  const lastPublishedForLink = lastPublishedRaw[link];

  const [entriesToPublish, newLastPublished]: [FeedEntry[], Date] = entries
    .filter((it) => 
      it.published !== undefined && it.published > lastPublishedForLink
    )
    .reduce(
      (acc, it) => [acc[0].concat(it), acc[1] > it.published! ? acc[1] : it.published!],
      [new Array<FeedEntry>(), lastPublishedForLink],
    );
  
  console.log(`entriesToPublish: ${entriesToPublish}`);

   const embeds: Embed[] = entriesToPublish
    .map((it) => ({
        title: it.title?.value,
        description: textClipper(
          unescape(it.description?.value ?? '')
            .replace(/<[^>]*>/g, "")
          , 100,
          { html: false, indicator: '...' },
        ),
        url: it.links[0].href,
      }));

  if (embeds.length > 0) {
    const bot = discordeno.createBot({
      token,
      botId,
    });
    discordeno.sendMessage(
      bot,
      channelId,
      {
        embeds,
      }
    );

    lastPublishedRaw[link] = newLastPublished;
  }
});

console.log(`lastPublishedRaw: ${lastPublishedRaw}`);

const content = stringify(lastPublishedRaw);
await Deno.writeFile(lastPublishedFilePath, content);

const fetchRSS = async (target: string): Promise<FeedEntry[]> => {
  const response = await fetch(target);
  const xml = await response.text();

  try {
    const { entries } = await parseFeed(xml);
    return entries;
  } catch (error) {
    console.error(JSON.stringify({
      errorMessage: error.message,
      xml,
    }));
    Deno.exit(1);
  }
}