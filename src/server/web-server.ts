import * as http from "node:http";
import { extractPinterestMedia } from "../extractors/pin-extractor.js";
import { extractBatchMedia, extractBoardPinUrls } from "../extractors/board-extractor.js";
import { generateSamplePalette } from "../processors/color-palette.js";
import { createZipStream, type ZipEntry } from "../processors/zip-packager.js";

const PORT = process.env["PORT"] ? parseInt(process.env["PORT"], 10) : 3000;

function renderHTML(): string {
  return `<!DOCTYPE html>
<html lang="th" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pinterest Media Studio • All-in-One Downloader & Creative Suite</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', 'Noto Sans Thai', sans-serif; }
    .gradient-hero { background: linear-gradient(135deg, #E60023 0%, #ad081b 100%); }
    .gradient-accent { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
    .gradient-tiktok { background: linear-gradient(135deg, #ff0050 0%, #00f2fe 100%); }
    .glass-card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
    .tab-active { border-bottom: 2px solid #E60023; color: #fff; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased">

  <!-- Navigation Bar -->
  <header class="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-lg shadow-red-500/20">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.334 1.357-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.546.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
        </div>
        <div>
          <h1 class="font-bold text-lg leading-tight">Pinterest Media Studio</h1>
          <p class="text-xs text-slate-400">All-in-One Downloader, Moodboard & TikTok Video Suite</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Reels Generator Ready
        </span>
      </div>
    </div>
  </header>

  <!-- Sub Navigation Tabs -->
  <div class="border-b border-slate-800 bg-slate-900/30">
    <div class="max-w-4xl mx-auto px-4 flex gap-6 md:gap-8 text-xs md:text-sm font-semibold text-slate-400 overflow-x-auto">
      <button id="tabSingleBtn" class="py-3 tab-active transition-colors flex items-center gap-2 whitespace-nowrap">
        🎯 Single Pin
      </button>
      <button id="tabBatchBtn" class="py-3 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap">
        📦 Batch & Board to ZIP
      </button>
      <button id="tabMoodboardBtn" class="py-3 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap">
        🖼️ One-Click Moodboard
      </button>
      <button id="tabReelsBtn" class="py-3 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap text-pink-400 font-bold">
        ⚡ Board to TikTok/Reels
      </button>
    </div>
  </div>

  <!-- Main Container -->
  <main class="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">

    <!-- ==================== TAB 1: SINGLE PIN ==================== -->
    <section id="sectionSingle" class="space-y-6">
      <div class="text-center mb-6">
        <h2 class="text-2xl md:text-3xl font-extrabold mb-2">ดึงภาพความละเอียดแท้ Original & วิดีโอ MP4</h2>
        <p class="text-slate-400 text-xs md:text-sm">รองรับรูปภาพความคมชัดสูงสุด วิดีโอ 1080p พร้อมดูดชุดโค้ดสี และปรับสัดส่วนสำหรับ Social Media</p>
      </div>

      <div class="glass-card rounded-2xl p-4 md:p-6 shadow-2xl">
        <form id="extractForm" class="flex flex-col sm:flex-row gap-3">
          <input 
            type="url" 
            id="urlInput" 
            placeholder="วางลิงก์ Pin เดี่ยว เช่น https://www.pinterest.com/pin/566327721915390351/" 
            required
            class="flex-1 bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-white placeholder-slate-500"
          />
          <button 
            type="submit" 
            class="gradient-hero hover:opacity-95 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            ดึงข้อมูลสื่อ
          </button>
        </form>
      </div>

      <div id="singleLoading" class="hidden text-center py-10">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-sm text-slate-400">กำลังสกัดข้อมูล Original Media จาก Pinterest...</p>
      </div>

      <div id="resultCard" class="hidden glass-card rounded-2xl p-6 shadow-2xl space-y-6">
        <div class="flex flex-col md:flex-row gap-6">
          <div class="w-full md:w-1/2 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center relative min-h-[320px]">
            <img id="previewImg" class="w-full h-auto object-contain max-h-[460px]" alt="Preview" />
            <video id="previewVideo" class="hidden w-full h-auto max-h-[460px] rounded-xl" controls autoplay loop muted playsinline></video>
          </div>

          <div class="w-full md:w-1/2 flex flex-col justify-between space-y-4">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span id="mediaTypeBadge" class="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full font-bold">IMAGE</span>
                <span id="qualityBadge" class="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-medium">Original High-Res</span>
              </div>
              <h3 id="pinTitle" class="text-lg font-bold text-white line-clamp-2"></h3>
              <p id="pinAuthor" class="text-xs text-slate-400 mt-1"></p>
              <p id="pinDesc" class="text-xs text-slate-300 mt-3 line-clamp-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80"></p>
            </div>

            <div class="pt-2 border-t border-slate-800">
              <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">🎨 Color Palette (ชุดสี)</h4>
              <div id="paletteContainer" class="flex gap-2 flex-wrap"></div>
            </div>

            <div class="space-y-2 pt-2">
              <a 
                id="downloadBtn" 
                href="#" 
                target="_blank"
                class="w-full gradient-hero hover:opacity-95 text-white font-bold py-3 rounded-xl text-center text-sm block shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                <span id="downloadBtnText">ดาวน์โหลดไฟล์</span>
              </a>

              <div class="grid grid-cols-3 gap-2">
                <button id="copyFigmaBtn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2 rounded-lg text-xs border border-slate-700">
                  🎨 For Figma
                </button>
                <button id="openResizerBtn" class="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-medium py-2 rounded-lg text-xs border border-indigo-500/30">
                  📱 Social Resize
                </button>
                <button id="addToMoodboardBtn" class="bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 font-medium py-2 rounded-lg text-xs border border-pink-500/30">
                  ⚡ Add to Reels
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== TAB 2: BATCH & BOARD TO ZIP ==================== -->
    <section id="sectionBatch" class="hidden space-y-6">
      <div class="text-center mb-6">
        <h2 class="text-2xl md:text-3xl font-extrabold mb-2">📦 โหลดยกบอร์ด & วางหลายลิงก์เป็น ZIP</h2>
        <p class="text-slate-400 text-xs md:text-sm">วางลิงก์บอร์ด หรือวางทีเดียวหลายสิบลิงก์ ระบบจะดึงภาพทั้งหมดมาแพ็กเกจเป็นไฟล์ .zip ในคลิกเดียว</p>
      </div>

      <div class="glass-card rounded-2xl p-6 shadow-2xl space-y-4">
        <label class="text-xs font-semibold text-slate-300 uppercase tracking-wider block">วางรายการลิงก์ Pinterest (บรรทัดละ 1 ลิงก์):</label>
        <textarea 
          id="batchUrlsInput" 
          rows="6" 
          placeholder="https://www.pinterest.com/pin/566327721915390351/&#10;https://www.pinterest.com/pin/430867889374864569/"
          class="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-4 text-xs font-mono text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 placeholder-slate-600"
        ></textarea>
        
        <div class="flex justify-between items-center pt-2">
          <span id="batchCountBadge" class="text-xs text-slate-400">พร้อมประมวลผล</span>
          <button 
            id="startBatchBtn"
            class="gradient-hero hover:opacity-95 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-red-500/20 flex items-center gap-2"
          >
            📦 ดึงภาพทั้งหมด & บีบอัดเป็น ZIP
          </button>
        </div>
      </div>

      <div id="batchLoading" class="hidden text-center py-10">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mb-3"></div>
        <p id="batchStatusText" class="text-sm text-slate-400">กำลังดึงภาพและแพ็กเป็นไฟล์ ZIP...</p>
      </div>

      <div id="batchResultContainer" class="hidden space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="font-bold text-sm text-white">รายการที่ดึงสำเร็จ (<span id="batchSuccessCount">0</span> รายการ)</h3>
          <div class="flex gap-2">
            <button id="sendBatchToReelsBtn" class="bg-pink-600 hover:bg-pink-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1">
              ⚡ ส่งไปทำ TikTok/Reel
            </button>
            <button id="downloadZipBtn" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1">
              ⬇️ ดาวน์โหลด ZIP
            </button>
          </div>
        </div>
        <div id="batchGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"></div>
      </div>
    </section>

    <!-- ==================== TAB 3: ONE-CLICK MOODBOARD ==================== -->
    <section id="sectionMoodboard" class="hidden space-y-6">
      <div class="text-center mb-6">
        <h2 class="text-2xl md:text-3xl font-extrabold mb-2">🖼️ One-Click Moodboard Generator</h2>
        <p class="text-slate-400 text-xs md:text-sm">รวมภาพที่เซฟไว้มาจัดเลย์เอาต์ Collage สวยงามระดับมือโปร พร้อม Export เป็นภาพ HD</p>
      </div>

      <div class="glass-card rounded-2xl p-6 shadow-2xl space-y-4">
        <div class="flex flex-wrap gap-3 justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400">สัดส่วน:</span>
            <select id="moodboardRatio" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white">
              <option value="16-9">16:9 Landscape (นำเสนองาน)</option>
              <option value="a4">A4 Print Vertical</option>
              <option value="story">9:16 Story Format</option>
            </select>
          </div>

          <div class="flex gap-2">
            <button id="generateMoodboardBtn" class="gradient-accent hover:opacity-95 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-lg shadow-indigo-500/20">
              ✨ จัดเลย์เอาต์ Moodboard
            </button>
            <button id="exportMoodboardBtn" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-lg shadow-emerald-500/20">
              ⬇️ Export PNG
            </button>
          </div>
        </div>

        <div class="bg-slate-950 rounded-xl border border-slate-800 p-4 flex items-center justify-center overflow-auto min-h-[400px]">
          <canvas id="moodboardCanvas" class="max-w-full h-auto rounded-lg shadow-2xl bg-slate-900"></canvas>
        </div>
      </div>
    </section>

    <!-- ==================== TAB 4: BOARD TO TIKTOK / REELS GENERATOR ==================== -->
    <section id="sectionReels" class="hidden space-y-6">
      <div class="text-center mb-6">
        <div class="inline-flex items-center gap-2 bg-pink-500/10 text-pink-400 border border-pink-500/20 px-3 py-1 rounded-full text-xs font-bold mb-2">
          ✨ Next-Gen Feature 26
        </div>
        <h2 class="text-2xl md:text-3xl font-extrabold mb-2 bg-gradient-to-r from-pink-400 via-rose-300 to-indigo-400 bg-clip-text text-transparent">
          ⚡ Board to TikTok / Reels Video Generator
        </h2>
        <p class="text-slate-400 text-xs md:text-sm max-w-xl mx-auto">
          AI แปลงรูปภาพในบอร์ดให้กลายเป็นคลิปวิดีโอแนวตั้ง 9:16 อัตโนมัติ พร้อม Ken Burns Zooming, Smooth Transition และดนตรี Beat-Sync จังหวะเพลงลง TikTok/IG ทันที!
        </p>
      </div>

      <!-- Quick Actions & Image Queue Bar -->
      <div class="glass-card rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center text-sm font-bold">
            🖼️
          </div>
          <div>
            <h4 class="text-xs font-bold text-white">รูปภาพในคิวสร้างคลิป: <span id="reelsQueueCount" class="text-pink-400 font-extrabold">0</span> ภาพ</h4>
            <p class="text-[10px] text-slate-400">ใส่ลิงก์ด้านล่าง หรือกดโหลดภาพตัวอย่างเพื่อทดสอบได้ทันที</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button id="loadDemoPinsBtn" class="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5">
            ✨ โหลดภาพตัวอย่างทันที (Demo)
          </button>
        </div>
      </div>

      <!-- Direct Input Box inside Reels Tab -->
      <div class="glass-card rounded-2xl p-4 shadow-xl">
        <form id="reelsDirectForm" class="flex flex-col sm:flex-row gap-2">
          <input 
            type="url" 
            id="reelsDirectUrlInput" 
            placeholder="วางลิงก์ Pinterest Pin ที่นี่เพื่อเพิ่มเข้าคลิป..." 
            class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
          />
          <button type="submit" class="bg-pink-600 hover:bg-pink-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 whitespace-nowrap">
            ➕ เพิ่มเข้าคลิป
          </button>
        </form>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Controls Left -->
        <div class="glass-card rounded-2xl p-5 shadow-2xl space-y-4 md:col-span-1">
          <h3 class="font-bold text-sm text-white flex items-center gap-2">
            ⚙️ ตั้งค่าการสร้างวิดีโอ
          </h3>

          <div>
            <label class="text-xs text-slate-400 block mb-1">สไตล์ Transition & Effect:</label>
            <select id="reelEffect" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white">
              <option value="kenburns">🎬 Ken Burns Dynamic Zoom & Pan</option>
              <option value="crossfade">✨ Smooth Dreamy Crossfade</option>
              <option value="flash">⚡ Fast Beat Flash Pulse</option>
            </select>
          </div>

          <div>
            <label class="text-xs text-slate-400 block mb-1">ดนตรีประกอบ (AI Beat Track):</label>
            <select id="reelMusic" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white">
              <option value="chill">🎵 Cozy Lo-Fi Sunset Beat (80 BPM)</option>
              <option value="upbeat">🔥 Synthwave Energy Rush (120 BPM)</option>
              <option value="aesthetic">✨ Cinematic Aesthetic Aura (70 BPM)</option>
            </select>
          </div>

          <div>
            <label class="text-xs text-slate-400 block mb-1">ความยาวแต่ละรูป (วินาที):</label>
            <input type="range" id="reelSpeed" min="1.5" max="4.0" step="0.5" value="2.5" class="w-full accent-pink-500" />
            <div class="flex justify-between text-[10px] text-slate-500">
              <span>เร็ว (1.5s)</span>
              <span id="speedValText" class="text-pink-400 font-bold">2.5 วินาที / รูป</span>
              <span>ช้า (4.0s)</span>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-800 space-y-2">
            <button 
              id="generateReelBtn"
              class="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-95 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              สร้าง & อัดคลิปวิดีโอ 9:16
            </button>
            <button 
              id="downloadReelBtn" 
              class="hidden w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              ⬇️ ดาวน์โหลดคลิป TikTok (MP4/WebM)
            </button>
          </div>
        </div>

        <!-- Phone Preview Right -->
        <div class="glass-card rounded-2xl p-6 shadow-2xl md:col-span-2 flex flex-col items-center justify-center">
          <div class="w-[250px] sm:w-[280px] aspect-[9/16] rounded-3xl overflow-hidden bg-black border-4 border-slate-800 shadow-2xl relative flex items-center justify-center">
            <canvas id="reelsCanvas" class="w-full h-full object-cover"></canvas>
            <video id="reelsVideoPreview" class="hidden w-full h-full object-cover" controls autoplay loop playsinline></video>
            
            <!-- Progress Overlay -->
            <div id="reelRecordingBadge" class="hidden absolute top-4 left-4 bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
              <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
              RECORDING REEL...
            </div>
          </div>
          <p id="reelStatusText" class="text-xs text-slate-400 mt-4 text-center">
            กดปุ่ม "สร้าง & อัดคลิปวิดีโอ 9:16" เพื่อเรนเดอร์คลิปวิดีโอสั้นพร้อมเพลงอัตโนมัติ
          </p>
        </div>
      </div>
    </section>

    <!-- Social Resizer Modal -->
    <div id="resizerModal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="glass-card rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="font-bold text-base text-white">📱 Smart Social Resizer</h3>
          <button id="closeResizerBtn" class="text-slate-400 hover:text-white text-lg">&times;</button>
        </div>

        <div class="flex gap-2 text-xs">
          <button id="resizeRatio916" class="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-lg border border-indigo-500">9:16 Story / TikTok</button>
          <button id="resizeRatio11" class="flex-1 bg-slate-800 text-slate-300 font-bold py-2 rounded-lg border border-slate-700">1:1 Square Post</button>
          <button id="resizeRatio45" class="flex-1 bg-slate-800 text-slate-300 font-bold py-2 rounded-lg border border-slate-700">4:5 IG Portrait</button>
        </div>

        <div class="flex justify-center bg-slate-950 p-2 rounded-xl border border-slate-800 max-h-[350px] overflow-hidden">
          <canvas id="resizerCanvas" class="max-h-[330px] w-auto rounded"></canvas>
        </div>

        <button id="downloadResizedBtn" class="w-full gradient-hero text-white font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-red-500/20">
          ⬇️ ดาวน์โหลดภาพที่ปรับสัดส่วนแล้ว
        </button>
      </div>
    </div>

  </main>

  <!-- Footer -->
  <footer class="border-t border-slate-800 text-center py-6 text-xs text-slate-500">
    <p>Pinterest Media Studio • Built with Node.js & TypeScript Strict Architecture</p>
  </footer>

  <script>
    // Tab Switching
    const tabSingleBtn = document.getElementById('tabSingleBtn');
    const tabBatchBtn = document.getElementById('tabBatchBtn');
    const tabMoodboardBtn = document.getElementById('tabMoodboardBtn');
    const tabReelsBtn = document.getElementById('tabReelsBtn');

    const sectionSingle = document.getElementById('sectionSingle');
    const sectionBatch = document.getElementById('sectionBatch');
    const sectionMoodboard = document.getElementById('sectionMoodboard');
    const sectionReels = document.getElementById('sectionReels');

    function switchTab(target) {
      [tabSingleBtn, tabBatchBtn, tabMoodboardBtn, tabReelsBtn].forEach(b => b.classList.remove('tab-active', 'text-white'));
      [sectionSingle, sectionBatch, sectionMoodboard, sectionReels].forEach(s => s.classList.add('hidden'));

      if (target === 'single') {
        tabSingleBtn.classList.add('tab-active', 'text-white');
        sectionSingle.classList.remove('hidden');
      } else if (target === 'batch') {
        tabBatchBtn.classList.add('tab-active', 'text-white');
        sectionBatch.classList.remove('hidden');
      } else if (target === 'moodboard') {
        tabMoodboardBtn.classList.add('tab-active', 'text-white');
        sectionMoodboard.classList.remove('hidden');
        renderMoodboard();
      } else if (target === 'reels') {
        tabReelsBtn.classList.add('tab-active', 'text-white');
        sectionReels.classList.remove('hidden');
        updateReelsQueueCount();
      }
    }

    tabSingleBtn.addEventListener('click', () => switchTab('single'));
    tabBatchBtn.addEventListener('click', () => switchTab('batch'));
    tabMoodboardBtn.addEventListener('click', () => switchTab('moodboard'));
    tabReelsBtn.addEventListener('click', () => switchTab('reels'));

    // Global App State
    let currentMediaUrl = '';
    let currentThumbnailUrl = '';
    let currentTitle = '';
    let currentPalette = [];
    let savedMoodboardImages = [
      'https://i.pinimg.com/originals/1b/73/c0/1b73c02835aaf327fbe2ac32d84fba00.png',
      'https://i.pinimg.com/originals/d5/3b/01/d53b014d86a6b6761bf649a0ed813c2b.png'
    ];

    function updateReelsQueueCount() {
      const el = document.getElementById('reelsQueueCount');
      if (el) el.textContent = savedMoodboardImages.length;
    }

    // ================= SINGLE PIN LOGIC =================
    const form = document.getElementById('extractForm');
    const urlInput = document.getElementById('urlInput');
    const singleLoading = document.getElementById('singleLoading');
    const resultCard = document.getElementById('resultCard');
    const previewImg = document.getElementById('previewImg');
    const previewVideo = document.getElementById('previewVideo');
    const pinTitle = document.getElementById('pinTitle');
    const pinAuthor = document.getElementById('pinAuthor');
    const pinDesc = document.getElementById('pinDesc');
    const mediaTypeBadge = document.getElementById('mediaTypeBadge');
    const qualityBadge = document.getElementById('qualityBadge');
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadBtnText = document.getElementById('downloadBtnText');
    const paletteContainer = document.getElementById('paletteContainer');
    const copyFigmaBtn = document.getElementById('copyFigmaBtn');
    const openResizerBtn = document.getElementById('openResizerBtn');
    const addToMoodboardBtn = document.getElementById('addToMoodboardBtn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = urlInput.value.trim();
      if (!url) return;

      singleLoading.classList.remove('hidden');
      resultCard.classList.add('hidden');

      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to extract');

        const media = data.media[0];
        currentMediaUrl = media.originalUrl || media.url;
        currentThumbnailUrl = media.thumbnailUrl || currentMediaUrl;
        currentTitle = data.title;
        currentPalette = data.palette || [];

        pinTitle.textContent = data.title;
        pinAuthor.textContent = 'By ' + data.author;
        pinDesc.textContent = data.description || 'ไม่มีคำอธิบายเพิ่มเติม';
        mediaTypeBadge.textContent = media.type === 'video' ? '🎬 VIDEO' : '🖼️ IMAGE';
        qualityBadge.textContent = media.quality || 'High-Res';

        if (media.type === 'video') {
          previewImg.classList.add('hidden');
          previewVideo.classList.remove('hidden');
          previewVideo.src = media.url;
          downloadBtnText.textContent = 'ดาวน์โหลดวิดีโอ MP4 (' + (media.quality || 'HD') + ')';
        } else {
          previewVideo.classList.add('hidden');
          previewImg.classList.remove('hidden');
          previewImg.onerror = () => {
            if (previewImg.src !== currentThumbnailUrl) previewImg.src = currentThumbnailUrl;
          };
          previewImg.src = media.originalUrl;
          downloadBtnText.textContent = 'ดาวน์โหลดภาพ Original High-Res';

          if (!savedMoodboardImages.includes(currentMediaUrl)) {
            savedMoodboardImages.push(currentMediaUrl);
            updateReelsQueueCount();
          }
        }

        downloadBtn.href = '/api/proxy-download?url=' + encodeURIComponent(currentMediaUrl) + '&title=' + encodeURIComponent(data.title) + '&fallback=' + encodeURIComponent(currentThumbnailUrl);

        // Render Color Palette
        paletteContainer.innerHTML = '';
        currentPalette.forEach(color => {
          const swatch = document.createElement('button');
          swatch.type = 'button';
          swatch.className = 'w-9 h-9 rounded-lg border border-white/20 shadow-md hover:scale-110 transition-transform';
          swatch.style.backgroundColor = color.hex;
          swatch.title = color.name + ' (' + color.hex + ') - คลิกเพื่อ Copy';
          swatch.addEventListener('click', () => {
            navigator.clipboard.writeText(color.hex);
            alert('คัดลอกโค้ดสี ' + color.hex + ' เรียบร้อย!');
          });
          paletteContainer.appendChild(swatch);
        });

        resultCard.classList.remove('hidden');
      } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
      } finally {
        singleLoading.classList.add('hidden');
      }
    });

    copyFigmaBtn.addEventListener('click', () => {
      if (currentMediaUrl) {
        navigator.clipboard.writeText(currentMediaUrl);
        alert('คัดลอกลิงก์สื่อสำหรับวางใน Figma / Canva เรียบร้อย!');
      }
    });

    addToMoodboardBtn.addEventListener('click', () => {
      if (currentMediaUrl && !savedMoodboardImages.includes(currentMediaUrl)) {
        savedMoodboardImages.push(currentMediaUrl);
        updateReelsQueueCount();
        alert('เพิ่มภาพนี้เข้าสู่ Reels / Moodboard แล้ว!');
        switchTab('reels');
      }
    });

    // ================= BATCH & BOARD TO ZIP LOGIC =================
    const batchUrlsInput = document.getElementById('batchUrlsInput');
    const startBatchBtn = document.getElementById('startBatchBtn');
    const batchLoading = document.getElementById('batchLoading');
    const batchStatusText = document.getElementById('batchStatusText');
    const batchResultContainer = document.getElementById('batchResultContainer');
    const batchGrid = document.getElementById('batchGrid');
    const batchSuccessCount = document.getElementById('batchSuccessCount');
    const downloadZipBtn = document.getElementById('downloadZipBtn');
    const sendBatchToReelsBtn = document.getElementById('sendBatchToReelsBtn');

    let extractedBatchItems = [];

    startBatchBtn.addEventListener('click', async () => {
      const rawText = batchUrlsInput.value.trim();
      if (!rawText) return;

      const lines = rawText.split('\\n').map(l => l.trim()).filter(Boolean);
      batchLoading.classList.remove('hidden');
      batchResultContainer.classList.add('hidden');
      batchGrid.innerHTML = '';
      extractedBatchItems = [];

      try {
        batchStatusText.textContent = 'กำลังดึงข้อมูล ' + lines.length + ' รายการ...';
        const res = await fetch('/api/extract-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: lines })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Batch extraction failed');

        (data.success || []).forEach((pin, index) => {
          const m = pin.media[0];
          if (m) {
            const url = m.originalUrl || m.url;
            const ext = m.type === 'video' ? 'mp4' : (url.includes('.png') ? 'png' : 'jpg');
            const cleanTitle = (pin.title || ('pin_' + index)).replace(/[^a-zA-Z0-9_\u0E00-\u0E7F]/g, '_');
            extractedBatchItems.push({
              url: url,
              filename: (index + 1) + '_' + cleanTitle + '.' + ext,
              thumbnail: m.thumbnailUrl || url
            });

            if (!savedMoodboardImages.includes(url)) {
              savedMoodboardImages.push(url);
            }
          }
        });

        updateReelsQueueCount();
        batchSuccessCount.textContent = extractedBatchItems.length;

        // Render preview cards
        extractedBatchItems.forEach(item => {
          const card = document.createElement('div');
          card.className = 'rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative group aspect-[3/4]';
          card.innerHTML = '<img src="' + item.thumbnail + '" class="w-full h-full object-cover" /><div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-xs text-white"><p class="truncate font-semibold">' + item.filename + '</p></div>';
          batchGrid.appendChild(card);
        });

        batchResultContainer.classList.remove('hidden');
      } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
      } finally {
        batchLoading.classList.add('hidden');
      }
    });

    downloadZipBtn.addEventListener('click', async () => {
      if (extractedBatchItems.length === 0) return;
      const res = await fetch('/api/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: extractedBatchItems })
      });
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'pinterest_media_bundle.zip';
      link.click();
    });

    sendBatchToReelsBtn.addEventListener('click', () => {
      switchTab('reels');
    });

    // ================= MOODBOARD GENERATOR LOGIC =================
    const moodboardCanvas = document.getElementById('moodboardCanvas');
    const moodboardRatio = document.getElementById('moodboardRatio');
    const generateMoodboardBtn = document.getElementById('generateMoodboardBtn');
    const exportMoodboardBtn = document.getElementById('exportMoodboardBtn');

    async function renderMoodboard() {
      const ctx = moodboardCanvas.getContext('2d');
      if (!ctx) return;

      const ratio = moodboardRatio.value;
      let width = 1920;
      let height = 1080;
      if (ratio === 'a4') { width = 1240; height = 1754; }
      else if (ratio === 'story') { width = 1080; height = 1920; }

      moodboardCanvas.width = width;
      moodboardCanvas.height = height;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      const count = Math.min(savedMoodboardImages.length, 6);
      if (count === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ยังไม่มีภาพใน Moodboard (ดึงภาพจาก Tab 1 หรือ Tab 2 ก่อน)', width / 2, height / 2);
        return;
      }

      const cols = count <= 2 ? count : (count <= 4 ? 2 : 3);
      const rows = Math.ceil(count / cols);
      const padding = 24;
      const cellW = (width - padding * (cols + 1)) / cols;
      const cellH = (height - 120 - padding * (rows + 1)) / rows;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('PINTEREST CREATIVE MOODBOARD', padding, 50);

      for (let i = 0; i < count; i++) {
        const x = padding + (i % cols) * (cellW + padding);
        const y = 80 + padding + Math.floor(i / cols) * (cellH + padding);

        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = '/api/proxy-download?url=' + encodeURIComponent(savedMoodboardImages[i]);
          await new Promise((res) => {
            img.onload = () => {
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(x, y, cellW, cellH, 16);
              ctx.clip();
              const scale = Math.max(cellW / img.width, cellH / img.height);
              const sw = cellW / scale;
              const sh = cellH / scale;
              const sx = (img.width - sw) / 2;
              const sy = (img.height - sh) / 2;
              ctx.drawImage(img, sx, sy, sw, sh, x, y, cellW, cellH);
              ctx.restore();
              res();
            };
            img.onerror = () => res();
          });
        } catch {}
      }
    }

    generateMoodboardBtn.addEventListener('click', renderMoodboard);
    moodboardRatio.addEventListener('change', renderMoodboard);

    exportMoodboardBtn.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = moodboardCanvas.toDataURL('image/png');
      a.download = 'pinterest_moodboard.png';
      a.click();
    });

    // ================= TIKTOK / REELS GENERATOR LOGIC =================
    const reelsCanvas = document.getElementById('reelsCanvas');
    const reelsVideoPreview = document.getElementById('reelsVideoPreview');
    const generateReelBtn = document.getElementById('generateReelBtn');
    const downloadReelBtn = document.getElementById('downloadReelBtn');
    const reelSpeed = document.getElementById('reelSpeed');
    const speedValText = document.getElementById('speedValText');
    const reelEffect = document.getElementById('reelEffect');
    const reelMusic = document.getElementById('reelMusic');
    const reelRecordingBadge = document.getElementById('reelRecordingBadge');
    const reelStatusText = document.getElementById('reelStatusText');
    const loadDemoPinsBtn = document.getElementById('loadDemoPinsBtn');
    const reelsDirectForm = document.getElementById('reelsDirectForm');
    const reelsDirectUrlInput = document.getElementById('reelsDirectUrlInput');

    let recordedReelBlob = null;

    // Load Demo Pins Button
    loadDemoPinsBtn.addEventListener('click', () => {
      savedMoodboardImages = [
        'https://i.pinimg.com/originals/1b/73/c0/1b73c02835aaf327fbe2ac32d84fba00.png',
        'https://i.pinimg.com/originals/d5/3b/01/d53b014d86a6b6761bf649a0ed813c2b.png'
      ];
      updateReelsQueueCount();
      alert('โหลดภาพตัวอย่างไอเดียสวยงาม 2 ภาพเข้าสู่คิวเรียบร้อย! สามารถกด "สร้าง & อัดคลิปวิดีโอ" ได้ทันทีครับ');
    });

    // Direct Pin Input inside Reels Tab
    reelsDirectForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = reelsDirectUrlInput.value.trim();
      if (!url) return;

      reelStatusText.textContent = 'กำลังดึงภาพเพื่อเพิ่มเข้าคิวคลิป...';
      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to extract');

        const m = data.media[0];
        const imgUrl = m.originalUrl || m.url;
        if (!savedMoodboardImages.includes(imgUrl)) {
          savedMoodboardImages.push(imgUrl);
        }
        updateReelsQueueCount();
        reelsDirectUrlInput.value = '';
        reelStatusText.textContent = '✅ เพิ่ม "' + data.title + '" เข้าคิวคลิปสำเร็จแล้ว! (รวม ' + savedMoodboardImages.length + ' ภาพ)';
      } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
      }
    });

    reelSpeed.addEventListener('input', () => {
      speedValText.textContent = reelSpeed.value + ' วินาที / รูป';
    });

    // Web Audio Synthesizer for Real-time Lo-Fi / Beat Track
    function createReelAudioStream(durationSec, mood) {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      const bpm = mood === 'upbeat' ? 120 : (mood === 'aesthetic' ? 70 : 80);
      const beatInterval = 60 / bpm;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(dest);

      osc.type = mood === 'upbeat' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(mood === 'upbeat' ? 140 : 220, audioCtx.currentTime);

      const totalBeats = Math.ceil(durationSec / beatInterval);
      for (let i = 0; i < totalBeats; i++) {
        const time = audioCtx.currentTime + i * beatInterval;
        const kickOsc = audioCtx.createOscillator();
        const kickGain = audioCtx.createGain();
        kickOsc.frequency.setValueAtTime(150, time);
        kickOsc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);
        kickGain.gain.setValueAtTime(0.4, time);
        kickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        kickOsc.connect(kickGain);
        kickGain.connect(dest);
        kickOsc.start(time);
        kickOsc.stop(time + 0.3);
      }

      osc.start();
      setTimeout(() => {
        osc.stop();
        audioCtx.close();
      }, durationSec * 1000 + 500);

      return dest.stream.getAudioTracks()[0];
    }

    generateReelBtn.addEventListener('click', async () => {
      const imagesToRender = savedMoodboardImages.slice(0, 8);
      if (imagesToRender.length === 0) {
        alert('กรุณาวางลิงก์ภาพ หรือกดปุ่ม "✨ โหลดภาพตัวอย่างทันที" ก่อนสร้างคลิปครับ!');
        return;
      }

      const ctx = reelsCanvas.getContext('2d');
      if (!ctx) return;

      const W = 720;
      const H = 1280;
      reelsCanvas.width = W;
      reelsCanvas.height = H;

      reelsVideoPreview.classList.add('hidden');
      reelsCanvas.classList.remove('hidden');
      reelRecordingBadge.classList.remove('hidden');
      downloadReelBtn.classList.add('hidden');
      generateReelBtn.disabled = true;

      // Load all images first
      reelStatusText.textContent = 'กำลังดาวน์โหลดและเตรียมภาพทั้งหมด...';
      const loadedImgs = [];
      for (const src of imagesToRender) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = '/api/proxy-download?url=' + encodeURIComponent(src);
          await new Promise((resolve) => {
            img.onload = () => { loadedImgs.push(img); resolve(); };
            img.onerror = () => resolve();
          });
        } catch {}
      }

      if (loadedImgs.length === 0) {
        alert('ไม่สามารถโหลดภาพได้');
        generateReelBtn.disabled = false;
        reelRecordingBadge.classList.add('hidden');
        return;
      }

      const secPerImg = parseFloat(reelSpeed.value);
      const totalDuration = loadedImgs.length * secPerImg;
      const effectType = reelEffect.value;
      const musicMood = reelMusic.value;

      // Setup MediaRecorder
      const canvasStream = reelsCanvas.captureStream(30);
      const audioTrack = createReelAudioStream(totalDuration, musicMood);
      if (audioTrack) {
        canvasStream.addTrack(audioTrack);
      }

      const mediaRecorder = new MediaRecorder(canvasStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm'
      });
      const recordedChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        recordedReelBlob = new Blob(recordedChunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(recordedReelBlob);
        reelsVideoPreview.src = videoUrl;
        reelsCanvas.classList.add('hidden');
        reelsVideoPreview.classList.remove('hidden');
        downloadReelBtn.classList.remove('hidden');
        reelRecordingBadge.classList.add('hidden');
        generateReelBtn.disabled = false;
        reelStatusText.textContent = '🎉 เรนเดอร์คลิป TikTok 9:16 พร้อมเพลงสำเร็จแล้ว! สามารถกดเล่นหรือดาวน์โหลดได้เลย';
      };

      mediaRecorder.start();
      reelStatusText.textContent = 'กำลังเรนเดอร์แอนิเมชัน & บันทึกเสียงเพลง Beat-Sync...';

      const startTime = performance.now();

      function animate(now) {
        const elapsed = (now - startTime) / 1000;
        if (elapsed >= totalDuration) {
          mediaRecorder.stop();
          return;
        }

        const imgIdx = Math.floor(elapsed / secPerImg) % loadedImgs.length;
        const progressInImg = (elapsed % secPerImg) / secPerImg;
        const currentImg = loadedImgs[imgIdx];
        const nextImg = loadedImgs[(imgIdx + 1) % loadedImgs.length];

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);

        // Draw background blurred
        ctx.save();
        ctx.filter = 'blur(40px) brightness(0.6)';
        ctx.drawImage(currentImg, -50, -50, W + 100, H + 100);
        ctx.restore();

        // Ken Burns Zoom Math
        let zoom = 1.0;
        if (effectType === 'kenburns') {
          zoom = 1.0 + progressInImg * 0.15;
        }

        const scale = Math.min((W * 0.92) / currentImg.width, (H * 0.82) / currentImg.height) * zoom;
        const dw = currentImg.width * scale;
        const dh = currentImg.height * scale;
        const dx = (W - dw) / 2;
        const dy = (H - dh) / 2;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 40;

        if (progressInImg > 0.8 && nextImg && effectType === 'crossfade') {
          const fadeAlpha = (progressInImg - 0.8) / 0.2;
          ctx.globalAlpha = 1 - fadeAlpha;
          ctx.drawImage(currentImg, dx, dy, dw, dh);
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = fadeAlpha;
          const nextScale = Math.min((W * 0.92) / nextImg.width, (H * 0.82) / nextImg.height);
          const ndw = nextImg.width * nextScale;
          const ndh = nextImg.height * nextScale;
          ctx.drawImage(nextImg, (W - ndw) / 2, (H - ndh) / 2, ndw, ndh);
          ctx.restore();
        } else {
          ctx.drawImage(currentImg, dx, dy, dw, dh);
          ctx.restore();
        }

        // Draw TikTok / Reel Overlay Graphics
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Plus Jakarta Sans, sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        ctx.fillText('✨ PINTEREST AESTHETIC REEL', 30, 80);

        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(30, 95, (W - 60) * (elapsed / totalDuration), 4);
        ctx.restore();

        requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
    });

    downloadReelBtn.addEventListener('click', () => {
      if (!recordedReelBlob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(recordedReelBlob);
      a.download = 'pinterest_tiktok_reel_9x16.webm';
      a.click();
    });

    // ================= SMART SOCIAL RESIZER MODAL =================
    const resizerModal = document.getElementById('resizerModal');
    const closeResizerBtn = document.getElementById('closeResizerBtn');
    const resizerCanvas = document.getElementById('resizerCanvas');
    const downloadResizedBtn = document.getElementById('downloadResizedBtn');
    const resizeRatio916 = document.getElementById('resizeRatio916');
    const resizeRatio11 = document.getElementById('resizeRatio11');
    const resizeRatio45 = document.getElementById('resizeRatio45');

    let currentResizerAspect = '9-16';

    function drawResizedPreview() {
      if (!currentMediaUrl) return;
      const ctx = resizerCanvas.getContext('2d');
      if (!ctx) return;

      let w = 1080;
      let h = 1920;
      if (currentResizerAspect === '1-1') { w = 1080; h = 1080; }
      else if (currentResizerAspect === '4-5') { w = 1080; h = 1350; }

      resizerCanvas.width = w;
      resizerCanvas.height = h;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = '/api/proxy-download?url=' + encodeURIComponent(currentMediaUrl);
      img.onload = () => {
        ctx.save();
        ctx.filter = 'blur(40px) brightness(0.7)';
        ctx.drawImage(img, -40, -40, w + 80, h + 80);
        ctx.restore();

        const scale = Math.min((w * 0.9) / img.width, (h * 0.9) / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 30;
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      };
    }

    openResizerBtn.addEventListener('click', () => {
      resizerModal.classList.remove('hidden');
      drawResizedPreview();
    });

    closeResizerBtn.addEventListener('click', () => resizerModal.classList.add('hidden'));

    resizeRatio916.addEventListener('click', () => { currentResizerAspect = '9-16'; drawResizedPreview(); });
    resizeRatio11.addEventListener('click', () => { currentResizerAspect = '1-1'; drawResizedPreview(); });
    resizeRatio45.addEventListener('click', () => { currentResizerAspect = '4-5'; drawResizedPreview(); });

    downloadResizedBtn.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = resizerCanvas.toDataURL('image/jpeg', 0.95);
      a.download = 'resized_social_' + currentResizerAspect + '.jpg';
      a.click();
    });
  </script>
</body>
</html>`;
}

