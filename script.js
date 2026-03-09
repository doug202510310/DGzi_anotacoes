const quadro = document.getElementById('quadro-kanban');
const btnNovaColuna = document.getElementById('btn-nova-coluna');
const modal = document.getElementById('modal-card');
const inputTitulo = document.getElementById('input-titulo-card');
const inputCor = document.getElementById('input-cor-card');
const btnSalvarCard = document.getElementById('btn-salvar-card');
const btnCancelarCard = document.getElementById('btn-cancelar-card');
const telaKanban = document.getElementById('quadro-kanban');
const headerPrincipal = document.querySelector('header');
const telaEditor = document.getElementById('tela-editor');
const btnVoltarKanban = document.getElementById('btn-voltar-kanban');
const tituloCardAtualEl = document.getElementById('titulo-card-atual');
const listaSubtitulosEl = document.getElementById('lista-subtitulos');
const btnNovoSubtitulo = document.getElementById('btn-novo-subtitulo');
const conteudoVazio = document.getElementById('conteudo-vazio');
const conteudoAtivo = document.getElementById('conteudo-ativo');
const tituloSubtituloAtualEl = document.getElementById('titulo-subtitulo-atual');
const areaDeTrabalho = document.getElementById('area-de-trabalho');
const areaEventos = document.getElementById('area-eventos');
const indicadorArmazenamento = document.getElementById('indicador-armazenamento');

const btnAddTexto = document.getElementById('btn-add-texto');
const btnAddChecklist = document.getElementById('btn-add-checklist');
const btnAddArquivo = document.getElementById('btn-add-arquivo');
const btnAddImagem = document.getElementById('btn-add-imagem'); 
const btnAddEvento = document.getElementById('btn-add-evento');
const inputArquivoEscondido = document.getElementById('input-arquivo-escondido');
const inputImagemEscondida = document.getElementById('input-imagem-escondida'); 
const btnDarkMode = document.getElementById('btn-dark-mode');
const btnExportar = document.getElementById('btn-exportar');
const inputImportar = document.getElementById('input-importar');
const modalTexto = document.getElementById('modal-texto');
const modalTextoTitulo = document.getElementById('modal-texto-titulo');
const modalTextoInput = document.getElementById('modal-texto-input');
const btnCancelarModalTexto = document.getElementById('btn-cancelar-modal-texto');
const btnConfirmarModalTexto = document.getElementById('btn-confirmar-modal-texto');
const modalEvento = document.getElementById('modal-evento');
const modalEventoTituloInput = document.getElementById('modal-evento-titulo-input');
const modalEventoDataInput = document.getElementById('modal-evento-data-input');
const btnCancelarModalEvento = document.getElementById('btn-cancelar-modal-evento');
const btnConfirmarModalEvento = document.getElementById('btn-confirmar-modal-evento');
const modalEditarCard = document.getElementById('modal-editar-card');
const inputEditarTituloCard = document.getElementById('input-editar-titulo-card');
const inputEditarCorCard = document.getElementById('input-editar-cor-card');
const btnCancelarEditarCard = document.getElementById('btn-cancelar-editar-card');
const btnSalvarEditarCard = document.getElementById('btn-salvar-editar-card');

let colunaAtualId = null; 
let cardAbertoAtual = null; 
let colunaDoCardAberto = null;
let subtituloAbertoAtual = null;

let dragInfo = null;
let dadosDoApp = JSON.parse(localStorage.getItem('anotacoesApp')) || { colunas: [] };

function escaparHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function salvarDados() { 
    localStorage.setItem('anotacoesApp', JSON.stringify(dadosDoApp)); 
    calcularEspacoUsado(); // Atualiza o medidor sempre que salva
}

// --- MEDIDOR DE ARMAZENAMENTO ATUALIZADO (USO / TOTAL) ---
function formatarBytes(bytes) {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return (mb / 1024).toFixed(2) + ' GB'; // Se passar de 1000MB, mostra em GB
    return mb.toFixed(2) + ' MB';
}

