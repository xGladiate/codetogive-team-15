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

    // // Card number validation
    // if (!cardNumber.trim()) {
    //   newErrors.cardNumber = "Card number is required";
    // } else if (!validateCardNumber(cardNumber)) {
    //   newErrors.cardNumber = "Card number must be 16 digits";
    // }

    // // Expiry date validation
    // if (!expiryDate.trim()) {
    //   newErrors.expiryDate = "Expiry date is required";
    // } else if (!validateExpiryDate(expiryDate)) {
    //   newErrors.expiryDate = "Please enter a valid expiry date (MM/YY)";
    // }

    // // CVC validation
    // if (!cvc.trim()) {
    //   newErrors.cvc = "CVC is required";
    // } else if (!validateCvc(cvc)) {
    //   newErrors.cvc = "CVC must be 3 digits";
    // }

    // // Name on card validation
    // if (!nameOnCard.trim()) {
    //   newErrors.nameOnCard = "Name on card is required";
    // }

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

      if (paymentMethod === "Bank") {
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
        toast.success("Payment recorded successfully.");
        router.push("/donor?success=true");
      } else {
        // Stripe flow
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            email,
            packageName: currentPackage.name,
            remarks,
            frequency,  // "one-time" | "monthly" | "annual"
            userId: user.id,
            schoolId: selectedSchool === "no_preference" ? null : selectedSchool || null,
            packageId: currentPackage.id,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data.error || "Stripe session failed");
          throw new Error(data.details || data.error || "Stripe session failed");
        }
        window.location.href = data.url;
      }

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
      
    } catch (error) {
      console.error("Error processing donation:", error);
      toast.error("Error processing donation. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const isFormValid = () => {
    const amountOk =
      currentPackage.name !== "Custom Amount" ||
      (!!customAmount && Number(customAmount) > 0);
  
    if (paymentMethod === "Stripe") {
      return validateEmail(email) && amountOk;
    }
  
    return validateEmail(email) && amountOk;
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
          <CardContent className="space-y-5">
          {/* Method toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Payment Method</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Choose how you’d like to donate
              </p>
            </div>

            <div className="inline-flex rounded-xl border overflow-hidden">
              <Button
                type="button"
                variant={paymentMethod === "Bank" ? "default" : "ghost"}
                className="rounded-none px-4"
                onClick={() => setPaymentMethod("Bank")}
              >
                Bank
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "Stripe" ? "default" : "ghost"}
                className="rounded-none px-4"
                onClick={() => setPaymentMethod("Stripe")}
              >
                Stripe
                <span className="ml-2 rounded bg-amber-100 text-amber-700 px-1.5 py-0.5 text-[10px]">
                  Test
                </span>
              </Button>
            </div>
          </div>

          {/* Email (always shown) */}
          <div>
            <Label htmlFor="email">Email*</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
              }}
              className={errors.email ? "border-red-500" : ""}
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Stripe card fields */}
          {paymentMethod === "Stripe" && (
            <div className="space-y-3 rounded-xl border p-4 bg-card/50">
              <Label className="font-medium">Stripe Checkout</Label>
              <p className="text-xs text-muted-foreground">
                You’ll be redirected to a secure Stripe page to complete your donation.  
                Use the test card <code className="bg-muted px-1.5 py-0.5 rounded">4242 4242 4242 4242</code> for testing.
              </p>
            </div>
          )}

          {/* Bank instructions */}
          {paymentMethod === "Bank" && (
            <div className="space-y-3 rounded-xl border p-4 bg-card/50">
              <div className="flex items-start justify-between">
                <div>
                  <Label className="font-medium">Bank Transfer Instructions</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    We’ll mark your donation as <span className="font-medium">pending</span> until we verify your transfer.
                  </p>
                </div>
                <span className="rounded bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px]">
                  Manual
                </span>
              </div>

              <CopyRow label="Bank" value="HSBC Hong Kong" />
              <CopyRow label="Account Name" value="REACH Foundation" />
              <CopyRow label="Account Number" value="123-456789-001" />
              <CopyRow label="Reference" value={email || user.email || "your email"} hint="Use your email for reconciliation" />
            </div>
          )}

          {/* Submit */}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            className={`w-full h-11 text-white disabled:opacity-50 disabled:cursor-not-allowed
              ${paymentMethod === "Stripe"
                ? "bg-[#635bff] hover:bg-[#635bff]/90"
                : "bg-blue-900 hover:bg-blue-800"
              }`}
            size="lg"
          >
            {isProcessing
              ? "Processing..."
              : paymentMethod === "Bank"
              ? `Confirm Bank Pledge (HK$${getAmount()})`
              : `Pay with Stripe (HK$${getAmount()})`}
          </Button>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 items-center">
      <p className="text-sm text-muted-foreground col-span-1">{label}</p>
      <div className="col-span-2 flex items-center gap-2">
        <code className="block w-full truncate rounded bg-muted px-2 py-1 text-xs">
          {value}
        </code>
        <Button
          type="button"
          variant="outline"
          className="h-7 px-2 text-xs"
          onClick={() => navigator.clipboard.writeText(value)}
        >
          Copy
        </Button>
      </div>
      {hint && (
        <p className="col-span-3 text-[11px] text-muted-foreground mt-1">{hint}</p>
      )}
    </div>
  );
}
