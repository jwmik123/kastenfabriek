import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <Link href="/" className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Kastenfabriek</h1>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
