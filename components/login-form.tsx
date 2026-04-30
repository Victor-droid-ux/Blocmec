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
import { signInSchema, type SignInInput } from "@/lib/validation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/config/routes";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { signIn, loading, error } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const [showPassword, setShowPassword] = useState(false);

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
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader className='text-center'>
        <CardTitle className='text-2xl'>Welcome Back</CardTitle>
        <CardDescription>Sign in to your Blockmec account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              placeholder='user@blockmec.org'
              {...register("email")}
              required
              autoComplete='email'
              disabled={isSubmitting || loading}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='password'>Password</Label>
            <div className='relative'>
              <Input
                id='password'
                type={showPassword ? "text" : "password"}
                placeholder='Enter your password'
                {...register("password")}
                required
                autoComplete='current-password'
                disabled={isSubmitting || loading}
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                onClick={togglePasswordVisibility}
                tabIndex={-1}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
                <span className='sr-only'>
                  {showPassword ? "Hide password" : "Show password"}
                </span>
              </Button>
            </div>
          </div>

          {/* Quick Login Demo Buttons */}
          {/* <div className='space-y-2'>
            <p className='text-xs text-muted-foreground text-center'>Quick Demo Login:</p>
            <div className='grid grid-cols-2 gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() =>
                  quickLogin({ email: "user@blockmec.org", password: "userpass" })
                }
                disabled={loading}
                className='text-xs'
              >
                Demo User
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() =>
                  quickLogin({ email: "admin@blockmec.org", password: "adminpass" })
                }
                disabled={loading}
                className='text-xs'
              >
                Admin User
              </Button>
            </div>
          </div> */}
        </CardContent>
        <CardFooter>
          <Button type='submit' className='mt-6 w-full' disabled={loading}>
            {loading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className='mr-2 h-4 w-4' />
                Sign In
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
