<script setup>
import { ref, computed, onMounted } from 'vue'

const eventos = ref([])
const minhasInscricoes = ref([])
const participantesEvento = ref([])
const mostrarParticipantes = ref(false)
const eventoParticipantes = ref(null)
const carregandoParticipantes = ref(false)
const busca = ref('')

const carregando = ref(true)
const erro = ref('')
const mensagem = ref('')

const mostrarLogin = ref(false)
const mostrarFormulario = ref(false)
const mostrarDetalhes = ref(false)
const mostrarMinhasInscricoes = ref(false)

const eventoSelecionado = ref(null)

const email = ref('')
const senha = ref('')
const erroLogin = ref('')
const carregandoLogin = ref(false)
const usuarioLogado = ref(null)

const salvandoEvento = ref(false)
const erroEvento = ref('')

const novoEvento = ref({
  titulo: '',
  descricao: '',
  data: '',
  horario: '',
  local: '',
  vagas: '',
  linkOnline: ''
})


async function carregarEventos() {
  try {
    const resposta = await fetch('http://localhost:3000/api/eventos')

    if (!resposta.ok) {
      throw new Error('Erro ao carregar eventos.')
    }

    eventos.value = await resposta.json()

  } catch (e) {
    console.error(e)
    erro.value = 'Não foi possível carregar os eventos.'
  } finally {
    carregando.value = false
  }
}


const eventosFiltrados = computed(() => {
  const texto = busca.value.toLowerCase().trim()

  if (!texto) {
    return eventos.value
  }

  return eventos.value.filter(evento =>
    (evento.titulo || '').toLowerCase().includes(texto) ||
    (evento.descricao || '').toLowerCase().includes(texto) ||
    (evento.local || '').toLowerCase().includes(texto)
  )
})


const totalEventos = computed(() => eventos.value.length)


const totalVagas = computed(() => {
  return eventos.value.reduce(
    (total, evento) => total + Number(evento.vagas || 0),
    0
  )
})


const vagasDisponiveis = computed(() => {
  return eventos.value.reduce(
    (total, evento) => total + Number(evento.vagasDisponiveis || 0),
    0
  )
})

 const totalInscricoes = computed(() => {
  return eventos.value.reduce((total, evento) => {
    const totalDoEvento =
      Number(evento.vagas || 0) -
      Number(evento.vagasDisponiveis || 0)

    return total + totalDoEvento
  }, 0)
})

function formatarData(data) {
  if (!data) return ''

  const partes = data.split('-')

  if (partes.length !== 3) {
    return data
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`
}


function mostrarMensagem(texto) {
  mensagem.value = texto

  setTimeout(() => {
    mensagem.value = ''
  }, 3500)
}


/* =========================
   LOGIN
========================= */

function abrirLogin() {
  email.value = ''
  senha.value = ''
  erroLogin.value = ''
  mostrarLogin.value = true
}


function fecharLogin() {
  mostrarLogin.value = false
  erroLogin.value = ''
}


async function fazerLogin() {

  erroLogin.value = ''

  if (!email.value || !senha.value) {
    erroLogin.value = 'Preencha o e-mail e a senha.'
    return
  }

  carregandoLogin.value = true

  try {

    const resposta = await fetch(
      'http://localhost:3000/api/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.value,
          senha: senha.value
        })
      }
    )

    const dados = await resposta.json()

    if (!resposta.ok) {
      throw new Error(
        dados.mensagem || 'E-mail ou senha inválidos.'
      )
    }

    usuarioLogado.value = dados.usuario

    mostrarLogin.value = false

    mostrarMensagem(
      `Login realizado com sucesso! Bem-vindo, ${dados.usuario.nome}.`
    )

    email.value = ''
    senha.value = ''

    if (usuarioLogado.value.perfil === 'participante') {
      await carregarMinhasInscricoes()
    }

  } catch (e) {

    erroLogin.value = e.message

  } finally {

    carregandoLogin.value = false

  }
}


function sair() {

  usuarioLogado.value = null
  minhasInscricoes.value = []

  mostrarDetalhes.value = false
  mostrarMinhasInscricoes.value = false
  mostrarFormulario.value = false

  mostrarMensagem('Você saiu do sistema.')
}


/* =========================
   ADMIN
========================= */

function abrirNovoEvento() {

  erroEvento.value = ''

  novoEvento.value = {
    titulo: '',
    descricao: '',
    data: '',
    horario: '',
    local: '',
    vagas: '',
    linkOnline: ''
  }

  mostrarFormulario.value = true
}


function fecharFormulario() {
  mostrarFormulario.value = false
  erroEvento.value = ''
}


async function cadastrarEvento() {

  erroEvento.value = ''

  if (
    !novoEvento.value.titulo ||
    !novoEvento.value.descricao ||
    !novoEvento.value.data ||
    !novoEvento.value.horario ||
    !novoEvento.value.local ||
    !novoEvento.value.vagas
  ) {
    erroEvento.value =
      'Preencha todos os campos obrigatórios.'

    return
  }

  if (Number(novoEvento.value.vagas) <= 0) {
    erroEvento.value =
      'A quantidade de vagas deve ser maior que zero.'

    return
  }

  salvandoEvento.value = true

  try {

    const resposta = await fetch(
      'http://localhost:3000/api/eventos',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          titulo: novoEvento.value.titulo,
          descricao: novoEvento.value.descricao,
          data: novoEvento.value.data,
          horario: novoEvento.value.horario,
          local: novoEvento.value.local,
          vagas: Number(novoEvento.value.vagas),
          linkOnline: novoEvento.value.linkOnline,
          responsavelId: usuarioLogado.value?.id || 1
        })
      }
    )

    const dados = await resposta.json()

    if (!resposta.ok) {
      throw new Error(
        dados.mensagem || 'Erro ao cadastrar evento.'
      )
    }

    await carregarEventos()

    mostrarFormulario.value = false

    mostrarMensagem(
      'Evento cadastrado com sucesso!'
    )

  } catch (e) {

    console.error(e)

    erroEvento.value = e.message

  } finally {

    salvandoEvento.value = false

  }
}


async function cancelarEvento(id) {

  const confirmar = window.confirm(
    'Deseja realmente cancelar este evento?'
  )

  if (!confirmar) {
    return
  }

  try {

    const resposta = await fetch(
      `http://localhost:3000/api/eventos/${id}`,
      {
        method: 'DELETE'
      }
    )

    const dados = await resposta.json()

    if (!resposta.ok) {
      throw new Error(
        dados.mensagem || 'Erro ao cancelar evento.'
      )
    }

    await carregarEventos()

    mostrarMensagem(
      'Evento cancelado com sucesso!'
    )

  } catch (e) {

    console.error(e)

    mostrarMensagem(
      e.message || 'Não foi possível cancelar o evento.'
    )
  }
}


/* =========================
   PARTICIPANTE
========================= */

async function carregarMinhasInscricoes() {

  if (!usuarioLogado.value) {
    return
  }

  try {

    const resposta = await fetch(
      `http://localhost:3000/api/inscricoes/usuario/${usuarioLogado.value.id}`
    )

    if (!resposta.ok) {
      throw new Error('Erro ao carregar inscrições.')
    }

    minhasInscricoes.value = await resposta.json()

  } catch (e) {

    console.error(e)

    minhasInscricoes.value = []
  }
}

async function abrirParticipantes(evento) {
  eventoParticipantes.value = evento
  participantesEvento.value = []
  mostrarParticipantes.value = true
  carregandoParticipantes.value = true

  try {
    const resposta = await fetch(
      `http://localhost:3000/api/eventos/${evento.id}/participantes`
    )

    if (!resposta.ok) {
      throw new Error('Não foi possível carregar os participantes.')
    }

    participantesEvento.value = await resposta.json()

  } catch (e) {
    console.error(e)
    mostrarMensagem(e.message || 'Erro ao carregar participantes.')
  } finally {
    carregandoParticipantes.value = false
  }
}

