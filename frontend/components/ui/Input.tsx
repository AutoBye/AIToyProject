import { InputHTMLAttributes } from "react";
import { clsx } from "clsx";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx("h-10 w-full rounded-md border border-border bg-panel px-3 text-sm outline-none focus:ring-2 focus:ring-accent", className)}
      {...props}
    />
  );
}
