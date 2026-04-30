"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Edit,
  Upload,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { get, put } from "@/lib/apiClient";
import {
  updateProfileSchema,
  type PublicProfile,
  type UpdateProfileInput,
} from "@/lib/validation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { setUser } from "@/store/user/user.reducer";
import { useAppDispatch } from "@/store/hook";
import { API_ENDPOINTS } from "@/config/endpoints";
import { ROUTES } from "@/config/routes";
import type { User } from "@/types/store/user";

type ProfileState = {
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  phone?: string;
  location?: string;
  bio?: string;
  joinDate?: string;
};

function getRoleLabel(role?: string | null) {
  if (!role) return "User";
  switch (role) {
    case "admin":
      return "Administrator";
    case "developer":
      return "Developer";
    case "user":
    default:
      return "User";
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState<ProfileState>({
    name: "",
    email: "",
    role: "",
    department: "",
    phone: "",
    location: "",
    bio: "",
    joinDate: "",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  });

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const res = await get<{ user: PublicProfile }>(API_ENDPOINTS.USER.PROFILE, {
          timeoutMs: 15000,
        });
        if (!res.ok) {
          if (res.status === 401) {
            router.push(ROUTES.LOGIN);
            return;
          }
          throw new Error(
            typeof res.error === "string" ? res.error : "Failed to fetch profile",
          );
        }
        const user = res.data?.user;
        if (!user) throw new Error("No user returned");

        const p: ProfileState = {
          name: user.name ?? "",
          email: user.email ?? "",
          role: String(user.role ?? ""),
          department: user.department ?? "",
          phone: user.phone ?? "",
          location: user.location ?? "",
          bio: user.bio ?? "",
          joinDate: user.created_at ? new Date(user.created_at).toLocaleDateString() : "",
        };

        if (!mounted) return;
        setProfile(p);

        reset({
          name: user.name ?? "",
          email: user.email ?? "",
          role: getRoleLabel(user.role ?? ""),
          department: user.department ?? "",
          phone: user.phone ?? "",
          location: user.location ?? "",
          bio: user.bio ?? "",
        });

        dispatch(setUser(user as User));
      } catch (err: any) {
        toast({
          title: "Unable to load profile",
          description: err?.message ?? "An error occurred",
          variant: "destructive",
        });
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadProfile();
    return () => {
      mounted = false;
    };
  }, [dispatch, router, toast]);

  const onSubmit = async (vals: UpdateProfileInput) => {
    setIsSaving(true);
    try {
      const payload = {
        name: vals.name,
        phone: vals.phone,
        location: vals.location,
        department: vals.department,
        bio: vals.bio,
      };

      const res = await put<{ user: UpdateProfileInput }>(
        API_ENDPOINTS.USER.PROFILE,
        payload,
        { timeoutMs: 15000 },
      );
      if (!res.ok) {
        const msg =
          typeof res.error === "string"
            ? res.error
            : res.error?.message ?? "Failed to update profile";
        toast({
          title: "Failed to update profile",
          description: String(msg),
          variant: "destructive",
        });
        return;
      }

      const updated = res.data?.user;
      if (!updated) throw new Error("Server returned no user");

      const p: ProfileState = {
        name: updated.name ?? "",
        email: updated.email ?? "",
        role: updated.role ?? "",
        department: updated.department ?? "",
        phone: updated.phone ?? "",
        location: updated.location ?? "",
        bio: updated.bio ?? "",
      };

      setProfile(p);
      setIsEditing(false);
      dispatch(setUser(updated as User));
      toast({ title: "Profile updated", description: "Your profile has been saved." });
    } catch (err: any) {
      toast({
        title: "Failed to update",
        description: err?.message ?? "Unable to save profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleCancelEdit = () => {
    reset({
      name: profile.name ?? "",
      department: profile.department ?? "",
      phone: profile.phone ?? "",
      location: profile.location ?? "",
      bio: profile.bio ?? "",
    });
    setIsEditing(false);
  };

  const fields = [
    { id: "name", label: "Full Name", disabled: false },
    { id: "email", label: "Email Address", type: "email", disabled: true },
    {
      id: "role",
      label: "Role",
      disabled: true,
      getValue: (val: string) => getRoleLabel(val),
    },
    { id: "department", label: "Department", disabled: false },
    { id: "phone", label: "Phone Number", disabled: false },
    { id: "location", label: "Location", disabled: false },
  ];

  const onError = (err: any) => {
    console.log("Validation errors:", err);
  };

  if (isLoading) {
    return (
      <div className='flex h-screen w-full items-center justify-center bg-[#1a1625]'>
        <div className='h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-purple-500'></div>
      </div>
    );
  }

  return (
    <DashboardShell>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className='space-y-6'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-3xl font-bold tracking-tight'>My Profile</h2>
              <p className='text-gray-400 mt-2'>
                View and manage your personal information.
              </p>
            </div>

            {!isEditing ? (
              <Button
                className='bg-purple-600 hover:bg-purple-700'
                onClick={() => setIsEditing(true)}
              >
                <Edit className='mr-2 h-4 w-4' />
                Edit Profile
              </Button>
            ) : (
              <div className='space-x-2'>
                <Button
                  variant='outline'
                  className='border-gray-600 text-gray-300 hover:bg-[#2a2139]'
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button
                  className='bg-purple-600 hover:bg-purple-700'
                  type='submit'
                  disabled={isSaving}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <Card className='bg-[#231c35] border-[#2a2139] text-white md:col-span-1'>
              <CardHeader className='flex flex-col items-center'>
                <div className='relative mb-4'>
                  <Avatar className='h-24 w-24'>
                    <AvatarImage
                      src='/placeholder.svg?height=96&width=96'
                      alt={profile.name}
                    />
                    <AvatarFallback className='bg-purple-800 text-xl'>
                      {(profile.name ?? "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size='icon'
                      className='absolute bottom-0 right-0 h-8 w-8 rounded-full bg-purple-600 hover:bg-purple-700'
                    >
                      <Camera className='h-4 w-4' />
                      <span className='sr-only'>Change avatar</span>
                    </Button>
                  )}
                </div>
                <CardTitle className='text-xl'>{profile.name}</CardTitle>
                <CardDescription className='text-gray-400'>
                  {getRoleLabel(profile.role)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center'>
                    <Mail className='h-4 w-4 mr-2 text-gray-400' />
                    <span className='text-gray-300'>{profile.email}</span>
                  </div>
                  <div className='flex items-center'>
                    <Phone className='h-4 w-4 mr-2 text-gray-400' />
                    <span className='text-gray-300'>{profile.phone}</span>
                  </div>
                  <div className='flex items-center'>
                    <MapPin className='h-4 w-4 mr-2 text-gray-400' />
                    <span className='text-gray-300'>{profile.location}</span>
                  </div>
                  <div className='flex items-center'>
                    <Briefcase className='h-4 w-4 mr-2 text-gray-400' />
                    <span className='text-gray-300'>{profile.department}</span>
                  </div>
                  <div className='flex items-center'>
                    <Calendar className='h-4 w-4 mr-2 text-gray-400' />
                    <span className='text-gray-300'>Joined {profile.joinDate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='bg-[#231c35] border-[#2a2139] text-white md:col-span-2'>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription className='text-gray-400'>
                  {isEditing
                    ? "Update your personal information below."
                    : "Your personal information and biography."}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                {isEditing ? (
                  <div className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='name'>Full Name</Label>
                        <Input
                          id='name'
                          {...register("name")}
                          className='bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500'
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='email'>Email Address</Label>
                        <Input
                          id='email'
                          {...register("email")}
                          readOnly
                          className='bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500'
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='role'>Role</Label>
                        <Input
                          id='role'
                          {...register("role")}
                          readOnly
                          className='bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500'
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='department'>Department</Label>
                        <Input
                          id='department'
                          {...register("department")}
                          className='bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500'
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='phone'>Phone Number</Label>
                        <Input
                          id='phone'
                          {...register("phone")}
                          className='bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500'
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='location'>Location</Label>
                        <Input
                          id='location'
                          {...register("location")}
                          className='bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500'
                        />
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='bio'>Bio</Label>
                      <Textarea
                        id='bio'
                        {...register("bio")}
                        className='bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500'
                        rows={4}
                      />
                    </div>
                  </div>
                ) : (
                  <div className='space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-y-4'>
                      <div>
                        <h3 className='text-sm font-medium text-gray-400'>Full Name</h3>
                        <p>{profile.name}</p>
                      </div>

                      <div>
                        <h3 className='text-sm font-medium text-gray-400'>
                          Email Address
                        </h3>
                        <p>{profile.email}</p>
                      </div>

                      <div>
                        <h3 className='text-sm font-medium text-gray-400'>Role</h3>
                        <p>{getRoleLabel(profile.role)}</p>
                      </div>

                      <div>
                        <h3 className='text-sm font-medium text-gray-400'>Department</h3>
                        <p>{profile.department}</p>
                      </div>

                      <div>
                        <h3 className='text-sm font-medium text-gray-400'>
                          Phone Number
                        </h3>
                        <p>{profile.phone}</p>
                      </div>

                      <div>
                        <h3 className='text-sm font-medium text-gray-400'>Location</h3>
                        <p>{profile.location}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className='text-sm font-medium text-gray-400 mb-2'>Bio</h3>
                      <p className='text-gray-300'>{profile.bio}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className='bg-[#231c35] border-[#2a2139] text-white md:col-span-3'>
              <CardHeader>
                <CardTitle>Documents & Files</CardTitle>
                <CardDescription className='text-gray-400'>
                  Manage your uploaded documents and files.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex flex-col items-center justify-center py-8 border-2 border-dashed border-[#2a2139] rounded-md'>
                  <Upload className='h-10 w-10 text-gray-400 mb-4' />
                  <h3 className='text-lg font-medium mb-2'>Upload Files</h3>
                  <p className='text-gray-400 text-center max-w-md mb-4'>
                    Drag and drop files here, or click to browse your computer.
                  </p>
                  <Button className='bg-purple-600 hover:bg-purple-700'>
                    Browse Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </DashboardShell>
  );
}
