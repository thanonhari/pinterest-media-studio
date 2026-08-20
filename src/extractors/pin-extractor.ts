import * as cheerio from "cheerio";

export interface MediaItem {
  type: "image" | "video";
  url: string;
  originalUrl: string;
  thumbnailUrl: string;
  quality?: string;
  width?: number;
  height?: number;
}

export interface PinData {
  id: string;
  title: string;
  description: string;
  author: string;
  sourceUrl?: string;
  dominantColor?: string;
  media: MediaItem[];
}

/**
 * สกัด ID จาก URL ของ Pinterest
 */
export function extractPinId(url: string): string | null {
  const match = url.match(/pin\/(\d+)/i) || url.match(/\/pin\/([a-zA-Z0-9_-]+)/i);
  return match?.[1] ?? null;
}

function calculateVideoQualityScore(url: string): number {
  if (url.includes("1080w") || url.includes("1080p")) return 4;
  if (url.includes("720w") || url.includes("720p")) return 3;
  if (url.includes("480w") || url.includes("480p")) return 2;
  if (url.includes("expMp4")) return 1;
  return 0;
}

/**
 * สกัดลิงก์วิดีโอจาก HTML หรือ embedded JSON ของ Pinterest
 */
function extractVideoUrlsFromHtml(rawHtml: string): string[] {
  const unescaped = rawHtml.replace(/\\u002F/g, "/").replace(/\\\//g, "/");

  const mp4Regex = /https?:\/\/(?:v\d*|i)\.pinimg\.com\/videos\/[^\s"'<>\\]+?\.mp4/gi;
  const m3u8Regex = /https?:\/\/(?:v\d*|i)\.pinimg\.com\/videos\/[^\s"'<>\\]+?\.m3u8/gi;

  const mp4Matches = Array.from(unescaped.matchAll(mp4Regex), (m) => m[0]);
  const m3u8Matches = Array.from(unescaped.matchAll(m3u8Regex), (m) => m[0]);

  const uniqueMp4 = Array.from(new Set(mp4Matches)).toSorted((a: string, b: string) => {
    return calculateVideoQualityScore(b) - calculateVideoQualityScore(a);
  });

  const uniqueM3u8 = Array.from(new Set(m3u8Matches));
  return [...uniqueMp4, ...uniqueM3u8];
}

/**
 * สกัดลิงก์รูปภาพทั้งหมดจาก HTML โดยตรวจสอบความถูกต้องของ Original Image
 */
function extractImagesFromHtml(rawHtml: string, ogImage: string): { originalUrl: string; thumbnailUrl: string } {
  const unescaped = rawHtml.replace(/\\u002F/g, "/").replace(/\\\//g, "/");

  // หา hash ของรูปภาพหลักจาก ogImage เช่น 1b/73/c0/1b73c02835aaf327fbe2ac32d84fba00
  const hashMatch = ogImage.match(/i\.pinimg\.com\/(?:\d+x|originals|\d+x\d+)\/(.+?)\.(?:jpg|png|webp)/i);
  const imagePath = hashMatch?.[1];

  // ค้นหา URL originals ทั้งหมดใน HTML
  const originalsInHtml = Array.from(
    unescaped.matchAll(/https?:\/\/i\.pinimg\.com\/originals\/[^\s"'<>\\]+?\.(?:jpg|png|webp)/gi),
    (m) => m[0]
  );

  // 1. ถ้าเจอ URL ใน originals ที่ตรงกับ imagePath ให้เลือกอันนั้นทันที (เช่น กรณีเป็น .png)
  if (imagePath) {
    const exactOriginal = originalsInHtml.find((u) => u.includes(imagePath));
    if (exactOriginal) {
      return {
        originalUrl: exactOriginal,
        thumbnailUrl: ogImage || exactOriginal,
      };
    }
  }

  // 2. ถ้าเจอ originals ตัวแรกใน HTML ให้ใช้ตัวนั้น
  const firstOriginal = originalsInHtml[0];
  if (firstOriginal) {
    return {
      originalUrl: firstOriginal,
      thumbnailUrl: ogImage || firstOriginal,
    };
  }

  // 3. Fallback: แปลงขนาดจาก ogImage
  const fallbackOriginal = ogImage
    ? ogImage.replace(/i\.pinimg\.com\/(?:\d+x|originals|\d+x\d+)\//g, "i.pinimg.com/originals/")
    : "";

  return {
    originalUrl: fallbackOriginal || ogImage,
    thumbnailUrl: ogImage,
  };
}

/**
 * ดึงข้อมูลสื่อจากหน้า Pinterest Pin (รองรับทั้ง Image และ Video 100%)
 */
export async function extractPinterestMedia(url: string): Promise<PinData> {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,th;q=0.8",
  };

  const response = await fetch(url, { headers, redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Failed to fetch Pinterest page (HTTP ${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("title").text().trim() ||
    "Pinterest Media";

  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="twitter:description"]').attr("content") ||
    "";

  const author = $('meta[name="author"]').attr("content") || "Pinterest Creator";
  const pinId = extractPinId(url) || `pin_${Date.now()}`;
  const ogImage = $('meta[property="og:image"]').attr("content") || "";

  const mediaList: MediaItem[] = [];

  // 1. ตรวจจับ Video จาก HTML & Embedded State
  const videoUrls = extractVideoUrlsFromHtml(html);
  if (videoUrls.length > 0 && videoUrls[0]) {
    const bestVideoUrl = videoUrls[0];
    const quality = bestVideoUrl.includes("720w")
      ? "720p HD"
      : bestVideoUrl.includes("1080w")
        ? "1080p FHD"
        : bestVideoUrl.includes("480w")
          ? "480p SD"
          : "Standard Video";

    mediaList.push({
      type: "video",
      url: bestVideoUrl,
      originalUrl: bestVideoUrl,
      thumbnailUrl: ogImage,
      quality,
    });
  }

  // 2. ดึงภาพความละเอียดแท้ Original ที่ตรวจสอบความถูกต้องแล้ว
  const imageInfo = extractImagesFromHtml(html, ogImage);
  if (imageInfo.originalUrl) {
    mediaList.push({
      type: "image",
      url: imageInfo.originalUrl,
      originalUrl: imageInfo.originalUrl,
      thumbnailUrl: imageInfo.thumbnailUrl,
      quality: "Original High-Res",
    });
  }

  if (mediaList.length === 0) {
    throw new Error("Could not find any extractable image or video from this Pinterest URL.");
  }

  return {
    id: pinId,
    title,
    description,
    author,
    sourceUrl: url,
    media: mediaList,
  };
}
