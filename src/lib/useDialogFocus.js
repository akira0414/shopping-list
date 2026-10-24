import { React } from "../vendor/runtime.js";

// Keep overlays keyboard-contained and restore the page exactly on dismissal.
export function useDialogFocus(dialogRef, overlayRef, onEscape) {
  const escape = React.useRef(onEscape);
  escape.current = onEscape;
  React.useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    const background = [];
    for (
      let node = overlayRef.current;
      node?.parentElement;
      node = node.parentElement
    ) {
      for (const sibling of node.parentElement.children) {
        if (
          sibling !== node &&
          !["SCRIPT", "STYLE", "LINK"].includes(sibling.tagName)
        ) {
          background.push([sibling, sibling.inert]);
          sibling.inert = true;
        }
      }
      if (node.parentElement === document.body) break;
    }
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus({ preventScroll: true });
    const key = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        escape.current();
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const nodes = [
        ...dialog.querySelectorAll(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]',
        ),
      ].filter(
        (node) =>
          node.getClientRects().length && !node.closest("[hidden],[inert]"),
      );
      if (!nodes.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      if (
        !dialog.contains(document.activeElement) ||
        document.activeElement === dialog
      ) {
        event.preventDefault();
        (event.shiftKey ? nodes.at(-1) : nodes[0]).focus();
      } else if (event.shiftKey && document.activeElement === nodes[0]) {
        event.preventDefault();
        nodes.at(-1).focus();
      } else if (!event.shiftKey && document.activeElement === nodes.at(-1)) {
        event.preventDefault();
        nodes[0].focus();
      }
    };
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("keydown", key, true);
      for (const [node, inert] of background) node.inert = inert;
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
}
