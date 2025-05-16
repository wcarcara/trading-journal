
const ASSETS = [
  { symbol: "BTCUSD", icon: "assets/btc.png", label: "BTC/USD" },
  { symbol: "XAUUSD", icon: "assets/gold.png", label: "XAU/USD" },
  { symbol: "SPX500USD", icon: "assets/spx.png", label: "SPX500" },
  { symbol: "NAS100USD", icon: "assets/nasdaq.png", label: "NAS100" },
  { symbol: "DJIUSD", icon: "assets/dji.png", label: "DJI" },
  { symbol: "USDJPY", icon: "assets/jpy.png", label: "USD/JPY" },
  { symbol: "EURUSD", icon: "assets/eur.png", label: "EUR/USD" },
  { symbol: "USOIL", icon: "assets/oil.png", label: "USOIL" },
  { symbol: "UKOIL", icon: "assets/oiluk.png", label: "UKOIL" }
];

function setupAssetSelector(initialValue="BTCUSD") {
  const assetOptionsContainer = document.getElementById('assetOptions');
  const selectedDiv = document.getElementById('selectedAssetJournal');
  const assetInput = document.getElementById('asset');

    if (!assetOptionsContainer || !selectedDiv || !assetInput) return;

  // Render options
  assetOptionsContainer.innerHTML = ASSETS.map(a =>
    `<div class="asset-option${a.symbol === initialValue ? ' active' : ''}" data-symbol="${a.symbol}">
      <img class="asset-icon-mini" src="${a.icon}" width="22" /> ${a.label}
     </div>`
  ).join('');
  // On select open
  selectedDiv.onclick = e => {
    assetOptionsContainer.style.display =
      assetOptionsContainer.style.display === 'block' ? 'none' : 'block';
    selectedDiv.classList.toggle('open');
  };
  // On option click
  assetOptionsContainer.onclick = e => {
    const option = e.target.closest('.asset-option');
    if (!option) return;
    const asset = ASSETS.find(a => a.symbol === option.dataset.symbol);
    document.querySelectorAll('.asset-option').forEach(o => o.classList.remove('active'));
    option.classList.add('active');
    selectedDiv.innerHTML =
      `<img class="asset-icon-mini" src="${asset.icon}" width="22"> ${asset.label} <span class="asset-dropdown-arrow">▼</span>`;
    assetInput.value = asset.symbol;
    assetOptionsContainer.style.display = 'none';
    selectedDiv.classList.remove('open');
  };
  // Set initial (or keep always latest selected)
  const current = ASSETS.find(a => a.symbol === (assetInput.value || initialValue)) || ASSETS[0];
  selectedDiv.innerHTML =
    `<img class="asset-icon-mini" src="${current.icon}" width="22"> ${current.label} <span class="asset-dropdown-arrow">▼</span>`;
  assetInput.value = current.symbol;
  assetOptionsContainer.style.display = 'none';
  // Escape on focus out
  selectedDiv.addEventListener('blur',()=>{assetOptionsContainer.style.display='none'; selectedDiv.classList.remove('open');});
}

document.addEventListener('DOMContentLoaded',()=>setupAssetSelector());