function fecharParticipantes() {
  mostrarParticipantes.value = false
  participantesEvento.value = []
  eventoParticipantes.value = null
}

async function abrirDetalhes(evento) {

  try {

    const resposta = await fetch(
      `http://localhost:3000/api/eventos/${evento.id}`
    )

    if (!resposta.ok) {
      throw new Error('Evento não encontrado.')
    }

    eventoSelecionado.value = await resposta.json()

    mostrarDetalhes.value = true

  } catch (e) {

    mostrarMensagem(e.message)
  }
}


function fecharDetalhes() {
  mostrarDetalhes.value = false
  eventoSelecionado.value = null
}


function estaInscrito(eventoId) {

  return minhasInscricoes.value.find(
    inscricao =>
      inscricao.eventoId === eventoId &&
      (
        inscricao.status === 'Confirmada' ||
        inscricao.status === 'Fila de espera'
      )
  )
}


async function inscreverNoEvento() {

  if (!usuarioLogado.value) {
    fecharDetalhes()
    abrirLogin()
    return
  }

  if (usuarioLogado.value.perfil !== 'participante') {
    mostrarMensagem(
      'Apenas participantes podem realizar inscrições.'
    )
    return
  }

  try {

    const resposta = await fetch(
      'http://localhost:3000/api/inscricoes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventoId: eventoSelecionado.value.id,
          usuarioId: usuarioLogado.value.id
        })
      }
    )

    const dados = await resposta.json()

    if (!resposta.ok) {
      throw new Error(
        dados.mensagem || 'Não foi possível realizar a inscrição.'
      )
    }

    await carregarEventos()
    await carregarMinhasInscricoes()

    eventoSelecionado.value =
      eventos.value.find(
        evento =>
          evento.id === eventoSelecionado.value.id
      ) || eventoSelecionado.value

    mostrarMensagem(dados.mensagem)

  } catch (e) {

    mostrarMensagem(e.message)
  }
}


async function cancelarInscricao(inscricaoId) {

  const confirmar = window.confirm(
    'Deseja realmente cancelar esta inscrição?'
  )

  if (!confirmar) {
    return
  }

  try {

    const resposta = await fetch(
      `http://localhost:3000/api/inscricoes/${inscricaoId}`,
      {
        method: 'DELETE'
      }
    )

    const dados = await resposta.json()

    if (!resposta.ok) {
      throw new Error(
        dados.mensagem ||
        'Não foi possível cancelar a inscrição.'
      )
    }

    await carregarEventos()
    await carregarMinhasInscricoes()

    mostrarMensagem(
      'Inscrição cancelada com sucesso!'
    )

  } catch (e) {

    mostrarMensagem(e.message)
  }
}


function abrirMinhasInscricoes() {

  carregarMinhasInscricoes()

  mostrarMinhasInscricoes.value = true
}


function fecharMinhasInscricoes() {
  mostrarMinhasInscricoes.value = false
}


function tentarNovamente() {
  erro.value = ''
  carregando.value = true
  carregarEventos()
}


onMounted(() => {
  carregarEventos()
})
</script>


