import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TestMinimal() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="p-4">
      <h1>Test Page</h1>
      <Button onClick={() => setCount(count + 1)}>
        Count: {count}
      </Button>
    </div>
  );
}