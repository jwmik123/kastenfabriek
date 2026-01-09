import Image from 'next/image'
import Link from 'next/link'

const Navigation = () => {
  return (
    <nav className="w-full py-6 fixed top-0 left-0 right-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white backdrop-blur-sm text-black font-poppins rounded-xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            {/* <Image
              src="/logo.svg"
              alt="Kastenfabriek Logo"
              width={80}
              height={40}
              priority
            /> */}
            <h1 className="text-xl flex items-center gap-2">
                <span>Kasten Fabriek</span>
            </h1>
          </Link>

          <div className="flex items-center gap-8">
            <Link href="/about" className="hover:text-black transition-colors">
              Onze kasten
            </Link>
            <Link href="/projects" className="hover:text-black transition-colors">
              Materialen
            </Link>
            <Link href="/contact" className=" hover:text-black transition-colors">
              Blog
            </Link>
          </div>
          <button className="bg-primary text-white px-4 py-2 rounded-xl">
            Ontwerp je maatkast
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navigation