<template>

  <div class="pagina">

    <!-- HEADER -->

    <header class="header">

      <div class="logo-area">

        <div class="logo">
          📅
        </div>

        <div>
          <h2>Eventos</h2>

          <p>
            Sistema de Gerenciamento de Eventos
          </p>
        </div>

      </div>


      <!-- USUÁRIO -->

      <div
        v-if="usuarioLogado"
        class="usuario-area"
      >

        <div class="usuario-info">

          <div class="avatar">
            👤
          </div>

          <div>

            <strong>
              {{ usuarioLogado.nome }}
            </strong>

            <small>
              {{
                usuarioLogado.perfil === 'admin'
                  ? 'Administrador'
                  : 'Participante'
              }}
            </small>

          </div>

        </div>


        <button
          v-if="usuarioLogado.perfil === 'participante'"
          class="btn-minhas"
          @click="abrirMinhasInscricoes"
        >
          Minhas inscrições
        </button>


        <button
          class="btn-sair"
          @click="sair"
        >
          Sair
        </button>

      </div>


      <button
        v-else
        class="btn-entrar"
        @click="abrirLogin"
      >
        Entrar
      </button>

    </header>


    <!-- MENSAGEM -->

    <div
      v-if="mensagem"
      class="mensagem"
    >

      <span>✓</span>

      {{ mensagem }}

      <button @click="mensagem = ''">
        ×
      </button>

    </div>


    <!-- ===================================
         PAINEL ADMIN
    ==================================== -->

    <main
      v-if="
        usuarioLogado &&
        usuarioLogado.perfil === 'admin'
      "
      class="admin"
    >

      <div class="admin-topo">

        <div>

          <span class="admin-badge">
            ⚙️ Área administrativa
          </span>

          <h1>
            Painel de Administração
          </h1>

          <p>
            Gerencie eventos, vagas e inscrições.
          </p>

        </div>


        <button
          class="btn-novo"
          @click="abrirNovoEvento"
        >
          ＋ Novo evento
        </button>

      </div>


      <!-- DASHBOARD -->

      <div class="dashboard">

        <div class="dashboard-card">

          <div class="dashboard-icone azul">
            📅
          </div>

          <div>

            <span>
              Total de eventos
            </span>

            <strong>
              {{ totalEventos }}
            </strong>

          </div>

        </div>


        <div class="dashboard-card">

          <div class="dashboard-icone roxo">
            🎟️
          </div>

          <div>

            <span>
              Total de vagas
            </span>

            <strong>
              {{ totalVagas }}
            </strong>

          </div>

        </div>


        <div class="dashboard-card">

          <div class="dashboard-icone verde">
            ✓
          </div>

          <div>

            <span>
              Vagas disponíveis
            </span>

            <strong>
              {{ vagasDisponiveis }}
            </strong>

          </div>

        </div>


        <div class="dashboard-card">

          <div class="dashboard-icone laranja">
            👥
          </div>

          <div>

            <span>
              Inscrições
            </span>

            <strong>
              {{ totalInscricoes }}
            </strong>

          </div>

        </div>

      </div>


      <!-- EVENTOS ADMIN -->

      <section class="gerenciamento">

        <div class="gerenciamento-topo">

          <div>

            <h2>
              Gerenciamento de eventos
            </h2>

            <p>
              Visualize e gerencie os eventos cadastrados.
            </p>

          </div>

          <div class="contador">
            {{ eventos.length }} eventos
          </div>

        </div>


        <div
          v-if="carregando"
          class="estado"
        >

          <div class="spinner"></div>

          <h3>
            Carregando eventos...
          </h3>

        </div>


        <div
          v-else-if="eventos.length === 0"
          class="estado"
        >

          <div class="icone-vazio">
            📅
          </div>

          <h3>
            Nenhum evento cadastrado
          </h3>

          <p>
            Comece criando seu primeiro evento.
          </p>

          <button
            class="btn-novo"
            @click="abrirNovoEvento"
          >
            ＋ Criar primeiro evento
          </button>

        </div>


        <div
          v-else
          class="tabela-container"
        >

          <table>

            <thead>

              <tr>

                <th>Evento</th>
                <th>Data</th>
                <th>Local</th>
                <th>Vagas</th>
                <th>Status</th>
                <th>Ações</th>

              </tr>

            </thead>


            <tbody>

              <tr
                v-for="evento in eventos"
                :key="evento.id"
              >

                <td>

                  <div class="evento-nome">

                    <div class="evento-mini">
                      📅
                    </div>

                    <div>

                      <strong>
                        {{ evento.titulo }}
                      </strong>

                      <small>
                        {{ evento.descricao }}
                      </small>

                    </div>

                  </div>

                </td>


                <td>
                  {{ formatarData(evento.data) }}

                  <br>

                  <small>
                    {{ evento.horario }}
                  </small>
                </td>


                <td>
                  📍 {{ evento.local }}
                </td>


                <td>
                  {{ evento.vagasDisponiveis }}
                  /
                  {{ evento.vagas }}
                </td>


                <td>

                  <span
                    class="status"
                    :class="{
                      aberto: evento.status === 'Aberto',
                      lotado: evento.status === 'Sem vagas',
                      cancelado: evento.status === 'Cancelado',
                      encerrado: evento.status === 'Encerrado'
                    }"
                  >
                    {{ evento.status }}
                  </span>

                </td>


                <td>

                <div class="acoes">

                  <button
                    class="btn-acao visualizar"
                    title="Visualizar"
                    @click="abrirDetalhes(evento)"
                  >
                    👁️
                  </button>

                  <button
                    type="button"
                    class="btn-acao participantes"
                    title="Participantes"
                    @click="abrirParticipantes(evento)"
                  >
                    👥
                  </button>

                  <button
                    class="btn-acao excluir"
                    title="Cancelar"
                    @click="cancelarEvento(evento.id)"
                    :disabled="
                      evento.status === 'Cancelado' ||
                      evento.status === 'Encerrado'
                    "
                  >
                    🗑️
                  </button>

                </div>

                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </section>

    </main>


    <!-- ===================================
         ÁREA PARTICIPANTE
    ==================================== -->

    <main
      v-else-if="
        usuarioLogado &&
        usuarioLogado.perfil === 'participante'
      "
      class="participante"
    >

      <section class="participante-topo">

        <div>

          <span class="participante-badge">
            👋 Área do participante
          </span>

          <h1>
            Olá, {{ usuarioLogado.nome }}!
          </h1>

          <p>
            Encontre um evento e garanta sua participação.
          </p>

        </div>


        <button
          class="btn-minhas-grande"
          @click="abrirMinhasInscricoes"
        >
          📋 Minhas inscrições
        </button>

      </section>


      <section class="resumo-participante">

        <div>

          <span class="resumo-icone">
            🎟️
          </span>

          <div>

            <small>
              Minhas inscrições
            </small>

            <strong>
              {{ totalInscricoes }}
            </strong>

          </div>

        </div>


        <div>

          <span class="resumo-icone">
            📅
          </span>

          <div>

            <small>
              Eventos disponíveis
            </small>

            <strong>
              {{ eventos.length }}
            </strong>

          </div>

        </div>

      </section>


      <section class="eventos-participante">

        <div class="secao-topo">

          <div>

            <h2>
              Eventos disponíveis
            </h2>

            <p>
              Escolha um evento para participar.
            </p>

          </div>


          <div class="busca-pequena">

            🔍

            <input
              v-model="busca"
              placeholder="Buscar evento..."
            >

          </div>

        </div>


        <div
          v-if="carregando"
          class="estado"
        >

          <div class="spinner"></div>

          <h3>
            Carregando eventos...
          </h3>

        </div>


        <div
          v-else-if="eventosFiltrados.length === 0"
          class="estado"
        >

          <div class="icone-vazio">
            📅
          </div>

          <h3>
            Nenhum evento encontrado.
          </h3>

        </div>


        <div
          v-else
          class="cards-participante"
        >

          <article
            v-for="evento in eventosFiltrados"
            :key="evento.id"
            class="card-participante"
          >

            <div class="card-participante-topo">

              <span
                class="status"
                :class="{
                  aberto: evento.status === 'Aberto',
                  lotado: evento.status === 'Sem vagas',
                  cancelado: evento.status === 'Cancelado',
                  encerrado: evento.status === 'Encerrado'
                }"
              >
                {{ evento.status }}
              </span>

            </div>


            <h3>
              {{ evento.titulo }}
            </h3>


            <p>
              {{ evento.descricao }}
            </p>


            <div class="dados-evento">

              <span>
                📅 {{ formatarData(evento.data) }}
              </span>

              <span>
                🕐 {{ evento.horario }}
              </span>

              <span>
                📍 {{ evento.local }}
              </span>

              <span>
                👥 {{ evento.vagasDisponiveis }} vagas
              </span>

            </div>


            <button
              class="btn-detalhes"
              @click="abrirDetalhes(evento)"
            >
              Ver detalhes
            </button>

          </article>

        </div>

      </section>

    </main>


    <!-- ===================================
         PÁGINA PÚBLICA
    ==================================== -->

    <template v-else>

      <section class="hero">

        <div class="decoracao esquerda">
          📅
        </div>

        <div class="decoracao direita">
          👥
        </div>


        <div class="hero-conteudo">

          <span class="badge">
            ✨ Bem-vindo!
          </span>

          <h1>
            Descubra eventos incríveis
          </h1>

          <p>
            Encontre atividades, workshops, palestras e muito mais.
            <br>
            Participe e aproveite experiências únicas.
          </p>


          <div class="busca">

            <div class="campo">

              <span class="lupa">
                🔍
              </span>

              <input
                v-model="busca"
                type="text"
                placeholder="Buscar por nome do evento, local ou tema..."
              >

            </div>

            <button class="btn-buscar">
              Buscar
            </button>

          </div>

        </div>

      </section>


      <main class="conteudo">

        <section class="titulo-secao">

          <div class="icone-titulo">
            📅
          </div>

          <div class="linha-titulo">

            <span></span>

            <h2>
              Eventos disponíveis
            </h2>

            <span></span>

          </div>

          <p>
            Encontre um evento e faça sua inscrição.
          </p>

        </section>


        <div
          v-if="carregando"
          class="estado"
        >

          <div class="spinner"></div>

          <h3>
            Carregando eventos...
          </h3>

        </div>


        <div
          v-else-if="erro"
          class="estado"
        >

          <div class="icone-estado">
            ⚠️
          </div>

          <h3>
            Ops! Algo deu errado.
          </h3>

          <p>
            {{ erro }}
          </p>

          <button
            class="btn-recarregar"
            @click="tentarNovamente"
          >
            Tentar novamente
          </button>

        </div>


        <div
          v-else-if="eventosFiltrados.length === 0"
          class="estado"
        >

          <div class="icone-vazio">
            📅

            <span>
              ×
            </span>
          </div>

          <h3>
            {{
              busca
                ? 'Nenhum evento encontrado.'
                : 'Nenhum evento cadastrado.'
            }}
          </h3>

          <p>
            {{
              busca
                ? 'Tente pesquisar por outro nome, local ou tema.'
                : 'Ainda não há eventos disponíveis.'
            }}
          </p>

        </div>


        <div
          v-else
          class="lista-eventos"
        >

          <article
            v-for="evento in eventosFiltrados"
            :key="evento.id"
            class="card"
          >

            <div class="card-topo">

              <span
                class="status"
                :class="{
                  aberto: evento.status === 'Aberto',
                  lotado: evento.status === 'Sem vagas',
                  cancelado: evento.status === 'Cancelado',
                  encerrado: evento.status === 'Encerrado'
                }"
              >
                {{ evento.status }}
              </span>

            </div>


            <h3>
              {{ evento.titulo }}
            </h3>


            <p class="descricao">
              {{ evento.descricao }}
            </p>


            <div class="informacoes">

              <div>

                <span>📅</span>

                <div>
                  <small>Data</small>

                  <strong>
                    {{ formatarData(evento.data) }}
                  </strong>
                </div>

              </div>


              <div>

                <span>🕐</span>

                <div>
                  <small>Horário</small>

                  <strong>
                    {{ evento.horario }}
                  </strong>
                </div>

              </div>


              <div>

                <span>📍</span>

                <div>
                  <small>Local</small>

                  <strong>
                    {{ evento.local }}
                  </strong>
                </div>

              </div>


              <div>

                <span>👥</span>

                <div>
                  <small>Vagas</small>

                  <strong>
                    {{ evento.vagasDisponiveis }}
                    /
                    {{ evento.vagas }}
                  </strong>
                </div>

              </div>

            </div>


            <button
              class="btn-evento"
              @click="abrirDetalhes(evento)"
            >
              Ver detalhes
            </button>

          </article>

        </div>

      </main>

    </template>


    <!-- FOOTER -->

    <footer>
      © 2026 Sistema de Gerenciamento de Eventos
    </footer>


    <!-- ===================================
         MODAL PARTICIPANTES
    ==================================== -->

    <div
      v-if="mostrarParticipantes"
      class="modal-fundo"
      @click.self="fecharParticipantes"
    >
      <div class="modal modal-participantes">

        <button
          class="fechar"
          type="button"
          @click="fecharParticipantes"
        >
          ×
        </button>

        <div class="login-icone">
          👥
        </div>

        <h2>
          Participantes
        </h2>

        <p class="login-subtitulo">
          {{
            eventoParticipantes
              ? eventoParticipantes.titulo
              : 'Participantes do evento'
          }}
        </p>

        <div
          v-if="carregandoParticipantes"
          class="estado-modal"
        >
          <div class="spinner"></div>
          <p>Carregando participantes...</p>
        </div>

        <div
          v-else-if="participantesEvento.length === 0"
          class="sem-inscricoes"
        >
          <div>👥</div>
          <h3>Nenhum participante inscrito.</h3>
          <p>Ainda não há inscrições para este evento.</p>
        </div>

        <div
          v-else
          class="lista-participantes"
        >
          <div
            v-for="(participante, index) in participantesEvento"
            :key="participante.id || participante.usuarioId || index"
            class="item-participante"
          >
            <div class="avatar-participante">
              👤
            </div>

            <div class="dados-participante">
              <strong>
                {{
                  participante.nome ||
                  participante.usuario?.nome ||
                  'Participante'
                }}
              </strong>

              <span>
                {{
                  participante.email ||
                  participante.usuario?.email ||
                  'E-mail não informado'
                }}
              </span>

              <small
                v-if="participante.status"
              >
                Status: {{ participante.status }}
                <template
                  v-if="
                    participante.status === 'Fila de espera' &&
                    participante.posicaoFila
                  "
                >
                  • Posição {{ participante.posicaoFila }}
                </template>
              </small>
            </div>
          </div>
        </div>

      </div>
    </div>


    <!-- ===================================
         MODAL LOGIN
    ==================================== -->

    <div
      v-if="mostrarLogin"
      class="modal-fundo"
      @click.self="fecharLogin"
    >

      <div class="modal">

        <button
          class="fechar"
          @click="fecharLogin"
        >
          ×
        </button>


        <div class="login-icone">
          🔐
        </div>


        <h2>
          Acessar sistema
        </h2>

        <p class="login-subtitulo">
          Entre com seus dados para continuar.
        </p>


        <div class="campo-login">

          <label>
            E-mail
          </label>

          <input
            v-model="email"
            type="email"
            placeholder="Digite seu e-mail"
            @keyup.enter="fazerLogin"
          >

        </div>


        <div class="campo-login">

          <label>
            Senha
          </label>

          <input
            v-model="senha"
            type="password"
            placeholder="Digite sua senha"
            @keyup.enter="fazerLogin"
          >

        </div>


        <div
          v-if="erroLogin"
          class="erro-login"
        >
          ⚠️ {{ erroLogin }}
        </div>


        <button
          class="btn-login"
          :disabled="carregandoLogin"
          @click="fazerLogin"
        >
          {{
            carregandoLogin
              ? 'Entrando...'
              : 'Entrar'
          }}
        </button>


        <p class="login-ajuda">
          Acesso para participantes e administradores.
        </p>

      </div>

    </div>


    <!-- ===================================
         MODAL NOVO EVENTO
    ==================================== -->

    <div
      v-if="mostrarFormulario"
      class="modal-fundo"
    >

      <div class="modal modal-evento">

        <button
          class="fechar"
          @click="fecharFormulario"
        >
          ×
        </button>


        <div class="formulario-topo">

          <div class="formulario-icone">
            📅
          </div>

          <div>

            <h2>
              Novo evento
            </h2>

            <p>
              Preencha os dados do evento.
            </p>

          </div>

        </div>


        <div class="formulario">

          <div class="campo-login">

            <label>
              Título *
            </label>

            <input
              v-model="novoEvento.titulo"
              type="text"
              placeholder="Ex.: Workshop de JavaScript"
            >

          </div>


          <div class="campo-login">

            <label>
              Descrição *
            </label>

            <textarea
              v-model="novoEvento.descricao"
              placeholder="Descreva o evento..."
            ></textarea>

          </div>


          <div class="dupla">

            <div class="campo-login">

              <label>
                Data *
              </label>

              <input
                v-model="novoEvento.data"
                type="date"
              >

            </div>


            <div class="campo-login">

              <label>
                Horário *
              </label>

              <input
                v-model="novoEvento.horario"
                type="time"
              >

            </div>

          </div>


          <div class="campo-login">

            <label>
              Local *
            </label>

            <input
              v-model="novoEvento.local"
              type="text"
              placeholder="Ex.: Auditório principal"
            >

          </div>


          <div class="dupla">

            <div class="campo-login">

              <label>
                Quantidade de vagas *
              </label>

              <input
                v-model="novoEvento.vagas"
                type="number"
                min="1"
                placeholder="Ex.: 30"
              >

            </div>


            <div class="campo-login">

              <label>
                Link online
              </label>

              <input
                v-model="novoEvento.linkOnline"
                type="url"
                placeholder="https://..."
              >

            </div>

          </div>


          <div
            v-if="erroEvento"
            class="erro-login"
          >
            ⚠️ {{ erroEvento }}
          </div>


          <div class="botoes-formulario">

            <button
              class="btn-cancelar"
              @click="fecharFormulario"
            >
              Cancelar
            </button>

            <button
              class="btn-login"
              :disabled="salvandoEvento"
              @click="cadastrarEvento"
            >
              {{
                salvandoEvento
                  ? 'Cadastrando...'
                  : 'Cadastrar evento'
              }}
            </button>

          </div>

        </div>

      </div>

    </div>


    <!-- ===================================
         MODAL DETALHES
    ==================================== -->

    <div
      v-if="mostrarDetalhes && eventoSelecionado"
      class="modal-fundo"
      @click.self="fecharDetalhes"
    >

      <div class="modal modal-detalhes">

        <button
          class="fechar"
          @click="fecharDetalhes"
        >
          ×
        </button>


        <span
          class="status"
          :class="{
            aberto: eventoSelecionado.status === 'Aberto',
            lotado: eventoSelecionado.status === 'Sem vagas',
            cancelado: eventoSelecionado.status === 'Cancelado',
            encerrado: eventoSelecionado.status === 'Encerrado'
          }"
        >
          {{ eventoSelecionado.status }}
        </span>


        <h2 class="titulo-detalhes">
          {{ eventoSelecionado.titulo }}
        </h2>


        <p class="descricao-detalhes">
          {{ eventoSelecionado.descricao }}
        </p>


        <div class="detalhes-lista">

          <div>
            <span>📅</span>

            <div>
              <small>Data</small>

              <strong>
                {{ formatarData(eventoSelecionado.data) }}
              </strong>
            </div>
          </div>


          <div>
            <span>🕐</span>

            <div>
              <small>Horário</small>

              <strong>
                {{ eventoSelecionado.horario }}
              </strong>
            </div>
          </div>


          <div>
            <span>📍</span>

            <div>
              <small>Local</small>

              <strong>
                {{ eventoSelecionado.local }}
              </strong>
            </div>
          </div>


          <div>
            <span>👥</span>

            <div>
              <small>Vagas disponíveis</small>

              <strong>
                {{ eventoSelecionado.vagasDisponiveis }}
                /
                {{ eventoSelecionado.vagas }}
              </strong>
            </div>
          </div>

        </div>


        <div
          v-if="eventoSelecionado.linkOnline"
          class="link-online"
        >
          🔗 Evento online disponível
        </div>


        <div
          v-if="usuarioLogado?.perfil === 'participante'"
          class="acao-inscricao"
        >

          <div
            v-if="estaInscrito(eventoSelecionado.id)"
            class="inscricao-existente"
          >

            <strong>
              {{
                estaInscrito(eventoSelecionado.id).status ===
                'Confirmada'
                  ? '✓ Você está inscrito neste evento!'
                  : '⏳ Você está na fila de espera.'
              }}
            </strong>

            <small
              v-if="
                estaInscrito(eventoSelecionado.id).status ===
                'Fila de espera'
              "
            >
              Posição na fila:
              {{
                estaInscrito(eventoSelecionado.id).posicaoFila
              }}
            </small>

          </div>


          <button
            v-else
            class="btn-inscrever"
            :disabled="
              eventoSelecionado.status === 'Cancelado' ||
              eventoSelecionado.status === 'Encerrado'
            "
            @click="inscreverNoEvento"
          >
            {{
              eventoSelecionado.status === 'Sem vagas'
                ? 'Entrar na fila de espera'
                : 'Inscrever-se'
            }}
          </button>

        </div>


        <button
          v-else
          class="btn-inscrever"
          @click="inscreverNoEvento"
        >
          Entrar para se inscrever
        </button>

      </div>

    </div>


    <!-- ===================================
         MODAL MINHAS INSCRIÇÕES
    ==================================== -->

    <div
      v-if="mostrarMinhasInscricoes"
      class="modal-fundo"
      @click.self="fecharMinhasInscricoes"
    >

      <div class="modal modal-inscricoes">

        <button
          class="fechar"
          @click="fecharMinhasInscricoes"
        >
          ×
        </button>


        <div class="login-icone">
          📋
        </div>


        <h2>
          Minhas inscrições
        </h2>

        <p class="login-subtitulo">
          Confira os eventos em que você está inscrito.
        </p>


        <div
          v-if="minhasInscricoes.length === 0"
          class="sem-inscricoes"
        >

          <div>
            📅
          </div>

          <h3>
            Você ainda não possui inscrições.
          </h3>

          <p>
            Escolha um evento e faça sua inscrição.
          </p>

        </div>


        <div
          v-else
          class="lista-inscricoes"
        >

          <div
            v-for="inscricao in minhasInscricoes"
            :key="inscricao.id"
            class="item-inscricao"
          >

            <div>

              <span
                class="status"
                :class="{
                  aberto: inscricao.status === 'Confirmada',
                  lotado: inscricao.status === 'Fila de espera',
                  cancelado:
                    inscricao.status === 'Cancelada'
                }"
              >
                {{ inscricao.status }}
              </span>


              <h3>
                {{ inscricao.evento?.titulo }}
              </h3>


              <p
                v-if="inscricao.evento"
              >
                📅
                {{ formatarData(inscricao.evento.data) }}
                às
                {{ inscricao.evento.horario }}
              </p>


              <p
                v-if="
                  inscricao.status === 'Fila de espera'
                "
                class="posicao"
              >
                ⏳ Posição na fila:
                {{ inscricao.posicaoFila }}
              </p>

            </div>


            <button
              v-if="
                inscricao.status === 'Confirmada' ||
                inscricao.status === 'Fila de espera'
              "
              class="btn-cancelar-inscricao"
              @click="cancelarInscricao(inscricao.id)"
            >
              Cancelar
            </button>

          </div>

        </div>

      </div>

    </div>

  </div>

