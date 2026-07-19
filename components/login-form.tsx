"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from "@/lib/validation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/config/routes";

type LoginFormProps = {
  defaultTab?: "signin" | "signup";
  showModeTabs?: boolean;
  postSignUpRedirect?: string;
};

export function LoginForm({
  defaultTab = "signin",
  showModeTabs = true,
  postSignUpRedirect,
}: LoginFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { signIn, signUp, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(defaultTab);

  const signInForm = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = signInForm;

  const {
    register: registerSignUp,
    handleSubmit: handleSignUpSubmit,
    formState: { isSubmitting: isSigningUp },
  } = signUpForm;

  const [showPassword, setShowPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] =
    useState(false);

  const onSubmit = async (vals: SignInInput) => {
    try {
      const result = await signIn(vals.email, vals.password);
      toast({
        title: "Login Successful! 🎉",
        description: `Welcome back ${result.name}!`,
        duration: 2000,
      });
      router.push(ROUTES.DASHBOARD.ROOT);
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err?.error || "Unable to sign in.",
        variant: "destructive",
      });
    }
  };

  const onSignUp = async (vals: SignUpInput) => {
    try {
      const result = await signUp(vals.name, vals.email, vals.password, {
        companyName: vals.companyName || undefined,
        next: postSignUpRedirect,
      });

      if (result.signedIn) {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("pendingVerificationEmail");
        }
        toast({
          title: "Account created",
          description: "Welcome to Blockmec. Your workspace is ready.",
        });
        router.push(postSignUpRedirect ?? ROUTES.DASHBOARD.ROOT);
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "pendingVerificationEmail",
          vals.email.trim().toLowerCase(),
        );
      }

      setValue("email", vals.email);
      setActiveTab("signin");
      toast({
        title: "Account created",
        description:
          result.message ||
          "Check your email for a verification link, then sign in.",
      });
    } catch (err: any) {
      toast({
        title: "Sign-up failed",
        description: err?.message || "Unable to create account.",
        variant: "destructive",
      });
    }
  };

  const togglePasswordVisibility = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword(!showPassword);
  };

  // useEffect(() => {
  //   if (user) {
  //     router.replace(ROUTES.DASHBOARD.ROOT);
  //   }
  // }, [user, router]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Blockmec Access</CardTitle>
        <CardDescription>
          Sign in to your workspace or create a new company account.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "signin" | "signup")}
          className="w-full"
        >
          {showModeTabs ? (
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Create Account</TabsTrigger>
            </TabsList>
          ) : null}

          <TabsContent value="signin" className="mt-4">
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@company.com"
                  {...register("email")}
                  required
                  autoComplete="email"
                  disabled={isSubmitting || loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password")}
                    required
                    autoComplete="current-password"
                    disabled={isSubmitting || loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={togglePasswordVisibility}
                    tabIndex={-1}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <form
              onSubmit={handleSignUpSubmit(onSignUp)}
              noValidate
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Jane Doe"
                  {...registerSignUp("name")}
                  required
                  autoComplete="name"
                  disabled={isSigningUp || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-company">Company Name (Optional)</Label>
                <Input
                  id="signup-company"
                  type="text"
                  placeholder="Acme Foods Ltd"
                  {...registerSignUp("companyName")}
                  autoComplete="organization"
                  disabled={isSigningUp || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Work Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@company.com"
                  {...registerSignUp("email")}
                  required
                  autoComplete="email"
                  disabled={isSigningUp || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showSignUpPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    {...registerSignUp("password")}
                    required
                    autoComplete="new-password"
                    disabled={isSigningUp || loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowSignUpPassword((prev) => !prev);
                    }}
                    tabIndex={-1}
                    disabled={loading}
                  >
                    {showSignUpPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle password visibility</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="signup-confirm-password"
                    type={showSignUpConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    {...registerSignUp("confirmPassword")}
                    required
                    autoComplete="new-password"
                    disabled={isSigningUp || loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowSignUpConfirmPassword((prev) => !prev);
                    }}
                    tabIndex={-1}
                    disabled={loading}
                  >
                    {showSignUpConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      Toggle confirm password visibility
                    </span>
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSigningUp || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Company Account"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter>
        <p className="text-xs text-muted-foreground text-center w-full">
          New teams start on the free plan and can upgrade in the Developer
          dashboard.
        </p>
      </CardFooter>
    </Card>
  );
}
