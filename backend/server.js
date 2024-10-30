const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.json());

function generateToken() {
    return crypto.randomBytes(20).toString('hex'); // Gera um token de 40 caracteres
}

let tokens = {
    id: 0,
    accessToken: generateToken(), // Gera o token inicial aleatório
    refreshToken: generateToken(), // Gera um refresh token aleatório
    expireAt: new Date(Date.now() + 3600 * 1000) // Expira em 1 hora
};

// Middleware para validar o header TenantId
app.use((req, res, next) => {
    const tenantId = req.header('TenantId');
    if (!tenantId) {
        return res.status(400).json({ error: 'TenantId é obrigatório no header' });
    }
    // Validação de TenantId, pode ser expandida para verificar no banco de dados, etc.
    console.log(`Requisição feita com TenantId: ${tenantId}`);
    next();
});

// Endpoint de login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username && password) {
        tokens.accessToken = generateToken();
        tokens.refreshToken = generateToken();
        tokens.expireAt = new Date(Date.now() + 3600 * 1000);
        tokens.id += 1;

        return res.json({
            id: tokens.id,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expireAt: tokens.expireAt
        });
    } else {
        return res.status(400).json({ error: 'Credenciais inválidas' });
    }
});

// EndPoint de eventos (payload de controle de horário)
app.post('/evento', (req, res) => {
    const { Cliente, IdCliente, IdChamado, NomeRespondeu, TelefoneRespondeu, OpcaoEscolhida } = req.body;

    // Log para verificar o payload recebido
    console.log('Payload recebido:', req.body);

    // Verifica se todos os campos obrigatórios estão presentes e não são os valores placeholders (ex: 'string', 0)
    if (Cliente === 'string' || IdCliente === 0 || IdChamado === 0 || NomeRespondeu === 'string' || TelefoneRespondeu === 'string' || OpcaoEscolhida === 'string') {
        console.log('Dados inválidos detectados: ', { Cliente, IdCliente, IdChamado, NomeRespondeu, TelefoneRespondeu, OpcaoEscolhida });
        return res.status(400).json({ error: 'Dados do evento são inválidos ou placeholders' });
    }

    // Se os dados forem válidos, continuar o processamento
    console.log('Evento recebido com sucesso:', { Cliente, IdCliente, IdChamado, NomeRespondeu, TelefoneRespondeu, OpcaoEscolhida });

    return res.status(200).json({ message: 'Evento recebido com sucesso!' });
});

// Endpoint de notificação simples
app.post('/notificacao', (req, res) => {
    const payload = req.body;

    console.log('Notificação simples recebida:', payload);

    // Processamento do payload
    if (payload.Telefones) {
        return res.status(200).json({ message: 'Notificação recebida com sucesso!' });
    } else {
        return res.status(400).json({ error: 'Dados da notificação incompletos' });
    }
});

// Recebimento de post evento
app.post('/evento-resposta', (req, res) => {
    const { Cliente, IdCliente, IdChamado, NomeRespondeu, TelefoneRespondeu, OpcaoEscolhida, TenantId, Telefones, menu } = req.body;

    console.log(`Resposta do evento:
        TenantId: ${TenantId},
        Cliente: ${Cliente},
        IdCliente: ${IdCliente},
        IdChamado: ${IdChamado},
        NomeRespondeu: ${NomeRespondeu},
        TelefoneRespondeu: ${TelefoneRespondeu},
        OpcaoEscolhida: ${OpcaoEscolhida}
        Telefones: ${JSON.stringify(Telefones)},
        Menu: ${JSON.stringify(menu)}`);

    return res.status(200).json({ message: 'Resposta do evento recebida com sucesso!' });
});

// Inicia o servidor na poeta 3000
app.listen(3000, ()=>{
    console.log('API rodando na porta 3000');
});