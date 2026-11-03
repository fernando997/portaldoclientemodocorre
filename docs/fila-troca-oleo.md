# Fila de espera de troca de óleo — especificação para o app nativo

Documento de transferência. Descreve a regra inteira como foi implementada no
**portal web** (React/Vite) para que seja reproduzida no **app nativo**. Quem lê
isto não precisa conhecer o portal: tudo que importa está aqui.

Estado atual: implementado e testado em produção de dados da branch
**`dev-willian`** do Bubble (nome de versão **`43lgt`**). Ainda não está em live.

---

## 1. O que a funcionalidade faz

A base da Modo Corre já tinha uma fila de troca de óleo, mas só acessível por um
**totem** físico na recepção: o cliente digitava a placa e tirava a senha. O
totem *era* a prova de que a pessoa estava lá.

O objetivo é dar a mesma capacidade pelo celular do cliente. Como isso remove a
prova física, ela é substituída por um **geofence obrigatório de 150 m** contra
a coordenada da base. O cliente com uma OS de troca de óleo aberta, estando
fisicamente na base do contrato dele, entra na fila e acompanha a posição.

Fluxo completo:

1. App abre e consulta o status da fila para o contrato ativo.
2. Havendo OS de troca de óleo elegível e nenhuma entrada ativa hoje, o app
   **pede a permissão de localização**, registra a posição e calcula a distância
   até a base, mostrando-a antes de qualquer ação.
3. O cliente toca em **"Cheguei na base"**. Aí a localização é **exigida**: sem
   permissão ou fora do raio, não entra, e a tela explica o porquê.
4. Dentro do raio, grava a entrada e mostra a posição na fila.
5. A tela se atualiza sozinha. Ao chegar na **posição ≤ 3**, mostra alerta
   "prepare-se" e dispara **uma** notificação.
6. A base chama → "você foi chamado"; inicia → "em atendimento"; finaliza → sai.

---

## 2. Onde os dados ficam

**Nenhuma tabela nova foi criada.** A fila é a tabela que o totem já usava.

### Tabela `oficina_fila_espera` (btype `custom.oficina_fila_espera`)

Nomes abaixo são os da **Data API** (é como chegam no JSON dos endpoints):

| Campo | Tipo | Observação |
|---|---|---|
| `os` | link → `operacional_os` | a OS que gerou a entrada |
| `numero os` | number | denormalizado da OS |
| `contrato` | link → `contratos` | |
| `cliente` | link → `customer` | |
| `veiculo` | link → `veiculos_frota` | |
| `placa` | text | denormalizado |
| `nome cliente` | text | denormalizado |
| `unidade` | link → `unidade` (a base) | |
| `status` | option set `fila_status` | chega como texto do display |
| `entrou em` | date | **a ordem da fila sai daqui** |
| `chamado em` | date | preenchido quando a base chama |
| `chamado vezes` | number | incrementa a cada chamada |
| `iniciado em` | date | início do atendimento |
| `finalizado em` | date | |
| `lat cliente` | number | onde o cliente estava ao entrar |
| `long cliente` | number | idem |
| `distancia metros` | number | distância medida até a base |

`fila_status` tem exatamente 4 opções, cujos displays são:
`AGUARDANDO`, `EM_ATENDIMENTO`, `FINALIZADO`, `CANCELADO`.

**Não existe campo de posição, e é proposital.** A posição é derivada (ver §5).

### Tabela `Unidades` (btype `custom.unidade`) — as bases

Campos de endereço em texto, mais os três que foram adicionados para o geofence:

| Campo | Tipo |
|---|---|
| `lat` | number |
| `long` | number |
| `raio_metros` | number (150) |

As 5 bases, com as coordenadas corretas:

| Código | Nome | id | lat | long |
|---|---|---|---|---|
| CAMP | CAMPINAS | `1779731986132x182858207994576900` | -22.9271957 | -47.1162088 |
| SOC | SOROCABA | `1779732740243x953681391339700200` | -23.5205459 | -47.4484512 |
| CGB | CUIABA | `1779734303515x440094045937860600` | -15.5803613 | -56.1190088 |
| VZ | VARZEA GRANDE | `1779734629195x978459896581718000` | -15.5803613 | -56.1190088 |
| SJRP | S. J. DO RIO PRETO | `1780594765022x577519546636959700` | -20.7769456 | -49.4074802 |

> Em `43lgt` a CGB está temporariamente com coordenada de Itapetininga por causa
> de um teste. O valor correto é o da tabela acima.

---

## 3. Endpoints

Workflow API do Bubble. A chave vai **no corpo** como `apikey`, nunca em header
— é a convenção de todos os endpoints `portal-cliente_*` deste app.

Base URL por versão:

```
produção  https://modocorreapp.com.br/api/1.1/wf
branch    https://modocorreapp.com.br/version-43lgt/api/1.1/wf
```

### `POST portal-cliente_fila-status`

Parâmetros: `apikey`, `contrato` (id).

Resposta (`response`):

| Chave | Conteúdo |
|---|---|
| `entrada` | a entrada ativa **de hoje** do contrato, ou `{}` |
| `posicao` | posição na fila (só faz sentido se houver `entrada`) |
| `total` | quantos AGUARDANDO hoje naquela base |
| `unidade` | a base do contrato, com `lat`, `long`, `raio_metros` |
| `ordens` | OS abertas candidatas (ver §4) |
| `planos` | os `plano_definidos` dessas OS, para ler a descrição |

### `POST portal-cliente_fila-entrar`

Parâmetros: `apikey`, `contrato`, `os`, `latitude`, `longitude`,
`distancia_metros`.

Resposta: `entrada` (a linha criada) e `posicao`.

**Quando recusa, responde `status: success` sem criar nada.** Portanto: trate
`entrada` ausente/vazia como **falha**, nunca como sucesso silencioso.

O servidor revalida por conta própria antes de criar:

- a chave existe;
- a OS existe, está `ABERTA` e pertence à moto daquele contrato;
- não há entrada ativa para a mesma OS;
- `distancia_metros` ≤ `raio_metros` da base.

Há ainda uma ação de reconciliação: se duas requisições correrem em paralelo e
ambas passarem na checagem, a segunda **se autocancela** (vira `CANCELADO`)
porque detecta uma entrada mais antiga para a mesma OS. Isso existe porque a
checagem do Bubble não é atômica — já aconteceu na prática.

---

## 4. Regra de elegibilidade

Uma OS dá direito à fila quando **todas** valem:

1. `status da os` = `"ABERTA"`
2. `tipos de os` = `"OS SIMPLES"`
3. tem `plano_mn` (o plano de manutenção ligado)
4. a descrição do plano é **troca de óleo**
5. o plano **não** está `SUBSTITUIDA` nem `REALIZADO`

Os itens 1–3 já vêm filtrados pelo endpoint em `ordens`. Os itens 4 e 5 ficam no
cliente, porque dependem de texto.

### Por que a regra 4 é textual

`TROCA DE ÓLEO` **não é option set**: é texto livre e inconsistente no catálogo.
Valores reais que precisam casar:

```
"TROCAS DE ÓLEO PERIÓDICAS"        "TROCA DE ÓLEO HONDA"
"TROCAS DE ÓLEO 2.000 KM"          "TROCA DE ÓLEO SUZUKI DK"
"TROCA DE ÓLEO "  (espaço no fim)  "TROCAR  ÓLEO DE MOTOR"
```

E que **não** podem casar:

```
"COMPLETAR ÓLEO"               (serviço vizinho, só Campinas, não dá fila)
"ÓLEO 10W30 E ARRUELA"         (tem ÓLEO, não tem TROCA)
"TROCA DE ARROELA DE VEDAÇÃO"  (tem TROCA, não tem ÓLEO)
"REVISÃO DE LUBRIFICAÇÃO HONDA"
```