</template>


<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family:
    Arial,
    Helvetica,
    sans-serif;

  background: #f7f8fc;

  color: #17233d;
}

button,
input,
textarea {
  font-family: inherit;
}

button {
  cursor: pointer;
}

.admin {
  width: 100%;
  max-width: none;

  margin: 0;

  padding: 55px 5% 80px;
}


/* HEADER */

.header {
  height: 90px;

  padding: 0 5%;

  display: flex;

  align-items: center;

  justify-content: space-between;

  background: white;

  border-bottom: 1px solid #e9ebf2;
}

.logo-area {
  display: flex;

  align-items: center;

  gap: 14px;
}

.logo {
  width: 50px;
  height: 50px;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 14px;

  background:
    linear-gradient(
      135deg,
      #5a3fd6,
      #3262e8
    );

  font-size: 25px;

  box-shadow:
    0 8px 20px rgba(70, 70, 180, 0.2);
}

.logo-area h2 {
  font-size: 22px;

  color: #17233d;
}

.logo-area p {
  margin-top: 3px;

  color: #77849b;

  font-size: 13px;
}


/* USUÁRIO */

.usuario-area {
  display: flex;

  align-items: center;

  gap: 12px;
}

.usuario-info {
  display: flex;

  align-items: center;

  gap: 9px;

  margin-right: 5px;
}

