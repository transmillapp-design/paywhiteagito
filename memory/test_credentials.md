# Test Credentials — Transmill Super App

## Master Admin (acesso total)
- Email: `marcelotransmillapp@gmail.com`
- Senha: `!Ma04202011@`

## Franqueado Admin (franquia "transmill")
- Email: `transmillapp@gmail.com`
- Senha: `demo123`
- user_type: labelview_unidade, franquia_slug: transmill

## Franquias existentes
- slug `transmill` (Transmill RJ)
- slug `transmill-sp` (Transmill São Paulo)

## Observações
- Login: POST /api/auth/login → retorna { access_token, user }
- Painel admin da franquia: rota `/franquia/:slug/admin`
- Aba "Integrações / APIs": gerenciar credenciais por franquia (XGate, Google Maps, Cloudinary, BaaS)
- Chave de criptografia: backend/.env `CREDENTIALS_ENCRYPTION_KEY` (Fernet)