Sempre com `Ó` acentuado — nunca ASCII. Daí a normalização obrigatória:

```
normalizar(t) = NFD → remove diacríticos → MAIÚSCULAS → colapsa espaços → trim

ehTrocaDeOleo(d):
    t = normalizar(d)
    se t contém "COMPLETAR"        → false
    retorna t contém "TROCA" e t contém "OLEO"
```

A descrição vem de `os → plano_mn → descrição`, no formato
`"➡️ TROCAS DE ÓLEO PERIÓDICAS previsto para 24.000 km"`.

Havendo mais de uma OS elegível, use a primeira — `ordens` já vem ordenada por
`data e hora` ascendente.

---

## 5. Posição na fila

Não leia campo nenhum: **derive**, com a mesma regra que o totem usa.

```
posicao = 1 + contagem de oficina_fila_espera onde:
            unidade  = a base do contrato
            status   = AGUARDANDO
            entrou em >= início do dia de hoje
            entrou em <  entrou em da minha entrada
```

Campo de posição gravado exigiria renumerar todo mundo a cada atendimento e
dessincroniza na primeira falha.

O recorte **"só hoje"** é decisão de produto: nada no sistema cancela ou expira
entradas antigas, e sem esse recorte linhas esquecidas inflam a posição. Efeito
colateral conhecido: o totem **não** aplica esse recorte, então pode mostrar
número diferente enquanto houver linhas velhas em AGUARDANDO.

---

## 6. Geofence

- Raio: `raio_metros` da base; **sem valor, assuma 150**.
- Distância por **Haversine** entre a posição do cliente e `lat`/`long` da base.
- Base **sem coordenada** (campo vazio, que o Bubble devolve como `0`) deve
  **esconder/bloquear** a fila, nunca liberar. `0,0` é um ponto no Atlântico.
- O app envia `distancia_metros` junto; o servidor compara com o raio.

**Limitação honesta:** as coordenadas vêm do aparelho, então o servidor não tem
como distinguir um GPS verdadeiro de um forjado. O geofence barra uso casual à
distância, não um atacante determinado. É a mesma limitação do fluxo de
`solicitar-desbloqueio` que já existe no produto.

---

## 7. Comportamento de localização

Dois momentos distintos, ambos necessários:

**Ao aparecer a OS elegível (sem entrada ativa):** pede a permissão, lê a
posição, registra no histórico de localizações e calcula a distância para exibir
("Você está na base" / "Você está a 183 m da base"). Se a permissão já estiver
negada de vez, **não insista** — apenas não mostre a distância.

**Ao tocar no botão:** a localização é **exigida**.

- permissão negada → explique como reativar nas configurações;
- GPS falhou → mensagem de erro, não entra;
- fora do raio → informe a distância, não entra;
- dentro → grava.

Antes de gravar, reconsulte o status: evita entrada duplicada quando a tela está
desatualizada. E bloqueie o botão enquanto a requisição estiver em andamento.

---

## 8. Estados da tela

| Condição | Tela |
|---|---|
| OS elegível, sem entrada | oferta + distância + botão |
| `AGUARDANDO`, posição > 3 | número grande da posição, quantos na frente |
| `AGUARDANDO`, posição ≤ 3 | destaque "prepare-se, está chegando" + notificação |
| `chamado em` preenchido | "Você foi chamado! Leve a moto até o atendente" |
| `EM_ATENDIMENTO` | "Sua moto está em atendimento" |

A notificação de posição ≤ 3 deve disparar **uma única vez por entrada** — guarde
o id da entrada já notificada.

No portal o polling é de 20 s enquanto a tela está aberta. **No app nativo isso
pode ser melhor:** push real e/ou as APIs nativas de geofencing permitem avisar
com o app fechado, que é o caso de uso real (a pessoa está esperando, não olhando
a tela).

---

## 9. Lado da base (já existe, não precisa reimplementar)

Página Bubble `operacional_fila_atendimento`, que exige o parâmetro de URL
`unidade` com o id da base. Os comandos escrevem direto na tabela:

