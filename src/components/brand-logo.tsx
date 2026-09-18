import Image from "next/image";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex h-8 items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md">
        <Image
          src="/khataone-mark-light-transparent.png"
          alt=""
          width={180}
          height={180}
          priority
          className="theme-brand-mark size-8 object-contain drop-shadow-sm"
        />
      </span>
      {!compact && (
        <span className="font-display text-lg font-bold leading-none tracking-normal text-khata-ink">
          Khata<span className="text-khata-green">One</span>
        </span>
      )}
    </span>
  );
}
