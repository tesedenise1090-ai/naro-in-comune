CREATE TABLE categorie (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

CREATE TABLE petizioni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titolo VARCHAR(255) NOT NULL,
    descrizione TEXT NOT NULL,
    immagine_url VARCHAR(255),
    ente VARCHAR(255) NOT NULL,
    stato ENUM('aperta', 'chiusa', 'in_valutazione') DEFAULT 'aperta',
    data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
    quorum INT DEFAULT 0,
    coordinate_gps VARCHAR(255),
    categoria_id INT,
    risposta_ufficiale TEXT,
    FOREIGN KEY (categoria_id) REFERENCES categorie(id)
);

CREATE TABLE news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titolo VARCHAR(255) NOT NULL,
    contenuto TEXT NOT NULL,
    immagine_url VARCHAR(255),
    data_pubblicazione DATETIME DEFAULT CURRENT_TIMESTAMP,
    evidenza BOOLEAN DEFAULT FALSE
);

CREATE TABLE monitoraggio_territorio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_zona VARCHAR(255) NOT NULL,
    tipo_rischio VARCHAR(255) NOT NULL,
    link_idrogeo_esterno VARCHAR(255),
    stato_allerta ENUM('verde', 'gialla', 'arancione', 'rossa') DEFAULT 'verde'
);

CREATE TABLE utility_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    etichetta VARCHAR(255) NOT NULL,
    url_esterno VARCHAR(255) NOT NULL,
    descrizione TEXT,
    icona VARCHAR(50)
);

CREATE TABLE settings (
    chiave VARCHAR(50) PRIMARY KEY,
    valore TEXT
);
