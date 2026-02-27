interface PageHeroProps {
  title: string;
  subtitle?: string;
  imageUrl: string;
}

export default function PageHero({ title, subtitle, imageUrl }: PageHeroProps) {
  return (
    <div
      className="relative w-full h-[420px] bg-cover bg-center flex items-center"
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
