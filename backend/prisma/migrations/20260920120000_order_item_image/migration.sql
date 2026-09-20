-- Remember the product's cover photo on each order line.
ALTER TABLE "OrderItem" ADD COLUMN "image" TEXT;

-- Fill in orders placed before this column existed, using the product's current cover photo.
UPDATE "OrderItem" oi
SET "image" = p."images"[1]
FROM "Product" p
WHERE oi."productId" = p."id" AND oi."image" IS NULL AND array_length(p."images", 1) > 0;
