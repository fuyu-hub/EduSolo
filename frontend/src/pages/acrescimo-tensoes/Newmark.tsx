import { useEffect, useRef } from "react";
import { Helmet } from 'react-helmet-async';
import { useNavigate } from "react-router-dom";
import NewmarkAnalise from "@/components/acrescimo-tensoes/NewmarkAnalise";


export default function NewmarkPage() {
  const navigate = useNavigate();

  const loadExampleRef = useRef<(() => void) | null>(null);



  const handleVoltar = () => {
    navigate('/acrescimo-tensoes');
  };



  return (
    <>
      <Helmet>
        <title>Acréscimo de Tensões - Newmark | EduSolos</title>
        <meta name="description" content="Calcule o acréscimo de tensões no solo para áreas retangulares carregadas usando a solução de Newmark (Steinbrenner). Ideal para projetos de sapatas." />
      </Helmet>
      <NewmarkAnalise onVoltar={handleVoltar} onLoadExampleRef={loadExampleRef} />
    </>
  );
}

