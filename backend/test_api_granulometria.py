#!/usr/bin/env python3
"""
Script de teste manual para o endpoint de granulometria.
Execute o servidor FastAPI antes de rodar este script.

Uso: python test_api_granulometria.py
"""

import requests
import json


def test_areia_bem_graduada():
    """Testa análise de areia bem graduada."""
    print("\n=== Teste 1: Areia Bem Graduada ===")
    
    payload = {
        "massa_total": 1000.0,
        "peneiras": [
            {"abertura": 4.76, "massa_retida": 50.0},
            {"abertura": 2.0, "massa_retida": 100.0},
            {"abertura": 1.0, "massa_retida": 150.0},
            {"abertura": 0.5, "massa_retida": 200.0},
            {"abertura": 0.25, "massa_retida": 250.0},
            {"abertura": 0.15, "massa_retida": 200.0},
            {"abertura": 0.075, "massa_retida": 30.0}
        ]
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/analisar/granulometria",
            json=payload
        )
        response.raise_for_status()
        
        result = response.json()
        print(f"✓ Status: {response.status_code}")
        print(f"  Classificação: {result.get('classificacao_uscs')}")
        print(f"  Descrição: {result.get('descricao_uscs')}")
        print(f"  % Pedregulho: {result.get('percentagem_pedregulho'):.1f}%")
        print(f"  % Areia: {result.get('percentagem_areia'):.1f}%")
        print(f"  % Finos: {result.get('percentagem_finos'):.1f}%")
        print(f"  D10: {result.get('d10'):.4f} mm")
        print(f"  D30: {result.get('d30'):.4f} mm")
        print(f"  D60: {result.get('d60'):.4f} mm")
        print(f"  Cu: {result.get('coef_uniformidade'):.2f}")
        print(f"  Cc: {result.get('coef_curvatura'):.2f}")
        
    except requests.exceptions.ConnectionError:
        print("✗ Erro: Não foi possível conectar ao servidor.")
        print("  Certifique-se de que o servidor está rodando em http://localhost:8000")
    except Exception as e:
        print(f"✗ Erro: {e}")


def test_solo_fino_argiloso():
    """Testa análise de solo fino argiloso com limites de Atterberg."""
    print("\n=== Teste 2: Solo Fino Argiloso ===")
    
    payload = {
        "massa_total": 1000.0,
        "peneiras": [
            {"abertura": 4.76, "massa_retida": 0.0},
            {"abertura": 2.0, "massa_retida": 50.0},
            {"abertura": 0.5, "massa_retida": 100.0},
            {"abertura": 0.075, "massa_retida": 250.0}
        ],
        "ll": 45.0,
        "lp": 25.0
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/analisar/granulometria",
            json=payload
        )
        response.raise_for_status()
        
        result = response.json()
        print(f"✓ Status: {response.status_code}")
        print(f"  Classificação: {result.get('classificacao_uscs')}")
        print(f"  Descrição: {result.get('descricao_uscs')}")
        print(f"  % Finos: {result.get('percentagem_finos'):.1f}%")
        
        # IP calculado
        ll = 45.0
        lp = 25.0
        ip = ll - lp
        print(f"  LL: {ll:.1f}%")
        print(f"  LP: {lp:.1f}%")
        print(f"  IP: {ip:.1f}%")
        
    except Exception as e:
        print(f"✗ Erro: {e}")


def test_pedregulho():
    """Testa análise de material com pedregulho."""
    print("\n=== Teste 3: Pedregulho ===")
    
    payload = {
        "massa_total": 1000.0,
        "peneiras": [
            {"abertura": 25.4, "massa_retida": 200.0},
            {"abertura": 19.1, "massa_retida": 250.0},
            {"abertura": 9.52, "massa_retida": 200.0},
            {"abertura": 4.76, "massa_retida": 150.0},
            {"abertura": 2.0, "massa_retida": 100.0},
            {"abertura": 0.5, "massa_retida": 80.0},
            {"abertura": 0.075, "massa_retida": 20.0}
        ]
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/analisar/granulometria",
            json=payload
        )
        response.raise_for_status()
        
        result = response.json()
        print(f"✓ Status: {response.status_code}")
        print(f"  Classificação: {result.get('classificacao_uscs')}")
        print(f"  Descrição: {result.get('descricao_uscs')}")
        print(f"  % Pedregulho: {result.get('percentagem_pedregulho'):.1f}%")
        print(f"  % Areia: {result.get('percentagem_areia'):.1f}%")
        print(f"  % Finos: {result.get('percentagem_finos'):.1f}%")
        
    except Exception as e:
        print(f"✗ Erro: {e}")


def test_erro_massa_excedida():
    """Testa tratamento de erro quando massa retida excede total."""
    print("\n=== Teste 4: Erro - Massa Excedida ===")
    
    payload = {
        "massa_total": 1000.0,
        "peneiras": [
            {"abertura": 2.0, "massa_retida": 600.0},
            {"abertura": 1.0, "massa_retida": 600.0}
        ]
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/analisar/granulometria",
            json=payload
        )
        
        if response.status_code == 400:
            print(f"✓ Status: {response.status_code} (esperado)")
            error_detail = response.json().get('detail', 'Sem detalhes')
            print(f"  Mensagem de erro: {error_detail}")
        else:
            print(f"✗ Status inesperado: {response.status_code}")
            
    except Exception as e:
        print(f"✗ Erro: {e}")


def main():
    """Executa todos os testes."""
    print("=" * 60)
    print("TESTES DA API DE GRANULOMETRIA")
    print("=" * 60)
    print("\nCertifique-se de que o servidor FastAPI está rodando em:")
    print("http://localhost:8000")
    print("\nComando: cd backend && uvicorn app.main:app --reload")
    
    test_areia_bem_graduada()
    test_solo_fino_argiloso()
    test_pedregulho()
    test_erro_massa_excedida()
    
    print("\n" + "=" * 60)
    print("TESTES CONCLUÍDOS")
    print("=" * 60)


if __name__ == "__main__":
    main()

