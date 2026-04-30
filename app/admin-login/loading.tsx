import { Skeleton } from "@/components/ui/skeleton"

export default function AdminLoginLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 lg:flex-row">
      <div className="hidden w-full max-w-md space-y-4 lg:block lg:w-1/2 lg:pr-8">
        <Skeleton className="h-10 w-3/4 bg-gray-200" />
        <Skeleton className="h-6 w-full bg-gray-200" />
        <Skeleton className="h-6 w-5/6 bg-gray-200" />
        <Skeleton className="h-[400px] w-full rounded-lg bg-gray-200" />
      </div>
      <div className="w-full max-w-md space-y-6 lg:w-1/2 lg:pl-8">
        <Skeleton className="mx-auto h-20 w-20 rounded-full bg-gray-200 lg:hidden" />
        <Skeleton className="mx-auto h-8 w-1/2 bg-gray-200" />
        <Skeleton className="mx-auto h-6 w-2/3 bg-gray-200" />
        <Skeleton className="h-10 w-full bg-gray-200" />
        <Skeleton className="h-10 w-full bg-gray-200" />
        <Skeleton className="h-10 w-full bg-gray-200" />
      </div>
    </div>
  )
}
