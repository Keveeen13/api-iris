const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const register = async (req, res) => {
    const { name, email, phone, password } = req.body;
    try{
        const user = new User ({ name, email, phone, password });
        await user.save();
        res.status(201).json({ message: 'Usuário registrado com sucesso' })
    } catch (error) {
        res.status(400).json({ message: 'Erro ao regitrar usuário' });
    }
};

const login = async (req, res) => {
    const { email, password} = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: 'Credenciais inválidas' });
        }
    

    const token = jwt.sign({ userId: user._Id }, process.env.JWT_SECRET, { expireIn: '1h' });

    // Envio de email com token
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Seu token de acesso',
        text: `Use o seguinte token para acessar: ${token}`,
    });

    res.status(200).json({ message: 'Token enviado para o email' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
};

module.exports = { register, login };