ALTER DATABASE barbearia SET TIMEZONE TO 'America/Sao_Paulo';

CREATE DOMAIN dom_status_agendamento AS VARCHAR(20)
    CHECK (VALUE IN ('pendente', 'confirmado', 'cancelado', 'concluido', 'falta'));

CREATE TABLE Pessoa (
    cpf VARCHAR(11) PRIMARY KEY,
    nome_completo VARCHAR(120) NOT NULL,
    data_nascimento DATE NOT NULL,
    telefone VARCHAR(20),
    endereco VARCHAR(200),
    email VARCHAR(120) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL
);


CREATE TABLE Barbeiro (
    cpf VARCHAR(11) PRIMARY KEY REFERENCES Pessoa(cpf)
        ON DELETE CASCADE ON UPDATE CASCADE,
    data_inicio DATE NOT NULL
);


CREATE TABLE Barbeiro_Chefe (
    id_barbeiro_chefe SERIAL PRIMARY KEY,
    cpf_barbeiro VARCHAR(11) UNIQUE NOT NULL REFERENCES Barbeiro(cpf)
        ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE Cliente (
    cpf VARCHAR(11) PRIMARY KEY REFERENCES Pessoa(cpf)
        ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE Plano_Mensal (
    id_plano_mensal SERIAL PRIMARY KEY,
    id_barbeiro_chefe INT NOT NULL REFERENCES Barbeiro_Chefe(id_barbeiro_chefe)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE Assina (
    id_cliente VARCHAR(11) REFERENCES Cliente(cpf)
        ON DELETE CASCADE ON UPDATE CASCADE,
	data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,	
    desconto DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    id_plano INT REFERENCES Plano_Mensal(id_plano_mensal)
        ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (id_cliente, id_plano)
);

CREATE TABLE Servico (
    id_servico SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    preco NUMERIC(10,2) NOT NULL,
    duracao_estimada_min INT NOT NULL,
    descricao VARCHAR(255)
);


CREATE TABLE Oferece (
    id_servico INT REFERENCES Servico(id_servico)
        ON DELETE CASCADE ON UPDATE CASCADE,
    cpf_barbeiro VARCHAR(11) REFERENCES Barbeiro(cpf)
        ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (id_servico, cpf_barbeiro)
);


CREATE TABLE Agendamento (
    id_agendamento SERIAL PRIMARY KEY,
    data_hora_agendamento TIMESTAMP with time zone NOT NULL,
    status dom_status_agendamento NOT NULL,
    cpf_origem VARCHAR(11) REFERENCES Pessoa(cpf)
        ON DELETE CASCADE ON UPDATE CASCADE,
    client_id VARCHAR(11) NOT NULL REFERENCES Cliente(cpf)
        ON DELETE CASCADE ON UPDATE CASCADE,
    barbeiro_id VARCHAR(11) NOT NULL REFERENCES Barbeiro(cpf)
        ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE Contem (
    id_serv INT REFERENCES Servico(id_servico)
        ON DELETE CASCADE ON UPDATE CASCADE,
    id_agen INT REFERENCES Agendamento(id_agendamento)
        ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (id_serv, id_agen)
);

CREATE TABLE Avaliacao (
    id_agen INT PRIMARY KEY REFERENCES Agendamento(id_agendamento)
        ON DELETE CASCADE ON UPDATE CASCADE,
    nota INT CHECK (nota BETWEEN 1 AND 5),
    comentario VARCHAR(255)
);

CREATE TABLE Produto (
    id_produto SERIAL PRIMARY KEY,
    nome_produto VARCHAR(120) NOT NULL,
    descricao VARCHAR(255),
    preco_compra NUMERIC(10,2) NOT NULL,
    preco_venda NUMERIC(10,2) NOT NULL,
    categoria varchar(100) NOT NULL,
    quantidade_estoque INT DEFAULT 0,
    minimo_estoque INT DEFAULT 0,
    status VARCHAR(100) NOT NULL
);


CREATE TABLE Reserva (
    id_cliente VARCHAR(11) REFERENCES Cliente(cpf)
        ON DELETE CASCADE ON UPDATE CASCADE,
    id_prod INT REFERENCES Produto(id_produto)
        ON DELETE CASCADE ON UPDATE CASCADE,
    data_reserva DATE NOT NULL,
    status VARCHAR(100) NOT NULL,
    PRIMARY KEY (id_cliente, id_prod)
);

CREATE TABLE Possui (
    id_serv INT REFERENCES Servico(id_servico)
        ON DELETE CASCADE ON UPDATE CASCADE,
    id_plano INT REFERENCES Plano_Mensal(id_plano_mensal)
        ON DELETE CASCADE ON UPDATE CASCADE,
    quantidade INT NOT NULL,
    PRIMARY KEY (id_serv, id_plano)
);


INSERT INTO Pessoa (cpf, nome_completo, data_nascimento, telefone, endereco, email, senha) VALUES
('00000000001', 'Artur Mendes', '1985-03-15', '(11) 98888-0001', 'Rua dos Barbeiros, 10', 'artur.mendes@email.com', 'senha_hash_123'),
('00000000002', 'Bruno Guedes', '1990-07-20', '(11) 98888-0002', 'Avenida Principal, 20', 'bruno.guedes@email.com', 'senha_hash_123'),
('00000000003', 'Carlos Viana', '1988-11-05', '(11) 98888-0003', 'Praça da Matriz, 30', 'carlos.viana@email.com', 'senha_hash_123'),
('00000000004', 'Diego Faria', '1992-01-30', '(11) 98888-0004', 'Rua das Tesouras, 40', 'diego.faria@email.com', 'senha_hash_123'),
('00000000005', 'Eduardo Matos', '1995-05-12', '(11) 98888-0005', 'Travessa dos Cortes, 50', 'eduardo.matos@email.com', 'senha_hash_123'),
('00000000006', 'Fábio Nunes', '1987-09-25', '(11) 98888-0006', 'Rua da Navalha, 60', 'fabio.nunes@email.com', 'senha_hash_123'),
('00000000007', 'Guilherme Reis', '1993-02-18', '(11) 98888-0007', 'Avenida Central, 70', 'guilherme.reis@email.com', 'senha_hash_123'),
('00000000008', 'Heitor Bastos', '1991-06-08', '(11) 98888-0008', 'Rua Sete, 80', 'heitor.bastos@email.com', 'senha_hash_123'),
('00000000009', 'Igor Santos', '1986-12-01', '(11) 98888-0009', 'Largo do Machado, 90', 'igor.santos@email.com', 'senha_hash_123'),
('00000000010', 'Jonas Pereira', '1994-04-14', '(11) 98888-0010', 'Rua da Barbearia, 100', 'jonas.pereira@email.com', 'senha_hash_123'),
('00000000011', 'Kevin Lopes', '1989-08-22', '(11) 98888-0011', 'Avenida Norte, 110', 'kevin.lopes@email.com', 'senha_hash_123'),
('00000000012', 'Lucas Moreira', '1996-03-10', '(11) 98888-0012', 'Rua Sul, 120', 'lucas.moreira@email.com', 'senha_hash_123'),
('00000000013', 'Marcos Andrade', '1984-10-27', '(11) 98888-0013', 'Travessa Leste, 130', 'marcos.andrade@email.com', 'senha_hash_123'),
('00000000014', 'Nelson Dias', '1997-07-19', '(11) 98888-0014', 'Rua Oeste, 140', 'nelson.dias@email.com', 'senha_hash_123'),
('00000000015', 'Otávio Paes', '1990-11-30', '(11) 98888-0015', 'Avenida do Corte, 150', 'otavio.paes@email.com', 'senha_hash_123'),
('00000000016', 'Paulo Rangel', '1985-02-05', '(11) 98888-0016', 'Rua da Cera, 160', 'paulo.rangel@email.com', 'senha_hash_123'),
('00000000017', 'Quintino Alves', '1992-08-11', '(11) 98888-0017', 'Praça da Navalha, 170', 'quintino.alves@email.com', 'senha_hash_123'),
('00000000018', 'Rafael Braga', '1998-04-23', '(11) 98888-0018', 'Rua do Pente, 180', 'rafael.braga@email.com', 'senha_hash_123'),
('00000000019', 'Sérgio Costa', '1983-12-17', '(11) 98888-0019', 'Avenida da Barba, 190', 'sergio.costa@email.com', 'senha_hash_123'),
('00000000020', 'Tiago Neves', '1991-09-02', '(11) 98888-0020', 'Rua do Bigode, 200', 'tiago.neves@email.com', 'senha_hash_123'),
('00000000021', 'Ulisses Ferraz', '1993-05-28', '(11) 98888-0021', 'Travessa do Estilo, 210', 'ulisses.ferraz@email.com', 'senha_hash_123'),
('00000000022', 'Vitor Melo', '1989-10-15', '(11) 98888-0022', 'Rua da Espuma, 220', 'vitor.melo@email.com', 'senha_hash_123'),
('00000000023', 'Wagner Pinto', '1995-01-09', '(11) 98888-0023', 'Avenida do Gel, 230', 'wagner.pinto@email.com', 'senha_hash_123'),
('00000000024', 'Xavier Gomes', '1986-07-03', '(11) 98888-0024', 'Rua do Cabelo, 240', 'xavier.gomes@email.com', 'senha_hash_123'),
('00000000025', 'Yuri Azevedo', '1994-11-11', '(11) 98888-0025', 'Praça do Corte, 250', 'yuri.azevedo@email.com', 'senha_hash_123'),
('00000000026', 'Alice Borges', '1990-01-01', '(21) 99999-0026', 'Rua dos Clientes, 1', 'alice.borges@email.com', 'senha_hash_123'),
('00000000027', 'Bernardo Costa', '1991-02-02', '(21) 99999-0027', 'Avenida dos Clientes, 2', 'bernardo.costa@email.com', 'senha_hash_123'),
('00000000028', 'Clara Dias', '1992-03-03', '(21) 99999-0028', 'Praça dos Clientes, 3', 'clara.dias@email.com', 'senha_hash_123'),
('00000000029', 'Daniel Alves', '1993-04-04', '(21) 99999-0029', 'Travessa dos Clientes, 4', 'daniel.alves@email.com', 'senha_hash_123'),
('00000000030', 'Elisa Fernandes', '1994-05-05', '(21) 99999-0030', 'Largo dos Clientes, 5', 'elisa.fernandes@email.com', 'senha_hash_123'),
('00000000031', 'Felipe Barros', '1995-06-06', '(21) 99999-0031', 'Rua dos Clientes, 6', 'felipe.barros@email.com', 'senha_hash_123'),
('00000000032', 'Gabriela Lima', '1996-07-07', '(21) 99999-0032', 'Avenida dos Clientes, 7', 'gabriela.lima@email.com', 'senha_hash_123'),
('00000000033', 'Hugo Moreira', '1997-08-08', '(21) 99999-0033', 'Praça dos Clientes, 8', 'hugo.moreira@email.com', 'senha_hash_123'),
('00000000034', 'Isabela Rocha', '1998-09-09', '(21) 99999-0034', 'Travessa dos Clientes, 9', 'isabela.rocha@email.com', 'senha_hash_123'),
('00000000035', 'João Paulo', '1999-10-10', '(21) 99999-0035', 'Largo dos Clientes, 10', 'joao.paulo@email.com', 'senha_hash_123'),
('00000000036', 'Karina Silva', '2000-11-11', '(21) 99999-0036', 'Rua dos Clientes, 11', 'karina.silva@email.com', 'senha_hash_123'),
('00000000037', 'Leonardo Martins', '1990-12-12', '(21) 99999-0037', 'Avenida dos Clientes, 12', 'leonardo.martins@email.com', 'senha_hash_123'),
('00000000038', 'Mariana Neves', '1991-01-13', '(21) 99999-0038', 'Praça dos Clientes, 13', 'mariana.neves@email.com', 'senha_hash_123'),
('00000000039', 'Nicolas Pires', '1992-02-14', '(21) 99999-0039', 'Travessa dos Clientes, 14', 'nicolas.pires@email.com', 'senha_hash_123'),
('00000000040', 'Olivia Ribeiro', '1993-03-15', '(21) 99999-0040', 'Largo dos Clientes, 15', 'olivia.ribeiro@email.com', 'senha_hash_123'),
('00000000041', 'Pedro Henrique', '1994-04-16', '(21) 99999-0041', 'Rua dos Clientes, 16', 'pedro.henrique@email.com', 'senha_hash_123'),
('00000000042', 'Quintia Soares', '1995-05-17', '(21) 99999-0042', 'Avenida dos Clientes, 17', 'quintia.soares@email.com', 'senha_hash_123'),
('00000000043', 'Ricardo Jesus', '1996-06-18', '(21) 99999-0043', 'Praça dos Clientes, 18', 'ricardo.jesus@email.com', 'senha_hash_123'),
('00000000044', 'Sofia Macedo', '1997-07-19', '(21) 99999-0044', 'Travessa dos Clientes, 19', 'sofia.macedo@email.com', 'senha_hash_123'),
('00000000045', 'Thiago Ventura', '1998-08-20', '(21) 99999-0045', 'Largo dos Clientes, 20', 'thiago.ventura@email.com', 'senha_hash_123'),
('00000000046', 'Ursula Bentes', '1999-09-21', '(21) 99999-0046', 'Rua dos Clientes, 21', 'ursula.bentes@email.com', 'senha_hash_123'),
('00000000047', 'Victor Hugo', '2000-10-22', '(21) 99999-0047', 'Avenida dos Clientes, 22', 'victor.hugo@email.com', 'senha_hash_123'),
('00000000048', 'Wendy Chaves', '1990-11-23', '(21) 99999-0048', 'Praça dos Clientes, 23', 'wendy.chaves@email.com', 'senha_hash_123'),
('00000000049', 'Yago Bastos', '1991-12-24', '(21) 99999-0049', 'Travessa dos Clientes, 24', 'yago.bastos@email.com', 'senha_hash_123'),
('00000000050', 'Zilda Pires', '1992-01-25', '(21) 99999-0050', 'Largo dos Clientes, 25', 'zilda.pires@email.com', 'senha_hash_123');


INSERT INTO Servico (nome, preco, duracao_estimada_min, descricao) VALUES
('Corte Masculino Simples', 40.00, 30, 'Corte clássico na máquina e tesoura.'),
('Corte Masculino Moderno', 50.00, 45, 'Corte estilizado (degradê, moicano, etc.).'),
('Barba Tradicional', 35.00, 30, 'Barba feita com navalha e toalha quente.'),
('Barba Design', 45.00, 40, 'Desenho e alinhamento da barba.'),
('Corte + Barba Simples', 70.00, 60, 'Combo de corte simples e barba tradicional.'),
('Corte + Barba Design', 90.00, 75, 'Combo de corte moderno e barba design.'),
('Pezinho (Acabamento)', 15.00, 10, 'Limpeza e acabamento do corte.'),
('Sobrancelha (Pinça/Navalha)', 20.00, 15, 'Limpeza e desenho da sobrancelha.'),
('Hidratação Capilar', 30.00, 20, 'Aplicação de máscara de hidratação.'),
('Relaxamento Capilar', 80.00, 60, 'Redução de volume e alinhamento dos fios.'),
('Pigmentação de Barba', 40.00, 30, 'Aplicação de tinta para cobrir falhas.'),
('Pigmentação Capilar', 50.00, 40, 'Escurecimento ou disfarce de grisalhos.'),
('Corte Infantil', 35.00, 30, 'Corte para crianças até 12 anos.'),
('Dia do Noivo - Pacote Básico', 200.00, 120, 'Corte, barba e limpeza de pele.'),
('Dia do Noivo - Pacote Premium', 350.00, 180, 'Pacote básico + massagem e unhas.'),
('Limpeza de Pele', 60.00, 45, 'Remoção de cravos e impurezas.'),
('Massagem Relaxante (Facial)', 40.00, 20, 'Massagem para aliviar tensão.'),
('Platinado (Descoloração)', 150.00, 120, 'Processo de descoloração global.'),
('Luzes / Mechas', 100.00, 90, 'Clareamento parcial dos fios.'),
('Escova Progressiva', 120.00, 90, 'Alisamento temporário dos fios.'),
('Tratamento Antiqueda', 70.00, 30, 'Aplicação de loções e massagem.'),
('Manicure Masculina', 25.00, 30, 'Cuidados com as unhas das mãos.'),
('Pedicure Masculina', 30.00, 30, 'Cuidados com as unhas dos pés.'),
('Remoção de Cera (Ouvido/Nariz)', 20.00, 10, 'Depilação facial com cera quente.'),
('Barboterapia Completa', 60.00, 45, 'Barba com esfoliação e hidratação facial.');


INSERT INTO Produto (nome_produto, descricao, preco_compra, preco_venda, categoria, quantidade_estoque, minimo_estoque, status) VALUES
('Shampoo Anticaspa', 'Shampoo de tratamento para caspa', 15.00, 30.00, 'Cabelo', 100, 20, 'ativo'),
('Condicionador Hidratante', 'Condicionador para cabelos ressecados', 12.00, 25.00, 'Cabelo', 100, 20, 'ativo'),
('Cera Modeladora Efeito Matte', 'Cera para fixação forte sem brilho', 25.00, 45.00, 'Modelador', 80, 15, 'ativo'),
('Pomada Efeito Brilho', 'Pomada para penteados clássicos com brilho', 22.00, 40.00, 'Modelador', 80, 15, 'ativo'),
('Óleo para Barba', 'Hidrata e amacia os fios da barba', 20.00, 35.00, 'Barba', 120, 30, 'ativo'),
('Balm para Barba', 'Modela e hidrata a barba', 18.00, 32.00, 'Barba', 120, 30, 'ativo'),
('Shampoo para Barba', 'Limpeza específica para os fios da barba', 15.00, 28.00, 'Barba', 90, 20, 'ativo'),
('Pente de Madeira (Barba)', 'Pente antiestático para barba', 10.00, 20.00, 'Acessório', 50, 10, 'ativo'),
('Escova de Cabelo', 'Escova para desembaraçar', 8.00, 15.00, 'Acessório', 60, 10, 'ativo'),
('Gel Pós-Barba', 'Acalma e refresca a pele', 14.00, 25.00, 'Pós-Barba', 70, 15, 'ativo'),
('Loção Pós-Barba', 'Loção alcoólica clássica', 16.00, 30.00, 'Pós-Barba', 70, 15, 'ativo'),
('Espuma de Barbear', 'Espuma densa para barbear', 13.00, 22.00, 'Barbear', 100, 25, 'ativo'),
('Gel de Barbear', 'Gel transparente para desenhar', 15.00, 28.00, 'Barbear', 100, 25, 'ativo'),
('Lâmina para Navalha (Caixa)', 'Caixa com 100 lâminas', 30.00, 50.00, 'Insumo', 40, 10, 'ativo'),
('Capa de Corte', 'Capa de nylon para cliente', 25.00, 45.00, 'Equipamento', 30, 5, 'ativo'),
('Talco Antisséptico', 'Talco para pescoço pós-corte', 10.00, 18.00, 'Finalização', 50, 10, 'ativo'),
('Spray Fixador (Forte)', 'Spray para fixação de penteado', 20.00, 38.00, 'Modelador', 60, 15, 'ativo'),
('Tônico Capilar (Antiqueda)', 'Loção para fortalecimento', 30.00, 55.00, 'Tratamento', 40, 10, 'ativo'),
('Argila Preta (Facial)', 'Máscara de argila para limpeza', 15.00, 25.00, 'Facial', 50, 10, 'ativo'),
('Esfoliante Facial', 'Esfoliante suave para o rosto', 18.00, 30.00, 'Facial', 50, 10, 'ativo'),
('Protetor Térmico', 'Protege do calor do secador', 22.00, 40.00, 'Cabelo', 40, 10, 'ativo'),
('Minoxidil 5%', 'Loção para crescimento de barba/cabelo', 40.00, 70.00, 'Tratamento', 30, 10, 'ativo'),
('Tinta de Cabelo (Preta)', 'Tinta para pigmentação', 12.00, 20.00, 'Coloração', 50, 15, 'ativo'),
('Tinta de Cabelo (Castanha)', 'Tinta para pigmentação', 12.00, 20.00, 'Coloração', 50, 15, 'ativo'),
('Pó Descolorante', 'Pó para platinar', 35.00, 60.00, 'Coloração', 25, 5, 'ativo');


INSERT INTO Barbeiro (cpf, data_inicio) VALUES
('00000000001', '2018-01-10'), ('00000000002', '2019-03-15'), ('00000000003', '2020-05-20'),
('00000000004', '2018-02-12'), ('00000000005', '2021-07-01'), ('00000000006', '2022-09-05'),
('00000000007', '2018-04-18'), ('00000000008', '2019-06-22'), ('00000000009', '2020-08-30'),
('00000000010', '2021-10-14'), ('00000000011', '2022-12-25'), ('00000000012', '2018-05-03'),
('00000000013', '2019-11-11'), ('00000000014', '2020-01-19'), ('00000000015', '2021-03-29'),
('00000000016', '2022-04-07'), ('00000000017', '2018-07-13'), ('00000000018', '2019-09-17'),
('00000000019', '2020-11-23'), ('00000000020', '2021-01-31'), ('00000000021', '2022-02-14'),
('00000000022', '2018-10-01'), ('00000000023', '2019-12-08'), ('00000000024', '2020-02-16'),
('00000000025', '2021-04-24');

INSERT INTO Cliente (cpf) VALUES
('00000000026'), ('00000000027'), ('00000000028'), ('00000000029'), ('00000000030'),
('00000000031'), ('00000000032'), ('00000000033'), ('00000000034'), ('00000000035'),
('00000000036'), ('00000000037'), ('00000000038'), ('00000000039'), ('00000000040'),
('00000000041'), ('00000000042'), ('00000000043'), ('00000000044'), ('00000000045'),
('00000000046'), ('00000000047'), ('00000000048'), ('00000000049'), ('00000000050');

INSERT INTO Barbeiro_Chefe (cpf_barbeiro) VALUES
('00000000001'), ('00000000002'), ('00000000003'), ('00000000004'), ('00000000005'),
('00000000006'), ('00000000007'), ('00000000008'), ('00000000009'), ('00000000010'),
('00000000011'), ('00000000012'), ('00000000013'), ('00000000014'), ('00000000015'),
('00000000016'), ('00000000017'), ('00000000018'), ('00000000019'), ('00000000020'),
('00000000021'), ('00000000022'), ('00000000023'), ('00000000024'), ('00000000025');


INSERT INTO Plano_Mensal (id_barbeiro_chefe) VALUES
(1), (2), (3), (4), (5), (6), (7), (8), (9), (10),
(11), (12), (13), (14), (15), (16), (17), (18), (19), (20),
(21), (22), (23), (24), (25);


INSERT INTO Assina (id_cliente, data_inicio, data_fim, id_plano) VALUES
('00000000026', '2024-01-01', '2024-02-01', 1),
('00000000027', '2024-01-02', '2024-02-02', 2),
('00000000028', '2024-01-03', '2024-02-03', 3),
('00000000029', '2024-01-04', '2024-02-04', 4),
('00000000030', '2024-01-05', '2024-02-05', 5),
('00000000031', '2024-01-06', '2024-02-06', 6),
('00000000032', '2024-01-07', '2024-02-07', 7),
('00000000033', '2024-01-08', '2024-02-08', 8),
('00000000034', '2024-01-09', '2024-02-09', 9),
('00000000035', '2024-01-10', '2024-02-10', 10),
('00000000036', '2024-01-11', '2024-02-11', 11),
('00000000037', '2024-01-12', '2024-02-12', 12),
('00000000038', '2024-01-13', '2024-02-13', 13),
('00000000039', '2024-01-14', '2024-02-14', 14),
('00000000040', '2024-01-15', '2024-02-15', 15),
('00000000041', '2024-01-16', '2024-02-16', 16),
('00000000042', '2024-01-17', '2024-02-17', 17),
('00000000043', '2024-01-18', '2024-02-18', 18),
('00000000044', '2024-01-19', '2024-02-19', 19),
('00000000045', '2024-01-20', '2024-02-20', 20),
('00000000046', '2024-01-21', '2024-02-21', 21),
('00000000047', '2024-01-22', '2024-02-22', 22),
('00000000048', '2024-01-23', '2024-02-23', 23),
('00000000049', '2024-01-24', '2024-02-24', 24),
('00000000050', '2024-01-25', '2024-02-25', 25);


INSERT INTO Oferece (id_servico, cpf_barbeiro) VALUES
(1, '00000000001'), (2, '00000000002'), (3, '00000000003'), (4, '00000000004'), (5, '00000000005'),
(6, '00000000006'), (7, '00000000007'), (8, '00000000008'), (9, '00000000009'), (10, '00000000010'),
(11, '00000000011'), (12, '00000000012'), (13, '00000000013'), (14, '00000000014'), (15, '00000000015'),
(16, '00000000016'), (17, '00000000017'), (18, '00000000018'), (19, '00000000019'), (20, '00000000020'),
(21, '00000000021'), (22, '00000000022'), (23, '00000000023'), (24, '00000000024'), (25, '00000000025');

INSERT INTO Agendamento (data_hora_agendamento, status, cpf_origem, client_id, barbeiro_id) VALUES
('2024-11-20 09:00:00', 'concluido', '00000000001', '00000000026', '00000000001'),
('2024-11-20 10:00:00', 'concluido', '00000000001', '00000000027', '00000000002'),
('2024-11-20 11:00:00', 'concluido', '00000000001', '00000000028', '00000000003'),
('2024-11-21 09:00:00', 'concluido', '00000000001', '00000000029', '00000000004'),
('2024-11-21 10:00:00', 'cancelado', '00000000001', '00000000030', '00000000005'),
('2024-11-22 09:00:00', 'confirmado', '00000000001', '00000000031', '00000000006'),
('2024-11-22 10:00:00', 'confirmado', '00000000001', '00000000032', '00000000007'),
('2024-11-22 11:00:00', 'confirmado', '00000000001', '00000000033', '00000000008'),
('2024-11-23 09:00:00', 'confirmado', '00000000001', '00000000034', '00000000009'),
('2024-11-23 10:00:00', 'confirmado', '00000000001', '00000000035', '00000000010'),
('2024-11-24 09:00:00', 'pendente', '00000000001', '00000000036', '00000000011'),
('2024-11-24 10:00:00', 'pendente', '00000000001', '00000000037', '00000000012'),
('2024-11-24 11:00:00', 'pendente', '00000000001', '00000000038', '00000000013'),
('2024-11-25 09:00:00', 'pendente', '00000000001', '00000000039', '00000000014'),
('2024-11-25 10:00:00', 'pendente', '00000000001', '00000000040', '00000000015'),
('2024-11-25 11:00:00', 'pendente', '00000000001', '00000000041', '00000000016'),
('2024-11-26 09:00:00', 'pendente', '00000000001', '00000000042', '00000000017'),
('2024-11-26 10:00:00', 'pendente', '00000000001', '00000000043', '00000000018'),
('2024-11-26 11:00:00', 'pendente', '00000000001', '00000000044', '00000000019'),
('2024-11-27 09:00:00', 'pendente', '00000000001', '00000000045', '00000000020'),
('2024-11-27 10:00:00', 'pendente', '00000000001', '00000000046', '00000000021'),
('2024-11-27 11:00:00', 'pendente', '00000000001', '00000000047', '00000000022'),
('2024-11-28 09:00:00', 'pendente', '00000000001', '00000000048', '00000000023'),
('2024-11-28 10:00:00', 'pendente', '00000000001', '00000000049', '00000000024'),
('2024-11-28 11:00:00', 'pendente', '00000000001', '00000000050', '00000000025');


INSERT INTO Contem (id_serv, id_agen) VALUES
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6), (7, 7), (8, 8), (9, 9), (10, 10),
(11, 11), (12, 12), (13, 13), (14, 14), (15, 15), (16, 16), (17, 17), (18, 18), (19, 19), (20, 20),
(21, 21), (22, 22), (23, 23), (24, 24), (25, 25);


INSERT INTO Avaliacao (id_agen, nota, comentario) VALUES
(1, 5, 'Excelente corte! Artur é o melhor.'),
(2, 5, 'Barba perfeita, como sempre.'),
(3, 4, 'Bom serviço, mas atrasou um pouco.'),
(4, 5, 'Diego mandou bem no degradê.'),
(5, 1, 'Cancelei, não posso avaliar o serviço.'),
(6, 5, 'Ótimo atendimento.'),
(7, 4, 'Gostei da hidratação.'),
(8, 3, 'Sobrancelha ficou OK.'),
(9, 5, 'Limpeza de pele top.'),
(10, 5, 'Relaxamento ficou muito bom.'),
(11, 4, 'Pigmentação na barba ficou natural.'),
(12, 5, 'Recomendo o corte infantil.'),
(13, 5, 'Serviço rápido e bem feito.'),
(14, 4, 'Bom custo-benefício.'),
(15, 5, 'Atendimento impecável.'),
(16, 3, 'O preço é um pouco salgado pelo que oferece.'),
(17, 5, 'Platinado ficou incrível!'),
(18, 4, 'Boas luzes.'),
(19, 5, 'Profissional muito cuidadoso.'),
(20, 5, 'Barboterapia relaxante.'),
(21, 4, 'Manicure bem feita.'),
(22, 5, 'Pedicure excelente.'),
(23, 5, 'Remoção de cera rápida e indolor.'),
(24, 4, 'Bom tratamento antiqueda, voltarei.'),
(25, 5, 'Serviço de alta qualidade.');


INSERT INTO Reserva (id_cliente, id_prod, data_reserva, status) VALUES
('00000000026', 1, '2024-11-10', 'retirado'),
('00000000027', 2, '2024-11-10', 'retirado'),
('00000000028', 3, '2024-11-11', 'retirado'),
('00000000029', 4, '2024-11-11', 'retirado'),
('00000000030', 5, '2024-11-12', 'cancelado'),
('00000000031', 6, '2024-11-12', 'reservado'),
('00000000032', 7, '2024-11-13', 'reservado'),
('00000000033', 8, '2024-11-13', 'reservado'),
('00000000034', 9, '2024-11-14', 'reservado'),
('00000000035', 10, '2024-11-14', 'reservado'),
('00000000036', 11, '2024-11-15', 'reservado'),
('00000000037', 12, '2024-11-15', 'reservado'),
('00000000038', 13, '2024-11-16', 'reservado'),
('00000000039', 14, '2024-11-16', 'reservado'),
('00000000040', 15, '2024-11-17', 'reservado'),
('00000000041', 16, '2024-11-17', 'reservado'),
('00000000042', 17, '2024-11-18', 'reservado'),
('00000000043', 18, '2024-11-18', 'reservado'),
('00000000044', 19, '2024-11-19', 'reservado'),
('00000000045', 20, '2024-11-19', 'reservado'),
('00000000046', 21, '2024-11-20', 'reservado'),
('00000000047', 22, '2024-11-20', 'reservado'),
('00000000048', 23, '2024-11-21', 'reservado'),
('00000000049', 24, '2024-11-21', 'reservado'),
('00000000050', 25, '2024-11-22', 'reservado');


INSERT INTO Possui (id_serv, id_plano, quantidade) VALUES
(1, 1, 4), -- Plano 1 (do Chefe 1) inclui 4 unidades do Serviço 1
(2, 2, 2), -- Plano 2 (do Chefe 2) inclui 2 unidades do Serviço 2
(3, 3, 4), -- ...
(4, 4, 2),
(5, 5, 2),
(6, 6, 1),
(7, 7, 8),
(8, 8, 4),
(9, 9, 2),
(10, 10, 1),
(11, 11, 2),
(12, 12, 2),
(13, 13, 4),
(14, 14, 1),
(15, 15, 1),
(16, 16, 2),
(17, 17, 1),
(18, 18, 1),
(19, 19, 2),
(20, 20, 1),
(21, 21, 4),
(22, 22, 4),
(23, 23, 4),
(24, 24, 2),
(25, 25, 2);


INSERT INTO Pessoa (cpf, nome_completo, data_nascimento, telefone, endereco, email, senha) VALUES
('00000000051', 'André Silva', '1990-01-20', '(11) 98888-0051', 'Rua Nova, 260', 'andre.silva@email.com', 'senha_hash_123'),
('00000000052', 'Beto Campos', '1988-04-12', '(11) 98888-0052', 'Avenida Moderna, 270', 'beto.campos@email.com', 'senha_hash_123'),
('00000000053', 'César Matos', '1995-09-02', '(11) 98888-0053', 'Praça Antiga, 280', 'cesar.matos@email.com', 'senha_hash_123'),
('00000000054', 'Davi Moreira', '1992-11-15', '(11) 98888-0054', 'Rua da Esquina, 290', 'davi.moreira@email.com', 'senha_hash_123'),
('00000000055', 'Elias Furtado', '1987-07-30', '(11) 98888-0055', 'Travessa Direita, 300', 'elias.furtado@email.com', 'senha_hash_123'),
('00000000056', 'Franco Lopes', '1998-02-10', '(11) 98888-0056', 'Avenida Principal, 310', 'franco.lopes@email.com', 'senha_hash_123'),
('00000000057', 'Gael Pires', '1993-08-05', '(11) 98888-0057', 'Rua da Prata, 320', 'gael.pires@email.com', 'senha_hash_123'),
('00000000058', 'Hélio Viana', '1991-03-25', '(11) 98888-0058', 'Largo do Ouro, 330', 'helio.viana@email.com', 'senha_hash_123'),
('00000000059', 'Ícaro Chaves', '1996-06-18', '(11) 98888-0059', 'Rua Sobe e Desce, 340', 'icaro.chaves@email.com', 'senha_hash_123'),
('00000000060', 'Julio Barros', '1994-10-07', '(11) 98888-0060', 'Praça Redonda, 350', 'julio.barros@email.com', 'senha_hash_123');

INSERT INTO Barbeiro (cpf, data_inicio) VALUES
('00000000051', '2023-01-10'),
('00000000052', '2023-02-15'),
('00000000053', '2023-03-20'),
('00000000054', '2023-04-12'),
('00000000055', '2023-05-01'),
('00000000056', '2023-06-05'),
('00000000057', '2023-07-18'),
('00000000058', '2023-08-30'),
('00000000059', '2023-09-14'),
('00000000060', '2023-10-25');

INSERT INTO Barbeiro_Chefe (cpf_barbeiro) VALUES
('00000000051'),
('00000000052'),
('00000000053'),
('00000000054'),
('00000000055');