async function calcularEspacoUsado() {
    try {
        // Pesa os textos e listas salvos
        const localStr = localStorage.getItem('anotacoesApp') || '';
        const usoLocalBytes = localStr.length * 2;

        // Usa a API moderna do navegador para ver o limite de espaço do aparelho
        if (navigator.storage && navigator.storage.estimate) {
            const estimativa = await navigator.storage.estimate();
            
            const usoTotalBytes = estimativa.usage + usoLocalBytes;
            const limiteTotalBytes = estimativa.quota; // A cota liberada pelo sistema

            indicadorArmazenamento.textContent = `💾 Uso: ${formatarBytes(usoTotalBytes)} / ${formatarBytes(limiteTotalBytes)}`;
        } else {
            // Fallback caso o navegador não suporte ver o limite
            let usoTotalBytes = usoLocalBytes;
            await localforage.iterate((value) => {
                if (typeof value === 'string') usoTotalBytes += value.length * 2;
            });
            indicadorArmazenamento.textContent = `💾 Uso: ${formatarBytes(usoTotalBytes)} / (Limite Desconhecido)`;
        }
    } catch (e) {
        console.error("Erro ao calcular espaço:", e);
        indicadorArmazenamento.textContent = `💾 Erro ao ler armazenamento`;
    }
}

calcularEspacoUsado();

// --- FUNÇÃO DE LIMPEZA PROFUNDA ---
async function removerArquivosDoBanco(conteudos) {
    if(!conteudos) return;
    for(let bloco of conteudos) {
        if((bloco.tipo === 'arquivo' || bloco.tipo === 'imagem') && bloco.idArquivo) {
            await localforage.removeItem(bloco.idArquivo);
        }
    }
    calcularEspacoUsado();
}

// --- MODO ESCURO ---
let isDarkMode = localStorage.getItem('darkModeAnotacoes') === 'true';
if(isDarkMode) document.body.classList.add('dark-mode');

btnDarkMode.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkModeAnotacoes', isDarkMode);
});

// --- MODAIS PERSONALIZADOS (substituem prompt()) ---
let _resolveModalTexto = null;
function pedirTexto(titulo, placeholder = '', valorInicial = '') {
    return new Promise((resolve) => {
        _resolveModalTexto = resolve;
        modalTextoTitulo.textContent = titulo;
        modalTextoInput.placeholder = placeholder;
        modalTextoInput.value = valorInicial;
        modalTexto.className = 'modal-ativo';
        setTimeout(() => modalTextoInput.focus(), 50);
    });
}
function fecharModalTexto(resultado) {
    modalTexto.className = 'modal-escondido';
    if (_resolveModalTexto) { _resolveModalTexto(resultado ?? null); _resolveModalTexto = null; }
}
btnCancelarModalTexto.addEventListener('click', () => fecharModalTexto(null));
btnConfirmarModalTexto.addEventListener('click', () => fecharModalTexto(modalTextoInput.value.trim() || null));
modalTextoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') fecharModalTexto(modalTextoInput.value.trim() || null);
    if (e.key === 'Escape') fecharModalTexto(null);
});

let _resolveModalEvento = null;
function pedirEvento() {
    return new Promise((resolve) => {
        _resolveModalEvento = resolve;
        modalEventoTituloInput.value = '';
        modalEventoDataInput.value = new Date().toISOString().slice(0, 10);
        modalEvento.className = 'modal-ativo';
        setTimeout(() => modalEventoTituloInput.focus(), 50);
    });
}
function fecharModalEvento(resultado) {
    modalEvento.className = 'modal-escondido';
    if (_resolveModalEvento) { _resolveModalEvento(resultado ?? null); _resolveModalEvento = null; }
}
btnCancelarModalEvento.addEventListener('click', () => fecharModalEvento(null));
btnConfirmarModalEvento.addEventListener('click', () => {
    const titulo = modalEventoTituloInput.value.trim();
    const data = modalEventoDataInput.value;
    if (!titulo) { alert('Digite o título do evento.'); return; }
    if (!data) { alert('Selecione uma data.'); return; }
    fecharModalEvento({ titulo, data });
});
modalEventoTituloInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') modalEventoDataInput.focus(); if (e.key === 'Escape') fecharModalEvento(null); });
modalEventoDataInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnConfirmarModalEvento.click(); if (e.key === 'Escape') fecharModalEvento(null); });

