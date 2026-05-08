import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface OptionItem {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  image?: string;
  comingSoon?: boolean;
  href?: string;
}

interface ProductOptionsSectionProps {
  title?: string;
  subtitle?: string;
  mainOptions: OptionItem[];
  additionalOptions?: OptionItem[];
}

const ProductOptionsSection: React.FC<ProductOptionsSectionProps> = ({
  title = "Waar ben je naar op zoek?",
  subtitle = "Kies het type kast dat perfect bij jouw ruimte en behoeften past",
  mainOptions,
  additionalOptions = [],
}) => {
  const renderOption = (option: OptionItem) => {
    const isComingSoon = option.comingSoon;

    return (
      <div
        key={option.id}
        className={`group ${isComingSoon ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <div className="aspect-square bg-neutral-50 overflow-hidden mb-4 relative">
          {option.image ? (
            <>
              <Image
                src={option.image}
                alt={option.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 md:bg-black/10 md:group-hover:bg-black/40 transition-colors duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-4 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.625,0.05,0,1)]">
                {option.href ? (
                  <Link href={option.href} className="block w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold text-sm text-center">
                    Ontwerp je kast
                  </Link>
                ) : (
                  <button className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold text-sm text-center">
                    Ontwerp je kast
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {isComingSoon ? (
                <>
                  <div className="absolute inset-0 bg-gray-400/10" />
                  <div className="absolute top-4 right-4 bg-gray-700 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Binnenkort
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
              <div className="w-full h-full flex items-center justify-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    isComingSoon ? 'bg-gray-200' : 'bg-primary/10'
                  }`}
                >
                  {option.icon}
                </div>
              </div>
            </>
          )}
          {isComingSoon && option.image && (
            <div className="absolute top-4 right-4 bg-gray-700 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Binnenkort
            </div>
          )}
        </div>
        <h3
          className={`text-xl font-semibold mb-2 ${
            isComingSoon
              ? 'text-gray-700'
              : 'text-gray-900 group-hover:text-primary transition-colors'
          }`}
        >
          {option.title}
        </h3>
        <p
          className={`text-sm leading-relaxed ${
            isComingSoon ? 'text-gray-500' : 'text-gray-600'
          }`}
        >
          {option.description}
        </p>
      </div>
    );
  };

  return (
    <section className="py-24 px-4 bg-white" data-nav-theme="light">
      <div className="max-w-7xl mx-auto">
        <p className="text-left text-gray-600 text-xl max-w-2xl mb-6">
          {subtitle}
        </p>
        <h2 className="text-4xl md:text-5xl mb-16 font-bold text-left text-gray-900">
          {title}
        </h2>

        {/* Main Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {mainOptions.map(renderOption)}
        </div>

        {/* Additional Options Grid */}
        {additionalOptions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {additionalOptions.map(renderOption)}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductOptionsSection;
