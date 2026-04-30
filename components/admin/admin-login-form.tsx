"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAppDispatch } from "@/store/hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { setUser } from "@/store/user/user.reducer";
import { signInSchema, type SignInInput } from "@/lib/validation";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { ROUTES, getRouteForRole } from "@/config/routes";
import { API_ENDPOINTS } from "@/config/endpoints";

export function AdminLoginForm() {
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.user.current);
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
      const result = await signIn(vals.email, vals.password, {
        endpoint: API_ENDPOINTS.AUTH.ADMIN,
      });
      dispatch(setUser(result));
      toast({
        title: "Administrator Login Successful! 🎉",
        description: `Welcome back${result.name}!`,
        duration: 2000,
      });
      router.push(ROUTES.ADMIN.ROOT);
    } catch (err: any) {
      // error state is already set in the hook; you can optionally show toast
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

  useEffect(() => {
    if (!user) return;

    const role = user.role;

    const dest = getRouteForRole(role);
    router.replace(dest);
  }, [user, router]);

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader className='text-center'>
        <div className='flex justify-center mb-4'>
          <div className='w-16 h-16 rounded-full bg-red-600 flex items-center justify-center'>
            <Shield className='h-8 w-8 text-white' />
          </div>
        </div>
        <CardTitle className='text-2xl'>Admin Access</CardTitle>
        <CardDescription>
          Enter your administrator credentials to access the Blockmec Admin Panel
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='admin-email'>Admin Email</Label>
            <Input
              id='admin-email'
              type='email'
              placeholder='info@blockmec.org'
              {...register("email")}
              required
              autoComplete='email'
              disabled={loading}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='admin-password'>Admin Password</Label>
            <div className='relative'>
              <Input
                id='admin-password'
                type={showPassword ? "text" : "password"}
                placeholder='Enter admin password'
                {...register("password")}
                required
                autoComplete='current-password'
                disabled={loading}
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
          <div className='text-sm text-muted-foreground'>
            <p>⚠️ This is a restricted area for authorized administrators only.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type='submit'
            className='w-full bg-red-600 hover:bg-red-700'
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Authenticating...
              </>
            ) : (
              <>
                <Shield className='mr-2 h-4 w-4' />
                Access Admin Panel
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