let _resolveModalEditarCard = null;
function abrirModalEditarCard(card) {
    return new Promise((resolve) => {
        _resolveModalEditarCard = resolve;
        inputEditarTituloCard.value = card.titulo;
        inputEditarCorCard.value = card.cor;
        modalEditarCard.className = 'modal-ativo';
        setTimeout(() => inputEditarTituloCard.focus(), 50);
    });
}
function fecharModalEditarCard(resultado) {
    modalEditarCard.className = 'modal-escondido';
    if (_resolveModalEditarCard) { _resolveModalEditarCard(resultado ?? null); _resolveModalEditarCard = null; }
}
btnCancelarEditarCard.addEventListener('click', () => fecharModalEditarCard(null));
btnSalvarEditarCard.addEventListener('click', () => {
    const titulo = inputEditarTituloCard.value.trim();
    if (!titulo) { alert('O card precisa de um título.'); return; }
    fecharModalEditarCard({ titulo, cor: inputEditarCorCard.value });
});
inputEditarTituloCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnSalvarEditarCard.click();
    if (e.key === 'Escape') fecharModalEditarCard(null);
});

// --- EXPORTAR / IMPORTAR ---
btnExportar.addEventListener('click', () => {
    const json = JSON.stringify(dadosDoApp, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anotacoes_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
});
inputImportar.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const dados = JSON.parse(ev.target.result);
            if (!dados.colunas) throw new Error('inválido');
            if (confirm('Isso substituirá TODOS os dados atuais. Arquivos e imagens anexados não serão restaurados. Continuar?')) {
                dadosDoApp = dados;
                salvarDados(); inicializarApp();
            }
        } catch { alert('Arquivo inválido. Use um backup exportado por este app.'); }
    };
    reader.readAsText(file);
    inputImportar.value = '';
});

function limparDragHighlight() {
    document.querySelectorAll('.drop-alvo, .drop-alvo-coluna').forEach(el => el.classList.remove('drop-alvo', 'drop-alvo-coluna'));
}

// --- SISTEMA DE BADGES ---
function calcularAlertas(subtituloLista) {
    let v = 0, l = 0;
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    
    subtituloLista.forEach(sub => {
        if(sub.conteudos) {
            sub.conteudos.forEach(bloco => {
                if(bloco.tipo === 'evento' && bloco.data) {
                    const dataEv = new Date(bloco.data + 'T00:00:00'); 
                    const diff = Math.ceil((dataEv - hoje) / (1000 * 60 * 60 * 24));
                    if(diff >= 0 && diff <= 1) v++;
                    else if(diff > 1 && diff <= 3) l++;
                }
            });
        }
    });
    return { vermelho: v, laranja: l };
}

function htmlBadges(v, l) {
    let h = '<div class="area-badges">';
    if(v > 0) h += `<span class="badge badge-vermelho">${v}</span>`;
    if(l > 0) h += `<span class="badge badge-laranja">${l}</span>`;
    return h + '</div>';
}

// --- KANBAN ---
function inicializarApp() {
    quadro.innerHTML = ''; 
    dadosDoApp.colunas.forEach(coluna => { renderizarColuna(coluna.id, coluna.nome); coluna.cards.forEach(card => renderizarCard(coluna.id, card)); });
}

