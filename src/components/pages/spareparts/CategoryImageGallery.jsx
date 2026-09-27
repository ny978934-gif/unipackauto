import { useEffect, useState } from "react";
import { secureImageUrl } from "./CloudinaryImage.jsx";

export default function CategoryImageGallery({ images = [], fallbackImage, alt }) {
  const availableImages = [...new Set([...(images || [])].filter(Boolean))];
  const [selectedImage, setSelectedImage] = useState(availableImages[0] || fallbackImage);
  const [displayedImage, setDisplayedImage] = useState(
    secureImageUrl(availableImages[0]) || fallbackImage
  );

  useEffect(() => {
    if (!availableImages.includes(selectedImage)) {
      setSelectedImage(availableImages[0] || fallbackImage);
    }
  }, [availableImages, fallbackImage, selectedImage]);

  useEffect(() => {
    const secureUrl = secureImageUrl(selectedImage);
    setDisplayedImage(secureUrl || fallbackImage);
  }, [selectedImage, fallbackImage]);

  const handleImageError = () => {
    if (displayedImage !== fallbackImage) {
      setDisplayedImage(fallbackImage);
      return;
    }
    setDisplayedImage("");
  };

  return (
    <div className="category-image-gallery">
      <div className="category-image-gallery-main">
        {displayedImage && <img src={displayedImage} alt={alt} loading="lazy" onError={handleImageError} />}
      </div>
      {availableImages.length > 1 && (
        <div className="category-image-gallery-thumbnails" aria-label={`${alt} images`}>
          {availableImages.map((image, index) => (
            <button
              key={image}
              type="button"
              className={image === selectedImage ? "active" : ""}
              onClick={() => setSelectedImage(image)}
              aria-label={`Show ${alt} image ${index + 1}`}
              aria-pressed={image === selectedImage}
            >
              <img src={secureImageUrl(image)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
