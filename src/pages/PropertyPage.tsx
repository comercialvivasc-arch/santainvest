import React, { useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Property, BrandSettings } from '../types';
import { Helmet } from 'react-helmet-async';
import PropertyDetailsContent from '../components/PropertyDetailsContent';

export default function PropertyPage({ properties, settings }: { properties: Property[], settings: BrandSettings }) {
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
    <>
      <Helmet>
        <title>{property.seoTitle || property.name}</title>
        <meta name="description" content={property.seoDescription || property.detailedDescription} />
        <link rel="canonical" href={`https://www.meuprimeiroimovelsc.com.br/imovel/${property.slug}`} />
      </Helmet>

      <PropertyDetailsContent property={property} allProperties={properties} settings={settings} onClose={() => navigate('/')} />
    </>
  );
}
