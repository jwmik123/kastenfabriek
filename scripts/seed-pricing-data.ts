import { createClient } from "@sanity/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2026-01-09",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const pricingData = {
  config: {
    led: {
      basePrice: 180,
      pricePerModule: 65,
    },
    deliveryPrice: 95,
    slopedBackWallSurcharge: 1100,
    slopedSideWallSurchargePerSide: 1100,
    constraints: {
      singleCorpus: {
        minWidth: 30,
        maxWidth: 65,
        minHeight: 200,
        maxHeight: 275,
        minDepth: 15,
        maxDepth: 90,
      },
      doubleCorpus: {
        minWidth: 65,
        maxWidth: 120,
        minHeight: 200,
        maxHeight: 275,
        minDepth: 15,
        maxDepth: 90,
      },
      topCabinet: {
        maxHeight: 110,
      },
    },
  },

  modules: [
    {
      layoutId: 1,
      name: "Hang Basic",
      description: "2x plank, 2x roede",
      contents: {
        shelves: 2,
        rods: 2,
        drawers: 0,
        hasWashingMachineShelf: false,
        hasDesk: false,
      },
      priceDouble: 570,
      priceSingle: 342,
      availableForTopCabinet: true,
    },
    {
      layoutId: 2,
      name: "Shelf Focus",
      description: "3x plank, 1x roede",
      contents: {
        shelves: 3,
        rods: 1,
        drawers: 0,
        hasWashingMachineShelf: false,
        hasDesk: false,
      },
      priceDouble: 580,
      priceSingle: 348,
      availableForTopCabinet: false,
    },
    {
      layoutId: 3,
      name: "Drawer Combo",
      description: "4x plank, 3x lade",
      contents: {
        shelves: 4,
        rods: 0,
        drawers: 3,
        hasWashingMachineShelf: false,
        hasDesk: false,
      },
      priceDouble: 1145,
      priceSingle: 687,
      availableForTopCabinet: false,
    },
    {
      layoutId: 4,
      name: "Multi Shelf",
      description: "5x plank, 1x roede",
      contents: {
        shelves: 5,
        rods: 1,
        drawers: 0,
        hasWashingMachineShelf: false,
        hasDesk: false,
      },
      priceDouble: 760,
      priceSingle: 456,
      availableForTopCabinet: false,
    },
    {
      layoutId: 5,
      name: "Utility",
      description: "1x plank, 1x wasmachine plank, 3x lade",
      contents: {
        shelves: 1,
        rods: 0,
        drawers: 3,
        hasWashingMachineShelf: true,
        hasDesk: false,
      },
      priceDouble: 1290,
      priceSingle: 774,
      availableForTopCabinet: false,
    },
    {
      layoutId: 6,
      name: "Full Shelf",
      description: "5x plank",
      contents: {
        shelves: 5,
        rods: 0,
        drawers: 0,
        hasWashingMachineShelf: false,
        hasDesk: false,
      },
      priceDouble: 680,
      priceSingle: 408,
      availableForTopCabinet: false,
    },
    {
      layoutId: 7,
      name: "Minimal Hang",
      description: "2x plank, 1x roede",
      contents: {
        shelves: 2,
        rods: 1,
        drawers: 0,
        hasWashingMachineShelf: false,
        hasDesk: false,
      },
      priceDouble: 535,
      priceSingle: 321,
      availableForTopCabinet: false,
    },
    {
      layoutId: 8,
      name: "Mixed Storage",
      description: "3x lade, 1x roede, 1x plank",
      contents: {
        shelves: 1,
        rods: 1,
        drawers: 3,
        hasWashingMachineShelf: false,
        hasDesk: false,
      },
      priceDouble: 1090,
      priceSingle: 654,
      availableForTopCabinet: false,
    },
    {
      layoutId: 9,
      name: "Workspace",
      description: "1x bureau, 1x plank",
      contents: {
        shelves: 1,
        rods: 0,
        drawers: 0,
        hasWashingMachineShelf: false,
        hasDesk: true,
      },
      priceDouble: 1020,
      priceSingle: 612,
      availableForTopCabinet: false,
    },
  ],

  accessories: [
    {
      id: "extra-shelf",
      name: "Extra Shelf",
      nameNl: "Plank Extra",
      price: 45,
      category: "interior",
      perUnit: true,
    },
    {
      id: "extra-rod",
      name: "Extra Rod",
      nameNl: "Roede Extra",
      price: 35,
      category: "interior",
      perUnit: true,
    },
    {
      id: "drawer",
      name: "Drawer",
      nameNl: "Lade",
      price: 185,
      category: "interior",
      perUnit: true,
    },
    {
      id: "jewelry-drawer",
      name: "Jewelry Drawer",
      nameNl: "Sieraden Lade",
      price: 245,
      category: "interior",
      perUnit: true,
    },
    {
      id: "pull-out-rod",
      name: "Pull-out Rod",
      nameNl: "Uitrek Roede",
      price: 105,
      category: "interior",
      perUnit: true,
    },
    {
      id: "pull-out-desk",
      name: "Pull-out Desk",
      nameNl: "Uitrek Bureau",
      price: 450,
      category: "interior",
      perUnit: true,
    },
    {
      id: "veneer-interior",
      name: "Veneer Interior Upgrade",
      nameNl: "Corpus in Houtlook (meerprijs)",
      price: 425,
      category: "upgrade",
      perUnit: false,
    },
    {
      id: "power-outlet",
      name: "Stekkerdoos",
      nameNl: "Stekkerdoos",
      price: 145,
      category: "electrical",
      perUnit: true,
    },
    {
      id: "side-panels-36mm",
      name: "Side Panels 36mm Upgrade",
      nameNl: "Zijpanelen 36mm (upgrade)",
      price: 175,
      category: "upgrade",
      perUnit: false,
    },
    {
      id: "push-to-open",
      name: "Push to Open",
      nameNl: "Push to Open",
      price: 7.5,
      category: "mechanism",
      perUnit: true,
    },
    {
      id: "handle",
      name: "Handle",
      nameNl: "Greep",
      price: 35,
      category: "mechanism",
      perUnit: true,
    },
  ],

  doors: [
    {
      id: "standard-color",
      name: "Standard Color Door (Large)",
      nameNl: "Deur Kleur",
      price: 135,
      variant: "standard",
    },
    {
      id: "small",
      name: "Small Door",
      nameNl: "Deur Klein",
      price: 75,
      variant: "small",
    },
    {
      id: "veneer",
      name: "Veneer Door",
      nameNl: "Deur Houtlook",
      price: 200,
      variant: "veneer",
    },
  ],

  handles: [
    { id: "1",  productCode: "W4080", name: "W4080 - variant 1",  price: 35 },
    { id: "2",  productCode: "W4080", name: "W4080 - variant 2",  price: 35 },
    { id: "3",  productCode: "W4080", name: "W4080 - variant 3",  price: 35 },
    { id: "4",  productCode: "W4080", name: "W4080 - variant 4",  price: 35 },
    { id: "5",  productCode: "W4080", name: "W4080 - variant 5",  price: 35 },
    { id: "6",  productCode: "W4080", name: "W4080 - variant 6",  price: 35 },
    { id: "7",  productCode: "W7822", name: "W7822 - variant 1",  price: 35 },
    { id: "8",  productCode: "W7822", name: "W7822 - variant 2",  price: 35 },
    { id: "9",  productCode: "W7840", name: "W7840 - variant 1",  price: 35 },
    { id: "10", productCode: "W7840", name: "W7840 - variant 2",  price: 35 },
    { id: "11", productCode: "W7840", name: "W7840 - variant 3",  price: 35 },
    { id: "12", productCode: "W7871", name: "W7871 - variant 1",  price: 35 },
    { id: "13", productCode: "W7870", name: "W7870 - variant 1",  price: 35 },
    { id: "14", productCode: "W7870", name: "W7870 - variant 2",  price: 35 },
    { id: "15", productCode: "W7988", name: "W7988 - variant 1",  price: 35 },
    { id: "16", productCode: "W7988", name: "W7988 - variant 2",  price: 35 },
    { id: "17", productCode: "W7988", name: "W7988 - variant 3",  price: 35 },
    { id: "18", productCode: "W7988", name: "W7988 - variant 4",  price: 35 },
    { id: "19", productCode: "Z1080", name: "Z1080 - variant 1",  price: 35 },
    { id: "20", productCode: "Z1080", name: "Z1080 - variant 2",  price: 35 },
    { id: "21", productCode: "Z1080", name: "Z1080 - variant 3",  price: 35 },
    { id: "22", productCode: "Z7849", name: "Z7849 - variant 1",  price: 35 },
    { id: "23", productCode: "W7845", name: "W7845 - variant 1",  price: 35 },
    { id: "24", productCode: "Z0056", name: "Z0056 - variant 1",  price: 35 },
    { id: "25", productCode: "Z0056", name: "Z0056 - variant 2",  price: 35 },
    { id: "26", productCode: "Z0056", name: "Z0056 - variant 3",  price: 35 },
    { id: "27", productCode: "Z0056", name: "Z0056 - variant 4",  price: 35 },
    { id: "28", productCode: "Z2168", name: "Z2168 - variant 1",  price: 35 },
    { id: "29", productCode: "Z2168", name: "Z2168 - variant 2",  price: 35 },
  ],

  installation: [
    {
      name: "Small Project",
      minTotal: 2000,
      maxTotal: 7000,
      price: 720,
      days: 1,
      people: 2,
    },
    {
      name: "Medium Project",
      minTotal: 7000,
      maxTotal: 12000,
      price: 1440,
      days: 2,
      people: 2,
    },
    {
      name: "Large Project",
      minTotal: 12000,
      maxTotal: 18000,
      price: 2160,
      days: 3,
      people: 2,
    },
  ],
};

