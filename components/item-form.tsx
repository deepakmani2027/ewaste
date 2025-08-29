"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Upload, Camera, Gavel } from 'lucide-react'
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import type { AuthUser } from "./auth/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"

export type Department = "Engineering" | "Sciences" | "Humanities" | "Administration" | "Hostel" | "Other"
export type Category =
 | "Computer"
 | "Projector"
 | "Lab Equipment"
 | "Mobile Device"
 | "Battery"
 | "Accessory"
 | "Other"

export default function ItemForm({
 refreshItems,
 user,
}: {
 refreshItems: () => void;
 user: AuthUser | null;
}) {
 const [name, setName] = useState("")
 const [department, setDepartment] = useState<Department>("Engineering")
 const [category, setCategory] = useState<Category>("Computer")
 const [ageMonths, setAgeMonths] = useState(12)
 const [condition, setCondition] = useState<"Good" | "Fair" | "Poor" | "Dead">("Fair")
 const [notes, setNotes] = useState("")
 const [pending, setPending] = useState(false)
 const [error, setError] = useState<string | null>(null)

  // Bidding states
  const [isBiddable, setIsBiddable] = useState(false);
  const [startingBid, setStartingBid] = useState(100);
  const [biddingEndDate, setBiddingEndDate] = useState('');

 // --- Re-added AI image recognition states ---
 const [aiLoading, setAiLoading] = useState(false)
 const [aiError, setAiError] = useState<string | null>(null)
 const fileInputRef = useRef<HTMLInputElement | null>(null)
 const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
 const [matchedLabelInfo, setMatchedLabelInfo] = useState<{category: string|null, department: string|null}>({category: null, department: null})
 const [previewUrl, setPreviewUrl] = useState<string | null>(null)

 const { ref, isInView } = useScrollAnimation()

 async function submit() {
  if (!name.trim()) {
   setError("Item name is required.");
   return;
  }
    if (isBiddable && (!startingBid || !biddingEndDate)) {
        setError("Starting bid and end date are required for an auction.");
        return;
    }
  if (!user?.email) {
   setError("You must be logged in to add an item.");
   return;
  }
  
  setError(null);
  setPending(true);

    const payload: any = {
        name,
        department,
        category,
        ageMonths: Number(ageMonths),
        condition,
        notes,
        createdBy: user.email,
    };

    if (isBiddable) {
        payload.biddingStatus = "open";
        payload.startingBid = Number(startingBid);
        payload.biddingEndDate = new Date(biddingEndDate).toISOString();
    }

  try {
   const response = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
   });

   if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to add item.");
   }

   // --- Reset all form fields on success ---
   setName("")
   setDepartment("Engineering")
   setCategory("Computer")
   setAgeMonths(12)
   setCondition("Fair")
   setNotes("")
      setIsBiddable(false)
      setStartingBid(100)
      setBiddingEndDate("")
   setAiSuggestions([])
   setMatchedLabelInfo({category: null, department: null})
   setPreviewUrl(null)
   if (fileInputRef.current) {
    fileInputRef.current.value = "";
   }
   
   refreshItems();

  } catch (err: any) {
   setError(err.message);
  } finally {
   setPending(false);
  }
 }

 // --- Re-added AI image recognition handler ---
 async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
  setAiError(null);
  setAiLoading(true);
  setAiSuggestions([]);
  setMatchedLabelInfo({category: null, department: null});
  
  try {
   const file = e.target.files?.[0];
   if (!file) return;
   
   if (file.size > 5 * 1024 * 1024) {
    setAiError("Image size must be less than 5MB");
    return;
   }
   
   const objectUrl = URL.createObjectURL(file);
   setPreviewUrl(objectUrl);
   
   const formData = new FormData();
   formData.append('image', file);
   
   const apiKey = 'acc_ecdcac04b616eb7';
   const apiSecret = '7ef947c769332701aed7df794108bf8a';
   const authHeader = 'Basic ' + btoa(`${apiKey}:${apiSecret}`);
   
   const response = await fetch('https://api.imagga.com/v2/tags', {
    method: 'POST',
    headers: { 'Authorization': authHeader },
    body: formData
   });
   
   if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Imagga API error: ${response.status} ${response.statusText}. ${errorText}`);
   }
   
   const data = await response.json();
   
   if (data.result && data.result.tags) {
    const tags = data.result.tags;
    
        // (Mapping logic remains the same)
    const categoryMap: { [key: string]: Category } = { "computer": "Computer", "laptop": "Computer", "phone": "Mobile Device", "battery": "Battery", "charger": "Accessory", "cable": "Accessory", "projector": "Projector", "equipment": "Lab Equipment" };
    const departmentMap: { [key: string]: Department } = { "lab": "Sciences", "science": "Sciences", "engineering": "Engineering", "office": "Administration", "hostel": "Hostel", "humanities": "Humanities" };
    
    let detectedCategory: Category = "Other";
    let detectedDepartment: Department = "Other";
    let bestCategoryScore = 0;
    let bestDepartmentScore = 0;
    let bestCategoryLabel = "";
    let bestDepartmentLabel = "";
    
    for (const tag of tags) {
     const tagName = tag.tag.en.toLowerCase();
     const confidence = tag.confidence;
     
     for (const key in categoryMap) {
      if (tagName.includes(key) && confidence > bestCategoryScore) {
       detectedCategory = categoryMap[key];
       bestCategoryScore = confidence;
       bestCategoryLabel = tag.tag.en;
      }
     }
     
     for (const key in departmentMap) {
      if (tagName.includes(key) && confidence > bestDepartmentScore) {
       detectedDepartment = departmentMap[key];
       bestDepartmentScore = confidence;
       bestDepartmentLabel = tag.tag.en;
      }
     }
    }
    
    setCategory(detectedCategory);
    setDepartment(detectedDepartment);
    
    if (tags.length > 0 && !name) {
     setName(tags[0].tag.en);
    }
    
    setAiSuggestions(tags.slice(0, 3).map((t: any) => `${t.tag.en} (${t.confidence.toFixed(0)}%)`));
    
    setMatchedLabelInfo({
     category: detectedCategory !== "Other" ? `${bestCategoryLabel} (${bestCategoryScore.toFixed(0)}%)` : null,
     department: detectedDepartment !== "Other" ? `${bestDepartmentLabel} (${bestDepartmentScore.toFixed(0)}%)` : null
    });
   } else {
    throw new Error("No tags found in the response");
   }
   
  } catch (err: any) {
   console.error("AI recognition error:", err);
   setAiError(err.message || "AI recognition is temporarily unavailable. Please enter details manually.");
  } finally {
   setAiLoading(false);
  }
 }

 return (
  <Card 
   ref={ref as any}
   className={`mt-4 transition-all duration-700 ease-out ${
    isInView 
     ? 'opacity-100 translate-y-0 scale-100' 
     : 'opacity-0 translate-y-8 scale-95'
   }`}
  >
   <CardHeader>
    <CardTitle>Add E‑Waste Item</CardTitle>
   </CardHeader>
   <CardContent className="space-y-4">
    {error && (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}

        {/* --- Re-added Image Upload UI --- */}
    <div className="grid gap-3">
     <Label htmlFor="item-image" className="text-lg font-semibold flex items-center gap-2">
      <Camera className="w-5 h-5" />
      Item Image (AI Recognition)
     </Label>
     
     <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 transition-colors hover:border-emerald-500">
      {previewUrl ? (
       <div className="mb-4 relative">
        <img 
         src={previewUrl} 
         alt="Preview" 
         className="max-h-48 rounded-md object-contain"
        />
        <button 
         className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 leading-none h-6 w-6"
         onClick={() => {
          setPreviewUrl(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
         }}
        >
         &times;
        </button>
       </div>
      ) : (
       <Upload className="w-12 h-12 text-gray-400 mb-4" />
      )}
      
      <Input
       id="item-image"
       type="file"
       accept="image/*"
       ref={fileInputRef}
       onChange={handleImageChange}
       disabled={aiLoading || pending}
       className="hidden"
      />
      
      <Label 
       htmlFor="item-image" 
       className={`cursor-pointer px-4 py-2 rounded-md ${aiLoading ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'} text-white flex items-center gap-2`}
      >
       {aiLoading ? 'Analyzing...' : 'Upload Image'}
      </Label>
      
      <p className="text-sm text-gray-500 mt-2">
       Upload a clear photo for AI-powered suggestions.
      </p>
     </div>
     
     {aiLoading && (
      <div className="flex items-center justify-center gap-2 text-blue-600">
       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
       <span>Analyzing image...</span>
      </div>
     )}
     
     {aiError && (
      <Alert variant="destructive" className="my-2">
       <AlertDescription>{aiError}</AlertDescription>
      </Alert>
     )}
     
     {aiSuggestions.length > 0 && (
      <div className="text-sm text-gray-700 mt-2 p-3 bg-gray-50 rounded-md">
       <span className="font-medium">AI detected: </span>
       {aiSuggestions.map((s, i) => (
        <span key={i} className="inline-block bg-gray-200 rounded px-2 py-1 mr-2 mb-1">{s}</span>
       ))}
      </div>
     )}
     
     {(matchedLabelInfo.category || matchedLabelInfo.department) && (
      <Alert className="bg-emerald-50 border-emerald-200 mt-2">
       <AlertDescription className="text-emerald-800">
        {matchedLabelInfo.category && <div className="font-medium">Suggested category: {matchedLabelInfo.category}</div>}
        {matchedLabelInfo.department && <div className="font-medium">Suggested department: {matchedLabelInfo.department}</div>}
       </AlertDescription>
      </Alert>
     )}
    </div>
    
    <div className="grid gap-3">
     <Label htmlFor="name" className="text-lg font-semibold">Item Name</Label>
     <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HP EliteBook 840 G5" disabled={pending} className="py-2 px-4 text-lg"/>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
     <div className="grid gap-3">
      <Label className="text-lg font-semibold">Department</Label>
      <Select value={department} onValueChange={(v: Department) => setDepartment(v)} disabled={pending}>
       <SelectTrigger className="py-2 px-4 text-lg h-12"><SelectValue /></SelectTrigger>
       <SelectContent>{["Engineering","Sciences","Humanities","Administration","Hostel","Other"].map((d) => (<SelectItem key={d} value={d} className="text-lg py-2">{d}</SelectItem>))}</SelectContent>
      </Select>
     </div>
     
     <div className="grid gap-3">
      <Label className="text-lg font-semibold">Category</Label>
      <Select value={category} onValueChange={(v: Category) => setCategory(v)} disabled={pending}>
       <SelectTrigger className="py-2 px-4 text-lg h-12"><SelectValue /></SelectTrigger>
       <SelectContent>{["Computer","Projector","Lab Equipment","Mobile Device","Battery","Accessory","Other"].map((c) => (<SelectItem key={c} value={c} className="text-lg py-2">{c}</SelectItem>))}</SelectContent>
      </Select>
     </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
     <div className="grid gap-3">
      <Label htmlFor="age" className="text-lg font-semibold">Age (months)</Label>
      <Input id="age" type="number" min={0} value={ageMonths} onChange={(e) => setAgeMonths(Number(e.target.value))} disabled={pending} className="py-2 px-4 text-lg"/>
     </div>
     
     <div className="grid gap-3">
      <Label className="text-lg font-semibold">Condition</Label>
      <Select value={condition} onValueChange={(v: any) => setCondition(v)} disabled={pending}>
       <SelectTrigger className="py-2 px-4 text-lg h-12"><SelectValue /></SelectTrigger>
       <SelectContent>{["Good","Fair","Poor","Dead"].map((c) => (<SelectItem key={c} value={c} className="text-lg py-2">{c}</SelectItem>))}</SelectContent>
      </Select>
     </div>
    </div>
    
    <div className="grid gap-3">
     <Label htmlFor="notes" className="text-lg font-semibold">Notes</Label>
     <Textarea id="notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Model number, serial number, etc." disabled={pending} className="py-2 px-4 text-lg"/>
    </div>
        
        <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
                <Label htmlFor="bidding-switch" className="text-lg font-semibold flex items-center gap-2">
                    <Gavel className="w-5 h-5" />
                    List for Bidding
                </Label>
                <Switch 
                    id="bidding-switch" 
                    checked={isBiddable} 
                    onCheckedChange={setIsBiddable}
                    disabled={pending}
                />
            </div>
            {isBiddable && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in-0 duration-300">
                    <div className="grid gap-3">
                        <Label htmlFor="starting-bid">Starting Bid (₹)</Label>
                        <Input 
                            id="starting-bid" 
                            type="number" 
                            min="0"
                            value={startingBid}
                            onChange={(e) => setStartingBid(Number(e.target.value))}
                            placeholder="e.g. 100"
                            className="py-2 px-4"
                        />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="bid-end-date">Bid End Date</Label>
                        <Input 
                            id="bid-end-date" 
                            type="date"
                            value={biddingEndDate}
                            onChange={(e) => setBiddingEndDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="py-2 px-4"
                        />
                    </div>
                </div>
            )}
        </div>
    
    <Button 
     className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-purple-600 text-white border-0 py-3 text-lg font-semibold mt-4" 
     onClick={submit} 
     disabled={pending || aiLoading}
    >
     <PlusCircle className="w-5 h-5 mr-2" />
     {pending ? 'Adding Item...' : 'Add Item'}
    </Button>
   </CardContent>
  </Card>
 )
}