function attachCalculatorMaskMoney(input) {
  let raw = "000";

  function render() {
    // Garante pelo menos 3 dígitos (centavos), mas nunca exibe zero à esquerda depois disso
    let val = raw;
    if (val.length < 3) val = val.padStart(3, '0');
    // Remove zeros à esquerda, mas nunca remove todos para preservar centavos
    else val = val.replace(/^0+/, '') || '0';
    const intPart = val.substring(0, val.length - 2);
    const decimal = val.substring(val.length - 2);
    input.value = intPart + "." + decimal;
  }

  function reset() {
    raw = "000";
    render();
  }

  // Inicialize
  reset();

  input.addEventListener('focus', function() {
    setTimeout(() => input.select(), 20);
  });

  input.addEventListener('keydown', function(e) {
    if (["Tab", "Shift", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
    if (e.key === 'Backspace') {
      raw = raw.slice(0, -1);
      if (!raw.length) raw = "0";
      render();
      e.preventDefault();
      return;
    }
    if (/^\d$/.test(e.key)) {
      if (raw === "0") raw = "";
      if (raw.length < 15) {
        raw = raw + e.key;
      }
      render();
      e.preventDefault();
      return;
    }
    e.preventDefault();
  });

  input.addEventListener('paste', function(e) { e.preventDefault(); });
  input.addEventListener('blur', function() {
    if (!raw || raw === "0" || raw.replace(/0/g, "") === "") reset();
  });
}

document.addEventListener('DOMContentLoaded', function() {
  ['accountBalance', 'takeProfit', 'entryPrice', 'stopLoss'].forEach(id => {
    const inp = document.getElementById(id);
    if (inp) attachCalculatorMaskMoney(inp);
  });
});

document.addEventListener('DOMContentLoaded', function() {
  // MODAL ADD TRADE - ABRIR/FECHAR

  // Abrir modal ao clicar no botão na tabela
  const openAddTradeModalBtn = document.getElementById('openAddTradeModalBtn');
  const addTradeModal = document.getElementById('addTradeModal');
  const closeAddTradeModal = document.getElementById('closeAddTradeModal');

  if (openAddTradeModalBtn && addTradeModal) {
    openAddTradeModalBtn.addEventListener('click', () => {
      addTradeModal.style.display = 'flex';
    });
  }
  if (closeAddTradeModal && addTradeModal) {
    closeAddTradeModal.addEventListener('click', () => {
      addTradeModal.style.display = 'none';
      document.getElementById('tradeFormModal').reset();
      resetAddTradeAssetSelector();
    });
  }
  // Fechar ao clicar fora do conteúdo
  if (addTradeModal) {
    addTradeModal.addEventListener('mousedown', function(e) {
      if (e.target === addTradeModal) {
        addTradeModal.style.display = 'none';
        document.getElementById('tradeFormModal').reset();
        resetAddTradeAssetSelector();
      }
    });
  }

  // Asset selector do modal
  function setupAddTradeAssetSelector() {
    const assetOptionsContainer = document.getElementById('assetOptionsModal');
    const selectedDiv = document.getElementById('selectedAssetJournalModal');
    const assetInput = document.getElementById('assetModal');
    if (!assetOptionsContainer || !selectedDiv || !assetInput) return;

    // Render options
    assetOptionsContainer.innerHTML = ASSETS.map(a =>
      `<div class="asset-option${a.symbol === "BTCUSD" ? ' active' : ''}" data-symbol="${a.symbol}">
        <img class="asset-icon-mini" src="${a.icon}" width="22" /> ${a.label}
       </div>`
    ).join('');
    // Open selector
    selectedDiv.onclick = e => {
      assetOptionsContainer.style.display =
        assetOptionsContainer.style.display === 'block' ? 'none' : 'block';
      selectedDiv.classList.toggle('open');
    };
    // Select option
    assetOptionsContainer.onclick = e => {
      const option = e.target.closest('.asset-option');
      if (!option) return;
      const asset = ASSETS.find(a => a.symbol === option.dataset.symbol);
      document.querySelectorAll('#assetOptionsModal .asset-option').forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      selectedDiv.innerHTML =
        `<img class="asset-icon-mini" src="${asset.icon}" width="22"> ${asset.label} <span class="asset-dropdown-arrow">▼</span>`;
      assetInput.value = asset.symbol;
      assetOptionsContainer.style.display = 'none';
      selectedDiv.classList.remove('open');
    };
    // Set initial
    const current = ASSETS.find(a => a.symbol === (assetInput.value || "BTCUSD")) || ASSETS[0];
    selectedDiv.innerHTML =
      `<img class="asset-icon-mini" src="${current.icon}" width="22"> ${current.label} <span class="asset-dropdown-arrow">▼</span>`;
    assetInput.value = current.symbol;
    assetOptionsContainer.style.display = 'none';
    selectedDiv.addEventListener('blur',()=>{assetOptionsContainer.style.display='none'; selectedDiv.classList.remove('open');});
  }

  function resetAddTradeAssetSelector() {
    // Quando resetar modal, volta para o asset inicial
    const selectedDiv = document.getElementById('selectedAssetJournalModal');
    const assetInput = document.getElementById('assetModal');
    if (selectedDiv && assetInput) {
      selectedDiv.innerHTML = `<img class="asset-icon-mini" src="assets/btc.png" width="22"> BTC/USD <span class="asset-dropdown-arrow">▼</span>`;
      assetInput.value = "BTCUSD";
    }
  }

  setupAddTradeAssetSelector();

  // Máscaras nos inputs do modal, igual ao form antigo
  ['accountBalanceModal', 'entryPriceModal', 'takeProfitModal', 'stopLossModal'].forEach(id => {
    const inp = document.getElementById(id);
    if (inp) attachCalculatorMaskMoney(inp);
  });

  // Calculadora automático para position size no modal
  ['accountBalanceModal', 'takeProfitModal', 'entryPriceModal', 'stopLossModal', 'riskPercentageModal'].forEach(id => {
    const inp = document.getElementById(id);
    if (inp) inp.addEventListener('input', () => {
      calculatePositionSizeModal();
    });
  });
  document.getElementById('wasStoppedOutModal')?.addEventListener('change', calculatePositionSizeModal);

  function calculatePositionSizeModal() {
    const acc = Number(document.getElementById('accountBalanceModal').value);
    const e = Number(document.getElementById('entryPriceModal').value);
    const s = Number(document.getElementById('stopLossModal').value);
    const rp = Number(document.getElementById('riskPercentageModal').value) / 100;
    let size = (acc && e && s && rp) ? (acc * rp / Math.abs(e - s)) : 0;
    document.getElementById('positionSizeModal').value = size > 0 ? size.toFixed(2) : '';
  }

  // SUBMIT MODAL FORM (INCLUIR NOVO TRADE)
  document.getElementById('tradeFormModal').addEventListener('submit', async function(e) {
    e.preventDefault();

    const trade = {
      accountBalance: parseFloat(document.getElementById('accountBalanceModal').value),
      asset: document.getElementById('assetModal').value || 'BTCUSD',
      entryPrice: parseFloat(document.getElementById('entryPriceModal').value),
      takeProfit: parseFloat(document.getElementById('takeProfitModal').value),
      stopLoss: parseFloat(document.getElementById('stopLossModal').value),
      riskPercentage: parseFloat(document.getElementById('riskPercentageModal').value),
      commission: parseFloat(document.getElementById('commissionModal').value),
      positionSize: parseFloat(document.getElementById('positionSizeModal').value),
      tradeComment: document.getElementById('tradeCommentModal').value,
      tradeDateTime: document.getElementById('tradeDateTimeModal').value,
      wasStoppedOut: document.getElementById('wasStoppedOutModal').checked
    };

    // Salvar no indexedDB e atualizar UI via TradingJournalApp
    if (window.tradingJournalApp && window.tradingJournalApp.saveTrade) {
      await window.tradingJournalApp.saveTrade(trade);
      // Fechar/Resetar modal
      addTradeModal.style.display = 'none';
      document.getElementById('tradeFormModal').reset();
      resetAddTradeAssetSelector();
      // Recomenda-se atualizar a tabela aqui se não for automático
      if (window.tradingJournalApp.updateTradeTable) window.tradingJournalApp.updateTradeTable();
    }
  });

});

class TradingJournalApp {
  constructor() {
    this.language = localStorage.getItem('language') || 'en';
    this.theme = localStorage.getItem('theme') || 'dark';
    this.trades = [];
    this.selectedMonthYear = this.getCurrentMonthYear();
    this.db = null;
    this.assets = [
      'BTCUSD', 'XAUUSD', 'SPX500USD', 'NAS100USD', 'DJIUSD',
      'USDJPY', 'EURUSD', 'USOIL', 'UKOIL'
    ];
    this.init();
  }

  async init() {
    document.body.classList.toggle('light-theme', this.theme === 'light');
    document.getElementById('languageSwitch').checked = this.language === 'pt';
    document.getElementById('themeSwitch').checked = this.theme === 'light';
    
    await this.initIndexedDB();
    await this.loadTrades();
    this.updateMonthYearDisplay();
    this.updateTradeTable();
    this.updateJournalStatistics();

    this.setupEventListeners();
    this.setupTradingJournal();
    this.applySettingsListeners();
  }

  getCurrentMonthYear() {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }

  

  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TradingJournalDB', 1);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('trades')) {
          db.createObjectStore('trades', { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };
      request.onerror = (event) => {
        console.error('Erro ao abrir IndexedDB:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async loadTrades() {
    if (!this.db) return;
    const transaction = this.db.transaction(['trades'], 'readonly');
    const store = transaction.objectStore('trades');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        this.trades = event.target.result;
        resolve();
      };
      request.onerror = (event) => {
        console.error('Erro ao carregar trades:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async saveTrade(trade) {
    if (!this.db) return;
    const transaction = this.db.transaction(['trades'], 'readwrite');
    const store = transaction.objectStore('trades');
    const request = store.put(trade);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        this.loadTrades().then(() => {
          this.updateTradeTable();
          this.updateJournalStatistics();
          this.updatePerformanceReports();
          resolve();
        }).catch(reject);
      };
      request.onerror = (event) => {
        console.error('Erro ao salvar trade:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async deleteTrade(tradeId) {
    if (!this.db) return;
    const transaction = this.db.transaction(['trades'], 'readwrite');
    const store = transaction.objectStore('trades');
    const request = store.delete(tradeId);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        this.loadTrades().then(() => {
          this.updateTradeTable();
          this.updateJournalStatistics();
          this.updatePerformanceReports();
          resolve();
        }).catch(reject);
      };
      request.onerror = (event) => {
        console.error('Erro ao deletar trade:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  setupEventListeners() {
  // Sidebar tab navigation
  document.querySelectorAll('.excel-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.excel-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.excel-tab-content').forEach(c => c.style.display = "none");
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).style.display = "block";
    if (tab === 'heatmap') {
      if (window.tradingJournalAI) window.tradingJournalAI.reloadAndRenderHeatmap();
    }
      if (tab === 'performance') this.updateJournalStatistics();
      if (tab === 'journal') this.updateTradeTable();
    });
  });

  // Settings, premium, login modals
  document.getElementById('settingsBtn')?.addEventListener('click', () => this.showModal('settingsModal'));
  document.getElementById('closeSettings')?.addEventListener('click', () => this.hideModal('settingsModal'));
  document.getElementById('premiumBtn')?.addEventListener('click', () => this.showModal('premiumModal'));
  document.getElementById('closePremium')?.addEventListener('click', () => this.hideModal('premiumModal'));
  document.getElementById('loginBtn')?.addEventListener('click', () => this.showModal('loginModal'));
  document.getElementById('closeLogin')?.addEventListener('click', () => this.hideModal('loginModal'));

  // Export, month nav
  document.getElementById('exportCsvBtn')?.addEventListener('click', () => this.exportToCsv());
  document.getElementById('prevMonthBtn')?.addEventListener('click', () => this.changeMonth(-1));
  document.getElementById('nextMonthBtn')?.addEventListener('click', () => this.changeMonth(1));

  // Overlay close
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('mousedown', (e) => {
      if (e.target === modal) this.hideModal(modal.id);
    });
  });

  // Settings switches
  document.getElementById('languageSwitch')?.addEventListener('change', (e) => {
    this.language = e.target.checked ? 'pt' : 'en';
    localStorage.setItem('language', this.language);
    this.updateTradeTable();
    this.updateJournalStatistics();
  });
  document.getElementById('themeSwitch')?.addEventListener('change', (e) => {
    this.theme = e.target.checked ? 'light' : 'dark';
    localStorage.setItem('theme', this.theme);
    document.body.classList.toggle('light-theme', this.theme === 'light');
  });

  // Trade size auto-calc
  ['accountBalance', 'takeProfit', 'entryPrice', 'stopLoss'].forEach(id => {
    const inp = document.getElementById(id);
    if (inp) {
      inp.addEventListener('input', () => this.calculatePositionSize());
    }
  });
  const wasStoppedOutCheckbox = document.getElementById('wasStoppedOut');
  if (wasStoppedOutCheckbox) {
    wasStoppedOutCheckbox.addEventListener('change', () => this.calculatePositionSize());
  }

  // Table actions: edit/delete
  document.getElementById('tradeTableBody').addEventListener('click', async (e) => {
    if (e.target.closest('.action-btn.delete')) {
      const tr = e.target.closest('tr');
      const id = Number(tr.dataset.id);
      await this.deleteTrade(id);
    }
    if (e.target.closest('.action-btn.edit')) {
      const tr = e.target.closest('tr');
      const id = Number(tr.dataset.id);
      const trade = this.trades.find(t => t.id === id);
      if (trade) this.fillEditForm(trade);
      this.editingTradeId = id;
    }
  });

}

  showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
  }
  hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
  }

  applySettingsListeners() {
    // Already handled in setupEventListeners.
  }

  setupTradingJournal() {
    const tradeForm = document.getElementById('tradeForm');
    if (tradeForm) {
      tradeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const wasStoppedOut = document.getElementById('wasStoppedOut').checked;
        const trade = {
          accountBalance: parseFloat(document.getElementById('accountBalance').value),
          asset: document.getElementById('asset').value || 'BTCUSD',
          entryPrice: parseFloat(document.getElementById('entryPrice').value),
          takeProfit: parseFloat(document.getElementById('takeProfit').value),
          stopLoss: parseFloat(document.getElementById('stopLoss').value),
          riskPercentage: parseFloat(document.getElementById('riskPercentage').value),
          commission: parseFloat(document.getElementById('commission').value),
          positionSize: parseFloat(document.getElementById('positionSize').value),
          tradeComment: document.getElementById('tradeComment').value,
          tradeDateTime: document.getElementById('tradeDateTime').value,
          wasStoppedOut: wasStoppedOut  // Novo campo
        };
        await this.saveTrade(trade);
        tradeForm.reset();
        document.getElementById('selectedAssetJournal').textContent = this.language === 'pt' ? 'Selecione um ativo' : 'Select an asset';
      });
  
      // Reconfigurando os event listeners para cálculo automático
      const calculateFields = ['accountBalance', 'takeProfit', 'entryPrice', 'stopLoss'];

  calculateFields.forEach(id => {
    const inp = document.getElementById(id);
    if (inp) attachCalculatorMaskMoney(inp);
  });

  calculateFields.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      const newElement = element.cloneNode(true);
      element.parentNode.replaceChild(newElement, element);
      newElement.addEventListener('input', () => this.calculatePositionSize());
    }
  });
  
      // Também atualizar quando stopout for clicado (opcional)
      const wasStoppedOutCheckbox = document.getElementById('wasStoppedOut');
      if (wasStoppedOutCheckbox) {
        wasStoppedOutCheckbox.addEventListener('change', () => {
          // Opcional: Ao marcar "stoppado", pode-se forçar um recálculo ou atualizar UI
          this.calculatePositionSize();
        });
      }
  
      // Configurar asset selector do journal (resto do código existente)
      const assetSelector = document.getElementById('assetSelector');
      if (assetSelector) {
          assetSelector.innerHTML = `
          <div class="crypto-selector-header">
            <span id="selectedAssetJournal">${this.language === 'pt' ? 'Selecione um ativo' : 'Select an asset'}</span>
            <span class="dropdown-arrow">▼</span>
          </div>
          <div class="crypto-options" id="assetOptions" style="display: none;">
            ${this.assets.map(asset => `<div class="crypto-option" data-value="${asset}">${asset}</div>`).join('')}
          </div>
        `;
  
        const selectorHeader = assetSelector.querySelector('.crypto-selector-header');
        const assetOptions = document.getElementById('assetOptions');
        selectorHeader.addEventListener('click', () => {
          assetOptions.style.display = assetOptions.style.display === 'none' ? 'block' : 'none';
        });
  
        document.querySelectorAll('#assetOptions .crypto-option').forEach(option => {
          option.addEventListener('click', () => {
            const selectedAsset = option.dataset.value;
            document.getElementById('selectedAssetJournal').textContent = selectedAsset;
            document.getElementById('asset').value = selectedAsset;
            assetOptions.style.display = 'none';
            this.calculatePositionSize();
          });
        });
      }
    }
  }

  updateTradeTable() {
  const tradeTableBody = document.getElementById('tradeTableBody');
  if (!tradeTableBody) return;

  tradeTableBody.innerHTML = '';

  // Filtrar trades do mês/ano corrente que está selecionado
  const daysInMonth = new Date(this.selectedMonthYear.year, this.selectedMonthYear.month, 0).getDate();
  const filteredTrades = this.trades.filter(trade => {
    const tradeDate = new Date(trade.tradeDateTime);
    return tradeDate.getFullYear() === this.selectedMonthYear.year &&
           (tradeDate.getMonth() + 1) === this.selectedMonthYear.month;
  });

  // Agrupar trades por dia
  const tradesByDay = {};
  filteredTrades.forEach(trade => {
    const tradeDate = new Date(trade.tradeDateTime);
    const day = tradeDate.getDate();
    if (!tradesByDay[day]) tradesByDay[day] = [];
    tradesByDay[day].push(trade);
  });

  // Preenche a tabela combinando grid de dias + trades daquele dia
  for (let day = 1; day <= daysInMonth; day++) {
    const formattedDay = day.toString().padStart(2, '0');
    const formattedMonth = this.selectedMonthYear.month.toString().padStart(2, '0');
    const formattedDate = `${formattedDay}-${formattedMonth}-${this.selectedMonthYear.year}`;

  // ...
  if (tradesByDay[day] && tradesByDay[day].length > 0) {
    tradesByDay[day].forEach(trade => {
      const tradeDate = new Date(trade.tradeDateTime);
      const formattedTradeTime = `${tradeDate.getHours().toString().padStart(2, '0')}:${tradeDate.getMinutes().toString().padStart(2, '0')}`;
      const formattedTradeDate = `${formattedDate} ${formattedTradeTime}`;
      const { profit, profitPercentage, commission } = this.calculateProfit(trade);

      const profitClass = profit > 0 ? 'up' : profit < 0 ? 'down' : 'neutral';
      const stoppedOutClass = trade.wasStoppedOut ? 'stopped-out' : '';
      const stoppedCellClass = trade.wasStoppedOut ? 'stopped-cell' : '';

      const row = document.createElement('tr');
      row.className = stoppedOutClass;
      row.innerHTML = `
        <td>${formattedTradeDate}</td>
        <td>${trade.asset}</td>
        <td>${Number(trade.entryPrice).toFixed(2)}</td>
        <td>${Number(trade.takeProfit).toFixed(2)}</td>
        <td class="${stoppedCellClass}">
          <div class="stop-value-container">
            ${Number(trade.stopLoss).toFixed(2)}
            ${trade.wasStoppedOut ? '<span class="stopped-badge">!</span>' : ''}
          </div>
        </td>
        <td>${Number(trade.riskPercentage).toFixed(2)}</td>
        <td>-$${commission.toFixed(2)}</td>
        <td>${Number(trade.positionSize).toFixed(2)}</td>
        <td>${trade.tradeComment || '-'}</td>
        <td class="${profitClass}">$${profit.toFixed(2)} (${profitPercentage.toFixed(2)}%)</td>
        <td>
          <button class="action-btn delete" data-id="${trade.id}" data-translate="Delete">Delete</button>
        </td>
      `;
      tradeTableBody.appendChild(row);
    });
  } else {
    // Preenche células vazias para o mês inteiro, todos os 11 <td>
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formattedDate}</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td></td>
    `;
    tradeTableBody.appendChild(row);
  }
}

  // Adicionar eventos aos botões de delete
  document.querySelectorAll('.action-btn.delete').forEach(btn => {
    btn.addEventListener('click', (e) => this.deleteTrade(parseInt(e.target.dataset.id)));
  });

  // Atualizar traduções, estatísticas, etc
  this.updateLanguage && this.updateLanguage();
  this.updateJournalStatistics && this.updateJournalStatistics();
}

updateJournalStatistics() {
    // Obter os elementos de estatísticas
    const winRateElement = document.querySelector('.stat-item:nth-child(1) .stat-value');
    const profitFactorElement = document.querySelector('.stat-item:nth-child(2) .stat-value');
    const totalTradesElement = document.querySelector('.stat-item:nth-child(3) .stat-value');
    const avgTradeElement = document.querySelector('.stat-item:nth-child(4) .stat-value');
    
    // Calcular estatísticas
    const totalTrades = this.trades.length;
    if (totalTrades === 0) {
      // Definir valores padrão se não houver trades
      if (winRateElement) {
        winRateElement.textContent = '0%';
        winRateElement.className = 'stat-value';
      }
      if (profitFactorElement) {
        profitFactorElement.textContent = '0';
        profitFactorElement.className = 'stat-value';
      }
      if (totalTradesElement) totalTradesElement.textContent = '0';
      if (avgTradeElement) {
        avgTradeElement.textContent = '0%';
        avgTradeElement.className = 'stat-value';
      }
      return;
    }
    
    let wins = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    let totalProfitPercentage = 0;
    
    this.trades.forEach(trade => {
      const { profit, profitPercentage } = this.calculateProfit(trade);
      
      if (profit > 0) {
        wins++;
        totalProfit += profit;
      } else {
        totalLoss += Math.abs(profit);
      }
      
      totalProfitPercentage += profitPercentage;
    });
    
    // Calcular estatísticas
    const winRate = (wins / totalTrades) * 100;
    const profitFactor = totalLoss === 0 ? totalProfit : totalProfit / totalLoss;
    const avgTradePercentage = totalProfitPercentage / totalTrades;
    
    // Atualizar a UI
    if (winRateElement) {
      winRateElement.textContent = `${winRate.toFixed(0)}%`;
      winRateElement.className = `stat-value ${winRate >= 50 ? 'positive' : 'negative'}`;
    }
    
    if (profitFactorElement) {
      profitFactorElement.textContent = profitFactor.toFixed(2);
      profitFactorElement.className = `stat-value ${profitFactor >= 1 ? 'positive' : 'negative'}`;
    }
    
    if (totalTradesElement) totalTradesElement.textContent = totalTrades.toString();
    
    if (avgTradeElement) {
      avgTradeElement.textContent = `${avgTradePercentage >= 0 ? '+' : ''}${avgTradePercentage.toFixed(2)}%`;
      avgTradeElement.className = `stat-value ${avgTradePercentage >= 0 ? 'positive' : 'negative'}`;
    }
  }

  calculatePositionSize() {
    const acc = Number(document.getElementById('accountBalance').value);
    const e = Number(document.getElementById('entryPrice').value);
    const s = Number(document.getElementById('stopLoss').value);
    const rp = Number(document.getElementById('riskPercentage').value) / 100;
    let size = (acc && e && s && rp) ? (acc * rp / Math.abs(e - s)) : 0;
    document.getElementById('positionSize').value = size > 0 ? size.toFixed(2) : '';
  }

  calculateProfit(trade) {
  // Comissão em % (ex: 0.1) do trade, aplica sobre o resultado do trade:
  let entry = Number(trade.entryPrice) || 0;
  let tp = Number(trade.takeProfit) || 0;
  let sl = Number(trade.stopLoss) || 0;
  let size = Number(trade.positionSize) || 0;
  let commPct = Number(trade.commission) || 0; // <--- EM PERCENTUAL

  // Determina saída...
  const exitPrice = trade.wasStoppedOut ? sl : (tp > entry || tp < entry) ? tp : sl;
  let grossP = (exitPrice - entry) * size;
  let commission = Math.abs(grossP) * (commPct / 100); // <--- Valor em USD
  let finalP = grossP - commission;
  let pct = (size && entry) ? (finalP / (size * entry)) * 100 : 0;
  return {
    profit: Number(finalP) || 0,
    profitPercentage: Number(pct) || 0,
    commission: Number(commission) || 0,
    grossProfit: Number(grossP) || 0
  };
}

updateMonthYearDisplay() {
  const date = new Date(this.selectedMonthYear.year, this.selectedMonthYear.month - 1, 1);
  const lang = this.language === 'pt' ? 'pt-BR' : 'en-US';
  const monthYear = date.toLocaleString(lang, { month: 'long', year: 'numeric' });
  const currentMonthYearElement = document.getElementById('currentMonthYear');
  if (currentMonthYearElement) {
    currentMonthYearElement.textContent = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
  }
}

changeMonth(delta) {
  const curr = new Date(this.selectedMonthYear.year, this.selectedMonthYear.month - 1, 1);
  curr.setMonth(curr.getMonth() + delta);
  this.selectedMonthYear = {
    year: curr.getFullYear(),
    month: curr.getMonth() + 1
  };
  this.updateTradeTable();
  this.updateMonthYearDisplay();
}

  exportToCsv() {
    const headers = [
      'Date/Time', 'Asset', 'Entry Price', 'Take Profit', 'Stop Loss',
      'Risk (%)', 'Comissão (%)', 'Position Size', 'Trade Comment', 'Profit'
    ];
    const csvRows = [
      headers.join(','),
      ...this.trades.map(trade => {
        let { profit } = this.calculateProfit(trade);
        return [
          trade.tradeDateTime ? new Date(trade.tradeDateTime).toLocaleString() : '',
          trade.asset,
          Number(trade.entryPrice).toFixed(2),
          Number(trade.takeProfit).toFixed(2),
          Number(trade.stopLoss).toFixed(2),
          Number(trade.riskPercentage).toFixed(2),
          Number(trade.commission).toFixed(2),
          Number(trade.positionSize).toFixed(2),
          `"${trade.tradeComment || ''}"`,
          profit.toFixed(2)
        ].join(',');
      })
    ].join('\n');
    const blob = new Blob([csvRows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'trades.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  initPerformanceCharts() {
    // Chart.js setup
    const weekly = document.getElementById('weeklyChart');
  const monthly = document.getElementById('monthlyChart');
  const yearly = document.getElementById('yearlyChart');
  if (!(window.Chart && weekly && monthly && yearly)) {
    console.error('Chart.js ou elementos dos gráficos não encontrados.');
    return;
  }
  
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, position: 'bottom' } }
    };
    this.weeklyChart = new Chart(document.getElementById('weeklyChart'), {
      type: 'pie',
      data: { labels: ['Profit $', 'Loss $'], datasets: [{ data: [0, 0], backgroundColor: ['#4CAF50', '#F44336'] }]},
      options: chartOptions
    });
    this.monthlyChart = new Chart(document.getElementById('monthlyChart'), {
      type: 'pie',
      data: { labels: ['Profit $', 'Loss $'], datasets: [{ data: [0, 0], backgroundColor: ['#2196F3', '#F44336'] }]},
      options: chartOptions
    });
    this.yearlyChart = new Chart(document.getElementById('yearlyChart'), {
      type: 'pie',
      data: { labels: ['Profit $', 'Loss $'], datasets: [{ data: [0, 0], backgroundColor: ['#FFC107', '#F44336'] }]},
      options: chartOptions
    });
  }

  getPerformanceData(period) {
  const now = new Date();
  const data = { 
    trades: 0, 
    wins: 0, 
    losses: 0, 
    profit: 0, 
    loss: 0, 
    pnl: 0,         // Novo: P&L total (profit - loss)
    invested: 0,     // Novo: Total investido
    pnlPercentage: 0 // Novo: P&L como % do investido
  };

  let startDate, endDate;
  if (period === 'week') {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - (now.getDay() || 7));
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (period === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31);
  }

  const periodTrades = this.trades.filter(trade => {
    const tradeDate = new Date(trade.tradeDateTime);
    return tradeDate >= startDate && tradeDate <= endDate;
  });

  periodTrades.forEach(trade => {
    const { profit, profitPercentage } = this.calculateProfit(trade);
    
    // Calcular o valor investido na operação (baseado no tamanho da posição e preço de entrada)
    const invested = trade.positionSize * trade.entryPrice;
    data.invested += invested;
    
    if (profit > 0) {
      data.profit += profit;
      data.wins++;
    } else if (profit < 0) {
      data.loss += Math.abs(profit);
      data.losses++;
    }
    data.trades++;
  });

  // Calcular P&L e percentual sobre valor investido
  data.pnl = data.profit - data.loss;
  data.pnlPercentage = data.invested > 0 ? (data.pnl / data.invested) * 100 : 0;

  return data;
}

  updatePerformanceStats(period, trades, wins, losses, pnl, pnlPercentage) {
  const statsElement = document.getElementById(`${period}DetailedStats`);
  if (statsElement) {
    const pnlClass = pnl >= 0 ? 'positive' : 'negative';
    const pnlSign = pnl >= 0 ? '+' : '';
    
    statsElement.innerHTML = `
      <div class="performance-stats">
        <span>Trades: ${trades}</span> | 
        <span>Wins: ${wins}</span> | 
        <span>Losses: ${losses}</span> | 
        <span>P&L: <span class="${pnlClass}">${pnlSign}$${pnl.toFixed(2)} (${pnlSign}${pnlPercentage.toFixed(2)}%)</span></span>
      </div>
    `;
  }
}

 updatePerformanceReports() {
  if (!this.weeklyChart || !this.monthlyChart || !this.yearlyChart) return; // <-- só atualiza se já existem!

  const weeklyData = this.getPerformanceData('week');
  const monthlyData = this.getPerformanceData('month');
  const yearlyData = this.getPerformanceData('year');

  this.weeklyChart.data.datasets[0].data = [weeklyData.profit, weeklyData.loss];
  this.weeklyChart.update();
  this.updatePerformanceStats('weekly', weeklyData.trades, weeklyData.wins, weeklyData.losses, weeklyData.pnl, weeklyData.pnlPercentage);

  this.monthlyChart.data.datasets[0].data = [monthlyData.profit, monthlyData.loss];
  this.monthlyChart.update();
  this.updatePerformanceStats('monthly', monthlyData.trades, monthlyData.wins, monthlyData.losses, monthlyData.pnl, monthlyData.pnlPercentage);

  this.yearlyChart.data.datasets[0].data = [yearlyData.profit, yearlyData.loss];
  this.yearlyChart.update();
  this.updatePerformanceStats('yearly', yearlyData.trades, yearlyData.wins, yearlyData.losses, yearlyData.pnl, yearlyData.pnlPercentage);
}
}

function renderIaInsightsWelcome() {
  const aiContainer = document.getElementById('ai-insights-content');
  if (aiContainer) {
    aiContainer.innerHTML = `
      <div class="ai-insight-card">
        <h4 class="ai-insight-title">Bem-vindo aos Insights de IA</h4>
        <div class="ai-insight-body">
          Clique em <b>Gerar Insights</b> para ver padrões e recomendações baseados em IA sobre suas operações.
        </div>
      </div>
      <div class="ai-insight-card">
        <h4 class="ai-insight-title">Como Funciona?</h4>
        <div class="ai-insight-body">
          A IA irá analisar fatores como acurácia, lucro e padrões de comportamento em seus trades, e retornará recomendações práticas para melhoria contínua — tudo embasado nos seus dados reais.
        </div>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  renderIaInsightsWelcome();
 
});

