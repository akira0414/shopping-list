// Recovered from doujin-shopping-list.apk; original local names may be abbreviated.
import {
  ChevronRightIcon,
  motion,
  PlusIcon,
  CalendarIcon,
  MapPinIcon,
  SettingsIcon,
  React,
  ExternalLinkIcon,
} from "./../vendor/runtime.js";

export function EventsPage({
  events: events,
  currentEventId: currentEventId,
  onSelect: onSelect,
  onAdd: onAdd,
  onEdit: onEdit,
  theme: theme,
}) {
  return (
    <div className="p-6">
      {
        <header className="flex justify-between items-center mb-10">
          {
            <div>
              {
                <h1 className="text-3xl font-black text-[#333333] mb-1">
                  {"場次空間"}
                </h1>
              }
              {
                <p className="text-xs font-bold text-gray-400">
                  {"管理您的參戰場次與預算"}
                </p>
              }
            </div>
          }
          {
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAdd}
              aria-label="新增場次"
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{
                backgroundColor: theme.primary,
                color: theme.onPrimary || "#fff",
              }}
            >
              {<PlusIcon className="w-6 h-6" />}
            </motion.button>
          }
        </header>
      }
      {
        <div className="space-y-6">
          {events.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              {
                <div className="w-24 h-24 bg-gray-100 rounded-[40px] flex items-center justify-center mx-auto text-gray-300">
                  {<CalendarIcon className="w-10 h-10" />}
                </div>
              }
              {
                <p className="text-gray-400 font-black">
                  {"點擊右上方按鈕新增第一場次"}
                </p>
              }
            </div>
          ) : (
            events.map((f) => {
              const m = f.id === currentEventId;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`event-card bg-white p-6 rounded-[32px] shadow-sm border-2 transition-all relative overflow-hidden group ${m ? "" : "border-transparent"}`}
                  style={{ borderColor: m ? theme.primary : void 0 }}
                  onClick={() => onSelect(f.id)}
                  key={f.id}
                >
                  {
                    <div className="flex justify-between items-start">
                      {
                        <div className="flex-grow">
                          {
                            <div className="event-card-title flex items-center gap-2 mb-2">
                              {
                                <h3 className="text-xl font-black text-[#333333]">
                                  {f.name}
                                </h3>
                              }
                              {m && (
                                <div
                                  className="w-2 h-2 rounded-full animate-pulse"
                                  style={{ backgroundColor: theme.primary }}
                                />
                              )}
                            </div>
                          }
                          {
                            <div className="grid grid-cols-2 gap-4">
                              {
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 px-3 py-2 rounded-xl">
                                  {<CalendarIcon className="w-3.5 h-3.5" />}{" "}
                                  {f.date}
                                </div>
                              }
                              {
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 px-3 py-2 rounded-xl">
                                  {<MapPinIcon className="w-3.5 h-3.5" />}{" "}
                                  {f.location}
                                </div>
                              }
                            </div>
                          }
                          {f.eventUrl && (
                            <a
                              className="event-site-link"
                              href={f.eventUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`活動網站 ${f.name}`}
                            >
                              <ExternalLinkIcon />
                              活動網站
                            </a>
                          )}
                          {
                            <div className="mt-4 flex items-center justify-between">
                              {
                                <div className="flex flex-col">
                                  {
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">
                                      {"預算總額"}
                                    </span>
                                  }
                                  {
                                    <span
                                      className="text-lg font-black"
                                      style={{
                                        color: theme.text || theme.primary,
                                      }}
                                    >
                                      {"$"}
                                      {f.budget.toLocaleString()}
                                    </span>
                                  }
                                </div>
                              }
                              {
                                <button
                                  type="button"
                                  aria-label={`進入清單 ${f.name}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onSelect(f.id);
                                  }}
                                  className="event-enter-button flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl group-hover:bg-white transition-colors"
                                >
                                  {
                                    <span className="text-xs font-black text-gray-400">
                                      {"進入清單"}
                                    </span>
                                  }
                                  {
                                    <ChevronRightIcon className="w-4 h-4 text-gray-300" />
                                  }
                                </button>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                  {
                    <button
                      aria-label={`編輯場次 ${f.name}`}
                      onClick={(p) => {
                        (p.stopPropagation(), onEdit(f));
                      }}
                      className="event-settings-button absolute right-4 top-4 w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 transition-all"
                    >
                      {<SettingsIcon className="w-5 h-5" />}
                    </button>
                  }
                </motion.div>
              );
            })
          )}
        </div>
      }
    </div>
  );
}
