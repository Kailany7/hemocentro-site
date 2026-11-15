# Contrato da API — HemoHelp (site público e área do doador)

Este documento descreve **apenas as rotas expostas por este repositório** (`hemocentro-site`), lidas
diretamente de `backend/src/routes/api-router.js`, `backend/src/routes/public-data-router.js` e
`backend/src/routes/doador-router.js`.

O painel `/gestao` **não faz parte deste repositório** e não é documentado aqui: ele vive em
`HemoHelpSistema`. Os dois repositórios compartilham o mesmo banco MongoDB (`MONGODB_DB=HemoHelp`).

## Convenções

- **Base:** `http://localhost:${PORT}` (o `PORT` vem do `.env`; o valor padrão do backend é `3001`).
- **Formato:** JSON, com `Content-Type: application/json; charset=utf-8` nas respostas.
- **CORS:** todas as respostas enviam `Access-Control-Allow-Origin: *`, e requisições `OPTIONS`
  recebem `204` sem corpo.
- **Sucesso:** as rotas públicas devolvem `{ "data": ... }`; as rotas do doador devolvem o recurso
  direto (ou `{ "token", "doador" }` no login).
- **Erro:** sempre `{ "erro": "mensagem" }`.
- **Identificador:** `id` (string do `ObjectId` do MongoDB).
- **Rota inexistente:** `404 { "erro": "Caminho da API nao encontrado." }` (fora de `/api/doador/*`);
  dentro de `/api/doador/*` a mensagem é `{ "erro": "Caminho da API não encontrado." }`.
- **Método errado em rota existente do doador:** `405 { "erro": "Método não permitido." }`.
- **Método errado nas rotas públicas:** `405 { "erro": "Metodo nao permitido." }`.

### Coleções e responsabilidade

| Coleção             | Este repositório           | Painel `HemoHelpSistema` |
| ------------------- | -------------------------- | ------------------------ |
| `DoadoresCCadastro` | cria e atualiza (doador)   | lê/gerencia              |
| `EstoqueSangue`     | somente leitura            | gerencia                 |
| `Campanhas`         | somente leitura            | gerencia                 |
| `LocaisColeta`      | somente leitura            | gerencia                 |
| `UnidadesMoveis`    | somente leitura            | gerencia                 |
| `GeocodingCache`    | cria e atualiza (cache)    | —                        |

Na primeira conexão o backend cria as coleções que ainda não existirem e garante os índices únicos
parciais de `email` e `cpf` em `DoadoresCCadastro`. Nenhum dado existente é removido.

---

## Health check

### GET `/api/health`

Verifica a conexão com o MongoDB. Não recebe corpo nem autenticação.

`200 OK`:

```json
{ "status": "ok", "banco": "conectado" }
```

Se o MongoDB não estiver acessível, a conexão falha e a rota responde com erro (o processo registra
a mensagem no console).

---

## Dados públicos da landing page

Estas três rotas alimentam a landing (`/`) e os cards "Campanhas ativas" e "Locais de coleta" da área
do doador. São **somente leitura** e não exigem autenticação.

Comportamento comum:

- Sucesso: `200 { "data": [...] }`.
- Falha ao consultar o MongoDB: `500 { "erro": "Não foi possível consultar os dados no momento." }`.
- Método diferente de `GET`: `405 { "erro": "Metodo nao permitido." }`.

### GET `/api/estoques`

Lê a coleção `EstoqueSangue` (ordenada por `nome`) e devolve um item por tipo sanguíneo.

Campos:

| Campo         | Tipo                                   | Observação                                              |
| ------------- | -------------------------------------- | ------------------------------------------------------- |
| `id`          | string                                 | `ObjectId` do documento                                 |
| `tipo`        | string                                 | `tipo`, `nome` ou `tipoSanguineo` do documento          |
| `valor`       | number                                 | `porcentagem`, `valor` ou `nivel`, limitado a 0–100     |
| `tom`         | `"estavel" \| "baixo" \| "critico"`    | calculado a partir do status e do `valor`               |
| `nivel`       | string                                 | status do documento ou rótulo do tom (`Estável`, etc.)  |
| `unidade`     | string (opcional)                      | `unidade` ou `local`                                    |
| `atualizadoEm`| string ISO (opcional)                  | `updatedAt` ou `createdAt`                              |

