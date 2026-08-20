import * as cheerio from "cheerio";
import { extractPinterestMedia, type PinData } from "./pin-extractor.js";

export interface BatchResult {
  success: PinData[];
  failed: { url: string; error: string }[];
}

/**
 * ดึงข้อมูลสื่อแบบเป็นชุด (Batch Extraction) จากหลาย ๆ URLs
 */
export async function extractBatchMedia(urls: string[]): Promise<BatchResult> {
  const cleanUrls = Array.from(
    new Set(
      urls
        .map((u) => u.trim())
        .filter((u) => u.startsWith("http://") || u.startsWith("https://"))
    )
  );

  const success: PinData[] = [];
  const failed: { url: string; error: string }[] = [];

  // รันพร้อมกันแบบจำกัด concurrency เพื่อไม่ให้โดน Rate Limit
  const batchSize = 5;
  for (let i = 0; i < cleanUrls.length; i += batchSize) {
    const chunk = cleanUrls.slice(i, i + batchSize);
    const promises = chunk.map(async (url) => {
      try {
        const pinData = await extractPinterestMedia(url);
        success.push(pinData);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        failed.push({ url, error: errorMsg });
      }
    });
    await Promise.all(promises);
  }

  return { success, failed };
}

/**
 * ดึงรายการ Pin URLs จากหน้าบอร์ด Pinterest (Board Scraper)
 */
export async function extractBoardPinUrls(boardUrl: string): Promise<string[]> {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };

  const response = await fetch(boardUrl, { headers, redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Failed to fetch board page (HTTP ${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const pinUrls: string[] = [];

  // ค้นหาลิงก์ /pin/<id>/ ทั้งหมดในหน้าบอร์ด
  $('a[href*="/pin/"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href) {
      const match = href.match(/\/pin\/(\d+)\//);
      if (match && match[1]) {
        pinUrls.push(`https://www.pinterest.com/pin/${match[1]}/`);
      }
    }
  });

  return Array.from(new Set(pinUrls));
}
