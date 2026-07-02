// Brand icons for contact links, sourced from the simple-icons library
// (lucide-react no longer ships brand logos). Rendered as plain SVGs so
// they inherit the surrounding text color.

import { siFacebook, siInstagram, siX } from "simple-icons";

function BrandIcon({ path, className }: { path: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return <BrandIcon path={siInstagram.path} className={className} />;
}

export function FacebookIcon({ className }: { className?: string }) {
  return <BrandIcon path={siFacebook.path} className={className} />;
}

export function XIcon({ className }: { className?: string }) {
  return <BrandIcon path={siX.path} className={className} />;
}
