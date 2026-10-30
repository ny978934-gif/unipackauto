export function getProductGalleryImages(product, type = "sparepart") {
  const savedImages = (Array.isArray(product.images) ? product.images : [])
    .filter((imageUrl) => typeof imageUrl === "string" && imageUrl.trim())
    .map((imageUrl) => imageUrl.trim());
  const productImages = type === "sparepart" && savedImages.length
    ? savedImages
    : [...savedImages, product.image];

  return [...new Set(
    productImages
      .filter((imageUrl) => typeof imageUrl === "string" && imageUrl.trim())
      .map((imageUrl) => imageUrl.trim())
  )].slice(0, type === "sparepart" ? 5 : 10);
}
