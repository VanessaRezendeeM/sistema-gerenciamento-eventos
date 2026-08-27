const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

const PORTA = 3000;

// ===============================
// DADOS DO SISTEMA
// ===============================

let usuarios = [
    {
        id: 1,
        nome: 'Administrador',
        email: 'admin@email.com',
        senha: '123456',
        perfil: 'admin'
    },
    {
        id: 2,
        nome: 'Vanessa',
        email: 'participante@email.com',
        senha: '123456',
        perfil: 'participante'
    },
    {
        id: 3,
        nome: 'João',
        email: 'joao@email.com',
        senha: '123456',
        perfil: 'participante'
    }
];

let eventos = [];

let inscricoes = [];

let proximoEventoId = 1;
let proximaInscricaoId = 1;

const ARQUIVO_DADOS = './dados.json';

function salvarDados() {
    const dados = {
        eventos,
        inscricoes,
        proximoEventoId,
        proximaInscricaoId
    };

    fs.writeFileSync(
        ARQUIVO_DADOS,
        JSON.stringify(dados, null, 2),
        'utf8'
    );
}

function carregarDados() {
    if (fs.existsSync(ARQUIVO_DADOS)) {
        const dados = JSON.parse(
            fs.readFileSync(ARQUIVO_DADOS, 'utf8')
        );

        eventos = dados.eventos || [];
        inscricoes = dados.inscricoes || [];

        proximoEventoId =
            dados.proximoEventoId || 1;

        proximaInscricaoId =
            dados.proximaInscricaoId || 1;
    }
}

// ===============================
// FUNÇÕES AUXILIARES
// ===============================

function atualizarStatusEvento(evento) {
    if (evento.status === 'Cancelado') {
        return;
    }

    const confirmados = inscricoes.filter(
        inscricao =>
            inscricao.eventoId === evento.id &&
            inscricao.status === 'Confirmada'
    ).length;

    if (new Date(evento.data + 'T' + evento.horario) < new Date()) {
        evento.status = 'Encerrado';
    } else if (confirmados >= evento.vagas) {
        evento.status = 'Sem vagas';
    } else {
        evento.status = 'Aberto';
    }
}

function promoverFila(eventoId) {
    const evento = eventos.find(e => e.id === eventoId);

    if (!evento || evento.status === 'Cancelado') {
        return;
    }

    const confirmados = inscricoes.filter(
        i => i.eventoId === eventoId && i.status === 'Confirmada'
    ).length;

    const vagasDisponiveis = evento.vagas - confirmados;

    if (vagasDisponiveis <= 0) {
        atualizarStatusEvento(evento);
        return;
    }

    const fila = inscricoes
        .filter(
            i =>
                i.eventoId === eventoId &&
                i.status === 'Fila de espera'
        )
        .sort((a, b) => a.posicaoFila - b.posicaoFila);

    if (fila.length > 0) {
        const proximo = fila[0];

        proximo.status = 'Confirmada';
        proximo.posicaoFila = null;

        fila.slice(1).forEach((inscricao, index) => {
            inscricao.posicaoFila = index + 1;
        });
    }

    atualizarStatusEvento(evento);
}

// ===============================
// ROTA INICIAL
// ===============================

app.get('/', (req, res) => {
    res.json({
        mensagem: 'API do Sistema de Gerenciamento de Eventos funcionando!'
    });
});

// ===============================
// LOGIN
// ===============================

app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;

    const usuario = usuarios.find(
        u => u.email === email && u.senha === senha
    );

    if (!usuario) {
        return res.status(401).json({
            mensagem: 'E-mail ou senha inválidos.'
        });
    }

    res.json({
        mensagem: 'Login realizado com sucesso.',
        usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            perfil: usuario.perfil
        }
    });
});

// ===============================
// EVENTOS
// ===============================

// Listar eventos
app.get('/api/eventos', (req, res) => {
    eventos.forEach(atualizarStatusEvento);

    const eventosComInformacoes = eventos.map(evento => {
        const confirmados = inscricoes.filter(
            i =>
                i.eventoId === evento.id &&
                i.status === 'Confirmada'
        ).length;

        return {
            ...evento,
            vagasDisponiveis: evento.vagas - confirmados
        };
    });

    res.json(eventosComInformacoes);
});

