import { useEffect, useRef } from "react";
import { Helmet } from 'react-helmet-async';
import BoussinesqAnalise from "@/components/acrescimo-tensoes/BoussinesqAnalise";
import { useNavigate } from "react-router-dom";

import { MobileModuleWrapper } from "@/components/mobile";
import BoussinesqMobile from "../mobile/BoussinesqMobile";


function BoussinesqPageDesktop() {
  const navigate = useNavigate();

  const loadExampleRef = useRef<(() => void) | null>(null);



  const handleVoltar = () => {
    navigate('/acrescimo-tensoes');
  };



  return <BoussinesqAnalise onVoltar={handleVoltar} onLoadExampleRef={loadExampleRef} />;
}

// Wrapper principal que escolhe versão mobile ou desktop
export default function BoussinesqPage() {
  return (
    <MobileModuleWrapper mobileVersion={<BoussinesqMobile />}>
      <Helmet>
        <title>Acréscimo de Tensões - Boussinesq | EduSolos</title>
        <meta name="description" content="Calcule o acréscimo de tensões no solo para carga pontual usando a teoria de Boussinesq. Visualização interativa 360° e resultados precisos." />
      </Helmet>
      <BoussinesqPageDesktop />
    </MobileModuleWrapper>
  );
}

