import mongoose from "mongoose";

const MONGO_URI = "mongodb://abhishek27501_db_user:Abhi12345@ac-zbzi2lq-shard-00-00.inlbkbb.mongodb.net:27017,ac-zbzi2lq-shard-00-01.inlbkbb.mongodb.net:27017,ac-zbzi2lq-shard-00-02.inlbkbb.mongodb.net:27017/?ssl=true&replicaSet=atlas-13m0xq-shard-0&authSource=admin&appName=ARCL";

async function run() {
  await mongoose.connect(MONGO_URI, { dbName: "arcl-instruments" });
  
  const EquipmentType = mongoose.model("EquipmentType", new mongoose.Schema({ name: String }, { strict: false }));
  const Category = mongoose.model("Category", new mongoose.Schema({ name: String, slug: String, equipmentType: { type: mongoose.Schema.Types.ObjectId, ref: "EquipmentType" } }, { strict: false }));
  const Product = mongoose.model("Product", new mongoose.Schema({ name: String, slug: String, category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" } }, { strict: false }));

  const prods = await Product.find().populate({
    path: "category",
    populate: { path: "equipmentType" }
  });

  console.log("=== ALL PRODUCTS & THEIR CATEGORIES ===");
  prods.forEach(p => {
    console.log(`Product: "${p.name}" (${p.slug})`);
    console.log(`  └ Category: "${p.category?.name}" (${p.category?.slug})`);
    console.log(`  └ EquipmentType: "${p.category?.equipmentType?.name}"`);
  });

  await mongoose.disconnect();
}

run();