// Buscar evento por ID
app.get('/api/eventos/:id', (req, res) => {
    const id = Number(req.params.id);

    const evento = eventos.find(e => e.id === id);

    if (!evento) {
        return res.status(404).json({
            mensagem: 'Evento não encontrado.'
        });
    }

    atualizarStatusEvento(evento);

    const confirmados = inscricoes.filter(
        i =>
            i.eventoId === id &&
            i.status === 'Confirmada'
    ).length;

    res.json({
        ...evento,
        vagasDisponiveis: evento.vagas - confirmados
    });
});

// Criar evento
app.post('/api/eventos', (req, res) => {
    const {
        titulo,
        descricao,
        data,
        horario,
        local,
        vagas,
        linkOnline,
        responsavelId
    } = req.body;

    if (!titulo || !descricao || !data || !horario || !local || !vagas) {
        return res.status(400).json({
            mensagem: 'Preencha todos os campos obrigatórios.'
        });
    }

    if (Number(vagas) <= 0) {
        return res.status(400).json({
            mensagem: 'A quantidade de vagas deve ser maior que zero.'
        });
    }

    const dataEvento = new Date(`${data}T${horario}`);

    if (dataEvento <= new Date()) {
        return res.status(400).json({
            mensagem: 'A data e horário do evento devem ser futuros.'
        });
    }

    const evento = {
        id: proximoEventoId++,
        titulo,
        descricao,
        data,
        horario,
        local,
        vagas: Number(vagas),
        linkOnline: linkOnline || '',
        responsavelId: Number(responsavelId) || 1,
        status: 'Aberto'
    };

    eventos.push(evento);
    salvarDados();

    res.status(201).json(evento);
});

// Editar evento
app.put('/api/eventos/:id', (req, res) => {
    const id = Number(req.params.id);

    const evento = eventos.find(e => e.id === id);

    if (!evento) {
        return res.status(404).json({
            mensagem: 'Evento não encontrado.'
        });
    }

    if (evento.status === 'Cancelado' || evento.status === 'Encerrado') {
        return res.status(400).json({
            mensagem: 'Este evento não pode mais ser alterado.'
        });
    }

    const {
        titulo,
        descricao,
        data,
        horario,
        local,
        vagas,
        linkOnline
    } = req.body;

    if (titulo) evento.titulo = titulo;
    if (descricao) evento.descricao = descricao;
    if (data) evento.data = data;
    if (horario) evento.horario = horario;
    if (local) evento.local = local;
    if (linkOnline !== undefined) evento.linkOnline = linkOnline;

    if (vagas !== undefined) {
        const novasVagas = Number(vagas);

        const confirmados = inscricoes.filter(
            i =>
                i.eventoId === id &&
                i.status === 'Confirmada'
        ).length;

        if (novasVagas < confirmados) {
            return res.status(400).json({
                mensagem:
                    'A quantidade de vagas não pode ser menor que o número de participantes confirmados.'
            });
        }

        evento.vagas = novasVagas;
    }

    atualizarStatusEvento(evento);

    res.json(evento);
});

// Cancelar evento
app.delete('/api/eventos/:id', (req, res) => {
    const id = Number(req.params.id);

    const evento = eventos.find(e => e.id === id);

    if (!evento) {
        return res.status(404).json({
            mensagem: 'Evento não encontrado.'
        });
    }

    evento.status = 'Cancelado';

    inscricoes
        .filter(i => i.eventoId === id)
        .forEach(i => {
            i.status = 'Cancelada pelo evento';
            i.posicaoFila = null;
        });

    res.json({
        mensagem: 'Evento cancelado com sucesso.',
        evento
    });
});

// ===============================
// INSCRIÇÕES
// ===============================

