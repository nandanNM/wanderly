"use client";

import * as React from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

// --- PROPS INTERFACE ---
// Omit the handlers framer-motion redefines (drag/animation) so spreading
// plain DOM props (onClick, etc.) onto motion.div doesn't clash.
interface PhotoStackCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
> {
  images: string[];
  category: string;
  title: string;
  subtitle: string;
  isActive?: boolean; // Controls the active (lifted) state
}

// --- FRAMER MOTION VARIANTS ---
// For the image stack within the card
const imageContainerVariants: Variants = {
  initial: {},
  hover: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const imageVariants: Variants = {
  initial: { scale: 1, rotate: 0, y: 0 },
  hover: (i: number) => ({
    scale: 1.05,
    rotate: (i - 1) * 10,
    y: -20,
    boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.2)",
    transition: { type: "spring", stiffness: 300, damping: 20 },
  }),
};

// For the card itself (click interaction)
const cardVariants: Variants = {
  inactive: {
    scale: 1,
    y: 0,
    zIndex: 0,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
  active: {
    scale: 1.05,
    y: -15,
    zIndex: 10,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

export const PhotoStackCard = React.forwardRef<
  HTMLDivElement,
  PhotoStackCardProps
>(
  (
    { className, images, category, title, subtitle, isActive, ...props },
    ref,
  ) => {
    const displayImages = images.slice(0, 3);

    return (
      <motion.div
        ref={ref}
        className={cn(
          "group relative flex h-72 w-72 cursor-pointer flex-col justify-start rounded-xl bg-white p-6 shadow-xl",
          "transition-colors duration-300 ease-in-out",
          className,
        )}
        variants={cardVariants}
        animate={isActive ? "active" : "inactive"}
        {...props}
      >
        {/* Text Content */}
        <div className="z-10">
          <p className="text-xs font-semibold uppercase text-neutral-500">
            {category}
          </p>
          <h2 className="mt-1 text-3xl font-bold text-neutral-900">{title}</h2>
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        </div>

        {/* Image Stack */}
        <motion.div
          className="absolute bottom-0 right-0 h-48 w-full"
          variants={imageContainerVariants}
          initial="initial"
          whileHover="hover"
        >
          <AnimatePresence>
            {displayImages.length > 0 ? (
              displayImages.map((src, i) => (
                <motion.img
                  key={`${src}-${i}`}
                  src={src}
                  alt={`${title} memory image ${i + 1}`}
                  custom={i}
                  variants={imageVariants}
                  className="absolute -bottom-5 right-6 h-40 w-auto origin-bottom rounded-lg border-4 border-white object-cover shadow-lg"
                  style={{
                    transform: `rotate(${(i - 1) * 4}deg)`,
                  }}
                />
              ))
            ) : (
              <div className="absolute -bottom-5 right-6 grid h-40 w-52 rotate-3 place-items-center rounded-lg border-4 border-white bg-neutral-100 text-3xl shadow-lg">
                📷
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    );
  },
);
PhotoStackCard.displayName = "PhotoStackCard";
