/**
 * Motor Trends Auto Group Inventory Database
 * Real Lower Mainland / Vancouver & Richmond BC Inventory
 * Based on KarStore Vancouver (karstore.ca/bc/inventory/) & BC Dealership Stock
 * All Prices in CAD | All Mileage in km | CAD Currency Enforcement
 */

const DEFAULT_VEHICLES_DATA = [
  {
    id: "veh-mt-01",
    year: 2021,
    make: "Jeep",
    model: "Wrangler 4xe",
    trim: "Unlimited High Altitude 4x4",
    price: 37888,
    monthlyEst: 495,
    mileage: 68000,
    bodyType: "SUV",
    fuelType: "Hybrid",
    transmission: "Automatic",
    drivetrain: "4x4",
    engine: "2.0L Turbo I4 Plug-in Hybrid PHEV",
    exteriorColor: "Hydro Blue Pearl",
    interiorColor: "Black Leather",
    vin: "1C4JJXR62MW581903",
    stockNumber: "MT-4022",
    condition: "Certified Pre-Owned",
    featured: true,
    badges: ["Single Owner", "No Accidents", "Clean Title", "Plug-in Hybrid", "4x4 High Altitude", "Local BC"],
    images: [
      "images/vehicles/jeep/main.jpg",
      "images/vehicles/jeep/jeep-1.jpg",
      "images/vehicles/jeep/jeep-2.jpg",
      "images/vehicles/jeep/jeep-3.jpg",
      "images/vehicles/jeep/jeep-4.jpg",
      "images/vehicles/jeep/jeep-5.jpg",
      "images/vehicles/jeep/jeep-6.jpg",
      "images/vehicles/jeep/jeep-7.jpg",
      "images/vehicles/jeep/jeep-8.jpg",
      "images/vehicles/jeep/jeep-9.jpg",
      "images/vehicles/jeep/jeep-10.jpg"
    ],
    features: [
      "Local BC Clean Title",
      "Single Owner - Zero Accidents",
      "Plug-in Hybrid (4xe Electric/Gas)",
      "Command-Trac 4x4 System",
      "High Altitude Unlimited Trim",
      "Premium Leather Upholstery",
      "Touchscreen Navigation & Backup Camera",
      "Off-road Capable & Trail Rated",
      "Clean Inside & Out - Runs and Drives Great",
      "DL#40212 - In-House Approval"
    ],
    overview: "2021 Jeep Wrangler 4xe Unlimited High Altitude 4x4. Local BC, clean title, single owner, no accidents. 68,000 KM, $37,888 CAD. Plug-in Hybrid, 4x4, Automatic, High Altitude Unlimited with premium leather interior, off-road capable, clean inside and out, runs and drives great. DL#40212. In-house Buy Here Pay Here financing available."
  },
  {
    id: "veh-mt-02",
    year: 2023,
    make: "Mitsubishi",
    model: "Outlander PHEV",
    trim: "SEL / GT AWD",
    price: 23888,
    monthlyEst: 345,
    mileage: 166000,
    bodyType: "SUV",
    fuelType: "Hybrid",
    transmission: "Automatic",
    drivetrain: "AWD",
    engine: "2.4L MIVEC 4-Cylinder + Twin Electric Motors PHEV",
    exteriorColor: "Sterling Silver Metallic",
    interiorColor: "Black Premium Seating",
    vin: "JA4T3VA90PZ310492",
    stockNumber: "MT-4023",
    condition: "Certified Pre-Owned",
    featured: true,
    badges: ["Single Owner", "No Accidents", "Clean Title", "Plug-in Hybrid", "AWD", "Local BC"],
    images: [
      "images/vehicles/outlander/main.jpg",
      "images/vehicles/outlander/outlander-1.jpg",
      "images/vehicles/outlander/outlander-2.jpg",
      "images/vehicles/outlander/outlander-3.jpg",
      "images/vehicles/outlander/outlander-4.jpg",
      "images/vehicles/outlander/outlander-5.jpg",
      "images/vehicles/outlander/outlander-6.jpg",
      "images/vehicles/outlander/outlander-7.jpg",
      "images/vehicles/outlander/outlander-8.jpg",
      "images/vehicles/outlander/outlander-9.jpg",
      "images/vehicles/outlander/outlander-10.jpg"
    ],
    features: [
      "Local BC Clean Title",
      "Single Owner - Zero Accidents",
      "PHEV Plug-in Hybrid Fuel Efficiency",
      "Super All-Wheel Control (S-AWC AWD)",
      "Spacious Family 3-Row Interior",
      "Great on Gas - Fuel Efficient Commuter",
      "Touchscreen Infotainment & Backup Camera",
      "Clean Inside and Out - Runs and Drives Great",
      "DL#40212 - In-House Approval"
    ],
    overview: "2023 Mitsubishi Outlander PHEV. Local BC, clean title, single owner, no accidents. 166,000 KM, $23,888 CAD. Plug-in Hybrid AWD SUV, Automatic. Great on gas, fuel efficient, spacious interior, great daily driver. Clean inside and out, runs and drives great. DL#40212. In-house financing available!"
  },
  {
    id: "veh-mt-03",
    year: 2017,
    make: "Toyota",
    model: "RAV4",
    trim: "LE / XLE FWD",
    price: 8888,
    monthlyEst: 142,
    mileage: 439000,
    bodyType: "SUV",
    fuelType: "Gasoline",
    transmission: "Automatic",
    drivetrain: "FWD",
    engine: "2.5L 4-Cylinder DOHC",
    exteriorColor: "Super White",
    interiorColor: "Grey Interior",
    vin: "2T3BFREV7HW694821",
    stockNumber: "MT-4021",
    condition: "Pre-Owned",
    featured: true,
    badges: ["Under $10k CAD", "Clean Title", "No Accidents", "Highway Driven", "Local BC"],
    images: [
      "images/vehicles/rav4/main.jpg",
      "images/vehicles/rav4/rav4-1.jpg",
      "images/vehicles/rav4/rav4-2.jpg",
      "images/vehicles/rav4/rav4-3.jpg",
      "images/vehicles/rav4/rav4-4.jpg",
      "images/vehicles/rav4/rav4-5.jpg",
      "images/vehicles/rav4/rav4-6.jpg",
      "images/vehicles/rav4/rav4-7.jpg",
      "images/vehicles/rav4/rav4-8.jpg",
      "images/vehicles/rav4/rav4-9.jpg",
      "images/vehicles/rav4/rav4-10.jpg"
    ],
    features: [
      "Local BC Clean Title",
      "Zero Accidents Reported",
      "Under $10,000 CAD Special",
      "Highway Driven & Work Commuter",
      "Reliable Toyota Durability",
      "Clean Inside and Out",
      "Runs and Drives Great",
      "DL#40212 - In-House Approval"
    ],
    overview: "2017 Toyota RAV4. Local BC, clean title, no accidents. 439,000 KM, $8,888 CAD. Automatic, highway driven, regularly used for work and commuting. Reliable, great daily driver, clean inside and out, runs and drives great. DL#40212 (Richmond, BC). In-house financing available!"
  },
  {
    id: "veh-001",
    year: 2012,
    make: "Honda",
    model: "Civic",
    trim: "LX Sedan",
    price: 8995,
    monthlyEst: 145,
    mileage: 138200,
    bodyType: "Sedan",
    fuelType: "Gasoline",
    transmission: "Automatic",
    drivetrain: "FWD",
    engine: "1.8L 4-Cylinder i-VTEC",
    exteriorColor: "Taffeta White",
    interiorColor: "Grey Cloth",
    vin: "2HGFB2F52CH512401",
    stockNumber: "MT-1001",
    condition: "Certified Pre-Owned",
    featured: true,
    badges: ["Under $10k CAD", "BC Local", "In-House Financed"],
    images: [
      "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "ECO Assist System",
      "Bluetooth HandsFreeLink",
      "Heated Front Seats",
      "Multi-Angle Rearview Camera",
      "Remote Keyless Entry",
      "Power Windows & Power Door Locks",
      "Air Conditioning",
      "Cruise Control"
    ],
    overview: "Real Vancouver commuter favorite. BC local car with zero major insurance claims. Clean title, thoroughly inspected and eligible for 100% in-house approval regardless of credit."
  },
  {
    id: "veh-002",
    year: 2011,
    make: "Toyota",
    model: "Corolla",
    trim: "CE Sedan",
    price: 7888,
    monthlyEst: 129,
    mileage: 142500,
    bodyType: "Sedan",
    fuelType: "Gasoline",
    transmission: "Automatic",
    drivetrain: "FWD",
    engine: "1.8L Dual VVT-i 4-Cylinder",
    exteriorColor: "Classic Silver Metallic",
    interiorColor: "Ash Cloth",
    vin: "2T1BU4EE2BC584102",
    stockNumber: "MT-1002",
    condition: "Pre-Owned",
    featured: true,
    badges: ["Under $10k CAD", "1-Owner", "Low Maintenance"],
    images: [
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Air Conditioning",
      "Power Windows & Door Locks",
      "AM/FM/CD/AUX Audio System",
      "Anti-Lock Brakes (ABS)",
      "Vehicle Stability Control (VSC)",
      "60/40 Split Folding Rear Bench",
      "Daytime Running Lights"
    ],
    overview: "Legendary Toyota reliability. Clean interior, smooth shifting automatic transmission. Fully safety checked for British Columbia roads and available on Buy Here Pay Here terms."
  },
  {
    id: "veh-003",
    year: 2013,
    make: "Hyundai",
    model: "Elantra",
    trim: "GLS Sedan",
    price: 6995,
    monthlyEst: 115,
    mileage: 151000,
    bodyType: "Sedan",
    fuelType: "Gasoline",
    transmission: "Automatic",
    drivetrain: "FWD",
    engine: "1.8L 4-Cylinder",
    exteriorColor: "Shimmering Silver",
    interiorColor: "Black Cloth",
    vin: "5NPDH4AE9DH491823",
    stockNumber: "MT-1003",
    condition: "Pre-Owned",
    featured: true,
    badges: ["Under $10k CAD", "Heated Seats", "Budget Pick"],
    images: [
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Heated Front & Rear Seats",
      "Power Glass Sunroof",
      "Bluetooth Hands-Free Calling",
      "16-inch Aluminum Alloy Wheels",
      "Keyless Entry with Alarm",
      "Cruise Control & Steering Audio Controls"
    ],
    overview: "Feature-packed compact sedan offering heated front and rear seats, sunroof, and exceptional fuel economy for Lower Mainland daily commutes."
  },
  {
    id: "veh-004",
    year: 2010,
    make: "Mazda",
    model: "Mazda3",
    trim: "GX Sedan",
    price: 5888,
    monthlyEst: 98,
    mileage: 162400,
    bodyType: "Sedan",
    fuelType: "Gasoline",
    transmission: "Automatic",
    drivetrain: "FWD",
    engine: "2.0L 4-Cylinder DOHC",
    exteriorColor: "Graphite Mica",
    interiorColor: "Black Cloth",
    vin: "JM1BL1H54A1209384",
    stockNumber: "MT-1004",
    condition: "Pre-Owned",
    featured: false,
    badges: ["Under $10k CAD", "Student Special", "Clean Title"],
    images: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Power Windows",
      "Keyless Entry",
      "Auxiliary Audio Input Jack",
      "Tire Pressure Monitoring System",
      "Anti-Lock Braking System",
      "Dual Front Airbags"
    ],
    overview: "Great first car or student commuter. Responsive steering, very low fuel consumption, passed our BC multi-point safety inspection."
  },
  {
    id: "veh-005",
    year: 2012,
    make: "Nissan",
    model: "Sentra",
    trim: "2.0 SV",
    price: 6495,
    monthlyEst: 108,
    mileage: 148800,
    bodyType: "Sedan",
    fuelType: "Gasoline",
    transmission: "Automatic",
    drivetrain: "FWD",
    engine: "2.0L 4-Cylinder",
    exteriorColor: "Magnetic Gray Metallic",
    interiorColor: "Charcoal Cloth",
    vin: "3N1AB6AP5CL683419",
    stockNumber: "MT-1005",
    condition: "Pre-Owned",
    featured: false,
    badges: ["Under $10k CAD", "Roomy Cabin", "Inspected"],
    images: [
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Power Windows & Power Door Locks",
      "Remote Keyless Entry",
      "Air Conditioning",
      "60/40 Split Fold-Down Rear Seats",
      "Cruise Control",
      "AM/FM/CD Audio with Aux Input"
    ],
    overview: "Reliable point-A to point-B transport with spacious cabin and trunk. Easy approval with our Richmond in-house financing regardless of past credit."
  },
  {
    id: "veh-006",
    year: 2014,
    make: "Ford",
    model: "Focus",
    trim: "SE Hatchback",
    price: 7495,
    monthlyEst: 122,
    mileage: 135200,
    bodyType: "Hatchback",
    fuelType: "Gasoline",
    transmission: "Automatic",
    drivetrain: "FWD",
    engine: "2.0L Ti-VCT 4-Cylinder",
    exteriorColor: "Ingot Silver",
    interiorColor: "Charcoal Black",
    vin: "1FADP3F28EL291483",
    stockNumber: "MT-1006",
    condition: "Pre-Owned",
    featured: false,
    badges: ["Under $10k CAD", "Hatchback", "Clean Carfax"],
    images: [
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Ford SYNC Voice Bluetooth System",
      "16-inch Aluminum Wheels",
      "Fold-Flat 60/40 Rear Seats",
      "Power Heated Mirrors",
      "Rear Window Wiper & Defroster"
    ],
    overview: "Versatile 5-door hatchback with generous cargo capacity. Fun to drive, economical on fuel, and ready for immediate Richmond delivery."
  },
  {
    id: "veh-007",
    year: 2018,
    make: "Honda",
    model: "Accord",
    trim: "Sport Sedan",
    price: 20995,
    monthlyEst: 295,
    mileage: 86400,
    bodyType: "Sedan",
    fuelType: "Gasoline",
    transmission: "Automatic",
    drivetrain: "FWD",
    engine: "1.5L Turbocharged 4-Cylinder",
    exteriorColor: "San Marino Red",
    interiorColor: "Black Sport Fabric with Leatherette",
    vin: "1HGCV1F34JA039481",
    stockNumber: "MT-1007",
    condition: "Certified Pre-Owned",
    featured: true,
    badges: ["KarStore Stock", "Sport Package", "Honda Sensing"],
    images: [
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "19-inch Machine-Finished Alloy Wheels",
      "Apple CarPlay & Android Auto",
      "Honda Sensing Safety & Driver-Assistive Tech",
      "Dual Chrome Exhaust Finishers",
      "Leather-Wrapped Steering Wheel with Paddle Shifters",
      "12-Way Power Driver Seat with Lumbar"
    ],
    overview: "Direct from KarStore Vancouver inventory. Stunning Accord Sport with aggressive styling, Honda Sensing safety suite, and turbocharged fuel-efficient performance."
  },
  {
    id: "veh-008",
    year: 2019,
    make: "BMW",
    model: "430xi",
    trim: "Gran Coupe xDrive",
    price: 23888,
    monthlyEst: 335,
    mileage: 77928,
    bodyType: "Coupe",
    fuelType: "Gasoline",
    transmission: "Automatic",
    drivetrain: "AWD",
    engine: "2.0L TwinPower Turbo 4-Cylinder",
    exteriorColor: "Mineral Grey Metallic",
    interiorColor: "Cognac Dakota Leather",
    vin: "WBA4J1C52KBM19483",
    stockNumber: "MT-1008",
    condition: "Certified Pre-Owned",
    featured: true,
    badges: ["KarStore Stock", "xDrive AWD", "Clean Carfax"],
    images: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "BMW xDrive Intelligent All-Wheel Drive",
      "8-Speed Sport Automatic Transmission",
      "iDrive Navigation System Professional",
      "Harman Kardon Surround Sound System",
      "Heated Steering Wheel & Front Seats",
      "Power Liftgate Tailgate",
      "Glass Sunroof"
    ],
    overview: "Direct from KarStore Vancouver inventory. 77,928 km, 8-speed Steptronic transmission, loaded with xDrive AWD and luxury Dakota leather interior."
  },
  {
    id: "veh-009",
    year: 2021,
    make: "Jeep",
    model: "Wrangler",
    trim: "Unlimited Sahara 4xe PHEV",
    price: 37888,
    monthlyEst: 495,
    mileage: 48200,
    bodyType: "SUV",
    fuelType: "Hybrid",
    transmission: "Automatic",
    drivetrain: "4WD",
    engine: "2.0L Turbo PHEV Plug-in Hybrid (375 hp)",
    exteriorColor: "Hydro Blue Pearl",
    interiorColor: "Black McKinley Leather",
    vin: "1C4JJXP63MW619420",
    stockNumber: "MT-1009",
    condition: "Certified Pre-Owned",
    featured: true,
    badges: ["KarStore Stock", "Plug-in Hybrid", "Trail Rated 4WD"],
    images: [
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Plug-in Hybrid 4xe Powertrain (375 HP / 470 lb-ft torque)",
      "Electric-Only Mode + Hybrid Driving Modes",
      "Sky One-Touch Power Convertible Top",
      "Uconnect 8.4-inch Touchscreen Navigation",
      "Alpine 9-Speaker Premium Audio with Subwoofer",
      "Dana 44 Heavy-Duty Solid Axles"
    ],
    overview: "Rugged capability meets eco-conscious plug-in efficiency. Direct from Vancouver KarStore inventory, clean title, immaculate BC condition."
  },
  {
    id: "veh-010",
    year: 2015,
    make: "Toyota",
    model: "RAV4",
    trim: "XLE AWD",
    price: 16995,
    monthlyEst: 249,
    mileage: 112000,
    bodyType: "SUV",
    fuelType: "Gasoline",
    transmission: "Automatic",
    drivetrain: "AWD",
    engine: "2.5L 4-Cylinder DOHC",
    exteriorColor: "Magnetic Gray Metallic",
    interiorColor: "Black Premium Cloth",
    vin: "2T3BFREV8FW491823",
    stockNumber: "MT-1010",
    condition: "Certified Pre-Owned",
    featured: true,
    badges: ["AWD", "1-Owner", "BC Inspected"],
    images: [
      "https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "All-Wheel Drive with Dynamic Torque Control",
      "Power Tilt/Slide Moonroof",
      "Dual-Zone Automatic Climate Control",
      "Heated Front Bucket Seats",
      "Backup Camera with Guidelines",
      "Roof Rails & Fog Lamps"
    ],
    overview: "BC's most requested all-weather crossover. Spacious rear cargo, smooth all-wheel drive, and complete dealer service records."
  },
  {
    id: "veh-011",
    year: 2017,
    make: "Honda",
    model: "CR-V",
    trim: "EX AWD",
    price: 19888,
    monthlyEst: 285,
    mileage: 98500,
    bodyType: "SUV",
    fuelType: "Gasoline",
    transmission: "Automatic",
    drivetrain: "AWD",
    engine: "1.5L Turbo 4-Cylinder",
    exteriorColor: "Crystal Black Pearl",
    interiorColor: "Black Cloth",
    vin: "2HKRW2H59HH581942",
    stockNumber: "MT-1011",
    condition: "Certified Pre-Owned",
    featured: false,
    badges: ["Real Time AWD", "Clean Carfax", "Honda Sensing"],
    images: [
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Real Time AWD with Intelligent Control System",
      "Remote Engine Starter",
      "Apple CarPlay & Android Auto Integration",
      "Heated Front Seats",
      "Blind Spot Information System with Cross Traffic Monitor",
      "Power Moonroof"
    ],
    overview: "Under 100k km, BC vehicle. Exceptional cargo versatility, turbo power, and standard active safety suite."
  },
  {
    id: "veh-012",
    year: 2016,
    make: "Ford",
    model: "F-150",
    trim: "XLT SuperCrew 4x4",
    price: 22995,
    monthlyEst: 325,
    mileage: 126000,
    bodyType: "Truck",
    fuelType: "Gasoline",
    transmission: "Automatic",
    drivetrain: "4WD",
    engine: "2.7L EcoBoost Twin-Turbo V6",
    exteriorColor: "Oxford White",
    interiorColor: "Medium Earth Gray",
    vin: "1FTFW1EP8GFA82194",
    stockNumber: "MT-1012",
    condition: "Pre-Owned",
    featured: true,
    badges: ["SuperCrew 4x4", "EcoBoost", "Tow Package"],
    images: [
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Electronic Shift-on-the-Fly 4WD",
      "Class IV Trailer Tow Package with Pro Backup Assist",
      "Spray-In Protective Bedliner",
      "Rear View Camera",
      "SYNC Infotainment with Bluetooth",
      "Power Driver Seat & Power Sliding Rear Window"
    ],
    overview: "Capable full-size crew cab pickup truck ready for work or BC mountain recreation. Strong towing capacity and excellent cabin space."
  },
  {
    id: "veh-013",
    year: 2018,
    make: "Tesla",
    model: "Model 3",
    trim: "Long Range AWD",
    price: 24995,
    monthlyEst: 349,
    mileage: 88000,
    bodyType: "Sedan",
    fuelType: "Electric",
    transmission: "Automatic",
    drivetrain: "AWD",
    engine: "Dual Motor All-Electric (350+ km range)",
    exteriorColor: "Deep Blue Metallic",
    interiorColor: "Black Premium Interior",
    vin: "5YJ3E1EB2JF104921",
    stockNumber: "MT-1013",
    condition: "Certified Pre-Owned",
    featured: true,
    badges: ["Dual Motor AWD", "Clean Energy BC", "Autopilot"],
    images: [
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Dual Motor All-Wheel Drive",
      "All-Glass Panoramic Roof with UV Protection",
      "Autopilot Convenience Features",
      "15-inch Touchscreen Display",
      "Heated Seats Throughout All 5 Seating Positions",
      "Supercharger Fast-Charging Compatible"
    ],
    overview: "Skip the gas pump with this clean title Model 3 Long Range. Smooth dual-motor AWD traction for rainy Lower Mainland driving."
  },
  {
    id: "veh-014",
    year: 2004,
    make: "Porsche",
    model: "Cayenne",
    trim: "S V8 AWD",
    price: 23888,
    monthlyEst: 339,
    mileage: 118500,
    bodyType: "SUV",
    fuelType: "Gasoline",
    transmission: "Automatic",
    drivetrain: "AWD",
    engine: "4.5L V8 (340 hp)",
    exteriorColor: "Basalt Black Metallic",
    interiorColor: "Havanna Sand Leather",
    vin: "WP1AB29P24LA49201",
    stockNumber: "MT-1014",
    condition: "Certified Pre-Owned",
    featured: true,
    badges: ["KarStore Stock", "Porsche V8", "Collector Grade"],
    images: [
      "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Porsche Traction Management (PTM) AWD",
      "Height-Adjustable Air Suspension",
      "Bose High-End Sound System",
      "Full Premium Leather Interior",
      "Power Glass Moonroof",
      "Heated Front & Rear Seats"
    ],
    overview: "Direct from KarStore Vancouver inventory. Classic Porsche Cayenne S V8 performance, timeless design, meticulously maintained."
  },
  {
    id: "veh-015",
    year: 2018,
    make: "Hyundai",
    model: "Tucson",
    trim: "2.0L AWD",
    price: 14995,
    monthlyEst: 219,
    mileage: 104200,
    bodyType: "SUV",
    fuelType: "Gasoline",
    transmission: "Automatic",
    drivetrain: "AWD",
    engine: "2.0L GDI 4-Cylinder",
    exteriorColor: "Coliseum Grey",
    interiorColor: "Black Cloth",
    vin: "KM8JU3A47JU682941",
    stockNumber: "MT-1015",
    condition: "Certified Pre-Owned",
    featured: false,
    badges: ["AWD", "Under $15k CAD", "Heated Seats"],
    images: [
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "All-Wheel Drive with Lock Mode",
      "Heated Front Seats",
      "Rearview Camera with Dynamic Guidelines",
      "Drive Mode Select (Eco / Normal / Sport)",
      "Bluetooth Hands-Free Phone System"
    ],
    overview: "Affordable modern crossover with capable AWD. Great visibility, comfortable ride, and very reasonable bi-weekly financing available."
  },
  {
    id: "veh-016",
    year: 2017,
    make: "Subaru",
    model: "Outback",
    trim: "2.5i Touring AWD",
    price: 17495,
    monthlyEst: 255,
    mileage: 119000,
    bodyType: "SUV",
    fuelType: "Gasoline",
    transmission: "Automatic",
    drivetrain: "AWD",
    engine: "2.5L BOXER 4-Cylinder",
    exteriorColor: "Tungsten Metallic",
    interiorColor: "Warm Ivory Cloth",
    vin: "4S4BSANC5H3291845",
    stockNumber: "MT-1016",
    condition: "Certified Pre-Owned",
    featured: false,
    badges: ["Symmetrical AWD", "X-Mode", "BC Ready"],
    images: [
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Subaru Symmetrical Full-Time AWD",
      "X-Mode with Hill Descent Control",
      "Power Rear Tailgate",
      "EyeSight Driver Assist Technology",
      "Heated Front Seats & De-Icer Wipers"
    ],
    overview: "The quintessential Pacific Northwest wagon. High ground clearance, legendary symmetrical all-wheel drive, and generous cargo capacity."
  },
  {
    id: "veh-017",
    year: 2015,
    make: "Lexus",
    model: "RX 350",
    trim: "Luxury AWD",
    price: 21995,
    monthlyEst: 310,
    mileage: 115000,
    bodyType: "SUV",
    fuelType: "Gasoline",
    transmission: "Automatic",
    drivetrain: "AWD",
    engine: "3.5L V6 (270 hp)",
    exteriorColor: "Starfire Pearl",
    interiorColor: "Parchment Leather",
    vin: "2T2ZK1BA3FC194820",
    stockNumber: "MT-1017",
    condition: "Certified Pre-Owned",
    featured: true,
    badges: ["Lexus Luxury", "Smooth V6", "Clean Title"],
    images: [
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "Active Torque Control All-Wheel Drive",
      "Mark Levinson Premium Surround Audio",
      "Heated & Ventilated Front Leather Seats",
      "Power Tilt/Slide Moonroof",
      "Blind Spot Monitor System with Rear Cross Traffic",
      "Power Rear Door"
    ],
    overview: "Unmatched reliability and comfort. Bulletproof 3.5L V6 engine, plush leather interior, and whisper-quiet highway ride across British Columbia."
  },
  {
    id: "veh-018",
    year: 2006,
    make: "BMW",
    model: "650i",
    trim: "Sport Coupe V8",
    price: 13888,
    monthlyEst: 199,
    mileage: 125000,
    bodyType: "Coupe",
    fuelType: "Gasoline",
    transmission: "Automatic",
    drivetrain: "RWD",
    engine: "4.8L Naturally Aspirated V8 (360 hp)",
    exteriorColor: "Titanium Silver Metallic",
    interiorColor: "Chateau Red Dakota Leather",
    vin: "WBAEH73526B718492",
    stockNumber: "MT-1018",
    condition: "Pre-Owned",
    featured: true,
    badges: ["KarStore Stock", "4.8L V8 Coupe", "Sport Package"],
    images: [
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80"
    ],
    features: [
      "4.8L Valvetronic Naturally Aspirated V8 (360 HP)",
      "Sport Automatic Transmission with Steptronic",
      "Logic7 Professional Audio",
      "Panoramic Glass Tilt Roof",
      "Heated Sport Bucket Seats with Memory"
    ],
    overview: "Direct from KarStore Vancouver inventory. 125,000 km, pristine naturally aspirated 4.8L V8 coupe, exhilarating exhaust note and timeless grand touring luxury."
  }
];

