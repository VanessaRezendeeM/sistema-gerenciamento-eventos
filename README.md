# Sistema de Gerenciamento de Eventos

Sistema web desenvolvido para gerenciamento de eventos, inscrições de participantes, controle de vagas e fila de espera.

Projeto desenvolvido como atividade acadêmica de Desenvolvimento Full Stack, aplicando conceitos de Front-end, Back-end, API REST, regras de negócio, persistência de dados e controle de versão.

---

## 📌 Sobre o Projeto

O Sistema de Gerenciamento de Eventos permite que administradores cadastrem e gerenciem eventos, enquanto participantes podem consultar eventos disponíveis, visualizar seus detalhes e realizar inscrições.

O sistema possui controle automático de vagas e fila de espera. Quando um evento está lotado, o participante pode entrar na fila. Quando uma vaga é liberada, o próximo participante da fila pode ser promovido automaticamente.

---

## 🎯 Objetivo

O objetivo do projeto é desenvolver uma aplicação web capaz de centralizar o gerenciamento de eventos e suas inscrições.

A aplicação busca facilitar:

- Cadastro e gerenciamento de eventos;
- Controle de vagas;
- Inscrição de participantes;
- Cancelamento de inscrições;
- Visualização de participantes;
- Controle de eventos lotados;
- Gerenciamento de fila de espera;
- Promoção de participantes da fila;
- Acompanhamento das inscrições através de um painel administrativo.

---

## 👥 Perfis de Usuário

O sistema possui dois perfis principais.

### Administrador

O administrador é responsável pelo gerenciamento dos eventos.

Pode:

- Cadastrar eventos;
- Editar eventos;
- Cancelar eventos;
- Visualizar eventos cadastrados;
- Acompanhar vagas;
- Visualizar participantes;
- Acompanhar inscrições;
- Consultar o painel administrativo.

### Participante

O participante pode:

- Fazer login;
- Visualizar eventos disponíveis;
- Pesquisar eventos;
- Visualizar detalhes dos eventos;
- Realizar inscrições;
- Consultar suas inscrições;
- Cancelar inscrições;
- Entrar na fila de espera quando o evento estiver lotado;
- Acompanhar a situação da inscrição.

---

## ⚙️ Funcionalidades

### 🔐 Login

O sistema possui autenticação para diferenciar administradores e participantes.

Após o login, cada usuário é direcionado para sua área correspondente.

### 📅 Cadastro de Eventos

O administrador pode cadastrar eventos informando:

- Nome;
- Descrição;
- Data;
- Horário;
- Local;
- Quantidade de vagas.

### ✏️ Gerenciamento de Eventos

O administrador pode visualizar e gerenciar os eventos cadastrados.

O sistema apresenta:

- Evento;
- Data;
- Horário;
- Local;
- Vagas;
- Status;
- Ações administrativas.

### 📊 Dashboard Administrativo

O painel administrativo apresenta informações sobre os eventos cadastrados:

- Total de eventos;
- Total de vagas;
- Vagas disponíveis;
- Total de inscrições.

### 🔎 Pesquisa de Eventos

O participante pode pesquisar eventos por informações como nome, local ou tema.

### 📝 Inscrição

O participante pode realizar sua inscrição em um evento.

O sistema verifica automaticamente a disponibilidade de vagas.

Quando existe vaga disponível, a inscrição é confirmada.

### 👥 Controle de Vagas

O sistema controla automaticamente as vagas disponíveis.

Exemplo:

```text
Total de vagas: 30
Inscrições confirmadas: 1
Vagas disponíveis: 29
```

### ⏳ Fila de Espera

Quando um evento está lotado, o participante pode entrar na fila de espera.

A fila respeita a ordem de inscrição dos participantes.

### 🔄 Promoção da Fila

Quando uma vaga é liberada, o sistema verifica a fila de espera e promove o próximo participante.

### 📋 Minhas Inscrições

