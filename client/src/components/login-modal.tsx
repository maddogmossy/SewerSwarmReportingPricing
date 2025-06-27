import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToRegister: () => void;
}

export default function LoginModal({ open, onOpenChange, onSwitchToRegister }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to Replit Auth
    window.location.href = "/api/login";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</div>
            <p className="text-slate-600 font-normal">Sign in to your account</p>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="mt-2"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="mt-2"
              required
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm text-slate-600">
                Remember me
              </Label>
            </div>
            <Button variant="link" className="text-sm text-primary p-0">
              Forgot password?
            </Button>
          </div>
          
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
        
        <div className="text-center py-4">
          <p className="text-slate-600">
            Don't have an account?{" "}
            <Button 
              variant="link" 
              onClick={onSwitchToRegister}
              className="text-primary font-semibold p-0"
            >
              Sign up
            </Button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