// LocalStorage Key for persistent marketplace edits (v3 contains real MT Inventory Jeep, Outlander, RAV4)
const STORAGE_KEY_VEHICLES = 'motortrends_vehicles_db_v3';

// Initialize VEHICLES_DATA from LocalStorage if available, otherwise use initial default catalog
function getStoredVehicles() {
  if (typeof localStorage !== 'undefined') {
    const localData = localStorage.getItem(STORAGE_KEY_VEHICLES);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure the 3 MT inventory vehicles are present at top
          const hasMTVehicles = parsed.some(v => v.id === 'veh-mt-01' || v.stockNumber === 'MT-4022');
          if (!hasMTVehicles) {
            const merged = [DEFAULT_VEHICLES_DATA[0], DEFAULT_VEHICLES_DATA[1], DEFAULT_VEHICLES_DATA[2], ...parsed];
            localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(merged));
            return merged;
          }
          return parsed;
        }
      } catch (e) {
        console.error('Error reading localStorage vehicles data:', e);
      }
    }
    // Store default copy
    localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(DEFAULT_VEHICLES_DATA));
  }
  return DEFAULT_VEHICLES_DATA;
}

function saveVehiclesData(data) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(data));
  }
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

// Strictly format currency in CAD across all display views without restriction or rounding
function formatPrice(val) {
  if (val === undefined || val === null || val === '') return '$0 CAD';
  const str = String(val).trim();
  const num = parseFloat(str);
  if (isNaN(num)) return `$${val} CAD`;
  if (str.includes('.')) {
    const parts = str.split('.');
    const intVal = parseInt(parts[0], 10);
    const formattedInt = isNaN(intVal) ? parts[0] : intVal.toLocaleString('en-CA');
    return `$${formattedInt}.${parts[1]} CAD`;
  }
  return `$${num.toLocaleString('en-CA')} CAD`;
}

function formatMonthly(val) {
  if (val === undefined || val === null || val === '') return '$0 CAD/mo';
  const str = String(val).trim();
  const num = parseFloat(str);
  if (isNaN(num)) return `$${val} CAD/mo`;
  if (str.includes('.')) {
    const parts = str.split('.');
    const intVal = parseInt(parts[0], 10);
    const formattedInt = isNaN(intVal) ? parts[0] : intVal.toLocaleString('en-CA');
    return `$${formattedInt}.${parts[1]} CAD/mo`;
  }
  return `$${num.toLocaleString('en-CA')} CAD/mo`;
}

function formatMileageKm(val) {
  const num = typeof val === 'number' ? val : parseInt(val) || 0;
  return `${num.toLocaleString('en-CA')} km`;
}

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_VEHICLES_DATA,
    VEHICLES_DATA,
    getStoredVehicles,
    saveVehiclesData,
    getAllMakes,
    getAllBodyTypes,
    getVehicleById,
    formatPrice,
    formatMonthly,
    formatMileageKm
  };
}
