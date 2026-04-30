"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ImageUpload } from "@/components/image-upload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProductLandingProperties } from "@/components/product-landing-properties";
import QRPreview from "@/components/qr-preview";
import AuthGuard from "@/components/dashboard/auth-guard";

const PRODUCT_TYPES = [
  { value: "documents", label: "Documents (Files)", icon: "📄" },
  { value: "passport", label: "Country Passport", icon: "🛂" },
  { value: "medicine", label: "Medicine", icon: "💊" },
  { value: "electronics", label: "Electronics", icon: "📱" },
  { value: "apparel", label: "Apparel", icon: "👕" },
  { value: "luxury", label: "Luxury Goods", icon: "💎" },
  { value: "food", label: "Food and Beverages", icon: "🍔" },
  { value: "artwork", label: "Artwork and Collections", icon: "🎨" },
  { value: "tickets", label: "Tickets and Event Passes", icon: "🎫" },
  { value: "cosmetics", label: "Cosmetics and Skincare", icon: "💄" },
  { value: "automotive", label: "Automotive Parts", icon: "🚗" },
  { value: "toys", label: "Toys and Baby Products", icon: "🧸" },
  { value: "books", label: "Books and Educational Materials", icon: "📚" },
  { value: "idcards", label: "ID Cards", icon: "🪪" },
  { value: "bankchecks", label: "Bank Checks", icon: "💳" },
  { value: "landing", label: "Landing/Properties", icon: "🏠" },
];

const DATA_TYPE_LABELS: Record<string, string> = {
  documents: "Document",
  passport: "Country Passport",
  medicine: "Medicine",
  electronics: "Electronics",
  apparel: "Apparel",
  luxury: "Luxury Goods",
  food: "Food & Beverages",
  artwork: "Artwork & Collectibles",
  tickets: "Tickets & Event Passes",
  cosmetics: "Cosmetics & Skincare",
  automotive: "Automotive Parts",
  toys: "Toys & Baby Products",
  books: "Books & Educational Materials",
  idcards: "ID Cards",
  bankchecks: "Bank Checks",
  landing: "Landing/Properties",
};

function getDataTypeLabel(type: string) {
  return DATA_TYPE_LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
}

