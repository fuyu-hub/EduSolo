import { useEffect, useRef } from "react";
import { Helmet } from 'react-helmet-async';
import BoussinesqAnalise from "@/components/acrescimo-tensoes/BoussinesqAnalise";
import { useNavigate } from "react-router-dom";




function BoussinesqPageDesktop() {
  const navigate = useNavigate();

  const loadExampleRef = useRef<(() => void) | null>(null);



  const handleVoltar = () => {
    navigate('/acrescimo-tensoes');
  };



  return <BoussinesqAnalise onVoltar={handleVoltar} onLoadExampleRef={loadExampleRef} />;
}

// Wrapper principal
export default function BoussinesqPage() {
  return (
    <>
      <Helmet>
        <title>Acréscimo de Tensões - Boussinesq | EduSolos</title>
        <meta name="description" content="Calcule o acréscimo de tensões no solo para carga pontual usando a teoria de Boussinesq. Visualização interativa 360° e resultados precisos." />
      </Helmet>
      <BoussinesqPageDesktop />
    </>
  );
}

