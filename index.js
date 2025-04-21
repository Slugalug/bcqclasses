import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { writeFileSync } from 'fs';

const BASE_URL = "https://55462240-9bac-42bc-956f-e8cf69591477.rain-pods.com";

// Step 1: Fetch the class list page and extract class URLs
async function fetchClassURLs() {
  const res = await fetch(`${BASE_URL}/module/class`);
  const html = await res.text();
  const dom = new JSDOM(html);
  const anchors = [...dom.window.document.querySelectorAll("a[href*='/module/class/']")];
  const urls = anchors
    .map((a) => a.href)
    .filter((href) => href.includes("/module/class/") && !href.includes("/module/class/register"))
    .map((href) => {
      if (href.startsWith("http")) return href;
      return `${BASE_URL}${href}`;
    });

  // Remove duplicates
  return [...new Set(urls)];
}

// Step 2: Fetch event_data JSON from each class page
async function fetchEventData(url) {
  const res = await fetch(url);
  const html = await res.text();
  const match = html.match(/var event_data = JSON\.stringify\((.*?)\);/s);
  if (!match) return null;
  try {
    const rawJson = match[1];
    const parsed = JSON.parse(rawJson);
    return { url, event_data: parsed };
  } catch (err) {
    console.error(`❌ Failed to parse event_data from ${url}`);
    return null;
  }
}

// Main
(async () => {
  const urls = await fetchClassURLs();
  console.log(`🎯 Found ${urls.length} class URLs:`);

   const allEventData = [];
  for (const url of urls) {
    const data = await fetchEventData(url);
    if (data) {
      allEventData.push(data);
    }
  }

  // ✅ Save the output to a JSON file
  writeFileSync('classData.json', JSON.stringify(allEventData, null, 2));
  console.log('✅ Wrote class data to classData.json');
})();
