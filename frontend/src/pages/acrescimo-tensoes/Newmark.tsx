import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NewmarkAnalise from "@/components/acrescimo-tensoes/NewmarkAnalise";


export default function NewmarkPage() {
  const navigate = useNavigate();

  const loadExampleRef = useRef<(() => void) | null>(null);



  const handleVoltar = () => {
    navigate('/acrescimo-tensoes');
  };



  return <NewmarkAnalise onVoltar={handleVoltar} onLoadExampleRef={loadExampleRef} />;
}

