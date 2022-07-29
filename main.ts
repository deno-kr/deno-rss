import { parseFeed } from "https://deno.land/x/rss@0.5.3/mod.ts";

const link = "https://buttondown.email/denonews/rss";
const response = await fetch(link);

const xml = await response.text();
const { entries } = await parseFeed(xml);

console.log(entries);