function renderizarColuna(id, nome) {
    const coluna = document.createElement('div');
    coluna.className = 'coluna';
    coluna.id = `coluna-${id}`;
    coluna.innerHTML = `
        <div class="coluna-header"><h2>${escaparHTML(nome)}</h2>
            <div style="display: flex; gap: 10px;">
                <button onclick="deletarColuna(${id})" title="Apagar Tema" style="background:transparent; border:none; font-size:1.2rem; cursor:pointer; opacity:0.5;">🗑️</button>
                <button class="btn-add-card" onclick="abrirModal(${id})">+</button>
            </div>
        </div>
        <div class="cards-container" id="container-${id}"></div>
    `;
    const header = coluna.querySelector('.coluna-header');
    const container = coluna.querySelector('.cards-container');

    // Arrastar coluna
    header.draggable = true;
    header.addEventListener('dragstart', (e) => {
        dragInfo = { tipo: 'coluna', colunaId: id };
        e.dataTransfer.setData('text/plain', 'coluna');
        setTimeout(() => coluna.classList.add('arrastando'), 0);
    });
    header.addEventListener('dragend', () => { coluna.classList.remove('arrastando'); dragInfo = null; limparDragHighlight(); });

    coluna.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (dragInfo?.tipo === 'coluna' && dragInfo.colunaId !== id) coluna.classList.add('drop-alvo-coluna');
        if (dragInfo?.tipo === 'card') container.classList.add('drop-alvo');
    });
    coluna.addEventListener('dragleave', (e) => {
        if (!coluna.contains(e.relatedTarget)) { coluna.classList.remove('drop-alvo-coluna'); container.classList.remove('drop-alvo'); }
    });
    coluna.addEventListener('drop', (e) => {
        e.preventDefault();
        coluna.classList.remove('drop-alvo-coluna');
        container.classList.remove('drop-alvo');
        if (!dragInfo) return;
        if (dragInfo.tipo === 'coluna' && dragInfo.colunaId !== id) {
            const idxOrigem = dadosDoApp.colunas.findIndex(c => c.id === dragInfo.colunaId);
            const idxDestino = dadosDoApp.colunas.findIndex(c => c.id === id);
            if (idxOrigem !== -1 && idxDestino !== -1) {
                const [removida] = dadosDoApp.colunas.splice(idxOrigem, 1);
                dadosDoApp.colunas.splice(idxDestino, 0, removida);
                salvarDados(); inicializarApp();
            }
        } else if (dragInfo.tipo === 'card') {
            moverCard(dragInfo.cardId, dragInfo.sourceColunaId, id);
        }
    });
    quadro.appendChild(coluna);
}

function moverCard(cardId, sourceColunaId, destColunaId) {
    if (sourceColunaId === destColunaId) return;
    const colunaOrigem = dadosDoApp.colunas.find(c => c.id === sourceColunaId);
    const colunaDestino = dadosDoApp.colunas.find(c => c.id === destColunaId);
    if (!colunaOrigem || !colunaDestino) return;
    const idxCard = colunaOrigem.cards.findIndex(c => c.id === cardId);
    if (idxCard === -1) return;
    const [card] = colunaOrigem.cards.splice(idxCard, 1);
    colunaDestino.cards.push(card);
    salvarDados(); inicializarApp();
}

window.deletarColuna = async function(id) {
    if(confirm('Tem certeza que deseja apagar esse tema e TUDO que tem nele?')) { 
        const col = dadosDoApp.colunas.find(c => c.id === id);
        if(col) {
            for(let card of col.cards) {
                if(card.subtitulos) {
                    for(let sub of card.subtitulos) {
                        await removerArquivosDoBanco(sub.conteudos);
                    }
                }
            }
        }
        dadosDoApp.colunas = dadosDoApp.colunas.filter(c => c.id !== id); 
        salvarDados(); inicializarApp(); 
    }
}

