import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PlaceholderCardProps {
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  className?: string;
}

export function PlaceholderCard({ 
  id = "placeholder", 
  name = "Placeholder Card",
  title,
  description = "This is a placeholder card component for template development",
  className = ""
}: PlaceholderCardProps) {
  return (
    <Card className={`bg-white border-2 border-gray-200 ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600" />
          {title || name}
        </CardTitle>
        {description && (
          <p className="text-sm text-gray-600">
            {description}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-700 font-medium">Sample Input 1</label>
            <Input
              type="text"
              placeholder="Enter value"
              className="border-gray-300"
            />
          </div>
          <div>
            <label className="text-xs text-gray-700 font-medium">Sample Input 2</label>
            <Input
              type="text"
              placeholder="Enter value"
              className="border-gray-300"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Configure
          </Button>
          <Button variant="outline" size="sm">
            Reset
          </Button>
        </div>
        
        <div className="p-3 bg-gray-50 rounded border text-sm text-gray-600">
          <strong>Placeholder ID:</strong> {id}
          <br />
          <strong>Component:</strong> {name}
          <br />
          <em>This card can be customized for specific template requirements.</em>
        </div>
      </CardContent>
    </Card>
  );
}