O participante pode visualizar os eventos nos quais está inscrito e consultar a situação de cada inscrição.

### 👤 Participantes

O administrador pode consultar os participantes de cada evento.

### ❌ Cancelamento

O participante pode cancelar sua inscrição.

Quando uma inscrição confirmada é cancelada, uma vaga é liberada e o sistema verifica se existe alguém aguardando na fila.

---

## 📐 Regras de Negócio

**RN01 - Cadastro de evento**

Somente administradores podem cadastrar eventos.

**RN02 - Quantidade de vagas**

Todo evento deve possuir uma quantidade de vagas válida.

**RN03 - Inscrição**

O participante pode se inscrever em eventos disponíveis.

**RN04 - Inscrição duplicada**

Um participante não pode possuir mais de uma inscrição ativa no mesmo evento.

**RN05 - Controle de vagas**

Uma inscrição confirmada ocupa uma vaga do evento.

**RN06 - Evento lotado**

Quando não existem vagas disponíveis, o participante pode entrar na fila de espera.

**RN07 - Ordem da fila**

A fila de espera segue a ordem de entrada dos participantes.

**RN08 - Liberação de vaga**

Quando uma vaga é liberada, o próximo participante da fila pode ser promovido automaticamente.

**RN09 - Cancelamento**

O participante pode cancelar sua inscrição.

**RN10 - Gerenciamento administrativo**

O administrador pode gerenciar eventos e consultar seus participantes.

---

## 🏗️ Arquitetura

O projeto possui uma arquitetura dividida em Front-end e Back-end.

```text
┌──────────────────────────────┐
│           FRONT-END          │
│                              │
│       Vue.js + Vite          │
│       JavaScript + CSS       │
│                              │
│       Interface do sistema   │
└──────────────┬───────────────┘
               │
               │ HTTP / REST API
               │
┌──────────────▼───────────────┐
│           BACK-END           │
│                              │
│       Node.js + Express      │
│                              │
│       Regras de negócio      │
│       Eventos                │
│       Inscrições             │
│       Fila de espera         │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│         PERSISTÊNCIA         │
│                              │
│          dados.json          │
└──────────────────────────────┘
```

---

## 🛠️ Tecnologias Utilizadas

### Front-end

- Vue.js
- Vite
- JavaScript
- HTML5
- CSS3

### Back-end

- Node.js
- Express
- JavaScript
- CORS

### Persistência

- JSON

### Controle de versão

- Git
- GitHub

---

## 📁 Estrutura do Projeto

