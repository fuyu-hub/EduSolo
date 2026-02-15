import { useEffect, useRef } from "react";
import { Helmet } from 'react-helmet-async';
import CarothersAnalise from "@/components/acrescimo-tensoes/CarothersAnalise";
import { useNavigate } from "react-router-dom";


export default function CarothersPage() {
  const navigate = useNavigate();

  const loadExampleRef = useRef<(() => void) | null>(null);



  const handleVoltar = () => {
    navigate('/acrescimo-tensoes');
  };



  return (
    <>
      <Helmet>
        <title>Acréscimo de Tensões - Carothers | EduSolos</title>
        <meta name="description" content="Calcule o acréscimo de tensões no solo para carregamento em faixa (fundações corridas) usando a teoria de Carothers." />
      </Helmet>
      <CarothersAnalise onVoltar={handleVoltar} onLoadExampleRef={loadExampleRef} />
    </>
  );
}
