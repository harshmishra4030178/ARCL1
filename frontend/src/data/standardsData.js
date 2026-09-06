/**
 * ARCL Civil Engineering Testing Standards (IS / ASTM / BS) Directory
 * 100% Mapped to Real ARCL Production Database Products & Cloudinary Images
 */

export const STANDARDS_CATEGORIES = [
  "All Standards",
  "Concrete Testing",
  "Soil & Geotechnical",
  "Bitumen & Highway",
  "Cement & Mortar",
  "Aggregates Testing",
  "NDT & Field Testing",
];

export const STANDARDS_DATA = [
  // 1. CONCRETE COMPRESSION TEST
  {
    id: "is-516-concrete-compressive-strength",
    code: "IS 516 : 2021",
    astmEquivalent: "ASTM C39 / BS 1881 / EN 12390-3",
    title: "Method of Tests for Strength of Concrete (Compressive & Flexural Strength)",
    category: "Concrete Testing",
    badgeColor: "blue",
    description:
      "Specifies the determination of compressive strength of cubic and cylindrical concrete specimens to assess structural load-bearing capacity for RMC plants, bridges, and building construction.",
    specimen: "150mm x 150mm x 150mm Cubes or 150mm Dia x 300mm Height Cylinders",
    paceRate: "140 kg/sq.cm/min (approx. 5.2 kN/sec for 150mm cubes)",
    significance: "Essential compliance test for all ready-mix concrete (RMC) plants, NHAI highways, and high-rise structures.",
    requiredEquipment: [
      {
        name: "Digital Compression Testing Machine 2000kN - Channel Frame",
        code: "ARCL-DCTM2000",
        slug: "digital-compression-testing-machine-2000kn-channel-frame",
        role: "Primary Load Crushing Unit",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788261941/products/rwv9chfcohdlnj0zvsgk.jpg",
        isPrimary: true,
      },
      {
        name: "Fully Automatic Compression Testing Machine - Servo Controlled",
        code: "ARCL-FACTM2000",
        slug: "fully-automatic-compression-testing-machine-servo-controlled",
        role: "Pace Rate Controlled Crushing Unit",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788263054/products/kacfjsnzzi9iost7qzbw.jpg",
        isPrimary: false,
      },
      {
        name: "Cube Mould – Plastic",
        code: "ARCL-CMP",
        slug: "cube-mould-plastic",
        role: "Specimen Casting",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788591051/products/ormymvc0n4jjlytmahlc.jpg",
        isPrimary: false,
      },
      {
        name: "Accelerated Curing Tank - Digital",
        code: "ARCL-DACT",
        slug: "accelerated-curing-tank-digital",
        role: "Water Curing Chamber (27±2°C)",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788606985/products/mjhvrfarzo6n1shakwxw.jpg",
        isPrimary: false,
      },
    ],
    tags: ["is 516", "astm c39", "ctm", "concrete cube", "compressive strength", "crushing", "curing tank"],
  },

  // 2. CONCRETE WORKABILITY / SLUMP
  {
    id: "is-1199-concrete-slump-workability",
    code: "IS 1199 (Part 2) : 2018",
    astmEquivalent: "ASTM C143 / BS EN 12350-2",
    title: "Methods of Sampling & Analysis of Concrete - Workability by Slump Test",
    category: "Concrete Testing",
    badgeColor: "blue",
    description:
      "Determines the consistency and workability of fresh concrete at batching plants and construction sites to avoid segregation and ensure pumpability.",
    specimen: "Freshly mixed concrete sampled as per IS 1199 guidelines",
    paceRate: "Mould lifted vertically in 2 to 5 seconds",
    significance: "Mandatory quality check for every batch of ready-mix concrete before pouring at site.",
    requiredEquipment: [
      {
        name: "Slump Cone Apparatus",
        code: "ARCL-SCA",
        slug: "slump-cone-apparatus",
        role: "Complete Set (Cone, Base Plate, Tamping Rod, Rule)",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788351530/products/wadktgpi4lftjnzdg7wv.jpg",
        isPrimary: true,
      },
    ],
    tags: ["is 1199", "astm c143", "slump cone", "workability", "fresh concrete", "pumpable concrete"],
  },

  // 3. ACCELERATED CURING
  {
    id: "is-9013-accelerated-curing",
    code: "IS 9013 : 1978",
    astmEquivalent: "ASTM C684",
    title: "Method of Making, Curing and Determining Compressive Strength of Accelerated-Cured Concrete",
    category: "Concrete Testing",
    badgeColor: "blue",
    description:
      "Predicts the 28-day compressive strength of concrete within 28.5 hours using the warm water / boiling water method for fast-track construction projects.",
    specimen: "150mm concrete cubes in sealed moulds",
    paceRate: "Controlled thermal water bath heating cycle",
    significance: "Allows high-speed QA approval without waiting 28 days for standard curing.",
    requiredEquipment: [
      {
        name: "Accelerated Curing Tank - Digital",
        code: "ARCL-DACT",
        slug: "accelerated-curing-tank-digital",
        role: "Thermostatic Boiling & Warm Water Tank",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788606985/products/mjhvrfarzo6n1shakwxw.jpg",
        isPrimary: true,
      },
      {
        name: "Cube Mould – Plastic",
        code: "ARCL-CMP",
        slug: "cube-mould-plastic",
        role: "Cube Casting",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788591051/products/ormymvc0n4jjlytmahlc.jpg",
        isPrimary: false,
      },
    ],
    tags: ["is 9013", "astm c684", "accelerated curing", "boiling water", "curing tank"],
  },

  // 4. NON-DESTRUCTIVE TESTING - REBOUND HAMMER
  {
    id: "is-13311-part-2-rebound-hammer",
    code: "IS 13311 (Part 2) : 1992",
    astmEquivalent: "ASTM C805 / BS 1881-202",
    title: "Non-Destructive Testing of Concrete - Rebound Hammer Method",
    category: "NDT & Field Testing",
    badgeColor: "indigo",
    description:
      "Assesses the in-situ compressive strength, surface hardness, and concrete uniformity of existing structures without damaging the elements.",
    specimen: "Smooth in-situ concrete surface (beams, columns, slabs)",
    paceRate: "Impact energy 2.207 Nm",
    significance: "Standard non-destructive structural audit of existing buildings, bridges, and precast units.",
    requiredEquipment: [
      {
        name: "Digital Concrete Test Hammer (rebound Hammer) – Langry",
        code: "ARCL-RHD",
        slug: "digital-concrete-test-hammer-rebound-hammer-langry",
        role: "Digital Impact Plunger & Display",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788606413/products/ps5uubhdmrb4dn90qgc8.png",
        isPrimary: true,
      },
      {
        name: "Concrete Test Hammer (Rebound Hammer) - Mechanical",
        code: "ARCL-RHM",
        slug: "concrete-test-hammer-rebound-hammer-mechanical",
        role: "Mechanical Portable Impact Tester",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788337198/products/q6g78rsluw6yrzau3cp3.png",
        isPrimary: false,
      },
    ],
    tags: ["is 13311", "astm c805", "rebound hammer", "schmidt hammer", "ndt", "surface hardness"],
  },

  // 5. NON-DESTRUCTIVE TESTING - UPV
  {
    id: "is-13311-part-1-ultrasonic-pulse-velocity",
    code: "IS 13311 (Part 1) : 1992",
    astmEquivalent: "ASTM C597 / BS 1881-203",
    title: "Non-Destructive Testing of Concrete - Ultrasonic Pulse Velocity (UPV)",
    category: "NDT & Field Testing",
    badgeColor: "indigo",
    description:
      "Measures ultrasonic wave velocity through concrete to detect internal voids, honeycombing, cracks, and assess dynamic elastic modulus.",
    specimen: "Direct, semi-direct, or indirect transmission across concrete sections",
    paceRate: "Pulse transmission 54 kHz transducers",
    significance: "Deep internal structural integrity assessment for old bridges, dams, and multi-storey pillars.",
    requiredEquipment: [
      {
        name: "Ultrasonic Pulse Velocity Tester – C369N",
        code: "ARCL-UPVC369N",
        slug: "ultrasonic-pulse-velocity-tester-c369n",
        role: "Microprocessor UPV Tester with Transducers",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788605424/products/klbevuzclelwgq4sfmxl.png",
        isPrimary: true,
      },
      {
        name: "Pile Integrity Tester – Zbl P8000",
        code: "ARCL-PIT8000",
        slug: "pile-integrity-tester-zbl-p8000",
        role: "Low Strain Pile Foundation Integrity Unit",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788603991/products/hedhrod4asvrclep4xzr.jpg",
        isPrimary: false,
      },
    ],
    tags: ["is 13311 part 1", "astm c597", "upv", "ultrasonic", "pulse velocity", "internal cracks"],
  },

  // 6. SOIL - CALIFORNIA BEARING RATIO (CBR)
  {
    id: "is-2720-part-16-cbr-testing",
    code: "IS 2720 (Part 16) : 1987",
    astmEquivalent: "ASTM D1883 / AASHTO T193 / BS 1377-4",
    title: "Methods of Test for Soils - Determination of California Bearing Ratio (CBR)",
    category: "Soil & Geotechnical",
    badgeColor: "amber",
    description:
      "Determines the bearing resistance and penetration capacity of subgrade and highway base courses in unsoaked and soaked conditions.",
    specimen: "Compacted soil in 150mm dia x 175mm height CBR mould",
    paceRate: "1.25 mm/minute standard penetration speed",
    significance: "The foundation calculation parameter for all IRC flexible pavement thickness designs (NHAI / MoRTH).",
    requiredEquipment: [
      {
        name: "CBR Testing Machine – Digital",
        code: "ARCL-DCBR",
        slug: "cbr-testing-machine-digital",
        role: "Motorized 50kN Load Frame with Penetration Piston",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788334655/products/tmqm10rzvm51w7nvpymj.png",
        isPrimary: true,
      },
    ],
    tags: ["is 2720 part 16", "astm d1883", "cbr", "california bearing ratio", "subgrade", "pavement design"],
  },

  // 7. SOIL - DIRECT SHEAR TEST
  {
    id: "is-2720-part-13-direct-shear",
    code: "IS 2720 (Part 13) : 1986",
    astmEquivalent: "ASTM D3080 / BS 1377-7",
    title: "Methods of Test for Soils - Direct Shear Test",
    category: "Soil & Geotechnical",
    badgeColor: "amber",
    description:
      "Determines the shear strength parameters of soil: cohesion (c) and internal friction angle (φ) under normal consolidation loads.",
    specimen: "60mm x 60mm x 25mm undisturbed or remoulded soil sample",
    paceRate: "12 selectable speeds from 1.25 mm/min to 0.002 mm/min",
    significance: "Crucial for slope stability analysis, retaining wall design, and foundation bearing capacity.",
    requiredEquipment: [
      {
        name: "Direct Shear Test Apparatus",
        code: "ARCL-DSA",
        slug: "direct-shear-test-apparatus",
        role: "12-Speed Motorized Shear Box Apparatus",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788335579/products/ggrcbhzetdw84nxkvymk.png",
        isPrimary: true,
      },
    ],
    tags: ["is 2720 part 13", "astm d3080", "direct shear", "shear strength", "soil friction", "cohesion"],
  },

  // 8. SOIL - PLATE LOAD TEST & EV2
  {
    id: "is-1888-plate-load-test",
    code: "IS 1888 : 1982",
    astmEquivalent: "ASTM D1194 / DIN 18134",
    title: "Method of Load Test on Soils (Bearing Capacity & Static Deformation Modulus EV2)",
    category: "Soil & Geotechnical",
    badgeColor: "amber",
    description:
      "Measures the ultimate bearing capacity and settlement of soil at foundation level under incremental static vertical loading.",
    specimen: "In-situ ground tested with 300mm, 450mm, 600mm, and 750mm circular bearing plates",
    paceRate: "Incremental hydraulic loading with dial gauge settlement monitoring",
    significance: "Determines allowable soil bearing pressure for high-rise building foundations and railway subgrades.",
    requiredEquipment: [
      {
        name: "Plate Load Test Apparatus",
        code: "ARCL-PLA",
        slug: "plate-load-test-apparatus",
        role: "50-Ton Hydraulic Jack, Reaction Bridge, Dial Gauges",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788345879/products/oijfrt4vt6vc0bk7bdtt.png",
        isPrimary: true,
      },
      {
        name: "Static Plate Load Test Apparatus – EV2",
        code: "ARCL-EV2",
        slug: "static-plate-load-test-apparatus-ev2",
        role: "Precision Static Deformation Modulus EV2 Tester",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788338334/products/gbcf98ojz83nrgx7ovkv.jpg",
        isPrimary: false,
      },
    ],
    tags: ["is 1888", "astm d1194", "plate load", "bearing capacity", "ev2", "settlement"],
  },

  // 9. SOIL - FIELD DENSITY BY SAND REPLACEMENT
  {
    id: "is-2720-part-28-sand-pouring",
    code: "IS 2720 (Part 28) : 1974",
    astmEquivalent: "ASTM D1556 / AASHTO T191",
    title: "Determination of Dry Density of Soil in Place by the Sand Replacement Method",
    category: "Soil & Geotechnical",
    badgeColor: "amber",
    description:
      "Measures the in-situ dry density and compaction percentage of compacted earth embankments and subgrade layers.",
    specimen: "100mm or 150mm excavated soil hole with standard Ottawa/Ennore sand",
    paceRate: "Field gravimetric density calculation",
    significance: "Daily quality verification for road embankments, canal linings, and earthen dams.",
    requiredEquipment: [
      {
        name: "Sand Pouring Cylinder",
        code: "ARCL-SPC",
        slug: "sand-pouring-cylinder",
        role: "100mm / 150mm Pouring Cylinder with Calibrating Can",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788345265/products/icn8bwm5eq9thbidqaug.jpg",
        isPrimary: true,
      },
    ],
    tags: ["is 2720 part 28", "astm d1556", "sand pouring", "field density", "soil compaction"],
  },

  // 10. BITUMEN - DUCTILITY TEST
  {
    id: "is-1208-bitumen-ductility",
    code: "IS 1208 : 1978",
    astmEquivalent: "ASTM D113 / AASHTO T51 / IP 32",
    title: "Methods for Testing Tar and Bituminous Materials - Determination of Ductility",
    category: "Bitumen & Highway",
    badgeColor: "emerald",
    description:
      "Measures the elongation distance in centimeters that a briquette of bitumen can stretch before breaking under controlled water bath conditions (27°C).",
    specimen: "Standard brass briquette mould (10mm x 10mm throat)",
    paceRate: "Pull rate 50 mm/minute ± 2.5 mm/min",
    significance: "Determines bitumen's resistance to cracking under repetitive traffic loads and temperature variations.",
    requiredEquipment: [
      {
        name: "Ductility Testing Machine",
        code: "ARCL-DTA",
        slug: "ductility-testing-machine",
        role: "Thermostatic Stainless Steel Bath with Motorized Puller",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788597428/products/s9jsybnbnnirc8mr9hmi.png",
        isPrimary: true,
      },
    ],
    tags: ["is 1208", "astm d113", "ductility", "bitumen", "asphalt elongation", "briquette mould"],
  },

  // 11. BITUMEN - PENETRATION TEST
  {
    id: "is-1203-bitumen-penetration",
    code: "IS 1203 : 1978",
    astmEquivalent: "ASTM D5 / AASHTO T49 / IP 49",
    title: "Methods for Testing Tar and Bituminous Materials - Determination of Penetration",
    category: "Bitumen & Highway",
    badgeColor: "emerald",
    description:
      "Determines the hardness or consistency of bitumen grades (e.g. VG-10, VG-30, VG-40) by measuring the depth in 1/10th of a mm that a standard 100g needle penetrates in 5 seconds at 25°C.",
    specimen: "Molten bitumen cooled in sample container at 25°C water bath",
    paceRate: "100g load for exactly 5 seconds",
    significance: "Primary criterion used in refinery certification and asphalt mix plant viscosity grading.",
    requiredEquipment: [
      {
        name: "Standard Penetrometer",
        code: "ARCL-SP",
        slug: "standard-penetrometer",
        role: "Digital Timer / Dial Penetrometer with 100g Weight & Needle",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788598475/products/lwq3ifkne9hcbing1rwg.png",
        isPrimary: true,
      },
    ],
    tags: ["is 1203", "astm d5", "penetrometer", "penetration", "bitumen grade", "vg30", "vg40"],
  },

  // 12. BITUMEN - MARSHALL STABILITY & FLOW
  {
    id: "astm-d6927-marshall-stability",
    code: "ASTM D6927 / AASHTO T245",
    astmEquivalent: "BS 598-107 / MoRTH Section 500",
    title: "Marshall Stability and Flow of Asphalt Paving Mixtures",
    category: "Bitumen & Highway",
    badgeColor: "emerald",
    description:
      "Measures the resistance to plastic flow (stability in kN) and flow value (deformation in mm) of cylindrical bituminous pavement mixture specimens.",
    specimen: "101.6mm dia x 63.5mm height compacted asphalt specimen",
    paceRate: "50.8 mm/min (2 inches/min) constant rate of strain",
    significance: "Determines the optimum bitumen binder content (OBC) for all highway and airport runway asphalt mixes.",
    requiredEquipment: [
      {
        name: "Marshall Stability Test Apparatus",
        code: "ARCL-MSA",
        slug: "marshall-stability-test-apparatus",
        role: "50kN Motorized Load Frame with Breaking Head & Flow Meter",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788336176/products/frdmjk3o3xlslbkcdsvw.png",
        isPrimary: true,
      },
      {
        name: "Bitumen Extractor",
        code: "ARCL-BE",
        slug: "bitumen-extractor",
        role: "Centrifuge Binder Extraction Unit",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788596945/products/vw7dw6etuoecnpz6zpuq.png",
        isPrimary: false,
      },
    ],
    tags: ["astm d6927", "aashto t245", "marshall stability", "flow value", "bituminous mix", "morth"],
  },

  // 13. CEMENT - VICAT CONSISTENCY & SETTING TIME
  {
    id: "is-4031-part-4-5-vicat-apparatus",
    code: "IS 4031 (Part 4 & 5) : 1988",
    astmEquivalent: "IS 5513 / ASTM C187 / ASTM C191 / EN 196-3",
    title: "Determination of Normal Consistency, Initial and Final Setting Times of Hydraulic Cement",
    category: "Cement & Mortar",
    badgeColor: "purple",
    description:
      "Determines the standard water percentage required for normal consistency, and the initial and final setting times of OPC, PPC, and rapid-hardening cements.",
    specimen: "Standard neat cement paste in Vicat conical mould (80mm dia x 40mm height)",
    paceRate: "Drop under 300g plunger weight",
    significance: "Mandatory factory and site acceptance test for all cement manufacturers and concrete batching operations.",
    requiredEquipment: [
      {
        name: "Vicat Apparatus",
        code: "ARCL-VA",
        slug: "vicat-apparatus",
        role: "Frame with Plunger, Initial Needle, Final Needle & Mould",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788594444/products/hotkt0gwwf6osg57zz0h.png",
        isPrimary: true,
      },
      {
        name: "Cement Flow Table",
        code: "ARCL-FTC",
        slug: "cement-flow-table",
        role: "Hydraulic Cement Mortar Flow Consistency Unit",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788595159/products/obbxcqi4ukf5gjze5zxy.png",
        isPrimary: false,
      },
    ],
    tags: ["is 4031", "is 5513", "astm c187", "astm c191", "vicat", "setting time", "initial setting", "cement"],
  },

  // 14. CEMENT - COMPRESSIVE STRENGTH BY MORTAR VIBRATOR
  {
    id: "is-4031-part-6-mortar-vibrating",
    code: "IS 4031 (Part 6) : 1988",
    astmEquivalent: "IS 10080 / ASTM C109 / EN 196-1",
    title: "Determination of Compressive Strength of Hydraulic Cement (70.6mm Mortar Cubes)",
    category: "Cement & Mortar",
    badgeColor: "purple",
    description:
      "Determines the 3-day, 7-day, and 28-day compressive strength of cement using 1:3 standard Ennore sand mortar cubes compacted on a vibrating machine.",
    specimen: "70.6mm x 70.6mm x 70.6mm (50 sq.cm area) mortar cubes",
    paceRate: "12,000 ± 400 vibrations per minute for 2 minutes",
    significance: "Defines whether cement grade meets Grade 33, Grade 43, or Grade 53 IS standards.",
    requiredEquipment: [
      {
        name: "Mortar Vibrating Machine",
        code: "ARCL-MVM",
        slug: "mortar-vibrating-machine",
        role: "12000 RPM Standard Vibrating Table with Mould Clamps",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788332627/products/ebtjbr9nzeo5drr76vrm.jpg",
        isPrimary: true,
      },
      {
        name: "Mortar Mould – 70.6 mm",
        code: "ARCL-CM70.6",
        slug: "mortar-mould-706-mm",
        role: "Precision 70.6mm Steel Mould",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788333992/products/sox7hdyuaboafy99wagx.jpg",
        isPrimary: false,
      },
    ],
    tags: ["is 4031 part 6", "is 10080", "mortar vibrator", "70.6mm cube", "cement strength"],
  },

  // 15. AGGREGATE - SIEVE ANALYSIS & GRADATION
  {
    id: "is-2386-part-1-sieve-analysis",
    code: "IS 2386 (Part 1) : 1963",
    astmEquivalent: "IS 460 / ASTM C136 / AASHTO T27",
    title: "Methods of Test for Aggregates for Concrete - Particle Size and Shape (Sieve Analysis)",
    category: "Aggregates Testing",
    badgeColor: "cyan",
    description:
      "Determines the particle size distribution (gradation) of coarse and fine aggregates to calculate Fineness Modulus (FM) and verify compliance with Zone I to IV.",
    specimen: "Dry coarse aggregate (4.75mm to 80mm) or fine sand (75 micron to 4.75mm)",
    paceRate: "15 minutes standard mechanical shaking",
    significance: "Ensures optimal packing density in concrete and asphalt mix designs to reduce voids and cement cost.",
    requiredEquipment: [
      {
        name: "Sieve Shaker",
        code: "ARCL-SS",
        slug: "sieve-shaker",
        role: "Motorized Gyratory Sieve Shaker with Timer",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788593714/products/mktci7afqlinki2g97u8.jpg",
        isPrimary: true,
      },
      {
        name: "Gi Test Sieve",
        code: "ARCL-TSGI",
        slug: "gi-test-sieve",
        role: "IS 460 Standard Mesh Sieves (75µ to 80mm)",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788592639/products/awes5fd8jxmdzkg7mbnp.jpg",
        isPrimary: false,
      },
    ],
    tags: ["is 2386 part 1", "is 460", "astm c136", "sieve analysis", "sieve shaker", "fineness modulus", "gradation"],
  },

  // 16. AGGREGATE - CRUSHING VALUE & IMPACT VALUE
  {
    id: "is-2386-part-4-crushing-impact-value",
    code: "IS 2386 (Part 4) : 1963",
    astmEquivalent: "BS 812 : Part 110 & 112",
    title: "Methods of Test for Aggregates for Concrete - Mechanical Properties (Crushing & Impact Value)",
    category: "Aggregates Testing",
    badgeColor: "cyan",
    description:
      "Assesses the resistance of aggregates to progressive compressive crushing (Aggregate Crushing Value) and sudden shock/impact (Aggregate Impact Value).",
    specimen: "Aggregates passing 12.5mm and retained on 10mm IS sieve",
    paceRate: "Crushing: 400 kN over 10 mins; Impact: 15 blows of 14 kg hammer from 380mm height",
    significance: "Key criterion for selecting stone aggregates for heavy traffic wearing courses and airport pavements.",
    requiredEquipment: [
      {
        name: "Crushing Value Apparatus",
        code: "ARCL-CVA",
        slug: "crushing-value-apparatus",
        role: "Crushing Cylinder & Plunger",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788263915/products/bnqfqjfdvrbihurrdnyv.png",
        isPrimary: true,
      },
      {
        name: "Impact Value Apparatus",
        code: "ARCL-IVA",
        slug: "impact-value-apparatus",
        role: "Impact Tester with Blow Counter & Tamping Rod",
        image: "https://res.cloudinary.com/domeeznqa/image/upload/v1788263598/products/kvk8ffye7ffmlwo1ygdq.png",
        isPrimary: false,
      },
    ],
    tags: ["is 2386 part 4", "bs 812", "crushing value", "impact value", "aggregate strength", "wearing course"],
  },
];
