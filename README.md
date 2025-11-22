Aqui está o arquivo Markdown completo, unificando os pré-requisitos e as instruções de configuração (instalação e execução) para o seu projeto `ep_bd`.

# EP_BD - Sistema de Gerenciamento de Barbearia

Este projeto é uma aplicação web que integra um backend em **Flask** e um frontend em **React**.

## 📋 Pré-requisitos

Para configurar e rodar este projeto, você precisará das seguintes ferramentas instaladas no seu ambiente:

1.  **Git**: Necessário para clonar o repositório.
* [Instalar Git](https://git-scm.com/downloads)
2.  **Python (versão 3.8+)**: Necessário para o backend Flask.
* Certifique-se de que o gerenciador de pacotes `pip` esteja instalado.
* [Instalar Python](https://www.python.org/downloads/)
3.  **Node.js (versão 14+)**: Necessário para o frontend React.
* O `npm` (gerenciador de pacotes) é instalado automaticamente com o Node.
* [Instalar Node.js](https://nodejs.org/)

---

## ⚙️ Configuração e Execução

Siga a ordem abaixo para garantir o funcionamento correto da aplicação.

### 1. Clonar o Repositório

Abra o seu terminal e clone o projeto para sua máquina:

```bash
git clone <URL_DO_REPOSITORIO>
cd ep_bd
````

### 2\. Configurando o Backend (Flask)

O backend gerencia a API e o banco de dados.

1.  **Crie um ambiente virtual (venv)** para isolar as dependências:

      * *Windows:*
        ```bash
        python -m venv venv
        venv\Scripts\activate
        ```
      * *Linux/Mac:*
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```

2.  **Instale as dependências** listadas no arquivo `requirements.txt`:

    ```bash
    pip install -r backend/requirements.txt
    ```

3.  **Execute o servidor**:
    A partir da raiz do projeto, execute o comando abaixo para rodar a aplicação Flask:

    ```bash
    python -m backend.app.run
    ```

    *O servidor iniciará em `http://0.0.0.0:5000` (modo debug ativado).*

### 3\. Configurando o Frontend (React)

O frontend gerencia a interface do usuário. Abra um **novo terminal** (mantenha o do backend rodando).

1.  **Acesse a pasta do frontend**:

    ```bash
    cd frontend
    ```

2.  **Instale as dependências** listadas no `package.json`:

    ```bash
    npm install
    ```

3.  **Inicie a aplicação**:

    ```bash
    npm start
    ```

    *O navegador abrirá automaticamente a aplicação em `http://localhost:3000`.*