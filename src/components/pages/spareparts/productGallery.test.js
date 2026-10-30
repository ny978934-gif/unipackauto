import assert from "node:assert/strict";
import test from "node:test";
import { getProductGalleryImages } from "./productGallery.js";

test("prefers the saved primary spare-part image and includes its gallery", () => {
  assert.deepEqual(
    getProductGalleryImages({
      image: " https://res.cloudinary.com/example/primary.jpg ",
      images: [
        "https://res.cloudinary.com/example/primary.jpg",
        "https://res.cloudinary.com/example/side.jpg",
      ],
    }),
    [
      "https://res.cloudinary.com/example/primary.jpg",
      "https://res.cloudinary.com/example/side.jpg",
    ]
  );
});

test("uses a primary spare-part image even when the gallery is empty", () => {
  assert.deepEqual(
    getProductGalleryImages({
      image: "https://res.cloudinary.com/example/primary.jpg",
      images: [],
    }),
    ["https://res.cloudinary.com/example/primary.jpg"]
  );
});

test("keeps machine image ordering unchanged", () => {
  assert.deepEqual(
    getProductGalleryImages({
      image: "https://example.com/primary.jpg",
      images: ["https://example.com/side.jpg"],
    }, "machine"),
    ["https://example.com/side.jpg", "https://example.com/primary.jpg"]
  );
});
