"use client";

import clsx from "clsx";
import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";

export type ButtonVariant = "primary" | "ghost" | "danger";

export type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: ButtonVariant;
  loading?: boolean;
  children?: ReactNode;
};

function LoadingDots({ className }: { className?: string }) {
  return (
    <span
      className={clsx("inline-flex items-center gap-1", className)}
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-current"
          animate={{ y: [0, -5, 0] }}
          transition={{
            duration: 0.55,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.12,
          }}
        />
      ))}
    </span>
  );
}

const MotionButton = motion.button;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    loading = false,
    disabled,
    className,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const canMotion = !isDisabled;

  const variantClass: Record<ButtonVariant, string> = {
    primary:
      "bg-[var(--emotion-accent,#5B8DEF)] text-white shadow-sm hover:brightness-[1.03]",
    ghost:
      "border border-[var(--emotion-accent,#5B8DEF)] bg-transparent text-[var(--emotion-accent,#5B8DEF)] hover:bg-[var(--emotion-accent,#5B8DEF)]/10",
    danger: "bg-[#E07B7B] text-white hover:brightness-[1.03]",
  };

  return (
    <MotionButton
      ref={ref}
      {...rest}
      type={type}
      disabled={isDisabled}
      className={clsx(
        "inline-flex min-h-[44px] items-center justify-center rounded-[8px] px-5 py-2 font-body text-base font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
        variantClass[variant],
        className,
      )}
      whileHover={canMotion ? { scale: 1.02 } : undefined}
      whileTap={canMotion ? { scale: 0.98 } : undefined}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <LoadingDots />
          <span className="sr-only">Loading</span>
        </span>
      ) : (
        (children as ReactNode)
      )}
    </MotionButton>
  );
});

export default Button;
