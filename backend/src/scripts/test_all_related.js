import mongoose from "mongoose";

const MONGO_URI = "mongodb://abhishek27501_db_user:Abhi12345@ac-zbzi2lq-shard-00-00.inlbkbb.mongodb.net:27017,ac-zbzi2lq-shard-00-01.inlbkbb.mongodb.net:27017,ac-zbzi2lq-shard-00-02.inlbkbb.mongodb.net:27017/?ssl=true&replicaSet=atlas-13m0xq-shard-0&authSource=admin&appName=ARCL";

async function run() {
  await mongoose.connect(MONGO_URI, { dbName: "arcl-instruments" });

  const Category = mongoose.model("Category", new mongoose.Schema({ name: String, slug: String, equipmentType: { type: mongoose.Schema.Types.ObjectId, ref: "EquipmentType" } }, { strict: false }));
  const Product = mongoose.model("Product", new mongoose.Schema({ name: String, slug: String, category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }, isActive: Boolean }, { strict: false }));
  const EquipmentType = mongoose.model("EquipmentType", new mongoose.Schema({ name: String, slug: String }, { strict: false }));

  const allProducts = await Product.find({ isActive: true }).populate({
    path: "category",
    populate: { path: "equipmentType" }
  });

  console.log(`Total active products: ${allProducts.length}`);

  for (const prod of allProducts) {
    const cat = prod.category;
    const eq = cat?.equipmentType;

    let related = [];
    if (eq?._id) {
      const sameEqCategories = await Category.find({ equipmentType: eq._id }).select("_id");
      const catIds = sameEqCategories.map(c => c._id);
      related = await Product.find({
        category: { $in: catIds },
        _id: { $ne: prod._id },
        isActive: true
      }).select("name slug");
    }

    console.log(`\nProduct: [${prod.name}]`);
    console.log(`  Equipment Group: "${eq?.name}"`);
    console.log(`  Related Count: ${related.length}`);
    related.forEach(r => console.log(`    -> ${r.name}`));
  }

  await mongoose.disconnect();
}

run();
