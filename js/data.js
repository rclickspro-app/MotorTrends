/**
 * Silver Motors Inventory Database
 * Comprehensive catalog of standard, reliable, and popular vehicles
 */

const DEFAULT_VEHICLES_DATA = [
  {
    id: "veh-001",
    year: 2023,
    make: "Toyota",
    model: "RAV4",
    trim: "XLE Premium AWD",
    price: 32890,
    monthlyEst: 439,
    mileage: 18450,
    bodyType: "SUV",
    fuelType: "Gasoline",
    transmission: "Automatic",
    drivetrain: "AWD",
    engine: "2.5L 4-Cylinder DOHC",
    exteriorColor: "Silver Sky Metallic",
    interiorColor: "Black SofTex",
    vin: "2T3C1RFV5PW108492",
    stockNumber: "SM-4821",
    condition: "Certified Pre-Owned",
    featured: true,
    badges: ["Certified", "1-Owner", "Clean Carfax"],
    images: [
      "https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Apple CarPlay & Android Auto",
      "Power Moonroof",
      "Blind Spot Monitor with Rear Cross Traffic",
      "Heated Front Seats & Steering Wheel",
      "Toyota Safety Sense 2.5",
      "Power Liftgate",
      "Keyless Smart Entry with Push Button Start",
      "Dual-Zone Automatic Climate Control"
    ],
    overview: "One of the most dependable compact SUVs on the market. Extremely clean 1-owner off-lease vehicle with full dealer service records. Inspected through our 150-point Silver Certified process with extended powertrain warranty."
  },
  {
    id: "veh-002",
    year: 2022,
    make: "Honda",
    model: "Civic",
    trim: "Sport Touring Hatchback",
    price: 24950,
    monthlyEst: 335,
    mileage: 26200,
    bodyType: "Hatchback",
    fuelType: "Gasoline",
    transmission: "Automatic (CVT)",
    drivetrain: "FWD",
    engine: "1.5L Turbocharged 4-Cyl",
    exteriorColor: "Lunar Silver Metallic",
    interiorColor: "Black Leather",
    vin: "1HGBK1H75NA089123",
    stockNumber: "SM-4822",
    condition: "Pre-Owned",
    featured: true,
    badges: ["Great Price", "Clean Carfax", "Low Mileage"],
    images: [
      "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Bose 12-Speaker Premium Sound System",
      "Wireless Apple CarPlay & Android Auto",
      "Adaptive Cruise Control with Low-Speed Follow",
      "Lane Keeping Assist System",
      "Heated Leather Front & Rear Seats",
      "18-inch Alloy Wheels",
      "Wireless Phone Charger"
    ],
    overview: "Sporty, fuel efficient, and packed with high-end tech. The Civic Sport Touring offers hatchback utility with sporty handling and exceptional 37+ MPG highway fuel economy."
  },
  {
    id: "veh-003",
    year: 2023,
    make: "Ford",
    model: "F-150",
    trim: "XLT SuperCrew 4x4",
    price: 43500,
    monthlyEst: 579,
    mileage: 21800,
    bodyType: "Truck",
    fuelType: "Gasoline",
    transmission: "10-Speed Automatic",
    drivetrain: "4WD",
    engine: "3.5L V6 EcoBoost (400hp)",
    exteriorColor: "Iconic Silver",
    interiorColor: "Medium Dark Slate",
    vin: "1FTFW1E84PKB39841",
    stockNumber: "SM-4823",
    condition: "Certified Pre-Owned",
    featured: true,
    badges: ["Certified", "Max Tow Package", "1-Owner"],
    images: [
      "https://images.unsplash.com/photo-1605893477799-b99e3b8b93fe?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Ford Co-Pilot360 2.0",
      "12-inch Touchscreen with SYNC 4",
      "Trailer Tow Package with Pro Trailer Backup Assist",
      "Remote Start System",
      "Extended Range 36 Gallon Fuel Tank",
      "Tailgate Step with Work Surface",
      "Lockable Under-Seat Storage"
    ],
    overview: "The best-selling truck in North America. Equipped with the powerful 3.5L Twin-Turbo EcoBoost engine, capable of towing up to 13,000 lbs. Ready for work or family road trips."
  },
  {
    id: "veh-004",
    year: 2022,
    make: "Hyundai",
    model: "Tucson",
    trim: "Hybrid SEL Convenience",
    price: 28400,
    monthlyEst: 379,
    mileage: 31000,
    bodyType: "SUV",
    fuelType: "Hybrid",
    transmission: "6-Speed Automatic",
    drivetrain: "AWD",
    engine: "1.6L Turbo Hybrid",
    exteriorColor: "Shimmering Silver",
    interiorColor: "Black Tricot Cloth",
    vin: "KM8JNCA19NU203941",
    stockNumber: "SM-4824",
    condition: "Pre-Owned",
    featured: true,
    badges: ["38 MPG", "AWD Hybrid", "Warranty"],
    images: [
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Smart Cruise Control with Stop & Go",
      "Panoramic Sunroof",
      "Hands-Free Smart Power Liftgate",
      "10.25-inch Digital Gauge Cluster",
      "Wireless Device Charging",
      "Forward Collision-Avoidance Assist with Pedestrian Detection"
    ],
    overview: "Exceptional hybrid crossover with bold styling and outstanding fuel economy. AWD gives you year-round confidence in all weather conditions."
  },
  {
    id: "veh-005",
    year: 2021,
    make: "Toyota",
    model: "Camry",
    trim: "SE Nightshade",
    price: 22800,
    monthlyEst: 305,
    mileage: 38400,
    bodyType: "Sedan",
    fuelType: "Gasoline",
    transmission: "8-Speed Automatic",
    drivetrain: "FWD",
    engine: "2.5L 4-Cylinder",
    exteriorColor: "Celestial Silver Metallic",
    interiorColor: "Black Sport SofTex",
    vin: "4T1B11HK5MU503819",
    stockNumber: "SM-4825",
    condition: "Pre-Owned",
    featured: false,
    badges: ["Clean Carfax", "Well Maintained", "Best Seller"],
    images: [
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Sport-Tuned Suspension",
      "18-inch Black Alloy Wheels",
      "Toyota Safety Sense 2.5+",
      "Apple CarPlay & Android Auto",
      "Bi-LED Headlights",
      "Sport SofTex-Trimmed Front Seats with 8-way Power Driver"
    ],
    overview: "Legendary Toyota reliability with sleek Nightshade blacked-out trim accents. Outstanding commuter sedan with low maintenance costs and strong resale value."
  },
  {
    id: "veh-006",
    year: 2023,
    make: "Mazda",
    model: "CX-5",
    trim: "2.5 S Premium Package AWD",
    price: 29900,
    monthlyEst: 398,
    mileage: 15100,
    bodyType: "SUV",
    fuelType: "Gasoline",
    transmission: "6-Speed Automatic",
    drivetrain: "AWD",
    engine: "2.5L SKYACTIV-G 4-Cyl",
    exteriorColor: "Sonic Silver Metallic",
    interiorColor: "Black Leatherette",
    vin: "JM3KFBDM8P0493812",
    stockNumber: "SM-4826",
    condition: "Certified Pre-Owned",
    featured: true,
    badges: ["Certified", "i-ACTIV AWD", "Low Mileage"],
    images: [
      "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Standard i-Activ AWD",
      "Bose 10-Speaker Audio Sound System",
      "Paddle Shifters",
      "LED Headlights with Adaptive Front-Lighting System",
      "Power Sliding-Glass Moonroof",
      "Mazda Radar Cruise Control with Stop & Go"
    ],
    overview: "Known for segment-leading handling and upscale interior feel. Drives like a luxury crossover at an everyday affordable price point."
  },
  {
    id: "veh-007",
    year: 2022,
    make: "Tesla",
    model: "Model 3",
    trim: "Long Range AWD",
    price: 31900,
    monthlyEst: 425,
    mileage: 29400,
    bodyType: "Sedan",
    fuelType: "Electric",
    transmission: "Single-Speed Fixed Gear",
    drivetrain: "AWD",
    engine: "Dual Motor All-Electric (358 mi range)",
    exteriorColor: "Midnight Silver Metallic",
    interiorColor: "All Black Premium Interior",
    vin: "5YJ3E1EB6NF381920",
    stockNumber: "SM-4827",
    condition: "Pre-Owned",
    featured: true,
    badges: ["EV Clean Fuel", "358mi Range", "Dual Motor"],
    images: [
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Autopilot Driver Assistance",
      "15-inch Touchscreen Navigation & Entertainment",
      "Glass Roof with UV & IR Protection",
      "Premium Audio 14 Speakers with Subwoofer",
      "Heated Front and Rear Seats",
      "Over-the-Air Software Updates",
      "Tesla Supercharging Enabled"
    ],
    overview: "Save hundreds on fuel every month with this pristine Dual-Motor Long Range Model 3. Acceleration from 0-60 in 4.2 seconds with 350+ miles of pure electric range."
  },
  {
    id: "veh-008",
    year: 2021,
    make: "Subaru",
    model: "Outback",
    trim: "Limited AWD",
    price: 26500,
    monthlyEst: 355,
    mileage: 34100,
    bodyType: "SUV",
    fuelType: "Gasoline",
    transmission: "Lineartronic CVT",
    drivetrain: "AWD",
    engine: "2.5L SUBARU BOXER 4-Cyl",
    exteriorColor: "Ice Silver Metallic",
    interiorColor: "Titanium Gray Leather",
    vin: "4S4BTANC7M3204918",
    stockNumber: "SM-4828",
    condition: "Pre-Owned",
    featured: false,
    badges: ["Symmetrical AWD", "Clean Carfax", "Roof Rails"],
    images: [
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Subaru Symmetrical All-Wheel Drive with X-MODE",
      "EyeSight Driver Assist Technology",
      "Harman Kardon 12-Speaker Sound",
      "11.6-inch STARLINK Multimedia Touchscreen",
      "Leather-Trimmed Upholstery",
      "Hands-Free Power Rear Gate"
    ],
    overview: "The ultimate adventure wagon. With 8.7 inches of ground clearance, standard AWD, and heated leather seats, it is designed for all season Canadian & North American driving."
  },
  {
    id: "veh-009",
    year: 2020,
    make: "Chevrolet",
    model: "Silverado 1500",
    trim: "RST Crew Cab 4WD",
    price: 36800,
    monthlyEst: 489,
    mileage: 48000,
    bodyType: "Truck",
    fuelType: "Gasoline",
    transmission: "8-Speed Automatic",
    drivetrain: "4WD",
    engine: "5.3L EcoTec3 V8 (355 hp)",
    exteriorColor: "Silver Ice Metallic",
    interiorColor: "Jet Black Cloth",
    vin: "1GCPYDEF6LZ209481",
    stockNumber: "SM-4829",
    condition: "Pre-Owned",
    featured: false,
    badges: ["V8 Power", "Z71 Off-Road", "Tow Package"],
    images: [
      "https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Z71 Off-Road and Protection Package",
      "Dual Exhaust with Polished Outlets",
      "Remote Vehicle Starter System",
      "Keyless Open and Start",
      "Chevrolet Infotainment 3 System with 8-inch diagonal color touchscreen",
      "EZ Lift Power Lock and Release Tailgate"
    ],
    overview: "Clean Silverado RST with full V8 power and rumbling sound. Features the popular Rally Sport Truck appearance package with body-colored bumpers and 20-inch wheels."
  },
  {
    id: "veh-010",
    year: 2022,
    make: "Honda",
    model: "CR-V",
    trim: "EX-L AWD",
    price: 29500,
    monthlyEst: 395,
    mileage: 22400,
    bodyType: "SUV",
    fuelType: "Gasoline",
    transmission: "CVT Automatic",
    drivetrain: "AWD",
    engine: "1.5L Turbo 4-Cyl",
    exteriorColor: "Modern Steel Metallic",
    interiorColor: "Black Leather",
    vin: "2HKRW2H87NH601923",
    stockNumber: "SM-4830",
    condition: "Certified Pre-Owned",
    featured: true,
    badges: ["Certified", "1-Owner", "Leather & Roof"],
    images: [
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Real Time AWD with Intelligent Control System",
      "Leather-Trimmed Seats with Driver Memory",
      "Power Tailgate with Programmable Height",
      "Honda Sensing Safety Suite",
      "Blind Spot Information System with Cross Traffic Monitor",
      "Remote Engine Start"
    ],
    overview: "Spacious, comfortable, and reliable. EX-L trim adds leather comfort and power tailgate to Honda's award-winning family SUV platform."
  },
  {
    id: "veh-011",
    year: 2021,
    make: "Nissan",
    model: "Rogue",
    trim: "SV AWD",
    price: 21900,
    monthlyEst: 295,
    mileage: 39500,
    bodyType: "SUV",
    fuelType: "Gasoline",
    transmission: "Xtronic CVT",
    drivetrain: "AWD",
    engine: "2.5L DOHC 4-Cylinder",
    exteriorColor: "Brilliant Silver Metallic",
    interiorColor: "Charcoal Cloth",
    vin: "JN8AT3BB9MW190341",
    stockNumber: "SM-4831",
    condition: "Pre-Owned",
    featured: false,
    badges: ["Great Value", "ProPILOT Assist", "33 MPG"],
    images: [
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Nissan Safety Shield 360",
      "ProPILOT Assist Highway Driving Helper",
      "Intelligent Around View Monitor (360 Camera)",
      "Dual Panel Panoramic Moonroof",
      "Remote Engine Start with Intelligent Climate Control",
      "Wi-Fi Hotspot"
    ],
    overview: "Tremendous value for money with modern redesigned interior, 360-degree parking cameras, and semi-autonomous ProPILOT highway cruise assist."
  },
  {
    id: "veh-012",
    year: 2020,
    make: "BMW",
    model: "3 Series",
    trim: "330i xDrive Sedan",
    price: 27900,
    monthlyEst: 375,
    mileage: 41200,
    bodyType: "Sedan",
    fuelType: "Gasoline",
    transmission: "8-Speed Sport Automatic",
    drivetrain: "AWD",
    engine: "2.0L BMW TwinPower Turbo 4-Cyl (255hp)",
    exteriorColor: "Glacier Silver Metallic",
    interiorColor: "Black Vernasca Leather",
    vin: "WBA5R7C57LFP84912",
    stockNumber: "SM-4832",
    condition: "Pre-Owned",
    featured: true,
    badges: ["xDrive AWD", "Live Cockpit Pro", "Clean History"],
    images: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "BMW Live Cockpit Professional with Navigation",
      "Active Driving Assistant & Lane Departure Warning",
      "Comfort Access Keyless Entry",
      "Heated Steering Wheel & Heated Front Seats",
      "Hi-Fi Sound System",
      "Wireless Apple CarPlay Compatibility"
    ],
    overview: "Dynamic sports sedan performance paired with BMW's intelligent xDrive all-wheel drive system. Immaculate condition inside and out with sharp styling."
  },
  {
    id: "veh-013",
    year: 2022,
    make: "Ford",
    model: "Explorer",
    trim: "XLT 4WD 7-Passenger",
    price: 34500,
    monthlyEst: 459,
    mileage: 28900,
    bodyType: "SUV",
    fuelType: "Gasoline",
    transmission: "10-Speed Automatic",
    drivetrain: "4WD",
    engine: "2.3L EcoBoost I-4 (300hp)",
    exteriorColor: "Silver Spruce Metallic",
    interiorColor: "Ebony ActiveX",
    vin: "1FMSK8DH8NGA90128",
    stockNumber: "SM-4833",
    condition: "Pre-Owned",
    featured: false,
    badges: ["3-Row / 7 Seats", "4WD", "Clean Carfax"],
    images: [
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "3-Row Seating (Accommodates 7 passengers)",
      "Terrain Management System with 7 selectable modes",
      "Ford Co-Pilot360 Assist+",
      "Power Liftgate",
      "Tri-Zone Electronic Automatic Temperature Control",
      "Acoustic-Laminate Front Side Windows"
    ],
    overview: "Spacious 3-row family SUV with 300 horsepower turbocharged performance, easy split-folding seats, and extensive cargo space for road trips."
  },
  {
    id: "veh-014",
    year: 2021,
    make: "Hyundai",
    model: "Elantra",
    trim: "SEL Convenience",
    price: 18900,
    monthlyEst: 255,
    mileage: 32500,
    bodyType: "Sedan",
    fuelType: "Gasoline",
    transmission: "Smartstream IVT",
    drivetrain: "FWD",
    engine: "2.0L 4-Cylinder (41 MPG Hwy)",
    exteriorColor: "Fluid Metal Silver",
    interiorColor: "Gray Cloth",
    vin: "KMHLN4AG5MU109284",
    stockNumber: "SM-4834",
    condition: "Pre-Owned",
    featured: false,
    badges: ["Under $20k", "41 MPG", "Great First Car"],
    images: [
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Forward Collision-Avoidance Assist",
      "10.25-inch High-Resolution Navigation Touchscreen",
      "Wireless Device Charging",
      "Heated Front Seats",
      "Electronic Parking Brake with Auto Hold",
      "Smart Cruise Control"
    ],
    overview: "Affordable, ultra-efficient commuter car with futuristic styling and top safety scores. Remarkable fuel economy at an accessible budget price point."
  },
  {
    id: "veh-015",
    year: 2022,
    make: "Mercedes-Benz",
    model: "C-Class",
    trim: "C 300 4MATIC Sedan",
    price: 35900,
    monthlyEst: 479,
    mileage: 23100,
    bodyType: "Sedan",
    fuelType: "Gasoline",
    transmission: "9G-TRONIC 9-Speed Automatic",
    drivetrain: "AWD",
    engine: "2.0L Inline-4 Turbo with Mild Hybrid (255hp)",
    exteriorColor: "Iridium Silver Metallic",
    interiorColor: "Black MB-Tex",
    vin: "W1KWF8DB4NR198302",
    stockNumber: "SM-4835",
    condition: "Certified Pre-Owned",
    featured: true,
    badges: ["Certified", "4MATIC AWD", "MBUX Touchscreen"],
    images: [
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "11.9-inch Portrait Central Touchscreen Display",
      "MBUX Augmented Reality Navigation",
      "Burmester 3D Surround Sound System",
      "Active Distance Assist DISTRONIC",
      "64-Color Ambient Lighting",
      "Panoramic Sliding Sunroof"
    ],
    overview: "Sophisticated executive sedan with next-generation MBUX vertical cockpit and 4MATIC all-weather traction. Smooth, whisper-quiet cabin ride."
  },
  {
    id: "veh-016",
    year: 2021,
    make: "Toyota",
    model: "Sienna",
    trim: "XLE 8-Passenger Hybrid",
    price: 37900,
    monthlyEst: 499,
    mileage: 39000,
    bodyType: "Van",
    fuelType: "Hybrid",
    transmission: "ECVT",
    drivetrain: "AWD",
    engine: "2.5L 4-Cylinder Hybrid (36 MPG)",
    exteriorColor: "Silver Metallic",
    interiorColor: "Chateau SofTex",
    vin: "5TDJSKEC7MS109483",
    stockNumber: "SM-4836",
    condition: "Pre-Owned",
    featured: false,
    badges: ["36 MPG Hybrid", "8 Passengers", "Family Favorite"],
    images: [
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Standard Hybrid Powertrain with 36 Combined MPG",
      "Dual Power Sliding Doors with Kick Sensor",
      "Hands-Free Power Liftgate",
      "Four-Zone Automatic Climate Control",
      "Blind Spot Monitor with Rear Cross-Traffic Alert",
      "7 USB Ports throughout cabin"
    ],
    overview: "The gold standard for family transportation. 36 MPG fuel economy in a full 8-passenger minivan with dual kick-sensor power sliding doors and AWD."
  }
];