.avatar {
  width: 38px;
  height: 38px;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 50%;

  background: #eef1ff;

  font-size: 18px;
}

.usuario-info strong {
  display: block;

  font-size: 13px;

  color: #25324b;
}

.usuario-info small {
  display: block;

  margin-top: 2px;

  color: #7d899d;

  font-size: 11px;
}

.btn-entrar {
  padding: 13px 27px;

  border: none;

  border-radius: 10px;

  background:
    linear-gradient(
      135deg,
      #3262e8,
      #443fd7
    );

  color: white;

  font-size: 15px;

  font-weight: bold;
}

.btn-sair,
.btn-minhas {
  padding: 9px 14px;

  border: 1px solid #e0e4ec;

  border-radius: 8px;

  background: white;

  color: #56637a;

  font-weight: bold;

  font-size: 12px;
}

.btn-minhas {
  color: #4354ca;

  border-color: #dfe2ff;

  background: #f5f6ff;
}


/* MENSAGEM */

.mensagem {
  position: fixed;

  top: 105px;

  right: 30px;

  z-index: 200;

  display: flex;

  align-items: center;

  gap: 9px;

  padding: 13px 15px;

  border: 1px solid #c8ecd8;

  border-radius: 10px;

  background: #e5f8ed;

  color: #176b3d;

  box-shadow:
    0 10px 30px rgba(30, 80, 50, 0.12);

  font-size: 14px;

  font-weight: bold;
}

.mensagem span {
  width: 23px;
  height: 23px;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 50%;

  background: #32a968;

  color: white;
}

.mensagem button {
  border: none;

  background: transparent;

  color: #176b3d;

  font-size: 20px;
}


/* HERO */

.hero {
  min-height: 430px;

  position: relative;

  display: flex;

  justify-content: center;

  overflow: hidden;

  background:
    radial-gradient(
      circle at center top,
      white 0%,
      #f3f4ff 45%,
      #edf2ff 100%
    );
}

