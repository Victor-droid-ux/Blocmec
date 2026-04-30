"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Input } from "@/components/ui/input";
import { RootState } from "@/store/store";

export function AdminHeader() {
  const user = useSelector((state: RootState) => state.user.current);
  return (
    <header className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4'>
      <div className='flex items-center justify-between'>
        {/* Left side - Search */}
        <div className='flex items-center space-x-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
            <Input placeholder='Search admin panel...' className='pl-10 w-64' />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className='flex items-center space-x-4'>
          {/* Notifications */}
          <Button variant='ghost' size='icon' className='relative'>
            <Bell className='h-5 w-5' />
            <span className='absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full'></span>
          </Button>

          {/* Theme Toggle */}
          <ModeToggle />

          {/* Admin Profile */}
          <div className='flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700'>
            <div className='w-8 h-8 bg-red-600 rounded-full flex items-center justify-center'>
              <User className='h-4 w-4 text-white' />
            </div>
            <div className='hidden md:block'>
              <p className='text-sm font-medium text-gray-900 dark:text-white'>Admin</p>
              <p className='text-xs text-gray-500 dark:text-gray-400'>{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
