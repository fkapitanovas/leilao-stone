# Leilao Stone

Web app para leilao de veiculos com lances em tempo real, autenticacao de usuarios e painel administrativo.

## Stack Tecnologica

- **Frontend/Backend**: Next.js 14 (App Router)
- **Banco de dados**: PostgreSQL (Supabase)
- **Autenticacao**: Supabase Auth
- **Tempo real**: Supabase Realtime
- **Storage**: Supabase Storage (imagens)
- **Deploy**: Vercel

## Configuracao

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Copie a URL e a chave anon do projeto

### 2. Configurar banco de dados

Execute os scripts SQL no Supabase SQL Editor:

```sql
-- Execute primeiro o schema.sql
-- Depois execute o storage.sql
```

Os arquivos estao em `supabase/schema.sql` e `supabase/storage.sql`

### 3. Configurar variaveis de ambiente

Copie o arquivo de exemplo e preencha com seus valores:

```bash
cp .env.local.example .env.local
```

Edite `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
CRON_SECRET=um_secret_aleatorio
```

### 4. Habilitar Realtime

No painel do Supabase:
1. Va em Database > Replication
2. Habilite Realtime para as tabelas: `bids`, `vehicles`, `notifications`

### 5. Criar bucket de storage

No painel do Supabase:
1. Va em Storage
2. Crie um bucket chamado `images`
3. Marque como publico

### 6. Instalar dependencias e rodar

```bash
npm install
npm run dev
```

Acesse http://localhost:3000

## Deploy na Vercel

1. Conecte seu repositorio na Vercel
2. Configure as variaveis de ambiente
3. Deploy!

O arquivo `vercel.json` ja configura o cron job para encerrar leiloes automaticamente.

## Primeiro Admin

Apos o primeiro usuario se cadastrar, execute no Supabase SQL Editor:

```sql
UPDATE profiles SET is_admin = TRUE WHERE email = 'seu@email.com';
```

## Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/          # Login e registro
│   ├── auction/[id]/    # Pagina do leilao
│   ├── admin/           # Painel administrativo
│   └── api/             # API routes
├── components/
│   ├── auction/         # Componentes do leilao
│   ├── admin/           # Componentes do admin
│   └── ui/              # Componentes base
├── lib/
│   ├── supabase/        # Clients do Supabase
│   └── hooks/           # Hooks customizados
└── types/               # Tipos TypeScript
```

## Funcionalidades

- [x] Autenticacao de usuarios (login/registro)
- [x] Listagem de leiloes ativos e agendados
- [x] Pagina de detalhes do veiculo com galeria
- [x] Countdown timer em tempo real
- [x] Sistema de lances em tempo real
- [x] Notificacoes (outbid, winner)
- [x] Painel admin para CRUD de veiculos
- [x] Upload de imagens com drag & drop
- [x] Encerramento automatico de leiloes (cron)
- [x] Responsividade mobile

## Licenca

MIT
