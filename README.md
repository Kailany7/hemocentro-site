# HemoHelp — site público e área do doador

Este repositório é a **parte pública** do HemoHelp: o site institucional com estoque, campanhas e
locais de coleta, mais o cadastro/login e a área do doador. O **painel administrativo (`/gestao`),
usado por administradores e agentes de saúde, fica em outro repositório** — não há rotas de gestão
aqui.

## 1. O projeto e a divisão em dois repositórios

O HemoHelp aproxima doadores e hemocentros. A plataforma é dividida em dois repositórios que
**compartilham o mesmo banco MongoDB** (`MONGODB_DB=HemoHelp`):

| Repositório      | Responsabilidade                                                                                   | Quem escreve o quê                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `(https://github.com/ArmandoAleixo/HemoHelpSistema)` (este) | Site público (`/`), cadastro/login do doador (`/doador/cadastro`, `/doador/login`) e área do doador (`/doador`, `/doador/perfil`). | Cria/atualiza a coleção `DoadoresCCadastro` e lê os dados públicos.    |
| `HemoHelpSistema` | Painel `/gestao`: administração de estoque, campanhas, locais, unidades móveis, parceiros e agentes de saúde. | Mantém as coleções de gestão que este site apenas lê.                 |

Consequências práticas dessa divisão:

- O site **não** tem tela de gestão, CRUD genérico nem autenticação de administrador.
- Estoque, campanhas e locais são **somente leitura** aqui. Quem cadastra esses dados é o painel.
- O mesmo documento de doador é visível para os dois lados: no MongoDB o tipo sanguíneo fica no
  campo `tipo`, e as rotas do doador o expõem como `tipoSanguineo`.
- Qualquer alteração de schema precisa considerar os dois repositórios, porque ambos apontam para o
  mesmo banco.

## 2. Tecnologias

**Frontend**

- React 19 + TypeScript
- TanStack Start e TanStack Router (renderização no servidor e rotas por arquivos)
- Vite 8
- Tailwind CSS 4
- Componentes Radix UI / shadcn/ui, `lucide-react` para ícones e `sonner` para avisos
- Leaflet com tiles do OpenStreetMap para o mapa de locais de coleta

**Backend**

- Node.js com o módulo `http` nativo (sem Express)
- Driver oficial do MongoDB (`mongodb`)
- `bcryptjs` para hash de senha, `jsonwebtoken` para o token do doador e `dotenv` para o `.env`

**Ferramentas**

- ESLint + Prettier
- `npm run build` (build de produção via Vite) e `npm run lint`

## 3. Estrutura de pastas

```text
backend/
  server.js                       Entrada da API (sobe o servidor e conecta no MongoDB)
  src/
    app.js                        Cria o servidor HTTP e trata erros não previstos
    config/env.js                 Lê e valida as variáveis do .env
    controllers/
      public-data-controller.js   Respostas de /api/estoques, /api/campanhas e /api/locais
    database/mongodb.js           Conexão única, criação de coleções e índices únicos
    http/http.js                  Resposta JSON, CORS e leitura do corpo da requisição
    middlewares/
      autenticarDoador.js         Valida o JWT e injeta o id do doador na requisição
    repositories/
      public-data-repository.js   Consultas ao MongoDB para os dados públicos
    routes/
      api-router.js               Encaminha /api/health, /api/doador/* e os dados públicos
      doador-router.js            Rotas de cadastro, login, perfil e senha
      public-data-router.js       Rotas públicas da landing
    services/
      doadorAuthService.js        Regras de cadastro, login, perfil e troca de senha
      geocoding-service.js        Geocodificação de endereços com cache (GeocodingCache)
      public-data-service.js      Normaliza os documentos do MongoDB para a landing
  tests/
    features/                     Especificações Gherkin (landing, plataforma do doador e sistema privado)

frontend/
  public/                         favicon, robots.txt e imagens das campanhas
  src/
    components/ui/                Componentes de UI compartilhados (shadcn/ui + Radix)
    features/
      auth/                       Sessão do doador: token no localStorage, provider e hook
      doador/                     Componentes da área do doador
      site/                       Landing: seções, dados públicos, hooks, tipos e mapa Leaflet
    hooks/                        Hooks compartilhados
    images/                       Imagens e ícones da aplicação
    lib/                          Utilitários, formatadores e páginas de erro
    routes/
      __root.tsx                  Layout raiz (fonts, CSS, toasts, 404 e erro)
      index.tsx                   /
      doador_.cadastro.tsx        /doador/cadastro
      doador_.login.tsx           /doador/login
      doador/
        route.tsx                 Layout protegido da área do doador
        index.tsx                 /doador
        perfil.tsx                /doador/perfil
    router.tsx                    Criação do router
    server.ts / start.ts          Entrada do TanStack Start
    routeTree.gen.ts              Árvore de rotas gerada automaticamente
    styles.css                    Estilos globais e tokens de design

docs/
  contrato-api.md                 Contrato detalhado da API

package.json                      Scripts e dependências (frontend + backend)
vite.config.ts                    Alias @, diretório do frontend e plugins
.env.example                      Modelo das variáveis de ambiente
```

