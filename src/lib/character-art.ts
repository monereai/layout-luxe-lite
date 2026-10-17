import type { ShopItem } from "@/lib/shop";
import { LOOKS_WITH_ART } from "@/lib/shop-combinations";

export type ClothingFrame = { item: ShopItem; src: string; turnaround: boolean };

/** Every selected extra uses the current angle, never a front-only visibility gate. */
export function clothingFrames(items: ShopItem[], frame: number): ClothingFrame[] {
  return [...items].sort((a, b) => order[a.category] - order[b.category]).map((item) => ({
    item,
    turnaround: LOOKS_WITH_ART.has(item.id),
    src: LOOKS_WITH_ART.has(item.id) ? `/monere/looks/${item.id}/${frame}.webp` : item.src,
  }));
}

const order = { costume: 0, footwear: 1, accessory: 2, hat: 3, glasses: 4 };
const regions = {
  hat: [0, 0.23], glasses: [0.08, 0.26], accessory: [0.2, 0.42],
  costume: [0.23, 0.86], footwear: [0.82, 1],
} as const;
const positions = {
  hat: [0.33, -0.02, 0.3, 0.16], glasses: [0.38, 0.115, 0.21, 0.08],
  accessory: [0.4, 0.27, 0.16, 0.12], costume: [0.28, 0.26, 0.4, 0.36],
  footwear: [0.21, 0.79, 0.56, 0.21],
} as const;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Character image unavailable: ${src}`));
    image.src = src;
  });
}

/** Compose the selected angle into one complete image, rather than front-facing DOM accessories. */
export async function composeCharacterFrame(baseSrc: string, extras: ClothingFrame[], frame: number): Promise<string> {
  const [base, plain, ...clothes] = await Promise.all([
    loadImage(baseSrc), loadImage(`/monere/looks/default/${frame}.webp`),
    ...extras.map(({ src }) => loadImage(src)),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = base.naturalWidth;
  canvas.height = base.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) return baseSrc;
  context.drawImage(base, 0, 0, canvas.width, canvas.height);
  const reference = document.createElement("canvas");
  reference.width = canvas.width;
  reference.height = canvas.height;
  const referenceContext = reference.getContext("2d");
  if (!referenceContext) return baseSrc;
  referenceContext.drawImage(plain, 0, 0, canvas.width, canvas.height);
  const original = referenceContext.getImageData(0, 0, canvas.width, canvas.height).data;
  extras.forEach(({ item, turnaround }, index) => {
    const image = clothes[index];
    if (!image) return;
    if (!turnaround) {
      const [x, y, w, h] = positions[item.category];
      // Keep newer items without turnaround art attached at every angle, too.
      const side = frame === 2 || frame === 6;
      const width = w * (side ? 0.65 : 1);
      context.drawImage(image, (x + (w - width) / 2) * canvas.width, y * canvas.height, width * canvas.width, h * canvas.height);
      return;
    }
    referenceContext.clearRect(0, 0, canvas.width, canvas.height);
    referenceContext.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = referenceContext.getImageData(0, 0, canvas.width, canvas.height);
    const [top, bottom] = regions[item.category];
    for (let offset = 0; offset < pixels.data.length; offset += 4) {
      const y = Math.floor(offset / 4 / canvas.width) / canvas.height;
      const difference = Math.abs((pixels.data[offset] ?? 0) - (original[offset] ?? 0))
        + Math.abs((pixels.data[offset + 1] ?? 0) - (original[offset + 1] ?? 0))
        + Math.abs((pixels.data[offset + 2] ?? 0) - (original[offset + 2] ?? 0))
        + Math.abs((pixels.data[offset + 3] ?? 0) - (original[offset + 3] ?? 0));
      if (y < top || y > bottom || difference < 65) pixels.data[offset + 3] = 0;
    }
    referenceContext.putImageData(pixels, 0, 0);
    context.drawImage(reference, 0, 0);
  });
  return canvas.toDataURL("image/png");
}