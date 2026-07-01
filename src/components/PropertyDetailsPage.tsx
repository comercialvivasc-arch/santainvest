import React, { useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Property } from '../types';
import { Helmet } from 'react-helmet-async';

export default function PropertyDetailsPage({ properties }: { properties: Property[] }) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const property = useMemo(() => {
    return properties.find((p) => p.slug === slug) || null;
  }, [properties, slug]);

  if (!property) {
    if (location.pathname.startsWith('/imovel/')) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-zinc-900">
          <h1 className="text-2xl font-bold">Imóvel não encontrado</h1>
          <button onClick={() => navigate('/')} className="mt-4 text-blue-600 underline">Voltar para a Home</button>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="pt-20 pb-10 px-4">
      <Helmet>
        <title>{property.seoTitle || property.name}</title>
        <meta name="description" content={property.seoDescription || property.detailedDescription} />
        <link rel="canonical" href={`https://www.meuprimeiroimovelsc.com.br/imovel/${property.slug}`} />
        <meta property="og:title" content={property.seoTitle || property.name} />
        <meta property="og:description" content={property.seoDescription || property.detailedDescription} />
        <meta property="og:image" content={property.mainImage || (property.images && property.images[0]) || ''} />
        <meta property="og:url" content={`https://www.meuprimeiroimovelsc.com.br/imovel/${property.slug}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={property.seoTitle || property.name} />
        <meta name="twitter:description" content={property.seoDescription || property.detailedDescription} />
        <meta name="twitter:image" content={property.mainImage || (property.images && property.images[0]) || ''} />
        <script type="application/ld+json">
          {property.schemaMarkup}
        </script>
      </Helmet>

      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm">
        <h1 className="text-3xl font-bold text-zinc-900">{property.name}</h1>
        <p className="text-zinc-600 mt-2">{property.neighborhood} - {property.region}</p>
        
        {property.images && property.images.length > 0 && (
          <img src={property.images[0]} alt={property.name} className="w-full h-auto mt-6 rounded-lg" />
        )}
        
        <div className="mt-6 prose prose-zinc max-w-none">
          <p>{property.detailedDescription}</p>
        </div>
        
        <button onClick={() => navigate('/')} className="mt-8 text-sm font-semibold text-primary underline">
          Voltar à lista de imóveis
        </button>
      </div>
    </div>
  );
}
