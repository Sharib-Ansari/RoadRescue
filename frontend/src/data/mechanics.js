export const mechanics = [
  {
    id: 'mech_001',
    name: 'Rajesh Kumar',
    avatar: null,
    workshopName: 'Kumar Auto Garage',
    rating: 4.8,
    reviewCount: 127,
    distance: 1.2,
    experience: 12,
    services: ['Engine Repair', 'Brake Service', 'Oil Change', 'Tyre Replacement', 'Battery Jumpstart'],
    visitCharge: 200,
    isAvailable: true,
    specialization: 'Multi-brand Cars',
    location: 'Sector 14, Gurgaon',
    phone: '+91 98765 43210',
    email: 'rajesh@kumarauto.in',
    about: 'Experienced automotive mechanic with over 12 years of hands-on experience handling sedans, hatchbacks, and compact SUVs. Specializes in emergency engine diagnostic and roadside breakdown resolution.',
    reviews: [
      { id: 'r101', author: 'Amit Sharma', rating: 5, comment: 'Excellent service, arrived within 20 minutes on NH-48!', date: '2024-01-15' },
      { id: 'r102', author: 'Priya Mehra', rating: 4, comment: 'Very professional and upfront about the part costs.', date: '2024-01-10' },
      { id: 'r103', author: 'Vikas Rao', rating: 5, comment: 'Quick battery jumpstart, got me moving in under 15 mins.', date: '2023-12-28' }
    ],
    serviceCharges: {
      'Engine Repair': '₹500 - ₹5000',
      'Brake Service': '₹800 - ₹2500',
      'Oil Change': '₹300 - ₹800',
      'Tyre Replacement': '₹200 - ₹500 (per tyre)',
      'Battery Jumpstart': '₹250 - ₹400'
    }
  },
  {
    id: 'mech_002',
    name: 'Vikramjit Singh',
    avatar: null,
    workshopName: 'Sher-e-Punjab Motors',
    rating: 4.9,
    reviewCount: 215,
    distance: 2.4,
    experience: 18,
    services: ['Heavy Duty Towing', 'Diesel Engine Specialist', 'Clutch Overhaul', 'Suspension Tuning'],
    visitCharge: 350,
    isAvailable: true,
    specialization: 'SUVs & Commercial Trucks',
    location: 'Sanjay Gandhi Transport Nagar, Delhi',
    phone: '+91 98111 23456',
    email: 'vikram@shermotors.in',
    about: 'Master technician with nearly two decades of expertise in heavy diesel vehicles, Mahindra, Tata SUVs, and commercial trucks. Equipped with heavy towing gears and mobile hydraulic tools.',
    reviews: [
      { id: 'r201', author: 'Harpreet Singh', rating: 5, comment: 'Towed my Scorpio effortlessly and fixed the clutch cylinder on site.', date: '2024-01-18' },
      { id: 'r202', author: 'Deepak Verma', rating: 5, comment: 'Honest person, saved me from an expensive dealer quote.', date: '2023-12-14' }
    ],
    serviceCharges: {
      'Heavy Duty Towing': '₹1500 - ₹4000',
      'Diesel Engine Specialist': '₹1200 - ₹7500',
      'Clutch Overhaul': '₹1500 - ₹4500',
      'Suspension Tuning': '₹1000 - ₹3500'
    }
  },
  {
    id: 'mech_003',
    name: 'Mohammed Rizwan',
    avatar: null,
    workshopName: 'Two-Wheeler Doctor & Speed Works',
    rating: 4.7,
    reviewCount: 94,
    distance: 0.8,
    experience: 8,
    services: ['Bike Puncture / Tube Replacement', 'Chain Lubrication & Adjustment', 'Carburetor Cleaning', 'Spark Plug Check'],
    visitCharge: 150,
    isAvailable: true,
    specialization: 'Bikes & Scooters (Royal Enfield, Honda, Yamaha)',
    location: 'Koramangala 4th Block, Bengaluru',
    phone: '+91 97400 98712',
    email: 'rizwan@twowheelerdoctor.com',
    about: 'Motorcycle enthusiast and certified technician for commuter and performance bikes. Quick dispatch on two-wheeler breakdown van equipped with puncture kits and spares.',
    reviews: [
      { id: 'r301', author: 'Karthik N.', rating: 5, comment: 'Fixed my Himalayan chain snap within 25 minutes of calling.', date: '2024-01-22' },
      { id: 'r302', author: 'Sneha Roy', rating: 4, comment: 'Friendly technician, genuine spark plug replacement.', date: '2024-01-05' }
    ],
    serviceCharges: {
      'Bike Puncture / Tube Replacement': '₹150 - ₹350',
      'Chain Lubrication & Adjustment': '₹150 - ₹300',
      'Carburetor Cleaning': '₹400 - ₹800',
      'Spark Plug Check': '₹100 - ₹250'
    }
  },
  {
    id: 'mech_004',
    name: 'Suresh Patel',
    avatar: null,
    workshopName: 'Shreeji Car Care & AC Clinic',
    rating: 4.6,
    reviewCount: 160,
    distance: 3.1,
    experience: 15,
    services: ['AC Gas Refill', 'Compressor Repair', 'Coolant Flush', 'Radiator Leak Fix'],
    visitCharge: 250,
    isAvailable: false,
    specialization: 'Automotive Climate Control & Cooling Systems',
    location: 'S.G. Highway, Ahmedabad',
    phone: '+91 99245 67890',
    email: 'suresh@shreejicarcare.com',
    about: 'Specialist in vehicle air-conditioning systems and radiator cooling units. Currently booked on scheduled maintenance assignments.',
    reviews: [
      { id: 'r401', author: 'Jignesh Shah', rating: 5, comment: 'Fixed cooling issue in sweltering 42 degree heat. Highly recommended!', date: '2023-11-20' },
      { id: 'r402', author: 'Chirag Dave', rating: 4, comment: 'Good quality refrigerant used, no gas leaks since.', date: '2023-10-18' }
    ],
    serviceCharges: {
      'AC Gas Refill': '₹1200 - ₹2200',
      'Compressor Repair': '₹1500 - ₹6000',
      'Coolant Flush': '₹400 - ₹900',
      'Radiator Leak Fix': '₹600 - ₹1800'
    }
  },
  {
    id: 'mech_005',
    name: 'Anthony D\'Souza',
    avatar: null,
    workshopName: 'Coastal Precision German Auto',
    rating: 5.0,
    reviewCount: 88,
    distance: 4.5,
    experience: 16,
    services: ['OBD2 Diagnostics', 'ECU Remapping', 'Electronic Throttle Reset', 'Sensor Replacement', 'Automatic Transmission Fluid'],
    visitCharge: 500,
    isAvailable: true,
    specialization: 'Luxury European Cars (BMW, Audi, Mercedes, VW)',
    location: 'Bandra West, Mumbai',
    phone: '+91 98200 55443',
    email: 'anthony@coastalprecision.in',
    about: 'Factory-trained technician specializing in modern German engineering, advanced onboard telemetry, ABS/ESP calibration, and ECU fault code diagnostics.',
    reviews: [
      { id: 'r501', author: 'Rohan Mehra', rating: 5, comment: 'Identified the exact sensor causing limp mode on my Audi A4 in 10 minutes.', date: '2024-01-25' },
      { id: 'r502', author: 'Farhan K.', rating: 5, comment: 'Extremely knowledgeable. Saved me a 70,000 INR bill from the authorized service center.', date: '2024-01-02' }
    ],
    serviceCharges: {
      'OBD2 Diagnostics': '₹750 - ₹1500',
      'ECU Remapping': '₹3000 - ₹12000',
      'Electronic Throttle Reset': '₹600 - ₹1500',
      'Sensor Replacement': '₹1000 - ₹4500'
    }
  },
  {
    id: 'mech_006',
    name: 'Anand Murugan',
    avatar: null,
    workshopName: 'Express 24/7 Roadside Assist',
    rating: 4.5,
    reviewCount: 310,
    distance: 1.8,
    experience: 10,
    services: ['Lockout Service', 'Flat Tyre', 'Emergency Fuel Delivery', 'Battery Jumpstart', 'Winch Out'],
    visitCharge: 200,
    isAvailable: true,
    specialization: '24/7 Rapid Emergency Response',
    location: 'OMR Road, Chennai',
    phone: '+91 94440 12345',
    email: 'anand@expressroadrescue.in',
    about: 'Rapid-response roadside technician equipped with state-of-the-art hydraulic jacks, cordless impact wrenches, and lockout bypass equipment.',
    reviews: [
      { id: 'r601', author: 'Sivaramakrishnan', rating: 5, comment: 'Arrived at 2 AM when my tire blew out on the bypass road. Lifesaver!', date: '2024-01-28' },
      { id: 'r602', author: 'Divya P.', rating: 4, comment: 'Delivered 5 litres of petrol in 20 minutes when gauge failed.', date: '2023-12-19' }
    ],
    serviceCharges: {
      'Lockout Service': '₹500 - ₹1200',
      'Flat Tyre': '₹250 - ₹450',
      'Emergency Fuel Delivery': '₹200 + Fuel Cost',
      'Battery Jumpstart': '₹250 - ₹400'
    }
  },
  {
    id: 'mech_007',
    name: 'Gurpreet Singh Johal',
    avatar: null,
    workshopName: 'Highway Star Towing & Mechanics',
    rating: 4.3,
    reviewCount: 75,
    distance: 5.2,
    experience: 14,
    services: ['Flatbed Towing', 'Wheel Alignment Check', 'Axle Repair', 'Brake Pad Replacement'],
    visitCharge: 300,
    isAvailable: false,
    specialization: 'Highway Recovery & Heavy Utility',
    location: 'Zirakpur - Chandigarh Highway',
    phone: '+91 98888 65432',
    email: 'gurpreet@highwaystar.in',
    about: 'Specializes in high-speed highway breakdowns, flatbed transportation, differential repairs, and heavy chassis towing.',
    reviews: [
      { id: 'r701', author: 'Maninder G.', rating: 4, comment: 'Fast flatbed tow to the nearest authorized workshop.', date: '2024-01-08' },
      { id: 'r702', author: 'Baljit Sandhu', rating: 4.5, comment: 'Reliable equipment and careful with car bumper clearance.', date: '2023-11-30' }
    ],
    serviceCharges: {
      'Flatbed Towing': '₹1800 - ₹4500',
      'Axle Repair': '₹1200 - ₹3800',
      'Brake Pad Replacement': '₹600 - ₹1800'
    }
  },
  {
    id: 'mech_008',
    name: 'Kavitha & Balan',
    avatar: null,
    workshopName: 'GreenDrive EV & Hybrid Care',
    rating: 4.9,
    reviewCount: 64,
    distance: 3.7,
    experience: 7,
    services: ['EV High-Voltage Diagnostics', '12V Auxiliary Battery Recovery', 'Regen Brake Inspection', 'Thermal System Check'],
    visitCharge: 400,
    isAvailable: true,
    specialization: 'Electric Vehicles & Hybrids (Tata EV, MG, Hyundai, Ola)',
    location: 'Hitec City, Hyderabad',
    phone: '+91 91212 34567',
    email: 'service@greendrive.in',
    about: 'Pioneering electric mobility certified technicians. High voltage safety compliant with specialized insulated tools for battery packs, inverters, and drive units.',
    reviews: [
      { id: 'r801', author: 'Venkat K.', rating: 5, comment: 'Nexon EV threw a critical error and Balan resolved the BMS sensor conflict right at my office parking.', date: '2024-01-26' },
      { id: 'r802', author: 'Swati R.', rating: 5, comment: 'Extremely polite, very high tech diagnostic tablet.', date: '2024-01-14' }
    ],
    serviceCharges: {
      'EV High-Voltage Diagnostics': '₹900 - ₹2500',
      '12V Auxiliary Battery Recovery': '₹400 - ₹900',
      'Regen Brake Inspection': '₹700 - ₹1800'
    }
  },
  {
    id: 'mech_009',
    name: 'Santosh Shinde',
    avatar: null,
    workshopName: 'Shinde Auto Works',
    rating: 4.4,
    reviewCount: 112,
    distance: 2.1,
    experience: 11,
    services: ['Clutch Wire Replacement', 'Gear Shift Cable Fix', 'Spark Plug Change', 'Fuel Pump Test'],
    visitCharge: 180,
    isAvailable: true,
    specialization: 'Budget & Compact Cars (Maruti Suzuki, Hyundai, Tata)',
    location: 'Kothrud, Pune',
    phone: '+91 98220 78901',
    email: 'santosh@shindeauto.co.in',
    about: 'Specialized in Indian compact cars, Alto, WagonR, Swift, Tiago, and i10. Carrying original MGP and Tata Genuine spares in mobile unit.',
    reviews: [
      { id: 'r901', author: 'Nikhil K.', rating: 4.5, comment: 'Clutch cable snapped on Paud road, Santosh was there in 15 minutes!', date: '2024-01-19' },
      { id: 'r902', author: 'Anjali Deshmukh', rating: 4, comment: 'Fair charges and very courteous.', date: '2023-12-05' }
    ],
    serviceCharges: {
      'Clutch Wire Replacement': '₹250 - ₹500',
      'Gear Shift Cable Fix': '₹400 - ₹900',
      'Fuel Pump Test': '₹300 - ₹800'
    }
  },
  {
    id: 'mech_010',
    name: 'Babu Lal Meena',
    avatar: null,
    workshopName: 'Rajasthan Wheels & Suspension',
    rating: 3.8,
    reviewCount: 52,
    distance: 6.8,
    experience: 9,
    services: ['Leaf Spring Repair', 'Shock Absorber Replacement', 'Wheel Bearing Replacement'],
    visitCharge: 220,
    isAvailable: true,
    specialization: 'Rugged 4x4s, Bolero, Thar & Pickups',
    location: 'VKI Area, Jaipur',
    phone: '+91 94140 33221',
    email: 'babulal@wheelsrajasthan.in',
    about: 'Expert in tough terrain vehicles, suspension reinforcement, leaf spring re-arching, and off-road recovery along bypass corridors.',
    reviews: [
      { id: 'r1001', author: 'Raghuveer Singh', rating: 4, comment: 'Repaired the rear leaf spring hanger quickly.', date: '2023-12-18' },
      { id: 'r1002', author: 'Manoj C.', rating: 3.5, comment: 'Service was okay, arrived a bit later than estimated.', date: '2023-11-12' }
    ],
    serviceCharges: {
      'Leaf Spring Repair': '₹800 - ₹2200',
      'Shock Absorber Replacement': '₹600 - ₹1600',
      'Wheel Bearing Replacement': '₹500 - ₹1200'
    }
  },
  {
    id: 'mech_011',
    name: 'Pradeep Das',
    avatar: null,
    workshopName: 'Kolkata Motocare & Detailing',
    rating: 4.6,
    reviewCount: 142,
    distance: 2.9,
    experience: 13,
    services: ['Alternator Repair', 'Starter Motor Repair', 'Wiring Harness Fix', 'Headlight / Horn Troubleshooting'],
    visitCharge: 250,
    isAvailable: true,
    specialization: 'Auto Electrical Systems',
    location: 'Salt Lake Sector V, Kolkata',
    phone: '+91 98300 44556',
    email: 'pradeep@kolkatamotocare.com',
    about: 'Expert electrical diagnostician. Specializes in solving short circuits, parasitic battery drains, burnt wiring looms, and alternator diode failures.',
    reviews: [
      { id: 'r1101', author: 'Subhashish Bose', rating: 5, comment: 'Found a short circuit in the fusebox that was draining my battery overnight.', date: '2024-01-20' },
      { id: 'r1102', author: 'Debolina Sen', rating: 4.5, comment: 'Rebuilt alternator brush set instead of forcing me to buy a full unit. Honest!', date: '2023-12-22' }
    ],
    serviceCharges: {
      'Alternator Repair': '₹600 - ₹2200',
      'Starter Motor Repair': '₹500 - ₹1800',
      'Wiring Harness Fix': '₹400 - ₹1500'
    }
  },
  {
    id: 'mech_012',
    name: 'Naveen Chawla',
    avatar: null,
    workshopName: 'Chawla Tyre Hub & Nitrogen Bar',
    rating: 4.7,
    reviewCount: 188,
    distance: 1.5,
    experience: 10,
    services: ['Tubeless Tyre Patching', 'Mushroom Plug Puncture Fix', 'Nitrogen Top-up', 'Spare Wheel Swapping'],
    visitCharge: 150,
    isAvailable: false,
    specialization: 'Tyres, Wheels & Run-flat Systems',
    location: 'Indiranagar 100ft Road, Bengaluru',
    phone: '+91 99001 88223',
    email: 'naveen@chawlatyrehub.com',
    about: 'Equipped with portable pneumatic bead breaker and run-flat vulcanizing kits. Offers doorstep puncture repair and spare tyre replacement in under 20 minutes.',
    reviews: [
      { id: 'r1201', author: 'Abhinav K.', rating: 5, comment: 'Did a clean mushroom patch on a sidewall adjacent puncture on my Creta.', date: '2024-01-23' },
      { id: 'r1202', author: 'Rahul Gupta', rating: 4.5, comment: 'Prompt assistance, polite and professional.', date: '2024-01-09' }
    ],
    serviceCharges: {
      'Tubeless Tyre Patching': '₹150 - ₹300',
      'Mushroom Plug Puncture Fix': '₹350 - ₹600',
      'Spare Wheel Swapping': '₹200 - ₹350'
    }
  }
];