.hero-conteudo {
  width: min(900px, 90%);

  padding-top: 60px;

  text-align: center;

  position: relative;

  z-index: 2;
}

.badge,
.admin-badge,
.participante-badge {
  display: inline-block;

  padding: 8px 15px;

  margin-bottom: 15px;

  border-radius: 30px;

  background: #ebeaff;

  color: #4d45c8;

  font-size: 13px;

  font-weight: bold;
}

.hero h1 {
  color: #15213d;

  font-size: 52px;

  line-height: 1.1;

  letter-spacing: -1.5px;
}

.hero-conteudo > p {
  margin: 20px 0 32px;

  color: #68758e;

  font-size: 17px;

  line-height: 1.6;
}

.decoracao {
  position: absolute;

  width: 72px;
  height: 72px;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 20px;

  font-size: 30px;

  opacity: 0.75;
}

.decoracao.esquerda {
  left: 9%;

  top: 120px;

  background: #eeedff;

  transform: rotate(-7deg);
}

.decoracao.direita {
  right: 9%;

  top: 105px;

  background: #e5f8f5;

  transform: rotate(8deg);
}


/* BUSCA */

.busca {
  width: 100%;

  min-height: 78px;

  display: flex;

  align-items: center;

  padding: 8px;

  border: 1px solid #e1e5ef;

  border-radius: 17px;

  background: white;

  box-shadow:
    0 15px 35px rgba(48, 65, 110, 0.12);
}

.campo {
  flex: 1;

  display: flex;

  align-items: center;

  padding-left: 18px;
}

.lupa {
  font-size: 21px;
}

.campo input {
  width: 100%;

  padding: 15px;

  border: none;

  outline: none;

  color: #273550;

  font-size: 15px;
}

.btn-buscar {
  height: 60px;

  padding: 0 35px;

  border: none;

  border-radius: 12px;

  background:
    linear-gradient(
      135deg,
      #3262e8,
      #493ed8
    );

  color: white;

  font-weight: bold;
}


/* CONTEÚDO */

.conteudo {
  width: min(1200px, 88%);

  margin: auto;

  padding: 65px 0 80px;
}

.titulo-secao {
  margin-bottom: 35px;

  text-align: center;
}

.icone-titulo {
  margin-bottom: 12px;

  font-size: 24px;
}

.linha-titulo {
  display: flex;

  align-items: center;

  justify-content: center;

  gap: 20px;
}

.linha-titulo span {
  width: 40px;

  height: 3px;

  border-radius: 10px;

  background: #6258dd;
}

.linha-titulo h2 {
  color: #17233d;

  font-size: 28px;
}

.titulo-secao p {
  margin-top: 10px;

  color: #77849b;

  font-size: 15px;
}


/* STATUS */

.status {
  display: inline-block;

  padding: 6px 12px;

  border-radius: 20px;

  font-size: 12px;

  font-weight: bold;
}

.status.aberto {
  color: #176b3c;

  background: #ddf6e7;
}

.status.lotado {
  color: #8c610f;

  background: #fff2d1;
}

.status.cancelado {
  color: #9e3030;

  background: #ffe1e1;
}

.status.encerrado {
  color: #596579;

  background: #e9ecf1;
}


/* ESTADOS */

.estado {
  min-height: 280px;

  padding: 40px;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  text-align: center;

  background: white;

  border: 1px solid #e4e7ef;

  border-radius: 17px;

  box-shadow:
    0 8px 25px rgba(35, 50, 90, 0.06);
}

.estado h3 {
  margin-top: 18px;

  font-size: 20px;
}

.estado p {
  margin-top: 8px;

  color: #77849b;

  font-size: 14px;
}

.spinner {
  width: 42px;
  height: 42px;

  border: 4px solid #e2e5ee;

  border-top-color: #3262e8;

  border-radius: 50%;

  animation: girar 0.8s linear infinite;
}

@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}

.icone-vazio {
  width: 90px;
  height: 90px;

  display: flex;

  align-items: center;

  justify-content: center;

  margin-bottom: 10px;

  border-radius: 50%;

  background: #f0f2ff;

  font-size: 40px;
}

.btn-recarregar {
  margin-top: 20px;

  padding: 11px 20px;

  border: none;

  border-radius: 9px;

  background: #3262e8;

  color: white;

  font-weight: bold;
}


/* CARDS PÚBLICOS */

.lista-eventos {
  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(300px, 1fr)
    );

  gap: 24px;
}

.card {
  padding: 24px;

  background: white;

  border: 1px solid #e4e7ef;

  border-radius: 16px;

  box-shadow:
    0 8px 25px rgba(35, 50, 90, 0.06);
}

.card h3 {
  margin-bottom: 9px;

  color: #17233d;

  font-size: 21px;
}

.descricao {
  min-height: 45px;

  color: #748198;

  font-size: 14px;

  line-height: 1.5;
}

.card-topo {
  margin-bottom: 14px;
}

.informacoes {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 15px;

  margin: 20px 0;

  padding: 18px 0;

  border-top: 1px solid #edf0f5;

  border-bottom: 1px solid #edf0f5;
}

.informacoes > div {
  display: flex;

  align-items: center;

  gap: 9px;
}

.informacoes > div > span {
  font-size: 18px;
}

.informacoes small {
  display: block;

  margin-bottom: 2px;

  color: #929daf;

  font-size: 11px;
}

.informacoes strong {
  color: #34425c;

  font-size: 13px;
}

.btn-evento {
  width: 100%;

  height: 45px;

  border: none;

  border-radius: 9px;

  background:
    linear-gradient(
      135deg,
      #3262e8,
      #493ed8
    );

  color: white;

  font-weight: bold;
}


/* =========================
   ADMIN
========================= */

.admin {
  width: min(1250px, 90%);

  margin: 0 auto;

  padding: 55px 0 80px;
}

.admin-topo {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 35px;
  gap: 30px;
}

.admin-topo > div:first-child {
  margin: 0;
  padding: 0;
  text-align: left;
}

.participante-topo {
  display: flex;

  align-items: center;

  justify-content: space-between;

  margin-bottom: 30px;
}

.admin-topo h1 {
  margin: 0;
  padding: 0;
  color: #17233d;
  font-size: 38px;
  line-height: 1.15;
  letter-spacing: -0.8px;
  text-align: left;
}

.participante-topo h1 {
  color: #17233d;

  font-size: 34px;
}

.admin-topo p {
  margin: 12px 0 0 0;
  padding: 0;
  color: #77849b;
  font-size: 16px;
  text-align: left;
}

.participante-topo p {
  margin-top: 7px;

  color: #77849b;

  font-size: 15px;
}

.admin-badge {
  display: flex;
  align-items: center;
  width: fit-content;
  margin: 0 0 18px 0;
  padding: 9px 16px;
  border-radius: 30px;
  background: #ebeaff;
  color: #4d45c8;
  font-size: 13px;
  font-weight: bold;
}

.btn-novo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  min-width: 160px;
  height: 52px;

  padding: 0 22px;
  margin: 67px 0 0 0;

  border: none;
  border-radius: 10px;

  background:
    linear-gradient(
      135deg,
      #3262e8,
      #493ed8
    );

  color: white;
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
}


/* DASHBOARD */

.dashboard {
  display: grid;

  grid-template-columns:
    repeat(
      4,
      1fr
    );

  gap: 18px;

  margin-bottom: 30px;
}

.dashboard-card {
  min-height: 115px;

  display: flex;

  align-items: center;

  gap: 16px;

  padding: 20px;

  border: 1px solid #e5e8ef;

  border-radius: 15px;

  background: white;

  box-shadow:
    0 7px 22px rgba(35, 50, 90, 0.05);
}