## 4. Como rodar

### 4.1 Requisitos

- Node.js e npm instalados
- Um banco MongoDB acessível (Atlas ou instância local) com as coleções de dados públicos já
  preenchidas pelo painel `HemoHelpSistema`

### 4.2 Variáveis de ambiente

Copie o `.env.example` para `.env` na raiz do projeto:

```bash
cp .env.example .env      # Linux/macOS
copy .env.example .env    # Windows (Prompt de Comando)
```

| Variável       | Para que serve                                                                                              |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`  | String de conexão do MongoDB. É o endereço do cluster/instância, com usuário e senha.                       |
| `MONGODB_DB`   | Nome do banco usado pela aplicação. Deve ser **`HemoHelp`**, o mesmo usado pelo painel de gestão.            |
| `PORT`         | Porta em que a API do backend escuta. O backend usa `3001` quando a variável não é definida.                 |
| `VITE_API_URL` | URL base da API consumida pelo frontend, **incluindo o `/api`** (o frontend concatena `/estoques`, `/doador/login` etc.). |
| `JWT_SECRET`   | Segredo usado para assinar e validar o token do doador. Sem ele, login, perfil e troca de senha falham.     |

> Use valores próprios e não versione o `.env`. `JWT_SECRET` deve ser uma string longa e aleatória.

### 4.3 Instalar dependências

```bash
npm install
```

### 4.4 Subir a API (terminal 1)

```bash
node backend/server.js
```

O equivalente é `npm run dev:backend`. A API sobe em `http://localhost:${PORT}` e, ao iniciar,
conecta ao MongoDB para garantir as coleções e os índices únicos de `email` e `cpf` em
`DoadoresCCadastro`.

### 4.5 Subir o site (terminal 2)

```bash
npm run dev
```

O Vite sobe o frontend (com SSR) e passa a consumir a API definida em `VITE_API_URL`.

### 4.6 Outros comandos

```bash
npm run build     # build de produção (cliente + servidor)
npm run preview   # pré-visualiza o build
npm run lint      # ESLint
npm run format    # Prettier
```

## 5. Rotas da API

Base: `http://localhost:${PORT}`. Todas as respostas são JSON e o backend libera CORS
(`Access-Control-Allow-Origin: *`) para o site consumir a API de outra origem.

As rotas públicas devolvem `{ "data": [...] }`. As rotas do doador devolvem o objeto direto e, em
caso de erro, `{ "erro": "mensagem" }`.

### 5.1 Rotas públicas

| Método | Rota             | Corpo | Resposta                                                          |
| ------ | ---------------- | ----- | ----------------------------------------------------------------- |
| `GET`  | `/api/health`    | —     | `200 { "status": "ok", "banco": "conectado" }`                    |
| `GET`  | `/api/estoques`  | —     | `200 { "data": [StockItem] }`                                     |
| `GET`  | `/api/campanhas` | —     | `200 { "data": [Campaign] }`                                      |
| `GET`  | `/api/locais`    | —     | `200 { "data": [CollectionLocation] }`                            |