document.addEventListener('DOMContentLoaded', () => {
  window.tradingJournalApp = new TradingJournalApp();
  // Inicialização do heatmap/IA
  setTimeout(() => {
    if (window.tradingJournalAI) return;
    if (window.tradingJournalApp)
      window.tradingJournalAI = new TradingJournalAI(window.tradingJournalApp);
  }, 200);
});

// Excel-style tabs logic
document.addEventListener('DOMContentLoaded', function () {
  const tabButtons = document.querySelectorAll('.excel-tab');
  const tabContents = document.querySelectorAll('.excel-tab-content');

  tabButtons.forEach(function(tab) {
    tab.addEventListener('click', function() {
      // Remove .active de todas as abas e esconde conteúdos
      tabButtons.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.style.display = "none");

      // Ativa a aba clicada e mostra o conteúdo correspondente
      tab.classList.add('active');
      const targetId = "tab-" + tab.getAttribute('data-tab');
      const content = document.getElementById(targetId);
      if(content) content.style.display = "block";
    });
  });
});


document.addEventListener('DOMContentLoaded', function () {
 
  // 1. Modal Seja um Apoiador
document.getElementById('apoiadorBtn')?.addEventListener('click', function() {
  document.getElementById('apoiadorModal').style.display = 'flex';
});
document.getElementById('closeApoiadorModal')?.addEventListener('click', function() {
  document.getElementById('apoiadorModal').style.display = 'none';
});
document.getElementById('apoiadorModal')?.addEventListener('mousedown', function(e) {
  if (e.target === this) this.style.display = 'none';
});

// 2. Modal Sobre
document.getElementById('sobreBtn')?.addEventListener('click', function() {
  document.getElementById('sobreModal').style.display = 'flex';
});
document.getElementById('closeSobreModal')?.addEventListener('click', function() {
  document.getElementById('sobreModal').style.display = 'none';
});
document.getElementById('sobreModal')?.addEventListener('mousedown', function(e) {
  if (e.target === this) this.style.display = 'none';
});

// 3. Settings (inalterado; já existe)
document.getElementById('settingsBtn')?.addEventListener('click', function() {
  document.getElementById('settingsModal').style.display = 'flex';
});
document.getElementById('closeSettings')?.addEventListener('click', function() {
  document.getElementById('settingsModal').style.display = 'none';
});
document.getElementById('settingsModal')?.addEventListener('mousedown', function(e) {
  if (e.target === this) this.style.display = 'none';
});

  // ----------- CALENDÁRIO RELATÓRIO MENSAL ------------

  // Abrir modal ao clicar no botão "Relatório mensal"
  document.getElementById('monthlyReportBtn')?.addEventListener('click', () => {
    renderMonthlyPnLCalendar();
    document.getElementById('monthlyReportModal').style.display = 'flex';
  });

  document.getElementById('closeMonthlyReportModal')?.addEventListener('click', () => {
    document.getElementById('monthlyReportModal').style.display = 'none';
  });

  document.getElementById('monthlyReportModal')?.addEventListener('mousedown', function(e) {
    if (e.target === this) this.style.display = 'none';
  });
});

