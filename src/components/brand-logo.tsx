import Image from "next/image";

export function BrandLogo() {
  return (
    <span className="inline-flex h-8 items-center gap-2">
      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md">
        <Image
          src="/khataone-mark-light-transparent.png"
          alt=""
          width={180}
          height={180}
          priority
          className="size-8 object-contain drop-shadow-sm"
        />
      </span>
      <span className="font-display text-sm font-semibold leading-none tracking-normal text-khata-ink">
        Khata<span className="text-khata-green">One</span>
      </span>
    </span>
  );
}
