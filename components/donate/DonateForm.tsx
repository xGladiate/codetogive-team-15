"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Package, School } from "@/types/database";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  selectedPackage: Package;
  packages: Package[];
  schools: School[];
  user: User;
}

export default function DonateForm({
  selectedPackage,
  packages,
  schools,
  user,
}: Props) {
  const [currentPackage, setCurrentPackage] = useState(selectedPackage);
  const [frequency, setFrequency] = useState("one-time");

  const [paymentMethod, setPaymentMethod] = useState<"Stripe" | "Bank">("Bank");

  const [customAmount, setCustomAmount] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Payment form states
  const [email, setEmail] = useState(user.email || "");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [country, setCountry] = useState("singapore");

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});

  const router = useRouter();
  const supabase = createClient();

  const extendedDescriptions: Record<string, string> = {
    "Custom Amount":
      "Make a donation of your chosen amount to support children's education. Whether it's a small contribution or a larger gift, every dollar helps provide essential resources, learning materials, and opportunities that make a real difference in a child's educational journey. Your flexible donation allows us to direct funds where they're needed most.",
    Supporter:
      "Support a child's basic educational needs with essential supplies and resources. Your contribution helps provide school supplies, basic learning materials, and educational support that makes a meaningful difference in their daily learning experience.",
    Champion:
      "Champion a child's educational journey by providing comprehensive support that covers their academic, nutritional, and developmental needs. Your sponsorship ensures consistent access to quality education, daily meals, learning materials, and extracurricular activities that help build well-rounded individuals ready for their future.",
    Angel:
      "Become a child's guardian angel by giving them the gift of early education. With your support, a child gains access to quality teaching, nutritious meals, and the tools they need to thrive in a safe and nurturing environment. Your contribution directly impacts their daily learning experience, providing them with books, educational materials, healthy snacks, and creative learning opportunities that spark curiosity and build confidence.",
    "Adopt A Classroom":
      "Transform an entire classroom by providing comprehensive support for all students and their teacher. Your generous donation covers classroom supplies, educational materials, technology resources, furniture, and teaching aids for a full academic year. You'll help create an optimal learning environment where 20-30 children can thrive together, building friendships and learning collaboratively. This impactful sponsorship includes regular updates and photos showing how your classroom is flourishing throughout the year.",
    "Sponsor A School":
      "Make a transformational impact by sponsoring an entire school community. Your exceptional contribution supports all students, teachers, and staff, covering operational costs, infrastructure improvements, educational programs, meal programs, and professional development. This comprehensive sponsorship ensures the school can provide quality education to hundreds of children while maintaining safe facilities, well-equipped classrooms, and innovative learning programs.",
  };

  const getAmount = () => {
    return currentPackage.name === "Custom Amount"
      ? customAmount
      : currentPackage.amount.toLocaleString();
  };

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateCardNumber = (cardNumber: string) => {
    const cleanCard = cardNumber.replace(/\s/g, "");
    return /^\d{16}$/.test(cleanCard);
  };

  const validateExpiryDate = (expiryDate: string) => {
    const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!regex.test(expiryDate)) return false;

    const [month, year] = expiryDate.split("/");
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    const expYear = parseInt(year);
    const expMonth = parseInt(month);

    if (
      expYear < currentYear ||
      (expYear === currentYear && expMonth < currentMonth)
    ) {
      return false;
    }

    return true;
  };

  const validateCvc = (cvc: string) => {
    return /^\d{3}$/.test(cvc);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Card number validation
    if (!cardNumber.trim()) {
      newErrors.cardNumber = "Card number is required";
    } else if (!validateCardNumber(cardNumber)) {
      newErrors.cardNumber = "Card number must be 16 digits";
    }

    // Expiry date validation
    if (!expiryDate.trim()) {
      newErrors.expiryDate = "Expiry date is required";
    } else if (!validateExpiryDate(expiryDate)) {
      newErrors.expiryDate = "Please enter a valid expiry date (MM/YY)";
    }

    // CVC validation
    if (!cvc.trim()) {
      newErrors.cvc = "CVC is required";
    } else if (!validateCvc(cvc)) {
      newErrors.cvc = "CVC must be 3 digits";
    }

    // Name on card validation
    if (!nameOnCard.trim()) {
      newErrors.nameOnCard = "Name on card is required";
    }

    // Custom amount validation
    if (
      currentPackage.name === "Custom Amount" &&
      (!customAmount || Number(customAmount) <= 0)
    ) {
      newErrors.customAmount = "Please enter a valid amount";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    const formattedValue = value.replace(/(\d{4})(?=\d)/g, "$1 "); // Add spaces every 4 digits
    if (value.length <= 16) {
      setCardNumber(formattedValue);
      if (errors.cardNumber) {
        setErrors((prev) => ({ ...prev, cardNumber: "" }));
      }
    }
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    if (value.length >= 2) {
      value = value.substring(0, 2) + "/" + value.substring(2, 4);
    }
    if (value.length <= 5) {
      setExpiryDate(value);
      if (errors.expiryDate) {
        setErrors((prev) => ({ ...prev, expiryDate: "" }));
      }
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    if (value.length <= 3) {
      setCvc(value);
      if (errors.cvc) {
        setErrors((prev) => ({ ...prev, cvc: "" }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !isFormValid()) {
      return;
    }

    setIsProcessing(true);

    try {
      const amount =
        currentPackage.name === "Custom Amount"
          ? parseFloat(customAmount)
          : currentPackage.amount;
      const schoolId =
        selectedSchool === "no_preference" ? null : selectedSchool || null;

      console.log("User ID:", user.id);

      const { error: donationError } = await supabase
        .from("donations")
        .insert({
          amount: amount,
          donor_id: user.id,
          school_id: schoolId,
          package_id: currentPackage.id,
          remarks: remarks,
          type: frequency === "one-time" ? "one_off" : "recurring",
          payment_method: paymentMethod,
          created_at: new Date().toISOString(),
          email: user.email
        })
        .select()
        .single();

      if (donationError) throw donationError;

      if (frequency !== "one-time") {
        const { error: recurringError } = await supabase
          .from("recurring_donations")
          .insert({
            start_date: new Date().toISOString(),
            billing_frequency: frequency,
            package_id: currentPackage.id,
            created_at: new Date().toISOString(),
          });

        if (recurringError) throw recurringError;
      }

      // Redirect to success page or donor dashboard
      toast.success("Payment recorded successfully.");
      router.push("/donor?success=true");
    } catch (error) {
      console.error("Error processing donation:", error);
      toast.error("Error processing donation. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const isFormValid = () => {
    return (
      validateEmail(email) &&
      validateCardNumber(cardNumber) &&
      validateExpiryDate(expiryDate) &&
      validateCvc(cvc) &&
      nameOnCard.trim() &&
      (currentPackage.name !== "Custom Amount" ||
        (customAmount && Number(customAmount) > 0))
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Side - Form */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">
              Selected: {currentPackage.name}
              {currentPackage.amount !== 0 && " Package"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Select
                value={currentPackage.id}
                onValueChange={(value) => {
                  const pkg = packages.find((p) => p.id === value);
                  if (pkg) setCurrentPackage(pkg);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {packages
                    .sort((a, b) => a.amount - b.amount)
                    .map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name}
                        {pkg.amount === 0
                          ? ""
                          : ` - HK$${pkg.amount.toLocaleString()}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="space-y-3">
                <div>
                  <Label className="font-medium">Description:</Label>
                  <p className="text-sm text-gray-700 mt-1">
                    {extendedDescriptions[currentPackage.name] ||
                      currentPackage.description}
                  </p>
                </div>
                <div>
                  <Label className="font-medium">Impact Highlight:</Label>
                  <p className="text-sm text-gray-700 mt-1">
                    Thanks to ongoing {currentPackage.name} sponsors, children
                    have been able to attend classes regularly, receive daily
                    meals, and enjoy creative learning activities. Parents have
                    shared how their children are now more confident, curious,
                    and ready for primary school.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {currentPackage.name === "Custom Amount" && (
                <div>
                  <Label htmlFor="custom-amount">Enter Custom Amount*</Label>
                  <Input
                    id="custom-amount"
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (
                        value === "" ||
                        (Number(value) >= 0 && !isNaN(Number(value)))
                      ) {
                        setCustomAmount(value);
                        if (errors.customAmount) {
                          setErrors((prev) => ({ ...prev, customAmount: "" }));
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (
                        e.key === "-" ||
                        e.key === "+" ||
                        e.key === "e" ||
                        e.key === "E"
                      ) {
                        e.preventDefault();
                      }
                    }}
                    min="0"
                    step="0.01"
                    placeholder="e.g., 1000"
                    required
                    className={errors.customAmount ? "border-red-500" : ""}
                  />
                  {errors.customAmount && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.customAmount}
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label className="text-base font-medium">
                  Select Donation Frequency:
                </Label>
                <RadioGroup
                  value={frequency}
                  onValueChange={setFrequency}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="one-time" id="one-time" />
                    <Label htmlFor="one-time">One-Time: HK${getAmount()}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly">Monthly: HK${getAmount()}/m</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="annual" id="annual" />
                    <Label htmlFor="annual">Annual: HK${getAmount()}/y</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="school-select">
                  Do you want to sponsor a particular school?
                </Label>
                <Select
                  value={selectedSchool}
                  onValueChange={setSelectedSchool}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a school (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_preference">No preference</SelectItem>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id.toString()}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="remarks">Additional Remarks (if any):</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any additional comments..."
                  rows={3}
                />
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Payment */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          <div>
              <Label className="text-base font-medium">Payment Method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v: "Bank" | "Stripe") => setPaymentMethod(v)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Bank" id="pay-bank" />
                  <Label htmlFor="pay-bank">Bank Transfer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Stripe" id="pay-card" />
                  <Label htmlFor="pay-card">Stripe</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="email">Email*</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: "" }));
                  }
                }}
                className={errors.email ? "border-red-500" : ""}
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="card-number">Card Information*</Label>
              <Input
                id="card-number"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                className={errors.cardNumber ? "border-red-500" : ""}
                maxLength={19} // 16 digits + 3 spaces
              />
              {errors.cardNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChange={handleExpiryDateChange}
                  className={errors.expiryDate ? "border-red-500" : ""}
                  maxLength={5}
                />
                {errors.expiryDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.expiryDate}
                  </p>
                )}
              </div>
              <div>
                <Input
                  placeholder="CVC"
                  value={cvc}
                  onChange={handleCvcChange}
                  className={errors.cvc ? "border-red-500" : ""}
                  maxLength={3}
                />
                {errors.cvc && (
                  <p className="text-red-500 text-sm mt-1">{errors.cvc}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="name-on-card">Name on card*</Label>
              <Input
                id="name-on-card"
                placeholder="Full name"
                value={nameOnCard}
                onChange={(e) => {
                  setNameOnCard(e.target.value);
                  if (errors.nameOnCard) {
                    setErrors((prev) => ({ ...prev, nameOnCard: "" }));
                  }
                }}
                className={errors.nameOnCard ? "border-red-500" : ""}
              />
              {errors.nameOnCard && (
                <p className="text-red-500 text-sm mt-1">{errors.nameOnCard}</p>
              )}
            </div>

            <div>
              <Label htmlFor="country">Country or region*</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="singapore">Singapore</SelectItem>
                  <SelectItem value="hong-kong">Hong Kong</SelectItem>
                  <SelectItem value="malaysia">Malaysia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              {isProcessing ? "Processing..." : `Pay HK$${getAmount()}`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
