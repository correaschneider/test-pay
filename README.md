# Sistema de Pagamentos

Sistema para gerenciamento de clientes e pagamentos integrado com a API Asaas.

## Pré-requisitos

- Node.js 18+
- MySQL 8+
- NPM ou Yarn

## Estrutura do Projeto

```
projects/
├── backend/ # API em NestJS
└── frontend/ # Interface em HTML/jQuery/Bootstrap
```

## Instalação

1. Clone o repositório:

```bash
git clone git@github.com:correaschneider/test-pay.git
```

## Configuração

Copie o arquivo `.env.example` para `.env` e configure as variáveis de ambiente.

```bash
cp .env.example .env
```

Altere as variáveis de ambiente para o seu ambiente.

## Inicialização

1. Inicie o projeto com Docker Compose:

```bash
docker-compose up -d
```

2. Acesse a interface web no navegador:

```bash
http://localhost:${FRONTEND_PORT}
```

## Funcionalidades

- Cadastro e listagem de clientes
- Geração de pagamentos via:
  - Boleto
  - PIX
  - Cartão de Crédito
- Webhook para atualização de status dos pagamentos
- Visualização de detalhes do cliente e seus pagamentos

## Tecnologias Utilizadas

- Backend:

  - NestJS
  - Prisma ORM
  - MySQL
  - TypeScript

- Frontend:
  - HTML
  - Bootstrap 5
  - jQuery
  - JavaScript

## Problema conhecido

O pagamento por cartão de crédito não está funcionando. Realizei o teste diretamente no Asaas e obtive o mesmo erro.

<img src="erro_cpf.gif" alt="Erro ao gerar pagamento por cartão de crédito" />
