import { useEffect, useState } from "react";

export const secureImageUrl = (imageUrl) => {
  if (typeof imageUrl !== "string" || !imageUrl) return "";
  if (typeof window === "undefined" || window.location.protocol !== "https:") return imageUrl;
  return imageUrl.replace(/^http:\/\//i, "https://");
};

export default function CloudinaryImage({ src, fallbackSrc, alt, ...imageProps }) {
  const deliveryUrl = secureImageUrl(src) || fallbackSrc;
  const [displayedUrl, setDisplayedUrl] = useState(deliveryUrl);

  useEffect(() => {
    setDisplayedUrl(deliveryUrl);
  }, [deliveryUrl]);

  const handleError = () => {
    if (displayedUrl !== fallbackSrc) {
      setDisplayedUrl(fallbackSrc);
    } else {
      setDisplayedUrl("");
    }
  };

  if (!displayedUrl) return null;
  return <img {...imageProps} src={displayedUrl} alt={alt} onError={handleError} />;
}