// Função principal - renderiza o calendário do mês selecionado mostrando Lucro/Loss diário
function renderMonthlyPnLCalendar() {
  const app = window.tradingJournalApp;
  if (!app) return;
  const sel = app.selectedMonthYear;
  const trades = app.trades || [];
  const calendarGrid = document.getElementById('calendarGrid');
  if (!calendarGrid) return;

  // Título dinâmico
  const dateMonth = new Date(sel.year, sel.month-1, 1);
  const lang = app.language === 'pt' ? 'pt-BR' : 'en-US';
  document.getElementById('monthlyCalendarTitle').textContent =
    `Relatório mensal — ${dateMonth.toLocaleString(lang, {month:'long', year:'numeric'})}`;

  // 1. Gerar painel de cabeçalho (D-S-T-Q-Q-S-S)
  // Começando sempre Domingo (usado no Brasil)
  const weekDays = app.language === 'pt'
    ? ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
    : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // 2. Monta trades agrupados por dia
  const dailyPnL = {};
  for (const trade of trades) {
    const dt = trade.tradeDateTime && new Date(trade.tradeDateTime);
    if (
      dt &&
      dt.getFullYear() === sel.year &&
      dt.getMonth() + 1 === sel.month
    ) {
      const day = dt.getDate();
      if (!dailyPnL[day]) dailyPnL[day] = 0;
      const { profit } = app.calculateProfit(trade);
      dailyPnL[day] += profit;
    }
  }

  // 3. Configurar como um calendário
  const firstDay = new Date(sel.year, sel.month-1, 1);
  const lastDayNum = new Date(sel.year, sel.month, 0).getDate();
  const firstWeekDay = firstDay.getDay(); // 0=Dom, 1=Seg, etc.
  const totalCells = Math.ceil((firstWeekDay + lastDayNum) / 7) * 7;

  // Limpa anterior
  calendarGrid.innerHTML = "";

  // Header: dias da semana
  const header = document.createElement('div');
  header.className = 'calendar-header';
  weekDays.forEach(wd => {
    const d = document.createElement('div');
    d.textContent = wd;
    header.appendChild(d);
  });
  calendarGrid.appendChild(header);

  // Dias das células do mês
  const today = new Date();
  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.className = "calendar-day-cell";
    const dayNum = i - firstWeekDay + 1;

    // Fora do mês
    if (i < firstWeekDay || dayNum > lastDayNum) {
      cell.classList.add("not-this-month");
      calendarGrid.appendChild(cell);
      continue;
    }

    // Hoje
    if (
      sel.year === today.getFullYear() &&
      sel.month === today.getMonth() + 1 &&
      dayNum === today.getDate()
    ) {
      cell.classList.add("today");
    }

    // Número do dia
    const daySpan = document.createElement('span');
    daySpan.className = 'day-num';
    daySpan.textContent = dayNum;
    cell.appendChild(daySpan);

    // PnL/loss do dia
    let value = dailyPnL[dayNum] || 0;
    let pnlSpan = document.createElement('span');
    pnlSpan.className = 'day-pnl';
    pnlSpan.textContent = value !== 0 ? (value > 0 ? '+' : '') + value.toFixed(2) : '-';

    if (value > 0) cell.classList.add('positive');
    else if (value < 0) { cell.classList.add('negative'); pnlSpan.classList.add('negative'); }
    else cell.classList.add('neutral');

    cell.appendChild(pnlSpan);
    calendarGrid.appendChild(cell);
  }
}

