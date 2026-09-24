import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  const uri = process.env.MONGO_URI.includes("?")
    ? process.env.MONGO_URI.replace("/?", "/arcl-instruments?")
    : process.env.MONGO_URI + "/arcl-instruments";

  await mongoose.connect(uri);
  console.log("Connected to MongoDB database: arcl-instruments");

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

  const eqTypes = await EquipmentType.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }).lean();
  const allCategories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  const allProducts = await Product.find({ isActive: true }).sort({ name: 1 }).lean();

  console.log("\n=======================================================");
  console.log("             EXACT DATABASE DATA AUDIT                ");
  console.log("=======================================================");
  console.log(`Total Active Equipment Types: ${eqTypes.length}`);
  console.log(`Total Active Categories:      ${allCategories.length}`);
  console.log(`Total Active Products:        ${allProducts.length}`);
  console.log("-------------------------------------------------------");

  const breakdown = [];
  for (const eq of eqTypes) {
    const catsInEq = allCategories.filter((c) => String(c.equipmentType) === String(eq._id));
    const catIds = catsInEq.map((c) => String(c._id));
    const prodsInEq = allProducts.filter((p) => catIds.includes(String(p.category)));

    breakdown.push({
      eqName: eq.name,
      eqSlug: eq.slug,
      categoriesCount: catsInEq.length,
      productsCount: prodsInEq.length,
      categories: catsInEq,
      products: prodsInEq,
    });

    console.log(
      `• [Equipment Type] "${eq.name}" (slug: /categories/${eq.slug}) => ${catsInEq.length} Categories | ${prodsInEq.length} Products`
    );
  }

  console.log("\n=======================================================");
  console.log("     FULL CRAWL: TESTING ALL LIVE PRODUCT URLS        ");
  console.log("=======================================================");

  const productResults = [];
  for (let i = 0; i < allProducts.length; i++) {
    const p = allProducts[i];
    const url = `https://arclinstruments.com/products/${p.slug}`;
    try {
      const res = await fetch(url);
      const html = await res.text();
      const hasNotFound = html.includes("Equipment Not Found") || html.includes("Product Not Found");
      const hasName = html.includes(p.name) || html.includes(p.productCode);
      const hasSchema = html.includes('"@type":"Product"') || html.includes('"@type": "Product"');

      const isOk = res.status === 200 && !hasNotFound && hasName;
      productResults.push({
        index: i + 1,
        name: p.name,
        slug: p.slug,
        code: p.productCode,
        status: res.status,
        hasNotFound,
        hasName,
        hasSchema,
        pass: isOk,
      });

      console.log(
        `[${i + 1}/${allProducts.length}] ${p.slug} => HTTP ${res.status} | Name in HTML: ${hasName} | Schema: ${hasSchema} | Pass: ${isOk ? "✅ PASS" : "❌ FAIL"}`
      );
    } catch (err) {
      productResults.push({
        index: i + 1,
        name: p.name,
        slug: p.slug,
        code: p.productCode,
        status: "ERROR",
        pass: false,
        error: err.message,
      });
      console.log(`[${i + 1}/${allProducts.length}] ${p.slug} => ❌ NETWORK ERROR: ${err.message}`);
    }
  }

  console.log("\n=======================================================");
  console.log("     FULL CRAWL: TESTING ALL LIVE CATEGORY URLS        ");
  console.log("=======================================================");

  const categoryResults = [];
  for (let i = 0; i < allCategories.length; i++) {
    const c = allCategories[i];
    const url = `https://arclinstruments.com/categories/${c.slug}`;
    try {
      const res = await fetch(url);
      const html = await res.text();
      const hasZero = html.includes("0 Products Available") || html.includes("No Instruments Match");
      const hasName = html.includes(c.name);

      const isOk = res.status === 200 && !hasZero;
      categoryResults.push({
        index: i + 1,
        name: c.name,
        slug: c.slug,
        status: res.status,
        hasZero,
        hasName,
        pass: isOk,
      });

      console.log(
        `[${i + 1}/${allCategories.length}] ${c.slug} => HTTP ${res.status} | HasName: ${hasName} | HasZero: ${hasZero} | Pass: ${isOk ? "✅ PASS" : "❌ FAIL"}`
      );
    } catch (err) {
      categoryResults.push({
        index: i + 1,
        name: c.name,
        slug: c.slug,
        status: "ERROR",
        pass: false,
        error: err.message,
      });
      console.log(`[${i + 1}/${allCategories.length}] ${c.slug} => ❌ NETWORK ERROR: ${err.message}`);
    }
  }

  console.log("\n=======================================================");
  console.log("    FULL CRAWL: TESTING ALL EQUIPMENT CLASSIFICATIONS  ");
  console.log("=======================================================");

  const eqClassifications = [
    "concrete-testing-equipment",
    "soil-testing-equipment",
    "aggregate-testing-equipment",
    "bitumen-testing-equipment",
    "cement-testing-equipment",
    "surveying-instruments",
    "non-destructive-testing-ndt-equipment",
  ];

  for (const eqSlug of eqClassifications) {
    const url = `https://arclinstruments.com/categories/${eqSlug}`;
    try {
      const res = await fetch(url);
      const html = await res.text();
      const hasZero = html.includes("0 Products Available");
      console.log(
        `Equipment URL: /categories/${eqSlug} => HTTP ${res.status} | HasZero: ${hasZero} | Pass: ${res.status === 200 && !hasZero ? "✅ PASS" : "❌ FAIL"}`
      );
    } catch (err) {
      console.log(`Equipment URL: /categories/${eqSlug} => ❌ ERROR: ${err.message}`);
    }
  }

  // Filter testing
  const filterUrls = [
    "https://arclinstruments.com/products?equipmentType=NDT+Equipments",
    "https://arclinstruments.com/products?equipmentType=Concrete+Testing+Equipments",
    "https://arclinstruments.com/products?equipmentType=Soil+Testing+Equipments",
    "https://arclinstruments.com/products?equipmentType=Bitumen+%26+Asphalt+Testing+Equipments",
  ];

  console.log("\n=======================================================");
  console.log("       FULL CRAWL: TESTING LIVE FILTER URLS           ");
  console.log("=======================================================");
  for (const fUrl of filterUrls) {
    try {
      const res = await fetch(fUrl);
      const html = await res.text();
      const hasZero = html.includes("0 Products Available") || html.includes("No Instruments Match");
      console.log(`Filter URL: ${fUrl} => HTTP ${res.status} | HasZero: ${hasZero} | Pass: ${res.status === 200 && !hasZero ? "✅ PASS" : "❌ FAIL"}`);
    } catch (err) {
      console.log(`Filter URL: ${fUrl} => ❌ ERROR: ${err.message}`);
    }
  }

  console.log("\n=======================================================");
  console.log("                  CRAWL AUDIT SUMMARY                  ");
  console.log("=======================================================");
  const productsPassed = productResults.filter((p) => p.pass).length;
  const categoriesPassed = categoryResults.filter((c) => c.pass).length;
  console.log(`Products Crawled:   ${allProducts.length} | Passed: ${productsPassed} | Failed: ${allProducts.length - productsPassed}`);
  console.log(`Categories Crawled: ${allCategories.length} | Passed: ${categoriesPassed} | Failed: ${allCategories.length - categoriesPassed}`);

  await mongoose.disconnect();
}

run().catch(console.error);
