export interface UserProfile {
  id: string;
  name: string;
  age?: number;
}

export function isUserProfile(data: unknown): data is UserProfile {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return typeof obj["id"] === "string" && typeof obj["name"] === "string";
}

export function processUserData(data: unknown): string {
  if (!isUserProfile(data)) {
    throw new TypeError("Invalid UserProfile");
  }
  return data.name;
}

export function checkStatus(isActive: boolean): number {
  const activeStatus = 1;
  const inactiveStatus = 0;
  if (isActive) {
    return activeStatus;
  }
  return inactiveStatus;
}
