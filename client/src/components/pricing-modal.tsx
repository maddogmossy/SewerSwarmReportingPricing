import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const reportSizes = [
  { range: "1-10 sections", price: 15 },
  { range: "1-25 sections", price: 22 },
  { range: "1-50 sections", price: 30 },
  { range: "1-75 sections", price: 36 },
  { range: "1-100 sections", price: 40 },
  { range: "Over 100 sections", price: 45 },
];

export default function PricingModal({ open, onOpenChange }: PricingModalProps) {
  const handleSelectSize = (range: string, price: number) => {
    // TODO: Navigate to checkout with selected size
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Select Report Size
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          {reportSizes.map((size, index) => (
            <Card 
              key={index}
              className="cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              onClick={() => handleSelectSize(size.range, size.price)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{size.range}</span>
                  <span className="text-primary font-semibold">£{size.price}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
