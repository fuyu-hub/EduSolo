import { useEffect, useRef } from "react";
import LoveAnalise from "@/components/acrescimo-tensoes/LoveAnalise";
import { useNavigate } from "react-router-dom";


export default function LovePage() {
  const navigate = useNavigate();

  const loadExampleRef = useRef<(() => void) | null>(null);



  const handleVoltar = () => {
    navigate('/acrescimo-tensoes');
  };



  return <LoveAnalise onVoltar={handleVoltar} onLoadExampleRef={loadExampleRef} />;
}

