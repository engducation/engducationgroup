"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogBackdrop({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        "fixed inset-0 z-40 bg-black/80 data-enter:animate-in data-enter:fade-in-0 data-enter:duration-200 data-enter:ease-out data-leave:animate-out data-leave:fade-out-0 data-leave:duration-150 data-leave:ease-in data-closed:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

function DialogPopup({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal>
      <DialogBackdrop />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-transparent p-4 data-enter:animate-in data-enter:fade-in-0 data-enter:duration-200 data-enter:ease-out data-leave:animate-out data-leave:fade-out-0 data-leave:duration-150 data-leave:ease-in data-closed:pointer-events-none data-closed:opacity-0",
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            "relative z-50 w-full bg-background text-foreground shadow-lg ring-1 ring-foreground/10",
            "data-enter:animate-in data-enter:fade-in-0 data-enter:zoom-in-95 data-enter:slide-in-from-bottom-4 data-enter:duration-200",
            "data-leave:animate-out data-leave:fade-out-0 data-leave:zoom-out-95 data-leave:slide-out-to-bottom-4 data-leave:duration-150",
          )}
        >
          <DialogClose
            className={cn(
              "absolute right-4 top-4 rounded-none p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none",
            )}
          >
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          {children}
        </div>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 p-4 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("pr-8 text-base font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-xs/relaxed text-muted-foreground", className)}
      {...props}
    />
  );
}

// Aliases for compatibility with existing code
const DialogContent = DialogPopup;

export {
  Dialog,
  DialogPortal,
  DialogClose,
  DialogTrigger,
  DialogPopup,
  DialogBackdrop,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogContent,
};
