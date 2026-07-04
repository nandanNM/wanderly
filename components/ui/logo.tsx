import Image from "next/image";

// Reusable Wanderly wordmark (app icon + name). Used in the landing nav/footer
// and the sign-in header.
export function Logo({
  size = "md",
  underline = true,
  priority = false,
}: {
  size?: "sm" | "md";
  underline?: boolean;
  priority?: boolean;
}) {
  const dim = size === "sm" ? 28 : 36;
  const iconClass = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const textClass = size === "sm" ? "text-2xl" : "text-2xl sm:text-3xl";

  return (
    <span className="flex items-center gap-2">
      <Image
        src="/logo.webp"
        alt="Wanderly logo"
        width={dim}
        height={dim}
        className={iconClass}
        priority={priority}
      />
      <span
        className={`font-hand font-bold ${textClass} ${
          underline ? "border-b-[3px] border-[#6f97d8] pb-0.5" : ""
        }`}
      >
        Wanderly
      </span>
    </span>
  );
}