// LocalStorage Key for persistent marketplace edits
const STORAGE_KEY_VEHICLES = 'silver_motors_vehicles_db';

// Initialize VEHICLES_DATA from LocalStorage if available, otherwise use initial default catalog
function getStoredVehicles() {
  const localData = localStorage.getItem(STORAGE_KEY_VEHICLES);
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Error reading localStorage vehicles data:', e);
    }
  }
  // Store default copy
  localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(DEFAULT_VEHICLES_DATA));
  return DEFAULT_VEHICLES_DATA;
}

function saveVehiclesData(data) {
  localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(data));
  VEHICLES_DATA.length = 0;
  VEHICLES_DATA.push(...data);
}

// Active working array
const VEHICLES_DATA = [...getStoredVehicles()];

// Helper functions for easy filtering and querying
function getAllMakes() {
  const makes = [...new Set(VEHICLES_DATA.map(v => v.make))];
  return makes.sort();
}

function getAllBodyTypes() {
  const types = [...new Set(VEHICLES_DATA.map(v => v.bodyType))];
  return types.sort();
}

function getVehicleById(id) {
  return VEHICLES_DATA.find(v => v.id === id);
}

function formatPrice(val) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val);
}

function formatNumber(val) {
  return new Intl.NumberFormat('en-US').format(val);
}