Formatos:

```jsonc
// StockItem
{
  "id": "6750f1c2e4b0a1d2c3e4f5a6",
  "tipo": "O-",
  "nivel": "Baixo",
  "valor": 39,                       // 0 a 100
  "tom": "baixo",                    // "estavel" | "baixo" | "critico"
  "unidade": "Banco de sangue",      // opcional
  "atualizadoEm": "2026-11-09T21:42:08.709Z" // opcional
}

// Campaign
{
  "id": "6750f1c2e4b0a1d2c3e4f5a7",
  "imagem": "https://.../campanha.jpg",
  "data": "22/11/2026 a 30/11/2026",
  "titulo": "Campanha de novembro",
  "descricao": "Doação de sangue no centro da cidade.",
  "local": "Hemocentro de Campina Grande", // opcional
  "endereco": "Rua Arlinda Gomes de Medeiros, Mirante", // opcional
  "horario": "07:00 às 18:00",             // opcional
  "meta": "120 doações",                   // opcional
  "status": "Ativa",                       // opcional
  "atualizadoEm": "2026-11-09T22:44:37.438Z", // opcional
  "latitude": -7.2331317,                  // opcional
  "longitude": -35.8662144,                // opcional
  "positionApproximate": true              // opcional
}

// CollectionLocation
{
  "id": "6750f1c2e4b0a1d2c3e4f5a8",
  "nome": "Hemocentro de Campina Grande",
  "endereco": "Rua Professora Eutécia Vital Ribeiro, s/n",
  "horario": "07:00 - 17:30",
  "tipo": "fixo",                    // "fixo" | "movel"
  "status": "Ativo",                 // opcional
  "placa": "ABC1D23",                // opcional, só unidades móveis
  "latitude": -7.23836975,           // opcional
  "longitude": -35.87332195,         // opcional
  "cidade": "Campina Grande",        // opcional
  "estado": "PB",                    // opcional
  "positionApproximate": true        // opcional
}
```

Erros dessas rotas: `405 { "erro": "Metodo nao permitido." }` para métodos diferentes de `GET` e
`500 { "erro": "Não foi possível consultar os dados no momento." }` quando o MongoDB falha.

### 5.2 Rotas do doador

| Método  | Rota                   | Autenticação | Corpo                                              | Resposta                                    |
| ------- | ---------------------- | ------------ | -------------------------------------------------- | ------------------------------------------- |
| `POST`  | `/api/doador/cadastro` | —            | `nome`, `email`, `tipoSanguineo`, `senha`, `cpf`, `telefone?` | `201` dados do doador               |
| `POST`  | `/api/doador/login`    | —            | `email`, `senha`                                   | `200 { "token", "doador" }`                 |
| `GET`   | `/api/doador/perfil`   | Bearer       | —                                                  | `200` dados do doador                       |
| `PATCH` | `/api/doador/perfil`   | Bearer       | `nome?`, `email?`, `telefone?`                     | `200` dados atualizados                     |
| `PATCH` | `/api/doador/senha`    | Bearer       | `senhaAtual`, `novaSenha`                          | `200 { "mensagem": "Senha alterada com sucesso." }` |

Exemplos de corpo e resposta:

```http
POST /api/doador/cadastro
Content-Type: application/json

{
  "nome": "Marina Alves",
  "email": "marina.alves@email.com",
  "tipoSanguineo": "O-",
  "senha": "segredo123",
  "cpf": "123.456.789-00",
  "telefone": "(83) 99999-0000"
}
```

```http
POST /api/doador/login
Content-Type: application/json

{ "email": "marina.alves@email.com", "senha": "segredo123" }
```

```http
GET /api/doador/perfil
Authorization: Bearer <token>
```

