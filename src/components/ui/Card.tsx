"use client";

import clsx from "clsx";
import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

export type CardProps = {
  children: ReactNode;
  className?: string;
} & Omit<HTMLMotionProps<"div">, "children">;

export default function Card({
  children,
  className,
  style,
  ...rest
}: CardProps) {
  return (
    <motion.div
      {...rest}
      className={clsx(
        "rounded-xl border border-[var(--border)] bg-[var(--emotion-surface,#161C26)] p-6",
        className,
      )}
      style={{
        ...style,
        transition: "background-color 600ms ease-out",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{
        opacity: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
        y: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
      }}
    >
      {children}
    </motion.div>
  );
}
