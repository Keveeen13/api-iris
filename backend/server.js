const express = require('express');
const crypto = require('crypto');
const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const puppeteer = require('puppeteer-core');
const path = require('path');
const ngrok = require('ngrok');
const app = express();
app.use(express.json());

// Função para gerar token
function generateToken() {
    return crypto.randomBytes(20).toString('hex'); // Gera um token de 40 caracteres
}

// Configuração para armazenamento de sessão
let sessionData;

// Configuração do cliente WhatsApp
const client = new Client({
    puppeteer: {
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    },
    session: sessionData // Carrega ou cria a sessão se necessário
});

client.on('qr', (qr) => {
    // Exibe o QR code no terminal para autenticação
    qrcode.generate(qr, { small: true });
});

client.on('auth_failure', (msg) => {
    console.error('Falha na autenticação:', msg);
});

client.on('ready', () => {
    console.log('WhatsApp Web conectado!');
});

// Inicia o cliente do WhatsApp Web
client.initialize();

// Armazenamento de tokens
let tokens = {
    id: 0,
    accessToken: generateToken(),
    refreshToken: generateToken(),
    expireAt: new Date(Date.now() + 3600 * 1000)
};

// Middleware para validar o header TenantId
app.use((req, res, next) => {
    const tenantId = req.header('TenantId');
    if (!tenantId) {
        return res.status(400).json({ error: 'TenantId é obrigatório no header' });
    }
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

// Endpoint para enviar mensagem no WhatsApp    
app.post('/mensagem', (req, res) => {
    const { message, telefone } = req.body;
    
    if (!message || !telefone) {
        return res.status(400).json({ error: 'Dados da notificação incompletos' });
    }

    const numeroComCodigo = `55${telefone}@c.us`;

    client.sendMessage(numeroComCodigo, message).then(response => {
        console.log('Mensagem enviada com sucesso para', telefone);
        res.status(200).json({ message: 'Mensagem enviada com sucesso!' });
        console.log('Mensagem enviada:', message );
    }).catch(err => {
        console.error('Erro ao enviar mensagem:', err);
        res.status(500).json({ error: 'Erro ao enviar mensagem' });
    });
});

// Endpoint de eventos (payload de controle de horário)
app.post('/evento', (req, res) => {
    const { Cliente, IdCliente, IdChamado, NomeRespondeu, TelefoneRespondeu, OpcaoEscolhida } = req.body;

    console.log('Payload recebido:', req.body);

    if (Cliente === 'string' || IdCliente === 0 || IdChamado === 0 || NomeRespondeu === 'string' || TelefoneRespondeu === 'string' || OpcaoEscolhida === 'string') {
        console.log('Dados inválidos detectados: ', { Cliente, IdCliente, IdChamado, NomeRespondeu, TelefoneRespondeu, OpcaoEscolhida });
        return res.status(400).json({ error: 'Dados do evento são inválidos ou placeholders' });
    }

    console.log('Evento recebido com sucesso:', { Cliente, IdCliente, IdChamado, NomeRespondeu, TelefoneRespondeu, OpcaoEscolhida });

    return res.status(200).json({ message: 'Evento recebido com sucesso!' });
});

// Endpoint de notificação simples
app.post('/notificacao', (req, res) => {
    const payload = req.body;

    console.log('Notificação simples recebida:', payload);

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

// Inicia o servidor na porta 3000
app.listen(3000, async () => {
    console.log('API rodando na porta 3000');

    try {
        const url = await ngrok.connect(3000);
        console.log(`Ngrok ativo: ${url}`);
    } catch (error) {
        console.error('Erro ao iniciar o Ngrok:', error);
    }
});