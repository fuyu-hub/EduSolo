import BoussinesqAnalise from "@/components/acrescimo-tensoes/BoussinesqAnalise";
import { useNavigate } from "react-router-dom";

export default function BoussinesqPage() {
  const navigate = useNavigate();
  
  const handleVoltar = () => {
    navigate('/acrescimo-tensoes');
  };
  
  return <BoussinesqAnalise onVoltar={handleVoltar} />;
}

