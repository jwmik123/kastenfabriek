import Image from "next/image";

interface SloganSectionProps {
  text: string;
  backgroundImage: string;
  align?: "left" | "center";
  textColor?: string;
  buttonText?: string;
  buttonLink?: string;
  onButtonClick?: () => void;
}

export default function SloganSection({
  text,
  backgroundImage,
  align = "center",
  textColor = "text-white",
  buttonText,
  buttonLink,
  onButtonClick,
}: SloganSectionProps) {
  return (
    <div className="w-full px-6 md:px-12 pb-12 md:pb-20 md:pt-12">
      <section className="rounded-xl relative overflow-hidden min-h-80 h-80 lg:h-144">
        <Image
          src={backgroundImage}
          alt="Slogan background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/10" />

        <div className={`relative z-10 h-full flex items-center px-6 md:px-12 ${
          align === "center" ? "justify-center text-center" : "justify-start text-left"
        }`}>
          <div className={align === "center" ? "text-center" : "text-left"}>
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold ${textColor} max-w-4xl`}>
              {text}
            </h2>
            {buttonText && (
              <div className="mt-6">
                {buttonLink ? (
                  <a
                    href={buttonLink}
                    className="inline-block bg-primary text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-primary-dark transition-colors"
                  >
                    {buttonText}
                  </a>
                ) : (
                  <button
                    onClick={onButtonClick}
                    className="bg-primary cursor-pointer text-white px-8 py-4 md:mt-12 rounded-xl text-lg font-semibold hover:bg-primary-dark transition-colors"
                  >
                    {buttonText}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

      </section>
    </div>
  );
}
