import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  const uri = process.env.MONGO_URI.includes("?")
    ? process.env.MONGO_URI.replace("/?", "/arcl-instruments?")
    : process.env.MONGO_URI + "/arcl-instruments";

  await mongoose.connect(uri);

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
  console.log("=== ALL EQUIPMENT TYPES ===");
  for (const eq of eqTypes) {
    const catsInEq = await Category.find({ equipmentType: eq._id }).lean();
    const catIds = catsInEq.map((c) => c._id);
    const prodsInEq = await Product.countDocuments({ category: { $in: catIds } });
    console.log(
      `EqType: '${eq.name}' | slug: '${eq.slug}' | id: ${eq._id} | categories: ${catsInEq.length} | totalProducts: ${prodsInEq}`
    );
    catsInEq.forEach((c) => {
      console.log(`    -> Cat: '${c.name}' | slug: '${c.slug}' | id: ${c._id}`);
    });
  }

  console.log("\n=== ALL CATEGORIES ===");
  const cats = await Category.find().populate("equipmentType").lean();
  for (const c of cats) {
    const prodsCount = await Product.countDocuments({ category: c._id });
    console.log(
      `Category: '${c.name}' | slug: '${c.slug}' | eqName: '${c.equipmentType?.name}' | eqSlug: '${c.equipmentType?.slug}' | prods: ${prodsCount}`
    );
  }

  await mongoose.disconnect();
}

run().catch(console.error);
