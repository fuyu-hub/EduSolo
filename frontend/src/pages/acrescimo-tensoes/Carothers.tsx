import { useEffect, useRef } from "react";
import CarothersAnalise from "@/components/acrescimo-tensoes/CarothersAnalise";
import { useNavigate } from "react-router-dom";


export default function CarothersPage() {
  const navigate = useNavigate();

  const loadExampleRef = useRef<(() => void) | null>(null);



  const handleVoltar = () => {
    navigate('/acrescimo-tensoes');
  };



  return <CarothersAnalise onVoltar={handleVoltar} onLoadExampleRef={loadExampleRef} />;
}
