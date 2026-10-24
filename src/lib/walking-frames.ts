/** Build game-only stepping poses from the equipped turnaround without replacing its artwork. */
export async function createWalkingFrames(src: string): Promise<string[]> {
  const image = new Image();
  image.src = src;
  await image.decode();
  const size = 280, split = 196;
  return [0, 1, 0, -1].map(step => {
    if (!step) return src;
    const canvas = document.createElement("canvas"); canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d"); if (!ctx) return src;
    // Keep face, mane and clothing stable; alternate the two lower-body halves.
    ctx.drawImage(image, 0, 0, image.width, image.height * split / size, 0, 0, size, split);
    const sourceY = image.height * split / size;
    ctx.drawImage(image, 0, sourceY, image.width / 2, image.height - sourceY, -step * 2, split - step * 3, size / 2 + step * 2, size - split + step * 3);
    ctx.drawImage(image, image.width / 2, sourceY, image.width / 2, image.height - sourceY, size / 2, split + step * 3, size / 2 + step * 2, size - split - step * 3);
    return canvas.toDataURL("image/png");
  });
}