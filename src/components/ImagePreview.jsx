// Recovered from doujin-shopping-list.apk; original local names may be abbreviated.
import { useDialogFocus } from "../lib/useDialogFocus.js";
import { motion, CloseIcon, React } from "./../vendor/runtime.js";

export function ImagePreview({ imageUrl: imageUrl, onClose: onClose }) {
  const ref = React.useRef(null);
  useDialogFocus(ref, ref, onClose);
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="圖片預覽"
      tabIndex={-1}
      className="image-preview-overlay fixed inset-0 z-[200] flex items-center justify-center p-4"
    >
      {
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
        />
      }
      {
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-full max-h-full flex flex-col items-center gap-6"
        >
          {
            <div className="relative overflow-hidden rounded-3xl shadow-2xl">
              {
                <img
                  src={imageUrl}
                  alt="商品或攤位圖片放大預覽"
                  className="max-w-full max-h-[75vh] object-contain"
                  referrerPolicy="no-referrer"
                />
              }
            </div>
          }
          {
            <button
              onClick={onClose}
              aria-label="關閉圖片預覽"
              className="w-14 h-14 bg-white text-gray-900 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
            >
              {<CloseIcon className="w-8 h-8" />}
            </button>
          }
        </motion.div>
      }
    </div>
  );
}