export default function CreateFilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Core form fields
  const [productName, setProductName] = useState("");
  const [dataType, setDataType] = useState("documents");
  const [description, setDescription] = useState("");
  const [batchNo, setBatchNo] = useState("");
  const [quantity, setQuantity] = useState("");
  const [companyRegNo, setCompanyRegNo] = useState("");
  const [qrType, setQrType] = useState("secure");
  const [expiryDays, setExpiryDays] = useState("365");
  const [verificationLimit, setVerificationLimit] = useState("0");

  // Additional product-specific fields
  const [additionalFields, setAdditionalFields] = useState<
    Record<string, string | null>
  >({});
  const [productImage, setProductImage] = useState<string | null>(null);

  useEffect(() => {
    setAdditionalFields({});
    setProductImage(null);
  }, [dataType]);

  const handleAdditionalFieldChange = (field: string, value: string | null) => {
    setAdditionalFields((prev) => {
      if (value === null) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: value };
    });
  };

  const handleImageChange = (base64Image: string | null) => {
    setProductImage(base64Image);
    handleAdditionalFieldChange("productImage", base64Image);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName.trim()) {
      toast({ title: "Product Name required", variant: "destructive" });
      return;
    }
    if (!quantity || parseInt(quantity) <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Enter a valid number of QR codes.",
        variant: "destructive",
      });
      return;
    }
    if (parseInt(quantity) > 10000) {
      toast({
        title: "Amount too large",
        description: "Maximum 10,000 QR codes per batch.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName.trim(),
          productType: dataType,
          batchNumber: batchNo || undefined,
          companyRegNo: companyRegNo || undefined,
          quantity: parseInt(quantity),
          description: description || undefined,
          expiryDays: expiryDays ? parseInt(expiryDays) : undefined,
          scanLimit: parseInt(verificationLimit) || 0,
          metadata: {
            ...additionalFields,
            qrType,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create batch file");
      }

      toast({
        title: "Batch created!",
        description: data.message,
      });

      router.push("/dashboard/batch-files");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message ?? "Failed to create batch file",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderAdditionalFields = () => {
    const imageUpload = (
      <div className="col-span-1 md:col-span-2 mt-4 mb-2">
        <ImageUpload
          onImageChange={handleImageChange}
          defaultImage={productImage}
          label={`${getDataTypeLabel(dataType)} Image`}
          description={`Upload an image for this ${getDataTypeLabel(dataType).toLowerCase()}`}
        />
      </div>
    );

    const field = (
      id: string,
      label: string,
      placeholder: string,
      key: string,
      type = "text",
    ) => (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={additionalFields[key] || ""}
          onChange={(e) => handleAdditionalFieldChange(key, e.target.value)}
          className="bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500"
        />
      </div>
    );

    const textareaField = (
      id: string,
      label: string,
      placeholder: string,
      key: string,
    ) => (
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={id}>{label}</Label>
        <Textarea
          id={id}
          placeholder={placeholder}
          value={additionalFields[key] || ""}
          onChange={(e) => handleAdditionalFieldChange(key, e.target.value)}
          className="bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500"
        />
      </div>
    );

    const wrap = (title: string, children: React.ReactNode) => (
      <div className="space-y-4 mt-4">
        <h3 className="text-lg font-medium">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {imageUpload}
          {children}
        </div>
      </div>
    );

    switch (dataType) {
      case "documents":
        return wrap(
          "Document Details",
          <>
            {field(
              "doc-type",
              "Document Type",
              "e.g., Certificate of Incorporation",
              "documentType",
            )}
            {field(
              "doc-number",
              "Document Number",
              "e.g., RC1234567",
              "documentNumber",
            )}
            {field(
              "issuing-authority",
              "Issuing Authority",
              "Organization that issued the document",
              "issuingAuthority",
            )}
            {field(
              "holder-name",
              "Holder's Name",
              "Name of the document holder",
              "holderName",
            )}
            {field("issue-date", "Issue Date", "", "issueDate", "date")}
            {field("expiry-date", "Expiry Date", "", "expiryDate", "date")}
          </>,
        );

      case "medicine":
        return wrap(
          "Medicine Details",
          <>
            {field(
              "medicine-name",
              "Medicine Name",
              "e.g., Paracetamol 500mg",
              "medicineName",
            )}
            {field(
              "manufacturer",
              "Manufacturer",
              "Company that produced the medicine",
              "manufacturer",
            )}
            {field(
              "active-ingredient",
              "Active Ingredient",
              "e.g., Paracetamol",
              "activeIngredient",
            )}
            {field("dosage", "Dosage", "e.g., 500mg", "dosage")}
            {field("med-category", "Category", "e.g., Analgesics", "category")}
            {field(
              "manufacture-date",
              "Manufacturing Date",
              "",
              "manufactureDate",
              "date",
            )}
            {field("med-expiry-date", "Expiry Date", "", "expiryDate", "date")}
            {field("nafdac", "NAFDAC Number", "e.g., A4-1234", "nafdacNumber")}
            {field("origin", "Origin", "e.g., Lagos, Nigeria", "origin")}
          </>,
        );

      case "electronics":
        return wrap(
          "Electronics Details",
          <>
            {field(
              "product-name",
              "Product Name",
              "e.g., iPhone 15 Pro Max",
              "productName",
            )}
            {field("model", "Model Number", "e.g., A3108", "model")}
            {field(
              "serial-number",
              "Serial Number",
              "Unique device identifier",
              "serialNumber",
            )}
            {field("imei", "IMEI", "e.g., 356789012345678", "imei")}
            {field(
              "e-manufacturer",
              "Manufacturer",
              "Company that made the product",
              "manufacturer",
            )}
            {field(
              "manufacture-date",
              "Date of Manufacture",
              "",
              "manufactureDate",
              "date",
            )}
            {field(
              "warranty-expiry",
              "Warranty Expiry Date",
              "",
              "warrantyExpiry",
              "date",
            )}
          </>,
        );

      case "apparel":
        return wrap(
          "Apparel Details",
          <>
            {field(
              "apparel-name",
              "Product Name",
              "e.g., Nike Air Jordan 1 Retro High",
              "productName",
            )}
            {field("brand", "Brand Name", "e.g., Nike / Jordan Brand", "brand")}
            {field("style-code", "Style Code", "e.g., 555088-134", "styleCode")}
            {field("size", "Size", "e.g., US 10 / EU 44", "size")}
            {field("color", "Color", "e.g., White/University Blue", "color")}
            {field(
              "a-manufacturer",
              "Manufacturer",
              "e.g., Nike Inc.",
              "manufacturer",
            )}
            {field(
              "a-manufacture-date",
              "Date of Manufacture",
              "",
              "manufactureDate",
              "date",
            )}
            {field("a-origin", "Origin", "e.g., Vietnam", "origin")}
            {field(
              "material",
              "Material Composition",
              "e.g., Leather upper, Rubber sole",
              "materialComposition",
            )}
          </>,
        );

      case "luxury":
        return wrap(
          "Luxury Goods Details",
          <>
            {field(
              "luxury-name",
              "Product Name",
              "e.g., Rolex Submariner Date",
              "productName",
            )}
            {field("luxury-brand", "Brand", "e.g., Rolex", "brand")}
            {field(
              "serial",
              "Serial Number",
              "Unique product identifier",
              "serialNumber",
            )}
            {field(
              "model-number",
              "Model Number",
              "e.g., 126610LN",
              "modelNumber",
            )}
            {field(
              "buyer-name",
              "Buyer Name",
              "Name of the owner",
              "buyerName",
            )}
            {field(
              "purchase-date",
              "Purchase Date",
              "",
              "purchaseDate",
              "date",
            )}
            {field(
              "retailer",
              "Authorized Retailer",
              "Where the product was purchased",
              "retailer",
            )}
            {field(
              "certificate",
              "Certificate Number",
              "Certificate of authenticity number",
              "certificateNumber",
            )}
          </>,
        );

      case "food":
        return wrap(
          "Food & Beverages Details",
          <>
            {field(
              "food-name",
              "Product Name",
              "e.g., Coca-Cola Classic",
              "productName",
            )}
            {field(
              "food-manufacturer",
              "Manufacturer",
              "Company that produced the food",
              "manufacturer",
            )}
            {field(
              "food-category",
              "Category",
              "e.g., Carbonated Soft Drink",
              "category",
            )}
            {field(
              "weight",
              "Weight/Volume",
              "e.g., 330ml / 11.2 fl oz",
              "weight",
            )}
            {field(
              "production-date",
              "Production Date",
              "",
              "manufactureDate",
              "date",
            )}
            {field("food-expiry", "Expiry Date", "", "expiryDate", "date")}
            {field(
              "food-origin",
              "Origin",
              "e.g., Atlanta, Georgia, USA",
              "origin",
            )}
            {textareaField(
              "ingredients",
              "Ingredients",
              "List of ingredients (comma separated)",
              "ingredients",
            )}
          </>,
        );

      case "artwork":
        return wrap(
          "Artwork & Collectibles Details",
          <>
            {field(
              "artwork-title",
              "Artwork Title",
              "Title of the artwork",
              "artworkTitle",
            )}
            {field(
              "artist-name",
              "Artist Name",
              "Creator of the artwork",
              "artistName",
            )}
            {field(
              "creation-year",
              "Year of Creation",
              "e.g., 1889",
              "creationYear",
            )}
            {field("medium", "Medium", "e.g., Oil on canvas", "medium")}
            {field(
              "dimensions",
              "Dimensions",
              "e.g., 73.7 cm × 92.1 cm",
              "dimensions",
            )}
            {field(
              "current-owner",
              "Current Owner / Gallery",
              "Who currently owns the artwork",
              "currentOwner",
            )}
            {field(
              "art-certificate",
              "Certificate Number",
              "Certificate of authenticity number",
              "certificateNumber",
            )}
            {textareaField(
              "provenance",
              "Previous Owners (Provenance)",
              "History of ownership",
              "provenance",
            )}
            {textareaField(
              "exhibition",
              "Exhibition History",
              "Where the artwork has been displayed",
              "exhibitionHistory",
            )}
          </>,
        );

      case "tickets":
        return wrap(
          "Tickets & Event Passes Details",
          <>
            {field(
              "event-name",
              "Event Name",
              "Name of the event",
              "eventName",
            )}
            {field("venue", "Venue", "e.g., MetLife Stadium", "venue")}
            {field("event-date", "Event Date", "", "eventDate", "date")}
            {field("event-time", "Event Time", "", "eventTime", "time")}
            {field("section", "Section", "e.g., Floor A", "section")}
            {field("row", "Row", "e.g., 12", "row")}
            {field("seat", "Seat", "e.g., 15-16", "seat")}
            {field(
              "ticket-number",
              "Ticket Number",
              "Unique ticket identifier",
              "ticketNumber",
            )}
          </>,
        );

      case "cosmetics":
        return wrap(
          "Cosmetics & Skincare Details",
          <>
            {field(
              "cosmetic-name",
              "Product Name",
              "e.g., La Mer Crème de la Mer",
              "productName",
            )}
            {field("cosmetic-brand", "Brand", "e.g., La Mer", "brand")}
            {field("volume", "Volume", "e.g., 60ml / 2 fl oz", "volume")}
            {field(
              "c-manufacturer",
              "Manufacturer",
              "Company that made the product",
              "manufacturer",
            )}
            {field("c-origin", "Origin", "e.g., United States", "origin")}
            {field(
              "c-manufacture-date",
              "Manufacture Date",
              "",
              "manufactureDate",
              "date",
            )}
            {field("c-expiry-date", "Expiry Date", "", "expiryDate", "date")}
            {field(
              "certification",
              "Certification",
              "e.g., FDA Approved, Cruelty-Free",
              "certification",
            )}
            {textareaField(
              "c-ingredients",
              "Key Ingredients",
              "e.g., Miracle Broth™, Lime Tea, Sea Kelp",
              "ingredients",
            )}
          </>,
        );

      case "automotive":
        return wrap(
          "Automotive Parts Details",
          <>
            {field(
              "part-name",
              "Part Name",
              "e.g., Genuine BMW Engine Oil Filter",
              "partName",
            )}
            {field(
              "part-number",
              "Part Number",
              "e.g., 11427848321",
              "partNumber",
            )}
            {field(
              "auto-manufacturer",
              "Manufacturer",
              "e.g., BMW AG",
              "manufacturer",
            )}
            {field(
              "vehicle-compat",
              "Vehicle Compatibility",
              "e.g., BMW 3/5/7 Series (2010-2023)",
              "vehicleCompatibility",
            )}
            <div className="space-y-2">
              <Label htmlFor="oem-certified">OEM Certified</Label>
              <Select
                value={additionalFields.oemCertified || "Yes"}
                onValueChange={(v) =>
                  handleAdditionalFieldChange("oemCertified", v)
                }
              >
                <SelectTrigger className="bg-[#1a1625] border-0 text-white focus:ring-purple-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#231c35] border-[#2a2139] text-white">
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {field(
              "warranty",
              "Warranty",
              "e.g., 2 years / 24,000 miles",
              "warranty",
            )}
            {field(
              "auto-manufacture-date",
              "Date of Manufacture",
              "",
              "manufactureDate",
              "date",
            )}
          </>,
        );

      case "toys":
        return wrap(
          "Toys & Baby Products Details",
          <>
            {field(
              "toy-name",
              "Product Name",
              "e.g., LEGO Star Wars Millennium Falcon",
              "toyName",
            )}
            {field("toy-brand", "Brand", "e.g., LEGO", "brand")}
            {field("toy-model", "Model Number", "e.g., 75192", "modelNumber")}
            {field("age-range", "Age Range", "e.g., 16+", "ageRange")}
            {field(
              "piece-count",
              "Piece Count",
              "e.g., 7,541 pieces",
              "pieceCount",
            )}
            {field(
              "toy-manufacturer",
              "Manufacturer",
              "e.g., LEGO Group",
              "manufacturer",
            )}
            {field(
              "safety-standard",
              "Safety Standards",
              "e.g., ASTM F963, EN71, CE",
              "safetyStandard",
            )}
            {field(
              "toy-manufacture-date",
              "Date of Manufacture",
              "",
              "manufactureDate",
              "date",
            )}
          </>,
        );

      case "books":
        return wrap(
          "Books & Educational Materials Details",
          <>
            {field(
              "book-title",
              "Book Title",
              "e.g., The Great Gatsby",
              "bookTitle",
            )}
            {field("author", "Author", "e.g., F. Scott Fitzgerald", "author")}
            {field("isbn", "ISBN", "e.g., 978-0-7432-7356-5", "isbn")}
            {field("publisher", "Publisher", "Publishing company", "publisher")}
            {field(
              "pub-year",
              "Publication Year",
              "e.g., 1925",
              "publicationYear",
            )}
            {field(
              "edition",
              "Edition",
              "e.g., First Edition, 3rd Edition",
              "edition",
            )}
            {field(
              "condition",
              "Condition",
              "e.g., Mint, Good, Fair",
              "condition",
            )}
            {field(
              "auth-grade",
              "Authenticity Grade",
              "e.g., A+, A, B+",
              "authenticityGrade",
            )}
          </>,
        );

      case "passport":
        return wrap(
          "Country Passport Details",
          <>
            {field(
              "passport-number",
              "Passport Number",
              "e.g., A12345678",
              "passportNumber",
            )}
            {field(
              "holder-full-name",
              "Full Name",
              "e.g., John Akachukwu Doe",
              "holderName",
            )}
            {field(
              "nationality",
              "Nationality",
              "e.g., Nigerian",
              "nationality",
            )}
            {field(
              "issuing-country",
              "Issuing Country",
              "e.g., Nigeria",
              "issuingCountry",
            )}
            {field("dob", "Date of Birth", "", "dateOfBirth", "date")}
            {field("p-issue-date", "Issue Date", "", "issueDate", "date")}
            {field("p-expiry-date", "Expiry Date", "", "expiryDate", "date")}
          </>,
        );

      case "idcards":
        return wrap(
          "ID Cards Details",
          <>
            {field(
              "id-full-name",
              "Full Name",
              "e.g., Akachukwu Nwabueze",
              "name",
            )}
            {field(
              "position",
              "Position",
              "e.g., Chief Executive Officer",
              "position",
            )}
            {field(
              "employee-id",
              "Employee ID",
              "e.g., BM-CEO-001",
              "employeeId",
            )}
            {field(
              "department",
              "Department",
              "e.g., Executive Management",
              "department",
            )}
            {field(
              "id-email",
              "Email",
              "e.g., akachukwu@blockmec.com",
              "email",
            )}
            {field("id-phone", "Phone", "e.g., +234 803 123 4567", "phone")}
            {field("blood-group", "Blood Group", "e.g., O+", "bloodGroup")}
            {field(
              "emergency-contact",
              "Emergency Contact",
              "e.g., +234 805 987 6543",
              "emergencyContact",
            )}
            {field("id-number", "ID Number", "e.g., BMID-2024-001", "idNumber")}
            {field("id-issue-date", "Issue Date", "", "issueDate", "date")}
            {field("id-expiry-date", "Expiry Date", "", "expiryDate", "date")}
          </>,
        );

      case "bankchecks":
        return wrap(
          "Bank Checks Details",
          <>
            {field(
              "check-number",
              "Check Number",
              "e.g., CHK-2024-001234",
              "checkNumber",
            )}
            {field(
              "bank-name",
              "Bank Name",
              "e.g., First National Bank",
              "bankName",
            )}
            {field(
              "account-holder",
              "Account Holder Name",
              "e.g., Blockmec Technologies Ltd",
              "accountHolder",
            )}
            {field("amount", "Amount", "e.g., $25,000.00", "amount")}
            {field("payee", "Payee", "e.g., ABC Corporation", "payee")}
            {field("check-issue-date", "Issue Date", "", "issueDate", "date")}
            {field(
              "routing-number",
              "Routing Number",
              "e.g., 021000021",
              "routingNumber",
            )}
            {field(
              "account-number",
              "Account Number (Last 4 digits)",
              "e.g., ****5678",
              "accountNumber",
            )}
          </>,
        );

      case "landing":
        return wrap(
          "Landing/Properties Details",
          <>
            {field(
              "property-name",
              "Property Name",
              "e.g., Luxurious Villa in Miami",
              "propertyName",
            )}
            {field(
              "address",
              "Address",
              "e.g., 123 Ocean Drive, Miami, FL 33139",
              "address",
            )}
            {field("city", "City", "e.g., Miami", "city")}
            {field("state", "State", "e.g., Florida", "state")}
            {field("zip-code", "Zip Code", "e.g., 33139", "zipCode")}
            {field("country", "Country", "e.g., USA", "country")}
            {field("bedrooms", "Bedrooms", "e.g., 4", "bedrooms", "number")}
            {field(
              "bathrooms",
              "Bathrooms",
              "e.g., 3.5",
              "bathrooms",
              "number",
            )}
            {field(
              "sq-footage",
              "Square Footage",
              "e.g., 2500 sq ft",
              "squareFootage",
            )}
            <div className="space-y-2">
              <Label htmlFor="property-type">Property Type</Label>
              <Select
                value={additionalFields.propertyType || "House"}
                onValueChange={(v) =>
                  handleAdditionalFieldChange("propertyType", v)
                }
              >
                <SelectTrigger className="bg-[#1a1625] border-0 text-white focus:ring-purple-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#231c35] border-[#2a2139] text-white">
                  {[
                    "House",
                    "Apartment",
                    "Condo",
                    "Townhouse",
                    "Land",
                    "Commercial",
                  ].map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="prop-description">Description</Label>
              <Textarea
                id="prop-description"
                placeholder="Detailed description of the property"
                value={additionalFields.description || ""}
                onChange={(e) =>
                  handleAdditionalFieldChange("description", e.target.value)
                }
                rows={4}
                className="bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500"
              />
            </div>
          </>,
        );

      default:
        return null;
    }
  };

  return (
    <AuthGuard>
      <DashboardShell>
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Create Batch File</h2>
          <p className="text-gray-400 mt-1">
            Generate a batch of unique QR codes for your products
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>
                Enter the details for your product batch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="productName"
                  placeholder="e.g., Coca Cola Classic 330ml"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Product Type <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {PRODUCT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setDataType(type.value)}
                      className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                        dataType === type.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="text-sm font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter product description or additional details"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch No.</Label>
                  <Input
                    id="batchNumber"
                    placeholder="e.g., BATCH-2024-001"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    Number of QR Codes <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="Number of QR codes to generate"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    min="1"
                    max="10000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyRegNo">
                  Company Registration Number
                </Label>
                <Input
                  id="companyRegNo"
                  placeholder="e.g., RC1234567"
                  value={companyRegNo}
                  onChange={(e) => setCompanyRegNo(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="bg-[#231c35] rounded-md p-6">
            <Accordion type="single" collapsible defaultValue="item-1">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-xl font-semibold">
                  {getDataTypeLabel(dataType)} Specific Details
                </AccordionTrigger>
                <AccordionContent>{renderAdditionalFields()}</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {dataType === "landing" && (
            <ProductLandingProperties
              productType={dataType}
              productData={{ id: batchNo }}
            />
          )}

          <QRPreview
            productName={productName}
            productType={dataType}
            batchNumber={batchNo}
            description={description}
            additionalFields={additionalFields}
            productImage={productImage}
          />

          <div className="bg-[#231c35] rounded-md p-6">
            <h2 className="text-xl font-semibold mb-4">QR Code Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="qr-type">QR Code Type</Label>
                <Select value={qrType} onValueChange={setQrType}>
                  <SelectTrigger
                    id="qr-type"
                    className="bg-[#1a1625] border-0 text-white"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#231c35] border-[#2a2139] text-white">
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="secure">Secure (Encrypted)</SelectItem>
                    <SelectItem value="timed">Timed (Expiring)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry-days">Expiry (Days)</Label>
                <Input
                  id="expiry-days"
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  className="bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500"
                  min="1"
                />
                <p className="text-xs text-gray-400">
                  Leave empty for non-expiring QR codes
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="verification-limit">Verification Limit</Label>
                <Input
                  id="verification-limit"
                  type="number"
                  value={verificationLimit}
                  onChange={(e) => setVerificationLimit(e.target.value)}
                  className="bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500"
                  min="0"
                />
                <p className="text-xs text-gray-400">
                  0 = unlimited verifications
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isGenerating} className="flex-1">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Batch File...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Batch File
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/batch-files")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DashboardShell>
    </AuthGuard>
  );
}
