import { useEffect, useRef } from "react";
import { Helmet } from 'react-helmet-async';
import LoveAnalise from "@/components/acrescimo-tensoes/LoveAnalise";
import { useNavigate } from "react-router-dom";


export default function LovePage() {
  const navigate = useNavigate();

  const loadExampleRef = useRef<(() => void) | null>(null);



  const handleVoltar = () => {
    navigate('/acrescimo-tensoes');
  };



  return (
    <>
      <Helmet>
        <title>Acréscimo de Tensões - Love | EduSolos</title>
        <meta name="description" content="Calcule o acréscimo de tensões no solo para área circular carregada usando a teoria de Love. Resultados detalhados para o eixo e fora do eixo." />
      </Helmet>
      <LoveAnalise onVoltar={handleVoltar} onLoadExampleRef={loadExampleRef} />
    </>
  );
}

