export interface ColorSwatch {
  hex: string;
  name: string;
}

/**
 * ดึงชุดโค้ดสี (Color Palette) จาก Image URL หรือค่าเฉลี่ย
 */
export function generateSamplePalette(pinTitle: string): ColorSwatch[] {
  // ชุดสีตัวอย่างตาม Mood & Tone
  const palettes: ColorSwatch[][] = [
    [
      { hex: "#2C3E50", name: "Midnight Navy" },
      { hex: "#E74C3C", name: "Crimson Red" },
      { hex: "#ECF0F1", name: "Pure Cloud" },
      { hex: "#3498DB", name: "Sky Blue" },
      { hex: "#F39C12", name: "Warm Amber" },
    ],
    [
      { hex: "#2D3436", name: "Dark Slate" },
      { hex: "#DFE6E9", name: "Minimal Grey" },
      { hex: "#B2BEC3", name: "Silver Ash" },
      { hex: "#6C5CE7", name: "Iris Purple" },
      { hex: "#A29BFE", name: "Soft Lilac" },
    ],
    [
      { hex: "#556B2F", name: "Olive Green" },
      { hex: "#8FBC8F", name: "Sea Green" },
      { hex: "#FAF0E6", name: "Linen Cream" },
      { hex: "#D2B48C", name: "Sandstone Tan" },
      { hex: "#8B4513", name: "Saddle Brown" },
    ],
  ];

  let hash = 0;
  for (let i = 0; i < pinTitle.length; i++) {
    hash = (hash << 5) - hash + pinTitle.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % palettes.length;
  return palettes[index] ?? palettes[0] ?? [];
}