export function createServer(): http.Server {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    // 1. Serve Web UI
    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(renderHTML());
      return;
    }

    // 2. API: Extract Single Media
    if (req.method === "POST" && url.pathname === "/api/extract") {
      let body = "";
      req.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const parsed = JSON.parse(body) as { url?: string };
          if (!parsed.url) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing Pinterest URL" }));
            return;
          }

          const pinData = await extractPinterestMedia(parsed.url);
          const palette = generateSamplePalette(pinData.title);

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ...pinData, palette }));
        } catch (error: unknown) {
          const errMsg = error instanceof Error ? error.message : "Internal Server Error";
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: errMsg }));
        }
      });
      return;
    }

    // 3. API: Extract Batch / Board
    if (req.method === "POST" && url.pathname === "/api/extract-batch") {
      let body = "";
      req.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const parsed = JSON.parse(body) as { urls?: string[] };
          const rawUrls = parsed.urls || [];
          let targetUrls: string[] = [];

          for (const item of rawUrls) {
            if (item.includes("/pin/")) {
              targetUrls.push(item);
            } else if (item.includes("pinterest.com/")) {
              const boardPins = await extractBoardPinUrls(item);
              targetUrls.push(...boardPins);
            }
          }

          const result = await extractBatchMedia(targetUrls);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (error: unknown) {
          const errMsg = error instanceof Error ? error.message : "Batch extraction error";
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: errMsg }));
        }
      });
      return;
    }

    // 4. API: Download ZIP Archive
    if (req.method === "POST" && url.pathname === "/api/download-zip") {
      let body = "";
      req.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const parsed = JSON.parse(body) as { entries?: ZipEntry[] };
          const entries = parsed.entries || [];

          res.writeHead(200, {
            "Content-Type": "application/zip",
            "Content-Disposition": 'attachment; filename="pinterest_bundle.zip"',
          });

          await createZipStream(entries, res);
        } catch (error: unknown) {
          const errMsg = error instanceof Error ? error.message : "ZIP package error";
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: errMsg }));
          }
        }
      });
      return;
    }

    // 5. API: Proxy Direct Download with Attachment header
    if (req.method === "GET" && url.pathname === "/api/proxy-download") {
      const targetUrl = url.searchParams.get("url");
      const fallbackUrl = url.searchParams.get("fallback");
      const title = (url.searchParams.get("title") || "pinterest_media").replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, "_");

      if (!targetUrl) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Missing target URL");
        return;
      }

      try {
        let upstream = await fetch(targetUrl);
        let finalUrl = targetUrl;

        // Fallback if target original returned 403 or 404
        if (!upstream.ok && fallbackUrl) {
          upstream = await fetch(fallbackUrl);
          finalUrl = fallbackUrl;
        }

        if (!upstream.ok) {
          throw new Error(`Upstream fetch failed: ${upstream.status}`);
        }

        const ext = finalUrl.includes(".mp4")
          ? "mp4"
          : finalUrl.includes(".png")
            ? "png"
            : finalUrl.includes(".webp")
              ? "webp"
              : "jpg";
        const filename = `${title}.${ext}`;

        res.writeHead(200, {
          "Content-Type": upstream.headers.get("content-type") || (ext === "mp4" ? "video/mp4" : "image/jpeg"),
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        });

        if (upstream.body) {
          const reader = upstream.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        }
        res.end();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(`Proxy download error: ${msg}`);
      }
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });
}

if (process.env["NODE_ENV"] !== "test") {
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`🚀 Pinterest Media Studio Server running at http://localhost:${PORT}`);
  });
}
