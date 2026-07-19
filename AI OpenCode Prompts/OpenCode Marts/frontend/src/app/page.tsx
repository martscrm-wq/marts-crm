import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-5xl font-bold text-black">Marts AI Platform</h1>
        <p className="text-xl text-black max-w-lg">
          Enterprise AI-powered business automation platform
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 border border-black rounded-lg hover:bg-gray-100 transition"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
