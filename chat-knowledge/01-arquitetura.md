# Arquitetura — App 1%

## Princípios

- **Pessoal, single-user.** Sem login, sem servidor, sem nuvem. Os dados ficam só no celular do usuário.
- **Mostra a realidade.** O app não suaviza nem pergunta como o usuário se sente — ele detecta e mostra.
- **Privacidade por padrão.** Como tudo é local, nenhum dado sai do dispositivo.
- **Custo zero.** Sem backend pago, sem APIs externas no MVP.

## Stack

| Camada | Escolha | Motivo |
|---|---|---|
| Framework | **Expo (React Native + TypeScript)** | iOS + Android com uma base, dev rápido, OTA updates |
| Roteamento | **expo-router** | Roteamento file-based, igual ao Next.js |
| Banco de dados | **expo-sqlite** | Local, embutido no app, zero infra |
| Estado global | **Zustand** | Leve, sem boilerplate, fácil de testar |
| Gráficos | **react-native-svg** | Pra desenhar o "Alvo de Vida" (pizza customizada) |
| Notificações | **expo-notifications** | Lembretes locais, sem servidor de push |
| Datas | **date-fns** | Manipulação de datas em pt-BR |
| Storage chave-valor | **expo-secure-store** | Pra flags simples (onboarded, etc.) |

## Estrutura de pastas

```
1%/
├── docs/                         # documentação técnica e regras de negócio
│   ├── 01-arquitetura.md
│   ├── 02-schema-de-dados.md
│   ├── 03-areas-e-tarefas.md
│   ├── 04-regras-de-negocio.md
│   └── 05-roadmap-mvp.md
├── app 1 percent.md              # documento original de visão
└── app/                          # projeto Expo
    ├── app/                      # rotas (expo-router)
    │   ├── _layout.tsx
    │   ├── index.tsx             # dashboard ou redireciona pra onboarding
    │   ├── onboarding/
    │   │   ├── cadastro.tsx
    │   │   ├── areas.tsx
    │   │   └── autoavaliacao.tsx
    │   ├── checklist.tsx
    │   ├── alvo.tsx              # gráfico Alvo de Vida
    │   ├── reflexao.tsx
    │   └── reativacao.tsx        # tela bloqueante após 2 dias pulados
    ├── src/
    │   ├── db/                   # schema, migrations, queries
    │   │   ├── schema.ts
    │   │   ├── seed.ts
    │   │   └── queries/
    │   ├── domain/               # regras de negócio puras (testáveis)
    │   │   ├── cores.ts
    │   │   ├── intensidade.ts
    │   │   ├── mediocridade.ts
    │   │   └── streak.ts
    │   ├── components/           # UI reutilizável
    │   ├── screens/              # composição de telas
    │   ├── store/                # zustand stores
    │   └── lib/                  # utilitários (datas, etc.)
    ├── assets/
    ├── app.json
    ├── package.json
    └── tsconfig.json
```

## Por que `domain/` separado de `db/`

As regras de negócio (cor por % de desempenho, classificação de intensidade, detecção de mediocridade) são **funções puras**, sem dependência de banco ou React. Isso permite:

- Testar via Jest sem mockar SQLite
- Rodar via Node CLI (script de auditoria, simulação)
- Manter a lógica clara — UI só renderiza, banco só persiste, `domain/` decide

## Como rodar (depois de inicializado)

```bash
cd app
npm install
npx expo start
```

- Pressiona `i` pra abrir no iOS Simulator (precisa Xcode no Mac)
- Pressiona `a` pra Android (precisa Android Studio)
- Lê QR code com Expo Go no celular pra testar no device real

## Decisões adiadas (v2+)

- Sincronização entre dispositivos → exigiria backend
- Backup → exportar SQLite pra arquivo .db ou JSON
- IA / coaches digitais → fora do MVP
- Multiusuário → fora do escopo (app é pessoal)
