import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  const uri = process.env.MONGO_URI.includes("?")
    ? process.env.MONGO_URI.replace("/?", "/arcl-instruments?")
    : process.env.MONGO_URI + "/arcl-instruments";

  console.log("Connecting to URI with db 'arcl-instruments'...");
  await mongoose.connect(uri);
  console.log("Connected to DB successfully");

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Collections in 'arcl-instruments':", collections.map((c) => c.name));

  // Check models
  const EquipmentType = mongoose.model(
    "EquipmentType",
    new mongoose.Schema({}, { strict: false }),
    "equipmenttypes"
  );
  const Category = mongoose.model(
    "Category",
    new mongoose.Schema({}, { strict: false }),
    "categories"
  );
  const Product = mongoose.model(
    "Product",
    new mongoose.Schema({}, { strict: false }),
    "products"
  );

  const eqTypes = await EquipmentType.find().lean();
  console.log("\n=================== EQUIPMENT TYPES (" + eqTypes.length + ") ===================");
  eqTypes.forEach((e) =>
    console.log(`- ${e.name} | slug: '${e.slug}' | id: ${e._id} | active: ${e.isActive}`)
  );

  const cats = await Category.find().lean();
  console.log("\n=================== CATEGORIES (" + cats.length + ") ===================");
  cats.forEach((c) =>
    console.log(`- ${c.name} | slug: '${c.slug}' | eqId: ${c.equipmentType} | active: ${c.isActive}`)
  );

  const targetSlugs = [
    "mortar-mixer",
    "flexural-testing-machine-digital",
    "standard-penetration-test-spt-apparatus",
    "dynamic-cone-penetrometer-test-dcpt",
    "bitumen-mixer",
    "digital-sieve-shaker",
  ];

  console.log("\n=================== TARGET PRODUCT LOOKUPS ===================");
  for (const s of targetSlugs) {
    const pBySlug = await Product.findOne({ slug: s }).lean();
    const pByRegex = await Product.findOne({ slug: { $regex: s, $options: "i" } }).lean();
    const pByName = await Product.findOne({ name: { $regex: s.replace(/-/g, " "), $options: "i" } }).lean();
    const catBySlug = await Category.findOne({ slug: s }).lean();
    console.log(
      `Target: '${s}':\n  - Product exact slug: ${pBySlug ? pBySlug.name + " (" + pBySlug.slug + ")" : "NONE"}\n  - Product regex slug: ${pByRegex ? pByRegex.name + " (" + pByRegex.slug + ")" : "NONE"}\n  - Product name match: ${pByName ? pByName.name + " (" + pByName.slug + ")" : "NONE"}\n  - Category exact slug: ${catBySlug ? catBySlug.name + " (" + catBySlug.slug + ")" : "NONE"}`
    );
  }

  const allProds = await Product.find().select("name slug category isActive isFeatured productCode").lean();
  console.log("\n=================== ALL PRODUCTS (" + allProds.length + ") ===================");
  allProds.forEach((p) =>
    console.log(`- ${p.name} | slug: '${p.slug}' | code: '${p.productCode}' | catId: ${p.category} | active: ${p.isActive}`)
  );

  await mongoose.disconnect();
}

run().catch(console.error);