```http
PATCH /api/doador/perfil
Authorization: Bearer <token>
Content-Type: application/json

{ "nome": "Marina Alves Souza", "telefone": "(83) 98888-1111" }
```

```http
PATCH /api/doador/senha
Authorization: Bearer <token>
Content-Type: application/json

{ "senhaAtual": "segredo123", "novaSenha": "novaSenha456" }
```

Regras principais:

- `senha`/`novaSenha` têm mínimo de 6 caracteres e são gravadas apenas como `senhaHash` (bcrypt).
- O token é um JWT com validade de **1 dia**, assinado com `JWT_SECRET`.
- `cpf` e `telefone` são gravados só com dígitos; o CPF é validado apenas pelo tamanho (11 dígitos)
  nesta fase.
- Nenhuma resposta inclui `senhaHash`.
- O contrato completo, com todos os códigos de erro, está em [`docs/contrato-api.md`](docs/contrato-api.md).

## 6. Telas

| Rota               | Tela              | O que faz                                                                                              |
| ------------------ | ----------------- | ------------------------------------------------------------------------------------------------------ |
| `/`                | Landing           | Hero, estoque de sangue, campanhas, locais de coleta com mapa Leaflet, critérios de doação e sobre. Os dados vêm de `/api/estoques`, `/api/campanhas` e `/api/locais`, com dados fixos de fallback. |
| `/doador/cadastro` | Criar conta       | Formulário de cadastro do doador (nome, e-mail, tipo sanguíneo, CPF, telefone e senha).                 |
| `/doador/login`    | Entrar            | Login com e-mail e senha; guarda o token no `localStorage`.                                             |
| `/doador`          | Área do doador    | Saudação, card "Próxima doação", campanhas ativas e locais de coleta. Exige login.                       |
| `/doador/perfil`   | Meu perfil        | Dados do doador, edição de nome/e-mail/telefone e troca de senha. Exige login.                           |

A área do doador é protegida pelo layout `frontend/src/routes/doador/route.tsx`: sem token no
`localStorage`, o usuário é redirecionado para `/doador/login`.

Na área do doador, "Campanhas ativas" e "Locais de coleta" usam as **mesmas rotas públicas da
landing**, reaproveitando `usePublicData` em `frontend/src/features/site/hooks/use-public-data.ts`.
Nesses dois cards o hook roda sem dados fixos: se a API falhar, a tela mostra uma mensagem de erro em
vez de conteúdo fictício.

## 7. Fluxo de branches

```text
main        versão estável (o que está publicado)
  └─ develop        integração do dia a dia
       ├─ feature/*  novas funcionalidades
       ├─ fix/*      correções de bug
       ├─ docs/*     documentação
       └─ chore/*    tarefas de manutenção (dependências, configuração, limpeza)
```

Regras:

1. `main` só recebe código estável e já validado em `develop`.
2. Todo trabalho novo sai de `develop`, em uma branch `feature/*`, `fix/*`, `docs/*` ou `chore/*`.
3. A branch é enviada ao repositório e integrada por **pull request para `develop`**.
4. Depois de validado, `develop` é promovido para `main`.

## 8. Pendências

### Card "Próxima doação" fictício (UC08)

O card "Próxima doação possível" em `/doador` ainda usa dados de exemplo. Em
`frontend/src/features/doador/data/exemplo.ts`, a função `doadorComDadosReais` mantém `ultimaDoacao`,
`proximaDoacaoPossivel` e `totalDoacoes` fixos, aproveitando do perfil apenas nome, e-mail e tipo
sanguíneo.

Motivo: a API do doador não expõe histórico nem data da última doação — `/api/doador/perfil` devolve
somente os dados cadastrais. Na página `/doador/perfil`, o componente `DadosDoador` recebe
`ultimaDoacao={null}` e `totalDoacoes={null}` justamente por isso, em vez de inventar valores.

Quando o histórico de doações existir na API, o card deve passar a consumir essa fonte e o arquivo de
exemplo pode ser removido.