```text
sistema-gerenciamento-eventos/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── style.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

---

## 🔌 API REST

O Front-end se comunica com o Back-end através de uma API REST.

### Login

```http
POST /api/login
```

Realiza a autenticação do usuário.

### Eventos

```http
GET /api/eventos
```

Lista os eventos cadastrados.

```http
GET /api/eventos/:id
```

Consulta os detalhes de um evento.

```http
POST /api/eventos
```

Cadastra um novo evento.

```http
PUT /api/eventos/:id
```

Atualiza um evento.

```http
DELETE /api/eventos/:id
```

Remove/cancela um evento.

### Inscrições

```http
POST /api/eventos/:id/inscricoes
```

Realiza uma inscrição.

```http
GET /api/inscricoes/:usuarioId
```

Consulta as inscrições de um participante.

```http
DELETE /api/inscricoes/:id
```

Cancela uma inscrição.

### Participantes

```http
GET /api/eventos/:id/participantes
```

Lista os participantes de um evento.

---

## 💾 Persistência dos Dados

Durante o desenvolvimento foi utilizada persistência local através do arquivo `dados.json`.

O arquivo armazena os eventos, inscrições e identificadores utilizados pelo sistema.

Exemplo:

```json
{
  "eventos": [],
  "inscricoes": [],
  "proximoEventoId": 1,
  "proximaInscricaoId": 1
}
```

A persistência permite que os dados continuem disponíveis mesmo após a reinicialização do servidor.

O arquivo `dados.json` não é versionado no GitHub, pois contém dados locais utilizados durante os testes.

---

## ▶️ Como Executar o Projeto

### Pré-requisitos

É necessário ter instalado:

- Node.js
- npm

### 1. Instalar dependências do Back-end

Na pasta principal do projeto:

```bash
npm install
```

### 2. Iniciar o Back-end

```bash
node server.js
```

O servidor será executado na porta 3000.

```text
http://localhost:3000
```

### 3. Acessar o Front-end

Abra outro terminal e entre na pasta:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Execute:

```bash
npm run dev
```

O Vite apresentará no terminal o endereço para acessar a aplicação.

---

## 🧪 Testes Realizados

Durante o desenvolvimento foram realizados testes das principais funcionalidades.

### Autenticação

- Login de administrador;
- Login de participante;
- Validação do acesso.

### Eventos

- Cadastro;
- Edição;
- Consulta;
- Cancelamento;
- Listagem.

### Inscrições

- Inscrição com vaga disponível;
- Consulta das inscrições;
- Cancelamento;
- Atualização das vagas.

### Fila de Espera

- Evento lotado;
- Entrada na fila;
- Liberação de vaga;
- Promoção automática do participante.

### Persistência

- Cadastro de evento;
- Inscrição de participante;
- Reinicialização do servidor;
- Verificação da permanência dos dados.

---

## 📌 Exemplo de Funcionamento

Um dos eventos utilizados nos testes foi:

```text
Evento: Workshop de JavaScript

Descrição:
Introdução ao desenvolvimento web com JavaScript.

Data:
30/08/2026

Horário:
19:00

Local:
Laboratório de Informática

Vagas:
30
```

Após uma inscrição confirmada:

```text
Total de vagas: 30
Vagas disponíveis: 29
Inscrições: 1
```

Esse cenário foi utilizado para validar o controle de vagas e a atualização do painel administrativo.

---

## 🔄 Fluxo de Inscrição

```text
Participante
      ↓
Visualiza eventos
      ↓
Seleciona um evento
      ↓
Visualiza detalhes
      ↓
Solicita inscrição
      ↓
Sistema verifica vagas
      ↓
   Possui vaga?
    ↙       ↘
  SIM       NÃO
   ↓          ↓
Confirmada   Fila de espera
   ↓          ↓
   └────┬─────┘
        ↓
Atualização da situação
```

---

## 🔐 Versionamento

O projeto utiliza Git para controle de versão e GitHub para armazenamento e compartilhamento do código-fonte.

O arquivo `.gitignore` impede o envio de arquivos desnecessários ou dados locais, como:

- `node_modules`;
- `dados.json`;
- arquivos `.env`;
- arquivos de build.

---

## 🎓 Finalidade Acadêmica

Este projeto foi desenvolvido para fins acadêmicos na área de Desenvolvimento Full Stack.

O desenvolvimento possibilitou a aplicação prática de conceitos relacionados a:

- Desenvolvimento Front-end;
- Desenvolvimento Back-end;
- Vue.js;
- Node.js;
- APIs REST;
- JavaScript;
- Regras de negócio;
- Persistência de dados;
- Controle de versão;
- Git e GitHub;
- Experiência do usuário.

---

## 👩‍💻 Autoria

**Vanessa Rezende**

Projeto acadêmico — Sistema de Gerenciamento de Eventos.

---

## 📄 Conclusão

O Sistema de Gerenciamento de Eventos atende às principais necessidades de gerenciamento de eventos e inscrições, permitindo o cadastro e acompanhamento de eventos, controle de vagas, inscrições, cancelamentos, participantes e fila de espera.

A aplicação integra Front-end e Back-end através de uma API REST e utiliza persistência local para manter os dados durante a utilização do sistema.

O projeto representa a aplicação prática dos conhecimentos adquiridos durante o desenvolvimento acadêmico em Full Stack.