.dashboard-icone {
  width: 52px;
  height: 52px;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 13px;

  font-size: 23px;
}

.dashboard-icone.azul {
  background: #eaf0ff;
}

.dashboard-icone.roxo {
  background: #f0ecff;
}

.dashboard-icone.verde {
  background: #e5f8ee;
}

.dashboard-icone.laranja {
  background: #fff2df;
}

.dashboard-card span {
  display: block;

  color: #7b879b;

  font-size: 12px;
}

.dashboard-card strong {
  display: block;

  margin-top: 5px;

  color: #17233d;

  font-size: 27px;
}


/* GERENCIAMENTO */

.gerenciamento {
  padding: 25px;

  border: 1px solid #e4e7ef;

  border-radius: 16px;

  background: white;

  box-shadow:
    0 8px 25px rgba(35, 50, 90, 0.05);
}

.gerenciamento-topo {
  display: flex;

  align-items: center;

  justify-content: space-between;

  margin-bottom: 25px;
}

.gerenciamento-topo h2 {
  color: #17233d;

  font-size: 21px;
}

.gerenciamento-topo p {
  margin-top: 5px;

  color: #7b879b;

  font-size: 13px;
}

.contador {
  padding: 7px 13px;

  border-radius: 20px;

  background: #f0f2f7;

  color: #66738a;

  font-size: 12px;

  font-weight: bold;
}


/* TABELA */

.tabela-container {
  overflow-x: auto;
}

table {
  width: 100%;

  border-collapse: collapse;
}

thead {
  background: #f8f9fc;
}

th {
  padding: 14px;

  color: #758197;

  font-size: 11px;

  text-align: left;

  text-transform: uppercase;
}

td {
  padding: 17px 14px;

  border-top: 1px solid #edf0f4;

  color: #56637a;

  font-size: 13px;
}

td small {
  color: #98a1b0;

  font-size: 11px;
}

.evento-nome {
  display: flex;

  align-items: center;

  gap: 10px;

  min-width: 220px;
}

.evento-mini {
  width: 38px;
  height: 38px;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 9px;

  background: #eef1ff;
}

.evento-nome strong {
  display: block;

  max-width: 220px;

  overflow: hidden;

  color: #25324b;

  text-overflow: ellipsis;

  white-space: nowrap;
}

.evento-nome small {
  display: block;

  max-width: 220px;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;
}

.acoes {
  display: flex;

  gap: 6px;
}

.btn-acao {
  width: 32px;
  height: 32px;

  display: flex;

  align-items: center;

  justify-content: center;

  border: 1px solid #e2e5eb;

  border-radius: 7px;

  background: white;
}

.btn-acao:disabled {
  opacity: 0.4;

  cursor: not-allowed;
}


/* =========================
   PARTICIPANTE
========================= */

.participante {
  width: min(1200px, 90%);

  margin: auto;

  padding: 50px 0 80px;
}

.participante-badge {
  margin-bottom: 10px;
}

.btn-minhas-grande {
  padding: 13px 20px;

  border: 1px solid #dfe2ff;

  border-radius: 10px;

  background: #f3f4ff;

  color: #4b51c7;

  font-weight: bold;
}

.resumo-participante {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 18px;

  margin-bottom: 35px;
}

.resumo-participante > div {
  display: flex;

  align-items: center;

  gap: 14px;

  padding: 20px;

  border: 1px solid #e5e8ef;

  border-radius: 15px;

  background: white;
}

.resumo-icone {
  width: 48px;
  height: 48px;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 12px;

  background: #eef1ff;

  font-size: 22px;
}

.resumo-participante small {
  display: block;

  color: #7b879b;

  font-size: 12px;
}

.resumo-participante strong {
  display: block;

  margin-top: 4px;

  font-size: 25px;
}

.eventos-participante {
  padding: 25px;

  border: 1px solid #e4e7ef;

  border-radius: 16px;

  background: white;
}

.secao-topo {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 20px;

  margin-bottom: 25px;
}

.secao-topo h2 {
  font-size: 21px;
}

.secao-topo p {
  margin-top: 5px;

  color: #7b879b;

  font-size: 13px;
}

.busca-pequena {
  width: 260px;

  height: 42px;

  display: flex;

  align-items: center;

  gap: 8px;

  padding: 0 12px;

  border: 1px solid #dfe3eb;

  border-radius: 9px;

  color: #77849b;
}

.busca-pequena input {
  width: 100%;

  border: none;

  outline: none;

  font-size: 13px;
}

.cards-participante {
  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(280px, 1fr)
    );

  gap: 20px;
}

.card-participante {
  padding: 22px;

  border: 1px solid #e5e8ef;

  border-radius: 14px;

  background: #fbfcff;
}

.card-participante h3 {
  margin: 12px 0 8px;

  color: #17233d;

  font-size: 19px;
}

.card-participante > p {
  min-height: 42px;

  color: #748198;

  font-size: 13px;

  line-height: 1.5;
}

.dados-evento {
  display: flex;

  flex-direction: column;

  gap: 8px;

  margin: 18px 0;

  color: #5d6a80;

  font-size: 12px;
}

.btn-detalhes {
  width: 100%;

  height: 42px;

  border: none;

  border-radius: 8px;

  background: #eef1ff;

  color: #4655c8;

  font-weight: bold;
}


/* =========================
   MODAIS
========================= */

.modal-fundo {
  position: fixed;

  inset: 0;

  z-index: 100;

  display: flex;

  align-items: center;

  justify-content: center;

  padding: 20px;

  background: rgba(18, 27, 48, 0.58);

  backdrop-filter: blur(5px);
}

.modal {
  width: min(430px, 100%);

  position: relative;

  padding: 38px;

  border-radius: 20px;

  background: white;

  box-shadow:
    0 25px 70px rgba(20, 30, 60, 0.25);

  animation: aparecer 0.2s ease;
}

.modal-evento {
  width: min(650px, 100%);

  max-height: 90vh;

  overflow-y: auto;
}

.modal-detalhes {
  width: min(600px, 100%);
}

.modal-inscricoes {
  width: min(650px, 100%);

  max-height: 85vh;

  overflow-y: auto;
}

@keyframes aparecer {

  from {
    opacity: 0;

    transform: translateY(12px) scale(0.98);
  }

  to {
    opacity: 1;

    transform: translateY(0) scale(1);
  }

}

.fechar {
  position: absolute;

  top: 16px;

  right: 18px;

  width: 34px;
  height: 34px;

  border: none;

  border-radius: 50%;

  background: #f2f4f8;

  color: #667085;

  font-size: 23px;
}

.login-icone,
.formulario-icone {
  width: 64px;
  height: 64px;

  display: flex;

  align-items: center;

  justify-content: center;

  margin-bottom: 20px;

  border-radius: 18px;

  background: #eef1ff;

  font-size: 30px;
}

.modal h2 {
  margin-bottom: 8px;

  color: #17233d;

  font-size: 27px;
}

.login-subtitulo {
  margin-bottom: 28px;

  color: #77849b;

  font-size: 14px;
}

.formulario-topo {
  display: flex;

  align-items: center;

  gap: 15px;

  margin-bottom: 25px;
}

.formulario-topo .formulario-icone {
  margin: 0;
}

.formulario-topo h2 {
  margin-bottom: 3px;
}

.formulario-topo p {
  color: #7b879b;

  font-size: 13px;
}

.campo-login {
  margin-bottom: 18px;
}

.campo-login label {
  display: block;

  margin-bottom: 7px;

  color: #34425c;

  font-size: 13px;

  font-weight: bold;
}

