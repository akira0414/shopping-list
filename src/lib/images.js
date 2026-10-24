export async function prepareImage(file) {
  if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("請選擇 JPEG、PNG 或 WebP 圖片；HEIC 等格式請先轉換");
  const url = URL.createObjectURL(file);
  let image;
  try {
    image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () =>
        reject(new Error("無法解碼圖片，請重新選擇或轉換格式"));
      image.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight)
      throw new Error("圖片內容無效");
    const ratio = Math.min(
      1,
      1600 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("此裝置無法處理圖片");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    // PNG preserves transparency. JPEG/WebP photographs are compressed as JPEG.
    const output = canvas.toDataURL(
      file.type === "image/png" ? "image/png" : "image/jpeg",
      0.82,
    );
    if (!output.startsWith("data:image/")) throw new Error("圖片轉換失敗");
    return output;
  } catch (error) {
    throw new Error(error.message || "圖片讀取失敗，請重試");
  } finally {
    if (image) image.src = "";
    URL.revokeObjectURL(url);
  }
}