| Verbo | Efeito |
|---|---|
| `cham` | marca `chamado em`, incrementa `chamado vezes` |
| `ini` | status → `EM_ATENDIMENTO`, marca `iniciado em` |
| `fim` | status → `FINALIZADO`, marca `finalizado em` |
| `vat` | desfaz o finalizar |
| `vfi` | desfaz o iniciar |

Nada cancela nem apaga linhas, exceto a reconciliação de duplicata do §3.

---

## 10. Armadilhas (leia antes de começar)

Cada uma destas custou tempo real na implementação do portal.

1. **Branches do Bubble têm esquema próprio.** A tabela da fila não existe na
   versão `test`. Toda chamada precisa apontar para a versão certa, senão o
   resultado é falso-negativo convincente.

2. **`plano_mn` tem underscore.** Os vizinhos usam espaço (`numero os`,
   `status da os`, `data e hora`), mas este campo é `plano_mn`. Ler com espaço
   devolve vazio em silêncio e **nenhuma OS é reconhecida como óleo** — nenhum
   erro é lançado.

3. **`Contratos.unidade` está vazio em contratos antigos.** A base confiável é
   `contrato → placa → Unidade` (o campo `Unidade` de `veiculos_frota`).

4. **`custom.unidade` ≠ `custom.unidades`.** O primeiro é "Unidades", as bases.
   O segundo é "Frota", a camada de empresa/locadora. Nomes quase iguais,
   significados diferentes; o `frota` do contrato **não** serve para localizar a
   base. A cidade do veículo também não: há moto com cidade ITAPETININGA
   pertencente à unidade CAMPINAS.

5. **Campo de objeto vazio vem como `{}`, não ausente** — e `{}` é verdadeiro.
   Sempre cheque se tem conteúdo antes de usar.

6. **Datas chegam como epoch em milissegundos** em alguns endpoints e ISO em
   outros. Normalize, ou ordenação e subtração viram `NaN`.

7. **Option set chega como o texto do display** (`"EM_ATENDIMENTO"`), não como a
   chave interna.

8. **Listas do Bubble vêm no máximo 50 por vez.** Não é problema para esta
   feature, mas é para listagens maiores.

9. **Dev e live têm bancos separados.** As coordenadas gravadas em dev **não**
   vão para live; precisam ser preenchidas lá.

10. **Geocodificar endereço sem número é impreciso demais para 150 m.** Um
    endereço sem número devolveu o centroide da rua, 192 m de onde a base
    realmente estava. O caminho confiável é pegar a coordenada no local.

---

## 11. Checklist de implementação

- [ ] Ler status ao abrir e enquanto a tela estiver viva
- [ ] Aplicar as 5 regras de elegibilidade (§4), com a normalização de texto
- [ ] Base pelo veículo, nunca pelo contrato
- [ ] Pedir localização ao aparecer a OS elegível; exigir no toque
- [ ] Haversine contra a base; esconder quando a base não tem coordenada
- [ ] Tratar `entrada` ausente na resposta de entrada como falha
- [ ] Reconsultar antes de gravar e travar o botão durante a requisição
- [ ] Derivar a posição; nunca procurar campo de posição
- [ ] Notificação de posição ≤ 3 uma vez por entrada
- [ ] Estados: oferta, aguardando, prepare-se, chamado, em atendimento

## 12. Referência no portal web

Se precisar comparar com a implementação funcionando:

| Arquivo | O que tem |
|---|---|
| `src/lib/geo.ts` | Haversine e validação de ponto |
| `src/lib/fila-oleo.ts` | regra de "é troca de óleo" e escolha da OS |
| `src/lib/buscar-fila.ts` | chamadas e mapeamento das respostas |
| `src/hooks/useFilaOleo.ts` | polling, permissão, distância, entrada |
| `src/components/portal/sections/FilaTrocaOleo.tsx` | tela da fila |
| `src/components/portal/AlertaFilaOleo.tsx` | banner de topo |