Regra do `tom`: `critico` se o status indicar crítico/emergência/indisponível ou `valor <= 20`;
`baixo` se indicar baixo/alerta ou `valor <= 45`; caso contrário, `estavel`.

Exemplo de resposta:

```json
{
  "data": [
    {
      "id": "6750f1c2e4b0a1d2c3e4f5a6",
      "tipo": "A+",
      "valor": 40,
      "tom": "baixo",
      "nivel": "Disponível",
      "unidade": "Banco de sangue",
      "atualizadoEm": "2026-11-09T21:42:08.709Z"
    }
  ]
}
```

### GET `/api/campanhas`

Lê a coleção `Campanhas`, **excluindo** documentos com `ativo: false` e com status
`inativa`/`cancelada`/`finalizada`/`encerrada`. Ordena pelo início da campanha (mais próxima
primeiro); campanhas sem data ficam no fim.

Campos:

| Campo                 | Tipo                    | Observação                                                        |
| --------------------- | ----------------------- | ----------------------------------------------------------------- |
| `id`                  | string                  | `ObjectId` do documento                                           |
| `titulo`              | string                  | `titulo` ou `nome`                                                |
| `descricao`           | string                  | `descricao` ou `description` (pode vir vazio)                     |
| `data`                | string                  | `data`/`periodo`/`dataFormatada` ou `dataInicio a dataFim`        |
| `local`               | string (opcional)       | `local`, `localNome` ou `unidade`                                 |
| `endereco`            | string (opcional)       | rua + bairro, quando existirem                                    |
| `horario`             | string (opcional)       | `horario` ou `horarioInicio às horarioFim`                        |
| `imagem`              | string                  | `imagem`, `imagemUrl`, `imageUrl` ou `urlImagem`                  |
| `meta`                | string (opcional)       | `meta` ou `objetivo`                                              |
| `status`              | string (opcional)       | `status` ou `situacao`                                            |
| `atualizadoEm`        | string ISO (opcional)   | `updatedAt` ou `createdAt`                                        |
| `latitude`            | number (opcional)       | `latitude` ou `lat`                                               |
| `longitude`           | number (opcional)       | `longitude`, `lng` ou `lon`                                       |
| `positionApproximate` | boolean (opcional)      | `true` quando a posição veio da geocodificação                    |

Se a campanha não tiver coordenadas, o backend geocodifica o `endereco` (usando `cidade`/`estado`
do documento ou `Campina Grande`/`PB` por padrão) e acrescenta `latitude`, `longitude` e
`positionApproximate: true`. Sem geocodificação, a campanha é devolvida sem coordenadas.

Exemplo de resposta:

```json
{
  "data": [
    {
      "id": "6750f1c2e4b0a1d2c3e4f5a7",
      "titulo": "Campanha de novembro",
      "descricao": "Doação de sangue no centro da cidade.",
      "data": "22/11/2026 a 30/11/2026",
      "endereco": "Rua Arlinda Gomes de Medeiros, Mirante",
      "horario": "07:00 às 18:00",
      "imagem": "https://res.cloudinary.com/exemplo/image/upload/campanha.jpg",
      "status": "Ativa",
      "atualizadoEm": "2026-11-09T22:44:37.438Z",
      "latitude": -7.2331317,
      "longitude": -35.8662144,
      "positionApproximate": true
    }
  ]
}
```

### GET `/api/locais`

Combina duas coleções: `LocaisColeta` (locais fixos) e `UnidadesMoveis` (unidades móveis), ignorando
documentos com `ativo: false`. Locais fixos vêm ordenados por `nome`, seguidos pelas unidades móveis
também ordenadas por `nome`.

Campos:

| Campo                 | Tipo                  | Observação                                                          |
| --------------------- | --------------------- | ------------------------------------------------------------------- |
| `id`                  | string                | `ObjectId`; unidades móveis recebem prefixo `movel-`                 |
| `nome`                | string                | `nome` ou `titulo`                                                  |
| `endereco`            | string                | `endereco`/`endereço`/`logradouro`; unidades móveis montam rua + bairro |
| `horario`             | string                | `horario`, `horário` ou `horarioFuncionamento`                      |
| `tipo`                | `"fixo" \| "movel"`   | `movel` para documentos vindos de `UnidadesMoveis`                  |
| `status`              | string (opcional)     | `status` ou `situacao`                                              |
| `placa`               | string (opcional)     | apenas unidades móveis                                              |
| `latitude`            | number (opcional)     | `latitude`/`lat`, inclusive dentro de `localizacao` ou `coordenadas` |
| `longitude`           | number (opcional)     | `longitude`/`lng`/`lon`                                             |
| `cidade`              | string (opcional)     | `cidade`/`municipio`, inclusive dentro de `endereco`                 |
| `estado`              | string (opcional)     | `estado`/`uf`                                                       |
| `positionApproximate` | boolean (opcional)    | `true` quando a posição veio da geocodificação                      |

Exemplo de resposta:

```json
{
  "data": [
    {
      "id": "6750f1c2e4b0a1d2c3e4f5a8",
      "nome": "Hemocentro de Campina Grande",
      "endereco": "Rua Professora Eutécia Vital Ribeiro, s/n",
      "horario": "07:00 - 17:30",
      "tipo": "fixo",
      "status": "Ativo",
      "latitude": -7.23836975,
      "longitude": -35.87332195,
      "cidade": "Campina Grande",
      "estado": "PB",
      "positionApproximate": true
    }
  ]
}
```

### Geocodificação

Os endereços sem coordenadas são resolvidos pelo Nominatim (OpenStreetMap):

- uma requisição por vez, com intervalo mínimo de ~1,1 s entre chamadas;
- resultado (inclusive o negativo) guardado na coleção `GeocodingCache`;
- cache negativo expira em 24 h;
- a posição só é aceita quando rua, cidade e estado conferem; resultados de uma mesma rua só são
  aproximados se estiverem a menos de 300 m entre si.

Por isso, a primeira chamada a `/api/campanhas` ou `/api/locais` pode demorar: o backend está
geocodificando. Se o Nominatim falhar ou não encontrar o endereço, o local continua na resposta,
apenas sem `latitude`/`longitude`. O frontend sinaliza esses casos como "sem posição confirmada".

---

## Autenticação e área do doador (UC06)

- Coleção: `DoadoresCCadastro`.
- O doador é identificado por `email` (único, sem diferenciar maiúsculas).
- A senha é gravada como `senhaHash` (bcrypt, custo 10) e **nunca** aparece em nenhuma resposta.
- O login devolve um JWT assinado com `JWT_SECRET`, com validade de **1 dia**.
- Rotas protegidas usam o cabeçalho `Authorization: Bearer <token>`.
- No MongoDB o tipo sanguíneo fica no campo `tipo`; as rotas do doador o expõem como
  `tipoSanguineo`.
- `cpf` e `telefone` são gravados apenas com dígitos, sem máscara.
- O CPF, nesta fase, é validado apenas pelo tamanho (11 dígitos).
- O tipo sanguíneo só é confirmado pelo hemocentro na primeira doação; por isso existe
  `tipoSanguineoVerificado`.

Formato público do doador (usado em cadastro, login e perfil):

| Campo                     | Tipo    | Observação                                            |
| ------------------------- | ------- | ----------------------------------------------------- |
| `id`                      | string  | `ObjectId` do documento                               |
| `nome`                    | string  |                                                       |
| `email`                   | string  | normalizado em minúsculas                             |
| `tipoSanguineo`           | string  | lido de `tipo`                                        |
| `tipoSanguineoVerificado` | boolean | começa em `false`                                     |
| `cpf`                     | string  | apenas dígitos                                        |
| `telefone`                | string  | apenas dígitos; ausente quando não informado          |
| `status`                  | string  | inicia como `Em triagem`                              |
| `createdAt`               | string  | data ISO                                              |
| `updatedAt`               | string  | data ISO                                              |

### POST `/api/doador/cadastro`

Cria a conta do doador.

Campos:

| Campo           | Obrigatório | Observação                          |
| --------------- | ----------- | ----------------------------------- |
| `nome`          | sim         | string não vazia                    |
| `email`         | sim         | formato de e-mail válido            |
| `tipoSanguineo` | sim         | string não vazia                    |
| `senha`         | sim         | mínimo de 6 caracteres              |
| `cpf`           | sim         | 11 dígitos (com ou sem máscara)     |
| `telefone`      | não         | 10 ou 11 dígitos, com ou sem máscara |

Pedido:

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

`201 Created`:

```json
{
  "id": "6750f1c2e4b0a1d2c3e4f5a6",
  "nome": "Marina Alves",
  "email": "marina.alves@email.com",
  "tipoSanguineo": "O-",
  "tipoSanguineoVerificado": false,
  "cpf": "12345678900",
  "telefone": "83999990000",
  "status": "Em triagem",
  "createdAt": "2026-11-08T12:00:00.000Z",
  "updatedAt": "2026-11-08T12:00:00.000Z"
}
```

Erros:

| Código | Quando                                                       | Corpo                                                              |
| ------ | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| `400`  | `nome`, `email`, `tipoSanguineo`, `senha` ou `cpf` ausente/vazio | `{ "erro": "Campos obrigatórios ausentes: email, senha." }`     |
| `400`  | senha com menos de 6 caracteres                              | `{ "erro": "A senha deve ter no mínimo 6 caracteres." }`           |
| `400`  | e-mail com formato inválido                                  | `{ "erro": "Informe um e-mail válido." }`                          |
| `400`  | CPF sem 11 dígitos                                           | `{ "erro": "CPF inválido." }`                                      |
| `400`  | telefone diferente de 10 ou 11 dígitos                       | `{ "erro": "Telefone inválido. Informe 10 ou 11 dígitos." }`       |
| `409`  | CPF já cadastrado                                            | `{ "erro": "CPF já cadastrado." }`                                 |
| `409`  | e-mail já cadastrado                                         | `{ "erro": "E-mail já cadastrado. Deseja recuperar a senha?" }`    |

A lista em "Campos obrigatórios ausentes" mostra apenas os campos que faltaram, na ordem em que são
validados. Os índices únicos de e-mail e CPF também protegem contra dois cadastros simultâneos com o
mesmo dado.

### POST `/api/doador/login`

Pedido:

```http
POST /api/doador/login
Content-Type: application/json

{
  "email": "marina.alves@email.com",
  "senha": "segredo123"
}
```

`200 OK`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "doador": {
    "id": "6750f1c2e4b0a1d2c3e4f5a6",
    "nome": "Marina Alves",
    "email": "marina.alves@email.com",
    "tipoSanguineo": "O-",
    "tipoSanguineoVerificado": false,
    "cpf": "12345678900",
    "telefone": "83999990000",
    "status": "Em triagem",
    "createdAt": "2026-11-08T12:00:00.000Z",
    "updatedAt": "2026-11-08T12:00:00.000Z"
  }
}
```

Erros:

| Código | Quando                            | Corpo                                               |
| ------ | --------------------------------- | --------------------------------------------------- |
| `400`  | `email` ou `senha` ausente        | `{ "erro": "Campos obrigatórios ausentes: senha." }` |
| `401`  | e-mail inexistente ou senha errada | `{ "erro": "E-mail ou senha inválidos" }`           |

A mensagem é a mesma nos dois casos de `401`, para não revelar quais e-mails existem.

### GET `/api/doador/perfil`

Exige token.

```http
GET /api/doador/perfil
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

`200 OK`: devolve o mesmo formato público do doador mostrado no login (sem `senhaHash`).

Erros:

| Código | Quando                                                   | Corpo                                          |
| ------ | -------------------------------------------------------- | ---------------------------------------------- |
| `401`  | cabeçalho `Authorization` ausente ou sem `Bearer`        | `{ "erro": "Token de autenticação ausente." }` |
| `401`  | token inválido, expirado ou doador removido              | `{ "erro": "Token inválido ou expirado." }`    |

### PATCH `/api/doador/perfil`

Atualiza apenas `nome`, `email` e `telefone`. Qualquer outro campo enviado é ignorado. Exige token.

Pedido:

```http
PATCH /api/doador/perfil
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome": "Marina Alves Souza",
  "email": "marina.souza@email.com",
  "telefone": "(83) 98888-1111"
}
```

- Todos os campos são opcionais, mas **pelo menos um** precisa ser enviado.
- `telefone` enviado como `null` ou string vazia **remove** o telefone do cadastro.
- `nome` vazio é rejeitado.

`200 OK`: devolve o doador já atualizado, no formato público.

Erros:

| Código | Quando                                                    | Corpo                                                          |
| ------ | --------------------------------------------------------- | -------------------------------------------------------------- |
| `400`  | nenhum campo enviado                                      | `{ "erro": "Envie ao menos um campo: nome, email ou telefone." }` |
| `400`  | `nome` vazio                                              | `{ "erro": "Informe seu nome." }`                              |
| `400`  | e-mail inválido                                           | `{ "erro": "Informe um e-mail válido." }`                      |
| `400`  | telefone diferente de 10 ou 11 dígitos                    | `{ "erro": "Telefone inválido. Informe 10 ou 11 dígitos." }`   |
| `409`  | e-mail já usado por outro doador                          | `{ "erro": "E-mail já cadastrado. Deseja recuperar a senha?" }` |
| `401`  | token ausente ou inválido                                 | mensagens de token acima                                       |
| `404`  | doador do token não existe mais                           | `{ "erro": "Doador não encontrado." }`                         |

### PATCH `/api/doador/senha`

Troca a senha exigindo a senha atual. Exige token.

Pedido:

```http
PATCH /api/doador/senha
Authorization: Bearer <token>
Content-Type: application/json

{
  "senhaAtual": "segredo123",
  "novaSenha": "novaSenha456"
}
```

`200 OK`:

```json
{ "mensagem": "Senha alterada com sucesso." }
```

Erros:

| Código | Quando                                    | Corpo                                                              |
| ------ | ----------------------------------------- | ------------------------------------------------------------------ |
| `400`  | `senhaAtual` ou `novaSenha` ausente       | `{ "erro": "Campos obrigatórios ausentes: novaSenha." }`           |
| `400`  | `novaSenha` com menos de 6 caracteres     | `{ "erro": "A senha deve ter no mínimo 6 caracteres." }`           |
| `401`  | `senhaAtual` não confere                  | `{ "erro": "Senha atual incorreta." }`                             |
| `401`  | token ausente ou inválido                 | mensagens de token acima                                           |
| `404`  | doador do token não existe mais           | `{ "erro": "Doador não encontrado." }`                             |

---

## Como testar com curl

```bash
# 1. Health check
curl http://localhost:3001/api/health

# 2. Dados públicos da landing
curl http://localhost:3001/api/estoques
curl http://localhost:3001/api/campanhas
curl http://localhost:3001/api/locais

# 3. Cadastro
curl -X POST http://localhost:3001/api/doador/cadastro \
  -H "Content-Type: application/json" \
  -d '{"nome":"Marina Alves","email":"marina.alves@email.com","tipoSanguineo":"O-","senha":"segredo123","cpf":"12345678900"}'

# 4. Login (guarde o token da resposta)
curl -X POST http://localhost:3001/api/doador/login \
  -H "Content-Type: application/json" \
  -d '{"email":"marina.alves@email.com","senha":"segredo123"}'

# 5. Perfil
curl http://localhost:3001/api/doador/perfil \
  -H "Authorization: Bearer COLE_O_TOKEN_AQUI"

# 6. Atualizar perfil
curl -X PATCH http://localhost:3001/api/doador/perfil \
  -H "Authorization: Bearer COLE_O_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"telefone":"(83) 98888-1111"}'

# 7. Trocar senha
curl -X PATCH http://localhost:3001/api/doador/senha \
  -H "Authorization: Bearer COLE_O_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"senhaAtual":"segredo123","novaSenha":"novaSenha456"}'
```

---

## Observação sobre o painel de gestão

O CRUD de doadores, agentes de saúde, campanhas, estoque, locais, parceiros e unidades móveis **não
existe neste repositório**. Ele pertence ao painel em `HemoHelpSistema`, que escreve nas mesmas
coleções do MongoDB. Este site apenas lê esses dados e mantém o cadastro do doador.
