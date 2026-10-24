// Recovered from doujin-shopping-list.apk; original local names may be abbreviated.
import { EditProductIcon } from "./Icons.jsx";
import { PlusIcon, TrashIcon, React } from "./../vendor/runtime.js";

export function CategoriesPage({
  categories: categories,
  onAdd: onAdd,
  onDelete: onDelete,
  onEdit,
  theme: theme,
}) {
  return (
    <div className="p-6">
      {
        <header className="flex justify-between items-center mb-8">
          {<h2 className="text-2xl font-black text-[#666666]">{"分類管理"}</h2>}
          {
            <button
              onClick={onAdd}
              aria-label="新增分類"
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/5 hover:scale-110 active:scale-95 transition-all"
              style={{
                backgroundColor: theme.primary,
                color: theme.onPrimary || "#fff",
              }}
            >
              {<PlusIcon className="w-6 h-6" />}
            </button>
          }
        </header>
      }
      {
        <div className="space-y-3">
          {categories.map((c) => (
            <div
              className="category-management-row bg-white rounded-2xl shadow-sm flex items-center justify-between"
              key={c.id}
            >
              {
                <button
                  type="button"
                  className="category-edit-button"
                  aria-label={`編輯分類 ${c.name}`}
                  onClick={() => onEdit(c)}
                >
                  {
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                  }
                  {<span className="font-bold text-[#666666]">{c.name}</span>}
                  <EditProductIcon />
                </button>
              }
              {
                <button
                  onClick={() => onDelete(c.id)}
                  aria-label={`刪除分類 ${c.name}`}
                  className="text-red-300 hover:text-red-500 transition-colors"
                >
                  {<TrashIcon className="w-5 h-5" />}
                </button>
              }
            </div>
          ))}
        </div>
      }
    </div>
  );
}
