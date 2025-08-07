/**
 * @fileMetadata
 * @purpose "Provides mock data for initial asset display, user information, and application alerts/activity."
 * @owner frontend-team
 * @dependencies ["lucide-react", "./constants"]
 * @exports ["INITIAL_ASSETS", "MOCK_DATA"]
 * @complexity medium
 * @tags ["mock", "data", "testing"]
 * @status stable
 */
import { Wind, ShieldAlert, CheckCircle, Clock } from "lucide-react";

import { COLORS } from "./constants";

export const INITIAL_ASSETS = [
  {
    id: 1,
    name: "Primary Residence",
    type: "Property",
    value: 450000,
    coverage: 95,
    image:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=400&auto=format&fit=crop",
    docs: [{ name: "Deed.pdf" }],
    maintenance: [{ name: "Roof Inspection", due: "2025-07-08" }],
    policies: [
      {
        id: "04760651",
        provider: "Citizens Property Insurance",
        type: "Homeowners",
      },
    ],
    details: {
      yearBuilt: 1979,
      constructionType: "Block, Wood",
      foundation: "Slab",
      roofCover: "Shingle",
      roofShape: "Gable",
      exteriorFeatures: "Stucco, Wood, Fenced, Balcony, Hurricane Shutters",
      flooring: "Tile, Carpet",
      heating: "Forced Air, Electric",
      cooling: "Central Air",
      appliances: "Dishwasher, Dryer, Range / Oven, Refrigerator, Washer",
      interiorFeatures:
        "Ceiling Fans, Open Floorplan, Living/Dining Combo, Solid Surface Counters",
      pool: "Fiberglass (10x26)",
      lotSize: "10,001 sqft",
      waterfront: "Canal - Brackish (80ft)",
      parcelNumber: "402124377001",
    },
    inventory: [
      {
        id: 101,
        name: 'LG 65" OLED TV',
        category: "Electronics",
        value: 1800,
        imagePreviews: [
          "https://images.unsplash.com/photo-1593784944564-e69963503b48?q=80&w=400&auto=format&fit=crop",
        ],
        description: "Model OLED65C1PUB, black",
        serial: "SN12345ABC",
        purchaseDate: "2022-08-15",
        condition: "Excellent",
        location: "Living Room",
        attachments: [],
      },
      {
        id: 102,
        name: "Leather Sectional Sofa",
        category: "Furniture",
        value: 3200,
        imagePreviews: [
          "https://images.unsplash.com/photo-1540574163024-5735f35c2367?q=80&w=400&auto=format&fit=crop",
        ],
        description: "Brown leather, L-shape",
        serial: "",
        purchaseDate: "2021-05-20",
        condition: "Good",
        location: "Living Room",
        attachments: [],
      },
    ],
  },
];

export const MOCK_DATA = {
  user: {
    name: "Alex Thompson",
    avatar: `https://placehold.co/100x100/0095FF/FFFFFF?text=AT`,
    email: "alex.thompson @email.com",
    phone: "(555) 123-4567",
    address: "3407 Knox Ter, Port Charlotte, FL 33948",
    memberSince: "January 15, 2022",
  },
  risk: {
    level: 78,
    status: "Amber",
    color: COLORS.warning,
  },
  alerts: [
    {
      id: 1,
      type: "Weather",
      icon: Wind,
      title: "High Wind Warning",
      description:
        "Winds of up to 55 mph expected in your area starting 8:00 PM.",
      time: "2h ago",
      color: COLORS.warning,
    },
    {
      id: 2,
      type: "Security",
      icon: ShieldAlert,
      title: "Policy Gap Detected",
      description:
        "Your Homeowners policy may not fully cover recent electronics purchases.",
      time: "1d ago",
      color: COLORS.danger,
    },
  ],
  activity: [
    {
      id: 1,
      icon: CheckCircle,
      text: 'Claim #C2025-07-124 for "Water Damage" was approved.',
      time: "1h ago",
    },
    {
      id: 2,
      icon: Clock,
      text: "Roof inspection scheduled for 8 Jul, 2025.",
      time: "Yesterday",
    },
  ],
  claims: [
    {
      id: "C2025-07-124",
      asset: "Primary Residence",
      incident: "Water Damage",
      date: "2025-06-15",
      status: "Approved",
      amount: 5400,
    },
  ],
};
