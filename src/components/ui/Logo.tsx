import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  /** Apply brightness+invert filter to render the logo in white (for dark backgrounds) */
  inverted?: boolean;
}

export function Logo({ className, width = 160, height = 89, inverted = false }: LogoProps) {
  return (
    <Image
      src="/logo.svg"
      alt="آموزشگاه ریاضی راشد"
      width={width}
      height={height}
      className={cn(inverted && "brightness-0 invert", className)}
      priority
    />
  );
}