let chartsInitialized = false;

function showPerformanceTabAndCharts() {
  if (window.tradingJournalApp.weeklyChart) window.tradingJournalApp.weeklyChart.destroy();
  if (window.tradingJournalApp.monthlyChart) window.tradingJournalApp.monthlyChart.destroy();
  if (window.tradingJournalApp.yearlyChart) window.tradingJournalApp.yearlyChart.destroy();

  window.tradingJournalApp.initPerformanceCharts();
  window.tradingJournalApp.updatePerformanceReports();
}

document.addEventListener('DOMContentLoaded', function () {
  // Excel-style tabs logic (substitua pelo bloco abaixo)
  const tabButtons = document.querySelectorAll('.excel-tab');
  const tabContents = document.querySelectorAll('.excel-tab-content');

  tabButtons.forEach(function(tab) {
    tab.addEventListener('click', function() {
      // Remove .active de todas as abas e esconde conteúdos
      tabButtons.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.style.display = "none");

      // Ativa a aba clicada e mostra o conteúdo correspondente
      tab.classList.add('active');
      const targetId = "tab-" + tab.getAttribute('data-tab');
      const content = document.getElementById(targetId);
      if(content) content.style.display = "block";

      // Se foi para a aba de performance, (re)inicializa os gráficos
      if (tab.dataset.tab === 'performance') {
        showPerformanceTabAndCharts();
      }
    });
  });

  // Opcionalmente, inicializa se a aba performance já estiver ativa no load
  if (document.querySelector('.excel-tab.active')?.dataset.tab === 'performance') {
    showPerformanceTabAndCharts();
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const emailEl = document.getElementById('emailContato');
  if(emailEl) {
    emailEl.addEventListener('click', function(e) {
      e.preventDefault();
      const email = "wcarcaradev@protonmail.com";
      window.open(`mailto:${email}`,"_blank"); // Abre o email padrão do usuário
    });
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const theme = localStorage.getItem('theme') || 'dark';
  document.body.classList.toggle('light-theme', theme === 'light');
  
  // Atualiza o estado visual do switch (se existe)
  const themeSwitch = document.getElementById('themeSwitch');
  if (themeSwitch) {
    themeSwitch.checked = theme === 'light';
    themeSwitch.addEventListener('change', function(e) {
      const isLight = e.target.checked;
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      document.body.classList.toggle('light-theme', isLight);
    });
  }
});