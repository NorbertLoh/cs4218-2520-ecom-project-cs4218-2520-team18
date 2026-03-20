import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";

const CATEGORIES = [
  { name: "Electronics", slug: "electronics" },
  { name: "Clothing", slug: "clothing" },
  { name: "Books", slug: "books" },
];

const PRODUCTS = [
  {
    name: "Test Laptop",
    slug: "test-laptop",
    description: "A high-performance laptop for testing purposes with great features",
    price: 999,
    category: "Electronics",
    quantity: 10,
    shipping: false,
  },
  {
    name: "Test Smartphone",
    slug: "test-smartphone",
    description: "Latest smartphone with advanced camera and long battery life",
    price: 699,
    category: "Electronics",
    quantity: 25,
    shipping: false,
  },
  {
    name: "Test T-Shirt",
    slug: "test-t-shirt",
    description: "A comfortable cotton t-shirt available in multiple colors",
    price: 29,
    category: "Clothing",
    quantity: 50,
    shipping: true,
  },
  {
    name: "Test Jeans",
    slug: "test-jeans",
    description: "Classic fit denim jeans with premium quality fabric",
    price: 59,
    category: "Clothing",
    quantity: 30,
    shipping: true,
  },
  {
    name: "Test Book",
    slug: "test-book",
    description: "An interesting book about software testing and quality assurance",
    price: 19,
    category: "Books",
    quantity: 100,
    shipping: true,
  },
];

// Create a minimal 1x1 pixel PNG image buffer
const createDummyImageBuffer = () => {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
};

const shouldDisableSeeding = () => process.env.DISABLE_TEST_DATA_SEED === "true";

const seedCategories = async () => {
  const categoryMap = {};

  for (const cat of CATEGORIES) {
    const existing = await categoryModel.findOne({ slug: cat.slug });

    if (!existing) {
      const created = await categoryModel.create({
        name: cat.name,
        slug: cat.slug,
      });
      categoryMap[cat.name] = created._id;
      console.log(`Category created: ${cat.name}`.green);
    } else {
      categoryMap[cat.name] = existing._id;
      console.log(`Category already exists: ${cat.name}`.cyan);
    }
  }

  return categoryMap;
};

const seedProducts = async (categoryMap) => {
  for (const prod of PRODUCTS) {
    const existing = await productModel.findOne({ slug: prod.slug });
    const categoryId = categoryMap[prod.category];

    if (!categoryId) {
      console.log(`Warning: Category ${prod.category} not found for product ${prod.name}`.yellow);
      continue;
    }

    if (!existing) {
      await productModel.create({
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        price: prod.price,
        category: categoryId,
        quantity: prod.quantity,
        photo: {
          data: createDummyImageBuffer(),
          contentType: "image/png",
        },
        shipping: prod.shipping,
      });
      console.log(`Product created: ${prod.name}`.green);
    } else {
      // Update existing product to ensure it has correct data
      existing.name = prod.name;
      existing.description = prod.description;
      existing.price = prod.price;
      existing.category = categoryId;
      existing.quantity = prod.quantity;
      existing.shipping = prod.shipping;

      // Only update photo if it doesn't exist
      if (!existing.photo || !existing.photo.data) {
        existing.photo = {
          data: createDummyImageBuffer(),
          contentType: "image/png",
        };
      }

      await existing.save();
      console.log(`Product updated: ${prod.name}`.blue);
    }
  }
};

const seedTestData = async () => {
  if (shouldDisableSeeding()) {
    console.log("Test data seeding disabled via DISABLE_TEST_DATA_SEED".yellow);
    return;
  }

  try {
    console.log("Starting test data seeding...".bgBlue.white);

    const categoryMap = await seedCategories();
    await seedProducts(categoryMap);

    console.log("Test data seeding completed successfully!".bgGreen.black);
  } catch (error) {
    console.error("Error seeding test data:".bgRed.white, error);
    throw error;
  }
};

export default seedTestData;
