# Plano de Integração e Gestão de Permissões Firebase

Este documento contém o diagnóstico detalhado, plano de ação e procedimentos para resolver os problemas de permissão no projeto Google Cloud/Firebase **micro-cubist-msjh2** e realizar a integração/migração completa utilizando a conta administrativa **meuprimeiroimovel.adm@gmail.com**.

---

## 1. Diagnóstico de Bloqueios e Estrutura IAM

### Possíveis Causas para a Impossibilidade de Adicionar Novos Usuários:
1. **Restrição de Domínio na Organização (Políticas Organizacionais)**:
   * **Vulnerabilidade/Bloqueio**: A política `constraints/iam.allowedPolicyMemberDomains` está ativa no nível da Organização ou Pasta no Google Cloud. Isso impede que contas externas ao domínio corporativo (como contas `@gmail.com` genéricas) sejam adicionadas ao IAM.
   * **Sintoma**: Ao tentar adicionar `meuprimeiroimovel.adm@gmail.com`, o console exibe um erro informando que o e-mail viola a política de domínio.

2. **Perda de Função de "Owner" (Proprietário)**:
   * **Sintoma**: O usuário atual (`comercial.vivasc@gmail.com`) pode possuir a função de *Editor* ou *Firebase Admin*, mas não a de *Owner* legítimo do projeto GCP, o que impede a alteração de políticas IAM e adição de novos membros.

3. **Suspensão de Conta por Billing (Faturamento)**:
   * **Sintoma**: Se o projeto requer recursos pagos ou excedeu limites de cotas e o faturamento está desativado ou recusado, o painel restringe modificações administrativas até a regularização do cartão de crédito.

4. **Herança Restritiva de Permissões**:
   * **Sintoma**: O projeto está inserido em uma árvore de diretórios do Google Cloud Workspace cuja herança de permissões restringe explicitamente delegação de privilégios.

---

## 2. Guia de Resolução: Correção de Permissões no Projeto Atual

Se você tiver acesso à conta de administração principal ou se o ambiente permitir edições, siga este procedimento para conceder controle total a **meuprimeiroimovel.adm@gmail.com**:

### Passo 1: Desabilitar Restrição de Domínio das Políticas Organizacionais
Caso o console bloqueie a adição da conta `@gmail.com`:
1. Acesse o **Console do Google Cloud** (https://console.cloud.google.com/) com uma conta administradora da organização.
2. No menu de navegação, vá em **IAM e administrador** > **Políticas da organização** (`Organization Policies`).
3. Pesquise por: `Restringir domínios de membros de políticas` (ID da restrição: `constraints/iam.allowedPolicyMemberDomains`).
4. Clique em **Editar**.
5. Em **Valores aplicados**, selecione **Personalizar**.
6. Mude para **Permitir tudo** ou adicione o e-mail da conta de forma explícita e salve as alterações.

### Passo 2: Conceder as Funções (Roles) no console do GCP IAM
1. Acesse o console IAM: https://console.cloud.google.com/iam-admin/iam?project=micro-cubist-msjh2
2. Clique no botão **Conceder Acesso** (`Grant Access`).
3. No campo **Novos princípios**, adicione: `meuprimeiroimovel.adm@gmail.com`
4. Na seção **Atribuir papéis**, selecione e adicione os seguintes papéis (roles) necessários para a administração e operação completa do portal:
   * **Proprietário** (`roles/owner`) — *Controle total do GCP*
   * **Administrador do Firebase** (`roles/firebase.admin`) — *Controle total do Firebase*
   * **Administrador do Cloud Run** (`roles/run.admin`) — *Administração do servidor Web*
   * **Administrador de Contas de Serviço** (`roles/iam.serviceAccountAdmin`) — *Para gerenciar tokens e microsserviços*
   * **Administrador do Cloud Storage** (`roles/storage.admin`) — *Para gerenciar uploads de imagens/plantas*
   * **Administrador de Regras do Firebase** (`roles/firebaserules.admin`) — *Atualização de regras de segurança*
   * **Administrador do Secret Manager** (`roles/secretmanager.admin`) — *Caso existam chaves de API ocultas*
5. Clique em **Salvar**.

---

## 3. Plano de Migração para Novo Projeto Firebase (Projeto Irrecuperável)

Se o projeto `micro-cubist-msjh2` estiver bloqueado de forma definitiva (sem acesso ao Owner ou suspenso na Organização), siga os passos abaixo para estabelecer um novo banco de dados no Firebase sob controle total de **meuprimeiroimovel.adm@gmail.com**:

### Passo A: Criar o Novo Projeto no Firebase Console
1. Logue em https://console.firebase.google.com/ utilizando o e-mail: **meuprimeiroimovel.adm@gmail.com**.
2. Clique em **Adicionar projeto** e dê o nome de **meuprimeiroimovel** (o Firebase gerará um ID único, como `meuprimeiroimovel-xxxxx`).
3. Vá em **Firestore Database** e clique em **Criar banco de dados** (Selecione o modo de produção e a região mais próxima de seus clientes).
4. Vá em **Authentication**, clique em **Começar** e ative o provedor **Google** (e e-mail/senha caso configurado).
5. Vá em **Storage**, clique em **Começar** e ative o bucket padrão do Storage para imagens.

### Passo B: Conectar a Aplicação ao Novo Projeto (Instalação Prática)
A arquitetura deste Portal foi desenhada para ser totalmente dinâmica. Os dados de conexão não estão hardcoded. Eles são carregados diretamente do arquivo de configuração central do portal.

Para conectar o site ao novo banco de dados:
1. No painel do seu novo projeto Firebase, acesse as **Configurações do Projeto** (ícone de engrenagem no canto superior esquerdo).
2. Na aba **Geral**, role até o final e e registre um novo Web App (clique no ícone `</>`).
3. Copie o objeto `firebaseConfig` gerado, que se parecerá com isto:
   ```json
   {
     "apiKey": "SUA_NOVA_API_KEY",
     "authDomain": "seu-novo-projeto.firebaseapp.com",
     "projectId": "seu-novo-projeto",
     "storageBucket": "seu-novo-projeto.firebasestorage.app",
     "messagingSenderId": "seu_sender_id",
     "appId": "seu_app_id",
     "firestoreDatabaseId": "(default)"
   }
   ```
4. No editor de arquivos deste ambiente, substitua o conteúdo do arquivo **/firebase-applet-config.json** com esses novos parâmetros.
5. O Portal redirecionará imediatamente todas as conexões de banco de dados, login e armazenamento de mídia para o seu novo Firestore sob a administração do e-mail **meuprimeiroimovel.adm@gmail.com**!

### Passo C: Migrando os Dados e Coleções Atuais (Firestore)
Para transferir os dados cadastrados (Propriedades, Corretores, Leads, etc.) do projeto antigo para o controle do seu novo e-mail, execute a extração através do Firebase CLI ou recadastre-os utilizando o **Painel Administrativo Independente** do portal, que possui importador facilitado para reinserção de backups.

---

## 4. Estrutura de Coleções que serão integradas (Schemas do seu Site)
As seguintes tabelas serão criadas e sincronizadas de forma automatizada no novo Firestore através do arquivo `firebase-blueprint.json` integrado no portal:

1. **`usuarios`**: Perfis de acesso (Administradores, Corretores e Clientes).
2. **`properties`**: Catálogo completo do site (Preço, endereço, fotos, parcelas, dados de entrega).
3. **`corretores`**: Lista de corretores ativos e e-mails de recebimento de contatos.
4. **`leads`**: Leads recebidos dos formulários do site gerados em tempo real.
5. **`visitas`**: Agenda de visitas a imóveis.
6. **`favoritos`**: Controle de favoritos de clientes logados.
7. **`mensagens`**: Caixa de mensagens recebidas.
8. **`settings`**: Customização visual de marca, telefones, Whatsapp, logotipo e slogans do Portal.
9. **`banners`**: Carrossel rotativo de anúncios e propagandas no topo da página.

---

## 5. Riscos e Recomendações de Segurança
* **Regras de Segurança (Firestore Rules)**: Foram geradas regras robustas no arquivo `/firestore.rules`. Assim que a migração for efetuada, implante-as no console do Firebase para prevenir acessos indesejados.
* **Autenticação**: Certifique-se de preencher a URL do domínio final da aplicação na Seção de Domínios Autorizados dentro do módulo de Autenticação do Firebase para permitir logins do Google com sucesso.
