import { Capacitor } from "@capacitor/core";
import { createBackup } from "./data.js";
export async function exportBackup(data) {
  const content = JSON.stringify(createBackup(data), null, 2);
  const filename = `場購清單-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory, Encoding } =
      await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");
    const { uri } = await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    try {
      await Share.share({
        title: "場購清單備份",
        files: [uri],
        dialogTitle: "儲存或分享備份",
      });
    } catch (error) {
      if (/cancel|canceled|cancelled/i.test(error.message || "")) return;
      throw error;
    }
  } else {
    const url = URL.createObjectURL(
      new Blob([content], { type: "application/json;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}