function renderizarCard(colunaId, card) {
    const container = document.getElementById(`container-${colunaId}`);
    const elementoCard = document.createElement('div');
    elementoCard.className = 'flashcard';
    elementoCard.style.backgroundColor = card.cor;
    elementoCard.draggable = true;

    const alertas = calcularAlertas(card.subtitulos || []);
    elementoCard.innerHTML = `
        <span class="txt-card">${escaparHTML(card.titulo)}</span>
        <div class="acoes-card">
            ${(alertas.vermelho > 0 || alertas.laranja > 0) ? htmlBadges(alertas.vermelho, alertas.laranja) : ''}
            <button class="btn-editar-card" title="Editar card">✏️</button>
        </div>
    `;

    elementoCard.querySelector('.btn-editar-card').addEventListener('click', async (e) => {
        e.stopPropagation();
        const resultado = await abrirModalEditarCard(card);
        if (resultado) { card.titulo = resultado.titulo; card.cor = resultado.cor; salvarDados(); inicializarApp(); }
    });

    elementoCard.addEventListener('click', () => abrirEditor(colunaId, card));

    elementoCard.addEventListener('dragstart', (e) => {
        dragInfo = { tipo: 'card', cardId: card.id, sourceColunaId: colunaId };
        e.dataTransfer.setData('text/plain', 'card');
        setTimeout(() => elementoCard.classList.add('arrastando'), 0);
    });
    elementoCard.addEventListener('dragend', () => { elementoCard.classList.remove('arrastando'); dragInfo = null; limparDragHighlight(); });

    container.appendChild(elementoCard);
}

btnNovaColuna.addEventListener('click', async () => {
    const n = await pedirTexto('Nova Coluna', 'Ex: Estudos, Trabalho...');
    if (n) { const id = Date.now(); dadosDoApp.colunas.push({ id, nome: n, cards: [] }); salvarDados(); renderizarColuna(id, n); }
});

// --- MODAL ---
window.abrirModal = function(id) { colunaAtualId = id; modal.className = 'modal-ativo'; inputTitulo.value = ''; inputTitulo.focus(); }
function fecharModal() { modal.className = 'modal-escondido'; colunaAtualId = null; }
btnCancelarCard.addEventListener('click', fecharModal);
inputTitulo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnSalvarCard.click();
    if (e.key === 'Escape') fecharModal();
});
btnSalvarCard.addEventListener('click', () => {
    const t = inputTitulo.value.trim();
    if (t !== "") {
        const c = dadosDoApp.colunas.find(col => col.id === colunaAtualId);
        const novoCard = { id: Date.now(), titulo: t, cor: inputCor.value, subtitulos: [] };
        c.cards.push(novoCard); salvarDados(); renderizarCard(colunaAtualId, novoCard); fecharModal();
    } else alert("Dê um título.");
});

// --- EDITOR ---
function abrirEditor(colunaId, card) {
    cardAbertoAtual = card; colunaDoCardAberto = colunaId;
    telaKanban.classList.add('escondido'); headerPrincipal.classList.add('escondido'); telaEditor.classList.remove('escondido');
    tituloCardAtualEl.textContent = card.titulo;
    renderizarListaSubtitulos();
    conteudoVazio.classList.remove('escondido'); conteudoAtivo.classList.add('escondido'); subtituloAbertoAtual = null;
}

btnVoltarKanban.addEventListener('click', () => {
    telaEditor.classList.add('escondido'); telaKanban.classList.remove('escondido'); headerPrincipal.classList.remove('escondido');
    cardAbertoAtual = null; inicializarApp(); 
});

