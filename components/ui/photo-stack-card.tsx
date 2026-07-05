"use client";

import * as React from "react";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface PhotoStackCardProps {
  images: string[];
  category: string;
  title: string;
  subtitle: string;
  /** Lifts + fans the stack open even without hover (e.g. selected). */
  isActive?: boolean;
  className?: string;
}

// Each photo fans out from the stack; wider spread + lift on hover.
const photoVariants: Variants = {
  rest: (i: number) => ({
    rotate: (i - 1) * 6,
    x: (i - 1) * 16,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  }),
  hover: (i: number) => ({
    rotate: (i - 1) * 12,
    x: (i - 1) * 52,
    y: -20,
    scale: 1.05,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  }),
};

export function PhotoStackCard({
  images,
  category,
  title,
  subtitle,
  isActive,
  className,
}: PhotoStackCardProps) {
  const shown = images.slice(0, 3);

  return (
    <motion.div
      initial="rest"
      animate={isActive ? "hover" : "rest"}
      whileHover="hover"
      className={cn(
        "group relative h-72 w-full rounded-2xl border border-black/10 bg-[#fffdf8] p-6 shadow-[0_10px_30px_rgba(42,42,42,0.12)] transition-shadow hover:shadow-[0_18px_44px_rgba(42,42,42,0.18)]",
        className,
      )}
    >
      {/* Text */}
      <div className="relative z-10 max-w-[60%]">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#5a7d2e]">
          {category}
        </p>
        <h2 className="font-hand mt-1 text-4xl font-bold leading-none text-[#2a2a2a]">
          {title}
        </h2>
        <p className="mt-2 text-sm text-[#7a7a7a]">{subtitle}</p>
      </div>

      {/* Photo stack — hangs off the bottom-right and fans on hover */}
      <div className="pointer-events-none absolute -bottom-8 right-3 h-44 w-64">
        {shown.length > 0 ? (
          shown.map((src, i) => (
            <motion.div
              key={`${src}-${i}`}
              custom={i}
              variants={photoVariants}
              style={{ zIndex: i }}
              className="absolute bottom-0 right-0 h-40 w-56 origin-bottom overflow-hidden rounded-xl border-4 border-white bg-[#eceae3] shadow-[0_8px_20px_rgba(0,0,0,0.22)]"
            >
              <Image
                src={src}
                alt={`${title} photo ${i + 1}`}
                fill
                sizes="224px"
                className="object-cover"
              />
            </motion.div>
          ))
        ) : (
          <div className="absolute bottom-0 right-0 grid h-40 w-56 rotate-3 place-items-center rounded-xl border-4 border-white bg-[#f0ede6] text-3xl shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
            📷
          </div>
        )}
      </div>
    </motion.div>
  );
}