async function seedPricingData() {
  console.log("🚀 Starting Sanity pricing data seed...\n");

  try {
    // Create pricingConfig singleton
    console.log("📦 Creating pricing configuration...");
    await client.createOrReplace({
      _id: "pricingConfig",
      _type: "pricingConfig",
      title: "Pricing Configuration",
      currency: "EUR",
      lastUpdated: new Date().toISOString(),
      led: pricingData.config.led,
      deliveryPrice: pricingData.config.deliveryPrice,
      slopedBackWallSurcharge: pricingData.config.slopedBackWallSurcharge,
      slopedSideWallSurchargePerSide: pricingData.config.slopedSideWallSurchargePerSide,
      constraints: pricingData.config.constraints,
    });
    console.log("   ✅ Pricing configuration created\n");

    // Create module layouts
    console.log("📦 Creating module layouts...");
    for (const module of pricingData.modules) {
      await client.createOrReplace({
        _id: `moduleLayout-${module.layoutId}`,
        _type: "moduleLayout",
        layoutId: module.layoutId,
        name: module.name,
        description: module.description,
        contents: module.contents,
        priceDouble: module.priceDouble,
        priceSingle: module.priceSingle,
        availableForTopCabinet: module.availableForTopCabinet,
      });
      console.log(`   ✅ ${module.layoutId}. ${module.name}`);
    }
    console.log("");

    // Create accessories
    console.log("📦 Creating accessories...");
    for (const accessory of pricingData.accessories) {
      await client.createOrReplace({
        _id: `accessory-${accessory.id}`,
        _type: "accessory",
        accessoryId: { _type: "slug", current: accessory.id },
        name: accessory.name,
        nameNl: accessory.nameNl,
        price: accessory.price,
        category: accessory.category,
        perUnit: accessory.perUnit,
      });
      console.log(`   ✅ ${accessory.name} (€${accessory.price})`);
    }
    console.log("");

    // Create door types
    console.log("📦 Creating door types...");
    for (const door of pricingData.doors) {
      await client.createOrReplace({
        _id: `doorType-${door.id}`,
        _type: "doorType",
        doorId: { _type: "slug", current: door.id },
        name: door.name,
        price: door.price,
        variant: door.variant,
      });
      console.log(`   ✅ ${door.name} (€${door.price})`);
    }
    console.log("");

    // Create handles
    console.log("📦 Creating handles...");
    for (const h of pricingData.handles) {
      await client.createOrReplace({
        _id: `handle-${h.id}`,
        _type: "handle",
        handleId: { _type: "slug", current: h.id },
        name: h.name,
        productCode: h.productCode,
        price: h.price,
      });
      console.log(`   ✅ ${h.name} (€${h.price})`);
    }
    console.log("");

    // Create installation tiers
    console.log("📦 Creating installation tiers...");
    for (const tier of pricingData.installation) {
      const tierId = tier.name.toLowerCase().replace(/\s+/g, "-");
      await client.createOrReplace({
        _id: `installationTier-${tierId}`,
        _type: "installationTier",
        name: tier.name,
        minTotal: tier.minTotal,
        maxTotal: tier.maxTotal,
        price: tier.price,
        days: tier.days,
        people: tier.people,
      });
      console.log(
        `   ✅ ${tier.name} (€${tier.minTotal}-€${tier.maxTotal} → €${tier.price})`
      );
    }
    console.log("");

    console.log("🎉 All pricing data seeded successfully!");
    console.log("\nSummary:");
    console.log(`   - 1 pricing configuration`);
    console.log(`   - ${pricingData.modules.length} module layouts`);
    console.log(`   - ${pricingData.accessories.length} accessories`);
    console.log(`   - ${pricingData.doors.length} door types`);
    console.log(`   - ${pricingData.handles.length} handles`);
    console.log(`   - ${pricingData.installation.length} installation tiers`);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

seedPricingData();
