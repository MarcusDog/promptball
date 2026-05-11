import { getCurrentWindow, PhysicalPosition } from "@tauri-apps/api/window";
import { useRef, useState, type ReactNode } from "react";
import { getStatusLabel } from "@/features/floating-ball/floating-ball";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import floatingBallActive from "../../../assets/promptball/icons/floating-ball-active.svg";
import floatingBallDefault from "../../../assets/promptball/icons/floating-ball-default.svg";
import floatingBallHover from "../../../assets/promptball/icons/floating-ball-hover.svg";

export function FloatingShell({ children }: { children: ReactNode }) {
  const { expanded, toggleExpanded, setExpanded, setActivePanel, appPreferences, floatingBallStatus } = useAppStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const dragMovedRef = useRef(false);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusLabel = getStatusLabel(floatingBallStatus);

  function openWorkspace() {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    toggleExpanded();
  }

  function handleBallClick() {
    if (dragMovedRef.current) {
      return;
    }
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      toggleExpanded();
      return;
    }
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
    }, 260);
  }

  async function startDrag() {
    try {
      await getCurrentWindow().startDragging();
      return true;
    } catch {
      // Browser preview mode.
      return false;
    }
  }

  async function startManualDrag(event: React.MouseEvent<HTMLElement>, toggleOnClick = false) {
    event.preventDefault();
    event.stopPropagation();

    try {
      const win = getCurrentWindow();
      const initialPosition = await win.outerPosition();
      const scaleFactor = await win.scaleFactor().catch(() => 1);
      const startX = event.screenX;
      const startY = event.screenY;
      dragMovedRef.current = false;

      const move = (moveEvent: MouseEvent) => {
        const dx = moveEvent.screenX - startX;
        const dy = moveEvent.screenY - startY;
        if (!dragMovedRef.current && Math.hypot(dx, dy) < 4) {
          return;
        }
        dragMovedRef.current = true;
        const nextX = initialPosition.x + Math.round((moveEvent.screenX - startX) * scaleFactor);
        const nextY = initialPosition.y + Math.round((moveEvent.screenY - startY) * scaleFactor);
        void win.setPosition(new PhysicalPosition(nextX, nextY));
      };
      const stop = () => {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", stop);
        if (toggleOnClick && !dragMovedRef.current) {
          handleBallClick();
        }
      };

      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", stop, { once: true });
    } catch {
      if (toggleOnClick) {
        handleBallClick();
      }
    }
  }

  if (expanded) {
    return (
      <main className="h-screen w-screen overflow-hidden rounded-[24px] border border-white/70 bg-[#F8FAFC] text-slate-950 shadow-[0_24px_60px_rgba(15,23,42,.18)]">
        {children}
      </main>
    );
  }

  const ballAsset =
    floatingBallStatus === "optimizing" || floatingBallStatus === "success" || floatingBallStatus === "editing"
      ? floatingBallActive
      : floatingBallDefault;

  return (
    <div
      className="flex h-screen w-screen items-center justify-center overflow-visible bg-transparent"
      onClick={(event) => {
        if (contextMenu) {
          setContextMenu(null);
        }
      }}
    >
      {appPreferences.showFloatingBall && (
        <button
          type="button"
          onMouseDown={(event) => {
            if (event.button !== 0) {
              return;
            }
            void startManualDrag(event, true);
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setContextMenu({ x: event.clientX, y: event.clientY });
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleExpanded();
            }
          }}
          className={cn(
            "group relative flex size-[66px] cursor-grab items-center justify-center rounded-full text-white drop-shadow-[0_14px_32px_rgba(37,99,235,.35)] transition duration-200 hover:scale-[1.06] hover:drop-shadow-[0_18px_40px_rgba(37,99,235,.46)] active:cursor-grabbing",
            floatingBallStatus === "optimizing" && "animate-pulse",
          )}
          aria-label={`PromptBall ${statusLabel}`}
          title={`PromptBall - ${statusLabel}`}
        >
          <img src={ballAsset} alt="" className="size-[66px] group-hover:hidden" />
          <img src={floatingBallHover} alt="" className="hidden size-[66px] group-hover:block" />
          <span
            className={cn(
              "absolute right-1 top-1 size-3 rounded-full border border-white shadow-[0_1px_5px_rgba(15,23,42,.18)]",
              floatingBallStatus === "idle" && "bg-slate-300",
              floatingBallStatus === "editing" && "bg-amber-400",
              floatingBallStatus === "optimizing" && "bg-cyan-300",
              floatingBallStatus === "success" && "bg-emerald-400",
              floatingBallStatus === "error" && "bg-red-400",
            )}
          />
        </button>
      )}

      {contextMenu && (
        <div
          className="fixed z-50 w-44 overflow-hidden rounded-xl border bg-white p-1 text-sm text-slate-800 shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          data-no-toggle
          onClick={(event) => event.stopPropagation()}
        >
          <button className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100" type="button" onClick={toggleExpanded}>
            打开工作台
          </button>
          <button
            className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100"
            type="button"
            onClick={() => {
              setContextMenu(null);
              window.dispatchEvent(new CustomEvent("promptball:quick-optimize-clipboard"));
            }}
          >
            快速优化剪贴板
          </button>
          <button
            className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100"
            type="button"
            onClick={() => {
              setActivePanel("settings");
              setExpanded(true);
              setContextMenu(null);
            }}
          >
            设置
          </button>
        </div>
      )}
    </div>
  );
}
