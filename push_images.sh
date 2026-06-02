#!/bin/bash

# Define cores para o output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Iniciando Build e Push para o Docker Hub ===${NC}"

# 1. Login no Docker Hub
echo -e "${BLUE}1. Fazendo login no Docker Hub...${NC}"
docker login

# 2. Build e Push do Backend
echo -e "${BLUE}2. Construindo imagem do Backend (jpsd/trabalho:backend)...${NC}"
docker build -t jpsd/trabalho:backend ./backend

echo -e "${BLUE}3. Enviando imagem do Backend para o Docker Hub...${NC}"
docker push jpsd/trabalho:backend

# 3. Build e Push do Frontend
echo -e "${BLUE}4. Construindo imagem do Frontend (jpsd/trabalho:frontend)...${NC}"
docker build -t jpsd/trabalho:frontend ./frontend

echo -e "${BLUE}5. Enviando imagem do Frontend para o Docker Hub...${NC}"
docker push jpsd/trabalho:frontend

echo -e "${GREEN}=== Processo Concluído com Sucesso! 🚀 ===${NC}"
echo -e "As seguintes imagens estão disponíveis no repositório único 'jpsd/trabalho':"
echo -e "  - ${GREEN}jpsd/trabalho:backend${NC}"
echo -e "  - ${GREEN}jpsd/trabalho:frontend${NC}"