// Fazer inscrição
app.post('/api/inscricoes', (req, res) => {
    const { eventoId, usuarioId } = req.body;

    const evento = eventos.find(e => e.id === Number(eventoId));

    if (!evento) {
        return res.status(404).json({
            mensagem: 'Evento não encontrado.'
        });
    }

    atualizarStatusEvento(evento);

    if (
        evento.status === 'Cancelado' ||
        evento.status === 'Encerrado'
    ) {
        return res.status(400).json({
            mensagem: 'Este evento não aceita novas inscrições.'
        });
    }

    const inscricaoExistente = inscricoes.find(
        i =>
            i.eventoId === Number(eventoId) &&
            i.usuarioId === Number(usuarioId) &&
            (
                i.status === 'Confirmada' ||
                i.status === 'Fila de espera'
            )
    );

    if (inscricaoExistente) {
        return res.status(400).json({
            mensagem: 'Você já possui uma inscrição neste evento.'
        });
    }

    const confirmados = inscricoes.filter(
        i =>
            i.eventoId === Number(eventoId) &&
            i.status === 'Confirmada'
    ).length;

    let status;
    let posicaoFila = null;

    if (confirmados < evento.vagas) {
        status = 'Confirmada';
    } else {
        status = 'Fila de espera';

        const pessoasNaFila = inscricoes.filter(
            i =>
                i.eventoId === Number(eventoId) &&
                i.status === 'Fila de espera'
        ).length;

        posicaoFila = pessoasNaFila + 1;
    }

    const inscricao = {
        id: proximaInscricaoId++,
        eventoId: Number(eventoId),
        usuarioId: Number(usuarioId),
        status,
        posicaoFila,
        dataInscricao: new Date().toISOString()
    };

    inscricoes.push(inscricao);

    atualizarStatusEvento(evento);
    salvarDados();

    res.status(201).json({
        mensagem:
            status === 'Confirmada'
                ? 'Inscrição realizada com sucesso!'
                : 'Evento lotado. Você entrou na fila de espera.',
        inscricao
    });
});

// Listar inscrições do usuário
app.get('/api/inscricoes/usuario/:usuarioId', (req, res) => {
    const usuarioId = Number(req.params.usuarioId);

    const resultado = inscricoes
        .filter(i => i.usuarioId === usuarioId)
        .map(inscricao => {
            const evento = eventos.find(
                e => e.id === inscricao.eventoId
            );

            return {
                ...inscricao,
                evento
            };
        });

    res.json(resultado);
});

// Cancelar inscrição
app.delete('/api/inscricoes/:id', (req, res) => {
    const id = Number(req.params.id);

    const inscricao = inscricoes.find(i => i.id === id);

    if (!inscricao) {
        return res.status(404).json({
            mensagem: 'Inscrição não encontrada.'
        });
    }

    if (
        inscricao.status !== 'Confirmada' &&
        inscricao.status !== 'Fila de espera'
    ) {
        return res.status(400).json({
            mensagem: 'Esta inscrição não pode ser cancelada.'
        });
    }

    const evento = eventos.find(
        e => e.id === inscricao.eventoId
    );

    if (!evento) {
        return res.status(404).json({
            mensagem: 'Evento não encontrado.'
        });
    }

    if (evento.status === 'Encerrado') {
        return res.status(400).json({
            mensagem: 'Não é possível cancelar após o encerramento do evento.'
        });
    }

    const eraConfirmada = inscricao.status === 'Confirmada';

    inscricao.status = 'Cancelada';
    inscricao.posicaoFila = null;

    if (eraConfirmada) {
        promoverFila(evento.id);
    } else {
        const fila = inscricoes
            .filter(
                i =>
                    i.eventoId === evento.id &&
                    i.status === 'Fila de espera'
            )
            .sort((a, b) => a.posicaoFila - b.posicaoFila);

        fila.forEach((item, index) => {
            item.posicaoFila = index + 1;
        });

        atualizarStatusEvento(evento);
    }
    salvarDados();
    
    res.json({
        mensagem: 'Inscrição cancelada com sucesso.'
    });
});

// ===============================
// PARTICIPANTES DE UM EVENTO
// ===============================

app.get('/api/eventos/:id/participantes', (req, res) => {
    const eventoId = Number(req.params.id);

    const participantes = inscricoes
        .filter(i => i.eventoId === eventoId)
        .map(inscricao => {
            const usuario = usuarios.find(
                u => u.id === inscricao.usuarioId
            );

            return {
                inscricaoId: inscricao.id,
                nome: usuario?.nome,
                email: usuario?.email,
                status: inscricao.status,
                posicaoFila: inscricao.posicaoFila
            };
        });

    res.json(participantes);
});

// ===============================
// INICIAR SERVIDOR
// ===============================
carregarDados();

app.listen(PORTA, () => {
    console.log('=================================');
    console.log('MEU SERVIDOR NOVO ESTÁ RODANDO');
    console.log('Porta: 3000');
    console.log('=================================');
});