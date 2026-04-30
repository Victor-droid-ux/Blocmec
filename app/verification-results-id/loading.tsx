export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
        <p className="text-lg font-semibold text-gray-700">Verifying ID Card...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we verify the blockchain records</p>
      </div>
    </div>
  )
}