.campo-login input,
.campo-login textarea {
  width: 100%;

  border: 1px solid #dfe3eb;

  border-radius: 9px;

  outline: none;

  color: #25324b;

  background: white;

  font-size: 14px;
}

.campo-login input {
  height: 48px;

  padding: 0 14px;
}

.campo-login textarea {
  min-height: 90px;

  padding: 12px 14px;

  resize: vertical;
}

.campo-login input:focus,
.campo-login textarea:focus {
  border-color: #4d62e5;

  box-shadow:
    0 0 0 3px rgba(77, 98, 229, 0.1);
}

.dupla {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 15px;
}

.erro-login {
  margin-bottom: 16px;

  padding: 11px 13px;

  border-radius: 8px;

  background: #fff0f0;

  color: #a52f2f;

  font-size: 13px;
}

.btn-login {
  width: 100%;

  height: 49px;

  border: none;

  border-radius: 9px;

  background:
    linear-gradient(
      135deg,
      #3262e8,
      #493ed8
    );

  color: white;

  font-size: 15px;

  font-weight: bold;
}

.btn-login:disabled {
  opacity: 0.65;

  cursor: not-allowed;
}

.login-ajuda {
  margin-top: 20px;

  color: #98a1b2;

  font-size: 12px;

  text-align: center;
}

.botoes-formulario {
  display: grid;

  grid-template-columns: 1fr 1.5fr;

  gap: 10px;

  margin-top: 10px;
}

.btn-cancelar {
  height: 49px;

  border: 1px solid #dfe3eb;

  border-radius: 9px;

  background: white;

  color: #596579;

  font-weight: bold;
}


/* PARTICIPANTES */

.modal-participantes {
  width: min(650px, 100%);
  max-height: 85vh;
  overflow-y: auto;
}

.estado-modal {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #77849b;
}

.lista-participantes {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 430px;
  overflow-y: auto;
}

.item-participante {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 14px;
  border: 1px solid #e4e7ef;
  border-radius: 11px;
  background: #fafbfe;
}

.avatar-participante {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eef1ff;
  font-size: 19px;
}

.dados-participante {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dados-participante strong {
  color: #25324b;
  font-size: 14px;
}

.dados-participante span {
  color: #77849b;
  font-size: 12px;
}

.dados-participante small {
  color: #4655c8;
  font-size: 11px;
  font-weight: bold;
}

@media (max-width: 700px) {
  .modal-participantes {
    max-height: 90vh;
  }
}


/* DETALHES */

.titulo-detalhes {
  margin-top: 15px !important;

  font-size: 28px !important;
}

.descricao-detalhes {
  margin: 15px 0 25px;

  color: #68758e;

  line-height: 1.6;
}

.detalhes-lista {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 15px;

  padding: 20px 0;

  border-top: 1px solid #edf0f5;

  border-bottom: 1px solid #edf0f5;
}

.detalhes-lista > div {
  display: flex;

  align-items: center;

  gap: 10px;
}

.detalhes-lista > div > span {
  font-size: 21px;
}

.detalhes-lista small {
  display: block;

  color: #929daf;

  font-size: 11px;
}

.detalhes-lista strong {
  display: block;

  margin-top: 3px;

  color: #34425c;

  font-size: 13px;
}

.link-online {
  margin-top: 18px;

  padding: 12px;

  border-radius: 9px;

  background: #eef7ff;

  color: #3262e8;

  font-size: 13px;

  font-weight: bold;
}

.acao-inscricao {
  margin-top: 25px;
}

.btn-inscrever {
  width: 100%;

  height: 50px;

  border: none;

  border-radius: 9px;

  background:
    linear-gradient(
      135deg,
      #3262e8,
      #493ed8
    );

  color: white;

  font-weight: bold;

  font-size: 15px;
}

.btn-inscrever:disabled {
  background: #adb5c4;

  cursor: not-allowed;
}

.inscricao-existente {
  display: flex;

  flex-direction: column;

  gap: 5px;

  padding: 15px;

  border-radius: 9px;

  background: #e8f8ef;

  color: #176b3d;

  text-align: center;
}

.inscricao-existente small {
  font-size: 12px;
}


/* INSCRIÇÕES */

.sem-inscricoes {
  padding: 35px 10px;

  text-align: center;
}

.sem-inscricoes > div {
  font-size: 45px;
}

.sem-inscricoes h3 {
  margin-top: 15px;

  color: #25324b;

  font-size: 17px;
}

.sem-inscricoes p {
  margin-top: 7px;

  color: #7b879b;

  font-size: 13px;
}

.lista-inscricoes {
  display: flex;

  flex-direction: column;

  gap: 12px;
}

.item-inscricao {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 15px;

  padding: 17px;

  border: 1px solid #e4e7ef;

  border-radius: 11px;

  background: #fafbfe;
}

.item-inscricao h3 {
  margin-top: 8px;

  color: #25324b;

  font-size: 16px;
}

.item-inscricao p {
  margin-top: 5px;

  color: #7b879b;

  font-size: 12px;
}

.item-inscricao .posicao {
  color: #9a6a14;

  font-weight: bold;
}

.btn-cancelar-inscricao {
  flex-shrink: 0;

  padding: 9px 13px;

  border: 1px solid #ffd4d4;

  border-radius: 8px;

  background: #fff3f3;

  color: #a52f2f;

  font-size: 12px;

  font-weight: bold;
}


/* FOOTER */

footer {
  padding: 25px;

  border-top: 1px solid #e8eaf0;

  background: white;

  color: #8a94a7;

  text-align: center;

  font-size: 13px;
}


/* RESPONSIVO */

@media (max-width: 900px) {

  .dashboard {
    grid-template-columns: 1fr 1fr;
  }

}

@media (max-width: 700px) {

  .header {
    height: auto;

    padding: 18px 5%;
  }

  .logo-area p {
    display: none;
  }

  .usuario-info {
    display: none;
  }

  .usuario-area {
    gap: 6px;
  }

  .btn-minhas {
    display: none;
  }

  .hero {
    min-height: 480px;
  }

  .hero-conteudo {
    padding-top: 45px;
  }

  .hero h1 {
    font-size: 37px;
  }

  .hero-conteudo > p {
    font-size: 15px;
  }

  .decoracao {
    display: none;
  }

  .busca {
    flex-direction: column;
  }

  .campo {
    width: 100%;
  }

  .btn-buscar {
    width: 100%;
  }

  .linha-titulo span {
    width: 20px;
  }

  .linha-titulo h2 {
    font-size: 22px;
  }

  .informacoes {
    grid-template-columns: 1fr;
  }

  .admin,
  .participante {
    width: 92%;

    padding-top: 35px;
  }

  .admin-topo,
  .participante-topo {
    align-items: flex-start;

    flex-direction: column;

    gap: 20px;
  }

  .admin-topo h1,
  .participante-topo h1 {
    font-size: 28px;
  }

  .dashboard {
    grid-template-columns: 1fr;
  }

  .gerenciamento,
  .eventos-participante {
    padding: 18px;
  }

  .resumo-participante {
    grid-template-columns: 1fr;
  }

  .secao-topo {
    align-items: flex-start;

    flex-direction: column;
  }

  .busca-pequena {
    width: 100%;
  }

  .modal {
    padding: 30px 24px;
  }

  .dupla {
    grid-template-columns: 1fr;
  }

  .botoes-formulario {
    grid-template-columns: 1fr;
  }

  .detalhes-lista {
    grid-template-columns: 1fr;
  }

  .item-inscricao {
    align-items: flex-start;

    flex-direction: column;
  }

  .btn-cancelar-inscricao {
    width: 100%;
  }

  .mensagem {
    right: 15px;
    left: 15px;
  }
}
</style>