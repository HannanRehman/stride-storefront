"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
export function DialogContent({
  children,
  className,
  onOpenAutoFocus,
  onCloseAutoFocus,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  const previousFocus = React.useRef<HTMLElement | null>(null);
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay" />
      <DialogPrimitive.Content
        data-lenis-prevent
        className={cn("dialog-content", className)}
        {...props}
        onOpenAutoFocus={(event) => {
          // Safari does not focus a button when it is clicked. Prefer the
          // dialog's registered trigger over the previously active element.
          const content = event.target;
          const trigger =
            content instanceof HTMLElement && content.id
              ? document.querySelector<HTMLElement>(
                  `[aria-controls="${CSS.escape(content.id)}"]`,
                )
              : null;
          previousFocus.current =
            trigger ||
            (document.activeElement instanceof HTMLElement &&
            document.activeElement !== document.body
              ? document.activeElement
              : null);
          onOpenAutoFocus?.(event);
        }}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          if (!event.defaultPrevented && previousFocus.current?.isConnected) {
            event.preventDefault();
            previousFocus.current.focus({ preventScroll: true });
          }
        }}
      >
        {children}
        <DialogPrimitive.Close
          className="dialog-close icon-button"
          aria-label="Close"
        >
          <X size={23} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
