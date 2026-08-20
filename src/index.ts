export interface UserProfile {
  id: string;
  name: string;
  age?: number;
}

/**
 * Type Guard: ตรวจสอบความถูกต้องของข้อมูลตามหลัก Evidence-based
 */
export function isUserProfile(data: unknown): data is UserProfile {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return typeof obj["id"] === "string" && typeof obj["name"] === "string";
}

/**
 * ฟังก์ชันประมวลผลข้อมูลที่ปลอดภัยจาก Slop
 */
export function processUserData(data: unknown): string {
  if (!isUserProfile(data)) {
    throw new TypeError("Invalid UserProfile data received");
  }
  return data.name;
}

export function main(): void {
  const sampleUser: unknown = {
    id: "usr_123",
    name: "Thanon",
    age: 25,
  };

  const name = processUserData(sampleUser);
  console.log(`User name: ${name}`);
}

main();
