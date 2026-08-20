import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<string>): Promise<void> {
  const start = Date.now();
  try {
    const message = await fn();
    const durationMs = Date.now() - start;
    results.push({ name, passed: true, message, durationMs });
    console.log(`✅ [PASS] ${name} (${durationMs}ms)\n   ↳ ${message}`);
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    const errMsg = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, message: errMsg, durationMs });
    console.error(`❌ [FAIL] ${name} (${durationMs}ms)\n   ↳ ${errMsg}`);
  }
}

async function testYtDlpInstalled(): Promise<string> {
  const { stdout } = await execFileAsync("yt-dlp", ["--version"]);
  const version = stdout.trim();
  return `yt-dlp พร้อมใช้งาน (เวอร์ชัน: ${version})`;
}

async function testYtDlpExtractInfo(): Promise<string> {
  // ทดสอบดึง metadata ของวิดีโอ Open Source: Big Buck Bunny
  const testUrl = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";
  const { stdout } = await execFileAsync("yt-dlp", ["--dump-json", "--playlist-items", "1", testUrl]);
  const parsed = JSON.parse(stdout) as Record<string, unknown>;
  const title = typeof parsed["title"] === "string" ? parsed["title"] : "Unknown";
  const duration = typeof parsed["duration"] === "number" ? parsed["duration"] : 0;
  return `ดึงข้อมูลสำเร็จ: "${title}" (ความยาว: ${duration} วินาที)`;
}

async function testOxlintQualityGate(): Promise<string> {
  const { stdout } = await execFileAsync("npx", ["oxlint", "src", "--deny-warnings"], { shell: true });
  return `Oxlint ตรวจสอบโค้ดทั้งหมดใน src/ ผ่านฉลุย: ${stdout.trim() || "0 errors, 0 warnings"}`;
}

async function main(): Promise<void> {
  console.log("==================================================");
  console.log("🚀 เริ่มต้นระบบทดสอบโปรเจกต์ (Automated Test Suite)");
  console.log("==================================================\n");

  await runTest("1. ตรวจสอบการติดตั้ง yt-dlp ในเครื่อง", testYtDlpInstalled);
  await runTest("2. ทดสอบดึงข้อมูล Metadata วิดีโอผ่าน yt-dlp", testYtDlpExtractInfo);
  await runTest("3. ทดสอบระบบ Anti-Slop Linter (Oxlint)", testOxlintQualityGate);

  console.log("\n==================================================");
  const totalPassed = results.filter((r) => r.passed).length;
  console.log(`📊 ผลการทดสอบ: ผ่าน ${totalPassed}/${results.length} รายการ`);
  console.log("==================================================");

  if (totalPassed !== results.length) {
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