function renderizarListaSubtitulos() {
    listaSubtitulosEl.innerHTML = ''; 
    if (!cardAbertoAtual.subtitulos) cardAbertoAtual.subtitulos = [];

    cardAbertoAtual.subtitulos.forEach((sub, index) => {
        const item = document.createElement('div');
        item.className = 'item-subtitulo';
        
        const alertas = calcularAlertas([sub]);
        const badgeHTML = (alertas.vermelho > 0 || alertas.laranja > 0) ? htmlBadges(alertas.vermelho, alertas.laranja) : '';

        item.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; flex:1;">
                <span class="txt-nome">${escaparHTML(sub.nome)}</span> ${badgeHTML}
            </div>
            <div class="acoes-subtitulo">
                <button class="btn-editar-sub" title="Renomear">✏️</button>
                <button class="btn-deletar-sub" title="Apagar">🗑️</button>
            </div>
        `;
        
        item.querySelector('.txt-nome').addEventListener('click', () => {
            document.querySelectorAll('.item-subtitulo').forEach(i => i.classList.remove('ativo'));
            item.classList.add('ativo'); abrirSubtitulo(sub);
        });

        item.querySelector('.btn-editar-sub').addEventListener('click', async (e) => {
            e.stopPropagation(); 
            const novoNome = await pedirTexto('Renomear subtítulo:', '', sub.nome);
            if(novoNome) { sub.nome = novoNome; salvarDados(); renderizarListaSubtitulos(); if(subtituloAbertoAtual===sub) tituloSubtituloAtualEl.textContent = novoNome; }
        });

        item.querySelector('.btn-deletar-sub').addEventListener('click', async (e) => {
            e.stopPropagation();
            if(confirm('Tem certeza que deseja apagar este subtítulo e TUDO que tem nele?')) {
                await removerArquivosDoBanco(sub.conteudos);
                cardAbertoAtual.subtitulos.splice(index, 1);
                salvarDados(); renderizarListaSubtitulos();
                if(subtituloAbertoAtual === sub) { conteudoVazio.classList.remove('escondido'); conteudoAtivo.classList.add('escondido'); }
            }
        });

        listaSubtitulosEl.appendChild(item);
    });
}

btnNovoSubtitulo.addEventListener('click', async () => {
    const nome = await pedirTexto('Novo Subtítulo', 'Ex: Introdução, Resumo...');
    if (nome) { cardAbertoAtual.subtitulos.push({ id: Date.now(), nome: nome, conteudos: [] }); salvarDados(); renderizarListaSubtitulos(); }
});

function abrirSubtitulo(subtitulo) {
    subtituloAbertoAtual = subtitulo; conteudoVazio.classList.add('escondido'); conteudoAtivo.classList.remove('escondido');
    tituloSubtituloAtualEl.textContent = subtitulo.nome; renderizarAreaDeTrabalho();
}

// RENDERIZAÇÃO ÁREA DE TRABALHO
function renderizarAreaDeTrabalho() {
    areaDeTrabalho.innerHTML = ''; areaEventos.innerHTML = ''; 
    if (!subtituloAbertoAtual.conteudos) subtituloAbertoAtual.conteudos = [];

    const ordem = { 'evento': 0, 'imagem': 1, 'texto': 2, 'lista': 3, 'arquivo': 4 };
    subtituloAbertoAtual.conteudos.sort((a, b) => ordem[a.tipo] - ordem[b.tipo]);
    salvarDados(); 

    subtituloAbertoAtual.conteudos.forEach((bloco, indexBloco) => {
        if(bloco.tipo === 'evento') {
            const cardEvento = document.createElement('div');
            cardEvento.className = 'mini-card-evento';
            const partes = bloco.data.split('-');
            cardEvento.innerHTML = `
                <div style="display:flex; justify-content: space-between;">
                    <span class="evento-titulo">${escaparHTML(bloco.titulo)}</span>
                    <button class="btn-deletar-bloco" style="margin-left: 10px;">🗑️</button>
                </div>
                <span class="evento-data">📅 ${partes[2]}/${partes[1]}/${partes[0]}</span>
            `;
            cardEvento.querySelector('.btn-deletar-bloco').addEventListener('click', () => {
                if(confirm('Apagar evento?')) { subtituloAbertoAtual.conteudos.splice(indexBloco, 1); salvarDados(); renderizarAreaDeTrabalho(); renderizarListaSubtitulos(); }
            });
            areaEventos.appendChild(cardEvento); return; 
        }

        const divBloco = document.createElement('div');
        divBloco.className = 'bloco-conteudo';
        const cabecalho = document.createElement('div');
        cabecalho.className = 'cabecalho-bloco';
        
        let tb = '';
        if(bloco.tipo === 'texto') tb = '📝 Anotação';
        if(bloco.tipo === 'lista') tb = '☑️ Lista';
        if(bloco.tipo === 'arquivo') tb = '📎 Arquivo';
        if(bloco.tipo === 'imagem') tb = '🖼️ Imagem Anexada';

        cabecalho.innerHTML = `<span class="titulo-tipo-bloco">${tb}</span> <button class="btn-deletar-bloco">🗑️</button>`;
        cabecalho.querySelector('.btn-deletar-bloco').addEventListener('click', async () => {
            if(confirm('Apagar este bloco?')) { 
                await removerArquivosDoBanco([bloco]); 
                subtituloAbertoAtual.conteudos.splice(indexBloco, 1); 
                salvarDados(); renderizarAreaDeTrabalho(); 
            }
        });
        divBloco.appendChild(cabecalho);

        if (bloco.tipo === 'texto') {
            const ct = document.createElement('div');
            ct.innerHTML = `
                <div class="toolbar-texto">
                    <button class="btn-formatacao" data-cmd="bold" style="font-weight:bold;">B</button>
                    <button class="btn-formatacao" data-cmd="italic" style="font-style:italic;">I</button>
                    <button class="btn-formatacao" data-cmd="underline" style="text-decoration:underline;">U</button>
                </div>
                <div class="bloco-texto-rico" contenteditable="true">${bloco.valor || ''}</div>
            `;
            const a = ct.querySelector('.bloco-texto-rico');
            ct.querySelectorAll('.btn-formatacao').forEach(btn => {
                btn.addEventListener('mousedown', (e) => { e.preventDefault(); document.execCommand(btn.dataset.cmd, false, null); a.focus(); });
            });
            a.addEventListener('input', () => { bloco.valor = a.innerHTML; salvarDados(); });
            divBloco.appendChild(ct);
        } 
        else if (bloco.tipo === 'imagem') {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = `<p style="font-size: 0.9rem; color: #7f8c8d;">Carregando imagem...</p>`;
            
            localforage.getItem(bloco.idArquivo).then(data => {
                if(data) {
                    wrapper.innerHTML = `<img src="${data}" class="imagem-inserida">`;
                } else {
                    wrapper.innerHTML = `<p style="color: red;">Imagem não encontrada no sistema.</p>`;
                }
            });
            divBloco.appendChild(wrapper);
        }
        else if (bloco.tipo === 'lista') {
            const cItens = document.createElement('div'); cItens.className = 'container-itens-lista';
            if (!bloco.itens) bloco.itens = []; 
            bloco.itens.forEach((item, indexItem) => {
                const li = document.createElement('div'); li.className = 'bloco-checklist'; li.style.opacity = item.concluido ? '0.5' : '1';
                li.innerHTML = `
                    <input type="checkbox" ${item.concluido ? 'checked' : ''}>
                    <input type="text" value="${escaparHTML(item.texto)}" style="text-decoration: ${item.concluido ? 'line-through' : 'none'};">                    
                    <button class="btn-deletar-bloco" style="border:none;background:transparent;">❌</button>
                `;
                li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => { item.concluido = e.target.checked; salvarDados(); renderizarAreaDeTrabalho(); });
                li.querySelector('input[type="text"]').addEventListener('input', (e) => { item.texto = e.target.value; salvarDados(); });
                li.querySelector('button').addEventListener('click', () => { bloco.itens.splice(indexItem, 1); salvarDados(); renderizarAreaDeTrabalho(); });
                cItens.appendChild(li);
            });
            const btnAdd = document.createElement('button'); btnAdd.className = 'btn-adicionar-item-lista'; btnAdd.textContent = '+ Adicionar item';
            btnAdd.addEventListener('click', () => { bloco.itens.push({ texto: '', concluido: false }); salvarDados(); renderizarAreaDeTrabalho(); });
            divBloco.appendChild(cItens); divBloco.appendChild(btnAdd);
        }
        else if (bloco.tipo === 'arquivo') {
            const wrapperArquivo = document.createElement('div');
            wrapperArquivo.className = 'bloco-arquivo';
            const nomeSpan = document.createElement('span');
            nomeSpan.className = 'nome-arquivo';
            nomeSpan.textContent = `📎 ${bloco.nome}`;
            const btnBaixar = document.createElement('button');
            btnBaixar.className = 'btn-baixar-arquivo';
            btnBaixar.textContent = 'Abrir/Baixar';
            wrapperArquivo.appendChild(nomeSpan);
            wrapperArquivo.appendChild(btnBaixar);
            divBloco.appendChild(wrapperArquivo);
            btnBaixar.addEventListener('click', async () => {
                const data = await localforage.getItem(bloco.idArquivo);
                if (data) {
                    const response = await fetch(data);
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const janela = window.open(url, '_blank');
                    if (!janela) {
                        // Fallback: popup bloqueado → força download
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = bloco.nome;
                        link.click();
                    }
                    setTimeout(() => URL.revokeObjectURL(url), 30000);
                }
            });
        }
        areaDeTrabalho.appendChild(divBloco);
    });
}

// FERRAMENTAS
btnAddTexto.addEventListener('click', () => { if (subtituloAbertoAtual) { subtituloAbertoAtual.conteudos.push({ tipo: 'texto', valor: '' }); salvarDados(); renderizarAreaDeTrabalho(); }});
btnAddChecklist.addEventListener('click', () => { if (subtituloAbertoAtual) { subtituloAbertoAtual.conteudos.push({ tipo: 'lista', itens: [{ texto: '', concluido: false }] }); salvarDados(); renderizarAreaDeTrabalho(); }});
btnAddArquivo.addEventListener('click', () => { if (subtituloAbertoAtual) inputArquivoEscondido.click(); });
btnAddImagem.addEventListener('click', () => { if (subtituloAbertoAtual) inputImagemEscondida.click(); }); 

btnAddEvento.addEventListener('click', async () => {
    if (subtituloAbertoAtual) {
        const resultado = await pedirEvento();
        if (resultado) {
            subtituloAbertoAtual.conteudos.push({ tipo: 'evento', titulo: resultado.titulo, data: resultado.data });
            salvarDados(); renderizarAreaDeTrabalho(); renderizarListaSubtitulos();
        }
    }
});

inputArquivoEscondido.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader(); reader.readAsDataURL(file); 
    reader.onload = async function() {
        const idUnico = 'arquivo_' + Date.now();
        await localforage.setItem(idUnico, reader.result);
        subtituloAbertoAtual.conteudos.push({ tipo: 'arquivo', idArquivo: idUnico, nome: file.name });
        salvarDados(); renderizarAreaDeTrabalho(); inputArquivoEscondido.value = ''; 
    };
});

inputImagemEscondida.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const idUnico = 'imagem_' + Date.now();
    subtituloAbertoAtual.conteudos.push({ tipo: 'imagem', idArquivo: idUnico });
    renderizarAreaDeTrabalho(); 

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = async function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; 
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrlCompressed = canvas.toDataURL('image/jpeg', 0.7);
            
            await localforage.setItem(idUnico, dataUrlCompressed);
            salvarDados(); 
            renderizarAreaDeTrabalho(); 
            inputImagemEscondida.value = '';
        }
    }
});

inicializarApp();