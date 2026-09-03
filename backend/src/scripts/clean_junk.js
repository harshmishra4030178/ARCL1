import mongoose from "mongoose";

const MONGO_URI = "mongodb://abhishek27501_db_user:Abhi12345@ac-zbzi2lq-shard-00-00.inlbkbb.mongodb.net:27017,ac-zbzi2lq-shard-00-01.inlbkbb.mongodb.net:27017,ac-zbzi2lq-shard-00-02.inlbkbb.mongodb.net:27017/?ssl=true&replicaSet=atlas-13m0xq-shard-0&authSource=admin&appName=ARCL";

async function clean() {
  await mongoose.connect(MONGO_URI, { dbName: "arcl-instruments" });
  const Product = mongoose.model("Product", new mongoose.Schema({ name: String }, { strict: false }));
  const Category = mongoose.model("Category", new mongoose.Schema({ name: String }, { strict: false }));
  const Eq = mongoose.model("EquipmentType", new mongoose.Schema({ name: String }, { strict: false }));

  const pRes = await Product.deleteMany({ name: /hare raam/i });
  const cRes = await Category.deleteMany({ name: /raju/i });
  const eRes = await Eq.deleteMany({ name: /sita raam/i });

  console.log(`Cleaned junk: ${pRes.deletedCount} products, ${cRes.deletedCount} categories, ${eRes.deletedCount} equipment types.`);
  await mongoose.disconnect();
}

clean();
