import * as archiverModule from "archiver";
import type { Writable } from "node:stream";

export interface ZipEntry {
  url: string;
  filename: string;
}

type ArchiverFormat = "zip" | "tar";
type ArchiverFactory = (format: ArchiverFormat, options?: archiverModule.ArchiverOptions) => archiverModule.Archiver;

function getArchiverInstance(options: archiverModule.ArchiverOptions): archiverModule.Archiver {
  const factory: ArchiverFactory =
    (archiverModule as unknown as { default?: ArchiverFactory }).default ??
    (archiverModule as unknown as ArchiverFactory);
  return factory("zip", options);
}

/**
 * รวมรูปภาพ/วิดีโอหลาย ๆ ไฟล์ให้เป็น ZIP stream ส่งตรงให้เบราว์เซอร์ดาวน์โหลด
 */
export async function createZipStream(entries: ZipEntry[], outputStream: Writable): Promise<void> {
  return new Promise((resolve, reject) => {
    const archive = getArchiverInstance({
      zlib: { level: 6 },
    });

    archive.on("error", (err: unknown) => {
      reject(err instanceof Error ? err : new Error(String(err)));
    });

    archive.on("end", () => {
      resolve();
    });

    archive.pipe(outputStream);

    void (async () => {
      try {
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          if (!entry) continue;

          try {
            const res = await fetch(entry.url);
            if (res.ok && res.body) {
              const arrayBuffer = await res.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              archive.append(buffer, { name: entry.filename });
            }
          } catch {
            // ข้ามไฟล์ที่ดาวน์โหลดไม่สำเร็จเพื่อไม่ให้การรวม ZIP พัง
          }
        }
        await archive.finalize();
      } catch (err: unknown) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    })();
  });
}
