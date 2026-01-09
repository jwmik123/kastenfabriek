import Image from "next/image";

export default function Home() {
  return (
    <div className="relative w-full h-screen -mt-6 font-poppins">
      <Image src="/ladingplaceholder.jpg" alt="Home" fill className="object-cover" />

      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 flex flex-col justify-center h-full text-white px-4 max-w-7xl mx-auto">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-left">
          Kasten-fabriek.nl
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl text-left">
        Op maat gemaakte kledingkasten.
        Volledig afgestemd op jouw wensen.
        </p>
        <div>
          <button className="bg-primary text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-primary/90 transition-colors">
            Ontwerp je maatkast
          </button>
        </div>
      </div>
    </div>
);
}
