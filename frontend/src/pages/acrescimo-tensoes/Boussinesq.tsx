import { useEffect, useRef } from "react";
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
      <BoussinesqPageDesktop />
    </MobileModuleWrapper>
  );
}

