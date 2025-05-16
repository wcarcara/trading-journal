class TradingJournalAI {
    constructor(app) {
      this.app = app;
      this.heatmapType = 'day_hour'; // dia/hora, weekday, asset
      this.heatmapData = {};
      this.isGeneratingInsights = false;
      this.aiInsights = null;
  
      this.init();
    }
  
    async init() {
  this.renderContainers();
  this.setupEventListeners();

  // Hook: toda vez que um trade é salvo, update o heatmap
  const originalSaveTrade = this.app.saveTrade.bind(this.app);
  this.app.saveTrade = async (trade) => {
    const result = await originalSaveTrade(trade);
    await this.reloadAndRenderHeatmap();
    return result;
  };

  // Corrigido: Hook só se switchTab existir
  if (typeof this.app.switchTab === 'function') {
    const originalSwitchTab = this.app.switchTab.bind(this.app);
    this.app.switchTab = (tabId) => {
      originalSwitchTab(tabId);
      if (tabId === 'trading-journal') {
        this.reloadAndRenderHeatmap();
      }
    };
  }

  // Carrega e exibe o heatmap inicial/ao abrir
  await this.reloadAndRenderHeatmap();
}
  
    async reloadAndRenderHeatmap() {
      // Usa os dados atuais do app.trades ( IndexedDB já é usado via assetTrackerApp )
      this.generateHeatmapData();
      this.renderHeatmap();
    }
  
    renderContainers() {
      // Criação do flex container com heatmap e IA lado a lado
      const container = document.querySelector('.trading-journal-container');
      if (!container) return;
  
      // Remover antigo se já havia para evitar múltiplos
      let flexRow = container.querySelector('.journal-extras-flex');
      if (flexRow) flexRow.remove();
  
      flexRow = document.createElement('div');
      flexRow.className = 'journal-extras-flex';
  
      // Heatmap
      const heatmapContainer = document.createElement('div');
      heatmapContainer.className = 'heatmap-container';
      heatmapContainer.innerHTML = `
        <div class="heatmap-header">
          <h3 class="heatmap-title">Heatmap de Operações</h3>
          <div class="heatmap-filter">
            <select id="heatmap-type">
              <option value="day_hour">Dia/Hora</option>
              <option value="weekday">Dia da Semana</option>
              <option value="asset">Ativo</option>
            </select>
          </div>
        </div>
        <div id="heatmap-content"></div>
        <div class="heatmap-legend">
  <div class="legend-item">
    <div class="legend-color" style="background-color: rgba(1,181,116,0.7); border:1px solid #00984A"></div>
    <span style="color:#08cf72;font-weight:600;">Win%</span>
  </div>
  <div class="legend-item">
    <div class="legend-color" style="background-color: rgba(234,6,6,0.7); border:1px solid #CC2222"></div>
    <span style="color:#ff6060;font-weight:600;">Loss%</span>
  </div>
</div>
      `;
  
      // IA Insights (mantendo sua estrutura original)
      const aiContainer = document.createElement('div');
      aiContainer.className = 'ai-insights-container';
      aiContainer.innerHTML = `
        <div class="ai-insights-header">
          <h3 class="ai-insights-title">Insights de IA</h3>
          <button id="generate-insights-btn" class="generate-insights-btn">
            <svg viewBox="0 0 24 24" fill="none"><path d="M21 12L9 12M21 6L9 6M21 18L9 18M5 12C5 12.5523 4.55228 13 4 13C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11C4.55228 11 5 11.4477 5 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 6C5 6.55228 4.55228 7 4 7C3.44772 7 3 6.55228 3 6C3 5.44772 3.44772 5 4 5C4.55228 5 5 5.44772 5 6Z" fill="currentColor"/><path d="M5 18C5 18.5523 4.55228 19 4 19C3.44772 19 3 18.5523 3 18C3 17.4477 3.44772 17 4 17C4.55228 17 5 17.4477 5 18Z" fill="currentColor"/></svg>
            Gerar Insights
          </button>
        </div>
        <div id="ai-insights-content" class="ai-insights-content">
        <div class="ai-insight-card"><h4 class="ai-insight-title">Análise de Padrões</h4><div class="ai-insight-body">Clique em "Gerar Insights" para analisar seus padrões de trading.</div></div>
        <div class="ai-insight-card"><h4 class="ai-insight-title">Resumo de Performance</h4><div class="ai-insight-body">Clique em "Gerar Insights" para obter um resumo de sua performance.</div></div>
        </div>
      `;
  
      flexRow.appendChild(heatmapContainer);
      flexRow.appendChild(aiContainer);
  
      // Inserir antes da section de relatórios de performance
      const performanceSection = container.querySelector('.performance-reports-container');
      if (performanceSection) {
        container.insertBefore(flexRow, performanceSection);
      } else {
        container.appendChild(flexRow);
      }
    }
  
    setupEventListeners() {
      document.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'heatmap-type') {
          this.heatmapType = e.target.value;
          this.generateHeatmapData();
          this.renderHeatmap();
        }
      });
      document.addEventListener('click', (e) => {
        if (e.target && (
            e.target.id === 'generate-insights-btn' ||
            (e.target.closest && e.target.closest('#generate-insights-btn'))
          )) {
          if (!this.isGeneratingInsights) {
            this.generateAIInsights();
          }
        }
      });
    }
  
    generateHeatmapData() {
      // Zera
      this.heatmapData = {};
      const trades = this.app.trades || [];
      if (this.heatmapType === 'day_hour') {
        for (let hour = 0; hour < 24; hour++) {
          this.heatmapData[hour] = {};
          for (let day = 0; day < 7; day++) {
            this.heatmapData[hour][day] = { wins: 0, losses: 0, total: 0 };
          }
        }
        trades.forEach(trade => {
          const tradeDate = new Date(trade.tradeDateTime);
          const day = tradeDate.getDay();
          const hour = tradeDate.getHours();
          const { profit } = this.app.calculateProfit(trade);
          const cell = this.heatmapData[hour] && this.heatmapData[hour][day]
            ? this.heatmapData[hour][day]
            : (this.heatmapData[hour][day] = { wins: 0, losses: 0, total: 0 });
          if (profit > 0) cell.wins++; else cell.losses++;
          cell.total++;
        });
      } else if (this.heatmapType === 'weekday') {
        for (let day = 0; day < 7; day++)
          this.heatmapData[day] = { wins: 0, losses: 0, total: 0 };
        trades.forEach(trade => {
          const tradeDate = new Date(trade.tradeDateTime);
          const day = tradeDate.getDay();
          const { profit } = this.app.calculateProfit(trade);
          const cell = this.heatmapData[day];
          if (profit > 0) cell.wins++; else cell.losses++;
          cell.total++;
        });
      } else if (this.heatmapType === 'asset') {
        trades.forEach(trade => {
          const asset = trade.asset || 'Desconhecido';
          if (!this.heatmapData[asset]) this.heatmapData[asset] = { wins: 0, losses: 0, total: 0 };
          const { profit } = this.app.calculateProfit(trade);
          if (profit > 0) this.heatmapData[asset].wins++; else this.heatmapData[asset].losses++;
          this.heatmapData[asset].total++;
        });
      }
    }
  
    renderHeatmap() {
      const container = document.getElementById('heatmap-content');
      if (!container) return;
  
      if (this.heatmapType === 'day_hour') {
        this.renderDayHourHeatmap(container);
      } else if (this.heatmapType === 'weekday') {
        this.renderWeekdayHeatmap(container);
      } else if (this.heatmapType === 'asset') {
        this.renderAssetHeatmap(container);
      }
    }
  
    renderDayHourHeatmap(container) {
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      let html = '<div class="heatmap-grid">';
      // Header
      html += '<div class="heatmap-cell header"></div>';
      dayNames.forEach(day => { html += `<div class="heatmap-cell header">${day}</div>`; });
      for (let hour = 0; hour < 24; hour++) {
        html += `<div class="heatmap-cell header">${hour}h</div>`;
        for (let day = 0; day < 7; day++) {
          const data = this.heatmapData[hour] && this.heatmapData[hour][day]
            ? this.heatmapData[hour][day]
            : { wins: 0, losses: 0, total: 0 };
          // Zero trades (cinza)
          if (data.total === 0) {
            html += `<div class="heatmap-cell" style="background-color:rgba(131,146,171,0.10)">
              <div class="win-rate">0%</div></div>`;
          } else {
            const winPct = Math.round((data.wins / data.total) * 100);
            const lossPct = Math.round((data.losses / data.total) * 100);
            if (data.wins === data.total) {
              // Tudo positivo
              const alpha = Math.max(0.15, Math.min(0.9, winPct / 100));
              html += `<div class="heatmap-cell" style="background-color:rgba(1,181,116,${alpha});">
                <div class="win-rate filled">${winPct}%</div>
                <span class="trade-count" style="color:rgba(255,255,255,0.75)">${data.total} trades</span>
              </div>`;
            } else if (data.losses === data.total) {
              // Tudo negativo
              const alpha = Math.max(0.15, Math.min(0.9, lossPct / 100));
              html += `<div class="heatmap-cell" style="background-color:rgba(234,6,6,${alpha});">
                <div class="win-rate filled">-${lossPct}%</div>
                <span class="trade-count" style="color:rgba(255,255,255,0.75)">${data.total} trades</span>
              </div>`;
            } // Atualize a renderização das células mistas no método renderDayHourHeatmap:
            else {
              // Misto - fundo dividido proporcional
              html += `<div class="heatmap-cell" style="padding:0;overflow:hidden">
                <div style="display:flex;width:100%;height:100%;position:absolute;top:0;left:0">
                  <div style="width:${winPct}%;height:100%;background:rgba(1,181,116,${Math.max(0.3,winPct/100)})"></div>
                  <div style="width:${lossPct}%;height:100%;background:rgba(234,6,6,${Math.max(0.3,lossPct/100)})"></div>
                </div>
                <div style="position:relative;z-index:1;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center">
                  <div class="win-rate filled" style="color:#fff;font-size:0.7rem;">${Math.round(winPct)}%</div>
                  <div style="color:#fff;font-size:0.7rem;">-${Math.round(lossPct)}%</div>
                  <span class="trade-count" style="color:rgba(255,255,255,0.75);font-size:0.65rem;">${data.total}</span>
                </div>
              </div>`;
            }
          }
        }
      }
      html += '</div>';
      container.innerHTML = html;
    }
  
    renderWeekdayHeatmap(container) {
      const dayNames = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
      let html = '<div style="display: flex; flex-direction: column; gap: 6px;">';
      for (let day = 0; day < 7; day++) {
        const data = this.heatmapData[day] || { wins:0, losses:0, total:0 };
        if(data.total === 0) {
          html += `<div style="display:flex"><div class="heatmap-cell" style="width:100%;background-color:rgba(131,146,171,0.10)">
            <span class="win-rate">0%</span>
          </div><div style="width:120px;padding-left:8px;">${dayNames[day]}</div></div>`;
        } else {
          const winPct = Math.round((data.wins/data.total)*100);
          const lossPct = Math.round((data.losses/data.total)*100);
          if(data.wins === data.total) {
            html += `<div style="display:flex">
              <div class="heatmap-cell" style="width:100%;background-color:rgba(1,181,116,${Math.max(0.15, winPct/100)});">
                <span class="win-rate filled">${winPct}%</span><span class="trade-count">${data.total} trades</span>
              </div>
              <div style="width:120px;padding-left:8px;">${dayNames[day]}</div>
            </div>`;
          } else if(data.losses === data.total) {
            html += `<div style="display:flex">
              <div class="heatmap-cell" style="width:100%;background-color:rgba(234,6,6,${Math.max(0.15, lossPct/100)});">
                <span class="win-rate filled">-${lossPct}%</span><span class="trade-count">${data.total} trades</span>
              </div>
              <div style="width:120px;padding-left:8px;">${dayNames[day]}</div>
            </div>`;
          } else {
            html += `<div style="display:flex">
              <div class="heatmap-cell" style="width:100%;padding:0;overflow:hidden;">
                <div style="display:flex;position:absolute;top:0;left:0;bottom:0;right:0;width:100%;height:100%;">
                  <div style="width:${winPct}%;height:100%;background:rgba(1,181,116,0.6);"></div>
                  <div style="width:${lossPct}%;height:100%;background:rgba(234,6,6,0.6);"></div>
                </div>
                <div style="position:relative;z-index:1;height:100%;width:100%;display:flex;flex-direction:column;justify-content:center;align-items:center">
                  <span class="win-rate filled" style="color:#fff;">${winPct}% / -${lossPct}%</span>
                  <span class="trade-count">${data.total} trades</span>
                </div>
              </div>
              <div style="width:120px;padding-left:8px;">${dayNames[day]}</div>
            </div>`;
          }
        }
      }
      html += '</div>';
      container.innerHTML = html;
    }
  
    renderAssetHeatmap(container) {
      const assets = Object.keys(this.heatmapData);
      if (assets.length === 0) {
        container.innerHTML = '<div style="color:#aaa">Sem dados</div>';
        return;
      }
      assets.sort((a,b)=>this.heatmapData[b].total-this.heatmapData[a].total);
      let html = '<div style="display: flex; flex-direction: column; gap: 6px;">';
      assets.forEach(asset=>{
        const data = this.heatmapData[asset];
        if(data.total === 0) {
          html += `<div style="display:flex"><div class="heatmap-cell" style="width:100%;background-color:rgba(131,146,171,0.10)">
            <span class="win-rate">0%</span>
          </div><div style="width:80px;padding-left:8px;">${asset}</div></div>`;
        } else {
          const winPct = Math.round((data.wins/data.total)*100);
          const lossPct = Math.round((data.losses/data.total)*100);
          if(data.wins === data.total) {
            html += `<div style="display:flex">
              <div class="heatmap-cell" style="width:100%;background-color:rgba(1,181,116,${Math.max(0.15, winPct/100)});">
                <span class="win-rate filled">${winPct}%</span><span class="trade-count">${data.total} trades</span>
              </div>
              <div style="width:80px;padding-left:8px;">${asset}</div>
            </div>`;
          } else if(data.losses === data.total) {
            html += `<div style="display:flex">
              <div class="heatmap-cell" style="width:100%;background-color:rgba(234,6,6,${Math.max(0.15, lossPct/100)});">
                <span class="win-rate filled">-${lossPct}%</span><span class="trade-count">${data.total} trades</span>
              </div>
              <div style="width:80px;padding-left:8px;">${asset}</div>
            </div>`;
          } else {
            html += `<div style="display:flex">
              <div class="heatmap-cell" style="width:100%;padding:0;overflow:hidden;">
                <div style="display:flex;position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;">
                  <div style="width:${winPct}%;height:100%;background:rgba(1,181,116,0.6);"></div>
                  <div style="width:${lossPct}%;height:100%;background:rgba(234,6,6,0.6);"></div>
                </div>
                <div style="position:relative;z-index:1;height:100%;width:100%;display:flex;flex-direction:column;justify-content:center;align-items:center">
                  <span class="win-rate filled" style="color:#fff;">${winPct}% / -${lossPct}%</span>
                  <span class="trade-count">${data.total} trades</span>
                </div>
              </div>
              <div style="width:80px;padding-left:8px;">${asset}</div>
            </div>`;
          }
        }
      });
      html += '</div>';
      container.innerHTML = html;
    }
    /*Gera insights de IA com base nos dados de trading*/
    async generateAIInsights() {
  const container = document.getElementById('ai-insights-content');
  if (!container) return;

  // Controle
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const lastDate = localStorage.getItem('aiInsightsLastRun');
  if (lastDate === today) {
    container.innerHTML = `
      <div class="ai-insight-card">
        <h4 class="ai-insight-title">
          <svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#FDBA74" stroke-width="2" fill="none"/><path d="M12 8v4" stroke="#FDBA74" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16" r="1" fill="#FDBA74"/></svg>
          Limite diário atingido
        </h4>
        <div class="ai-insight-body">
          Você já gerou insights de IA hoje.<br>
          Por favor, tente novamente amanhã!
        </div>
      </div>
    `;
    return;
  }

  // Quando gerar, salva a data
  localStorage.setItem('aiInsightsLastRun', today);

       // Se não houver trades suficientes, mostrar mensagem
      if (!this.app.trades || this.app.trades.length < 5) {
        container.innerHTML = `
          <div class="ai-insight-card">
            <h4 class="ai-insight-title">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 16V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Dados Insuficientes
            </h4>
            <div class="ai-insight-body">
              São necessários pelo menos 5 trades para gerar insights relevantes. Continue registrando suas operações.
            </div>
          </div>
        `;
        return;
      }
      
      // Mostrar estado de carregamento
      this.isGeneratingInsights = true;
      container.innerHTML = `
        <div class="ai-loading">
          <div class="ai-loading-spinner"></div>
          <p>Gerando insights com IA...</p>
        </div>
      `;
      
      try {
        // Preparar os dados para a análise
        const tradeData = this.prepareTradeDataForAnalysis();
        
        // Fazer a chamada para a API da IA
        const insights = await this.callAIApi(tradeData);
        
        // Guardar os resultados
        this.aiInsights = insights;
        
        // Renderizar os insights
        this.renderAIInsights();
      } catch (error) {
        console.error('Erro ao gerar insights:', error);
        container.innerHTML = `
          <div class="ai-insight-card">
            <h4 class="ai-insight-title">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Erro ao Gerar Insights
            </h4>
            <div class="ai-insight-body">
              Ocorreu um erro ao analisar seus dados. Por favor, tente novamente mais tarde.
            </div>
          </div>
        `;
      } finally {
        this.isGeneratingInsights = false;
      }
    }
    
    /* Prepara os dados de trading para análise pela IA*/
    prepareTradeDataForAnalysis() {
      // Converter os trades para um formato mais adequado para análise
      const processedTrades = this.app.trades.map(trade => {
        const { profit, profitPercentage } = this.app.calculateProfit(trade);
        const tradeDate = new Date(trade.tradeDateTime);
        
        return {
          asset: trade.asset,
          entryPrice: trade.entryPrice,
          takeProfit: trade.takeProfit,
          stopLoss: trade.stopLoss,
          positionSize: trade.positionSize,
          riskPercentage: trade.riskPercentage,
          profit: profit,
          profitPercentage: profitPercentage,
          date: tradeDate.toISOString(),
          day: tradeDate.getDay(),
          hour: tradeDate.getHours(),
          comment: trade.tradeComment || ''
        };
      });
      
      // Agregar métricas gerais
      const totalTrades = processedTrades.length;
      const winningTrades = processedTrades.filter(t => t.profit > 0);
      const losingTrades = processedTrades.filter(t => t.profit <= 0);
      const winRate = (winningTrades.length / totalTrades) * 100;
      
      const totalProfit = processedTrades.reduce((sum, trade) => sum + (trade.profit > 0 ? trade.profit : 0), 0);
      const totalLoss = processedTrades.reduce((sum, trade) => sum + (trade.profit < 0 ? Math.abs(trade.profit) : 0), 0);
      const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
      
      // Análise por dia da semana
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const dayAnalysis = dayNames.map((name, index) => {
        const dayTrades = processedTrades.filter(t => t.day === index);
        const dayWins = dayTrades.filter(t => t.profit > 0);
        const dayWinRate = dayTrades.length > 0 ? (dayWins.length / dayTrades.length) * 100 : 0;
        return {
          day: name,
          trades: dayTrades.length,
          winRate: dayWinRate,
          avgProfit: dayTrades.length > 0 ? dayTrades.reduce((sum, t) => sum + t.profitPercentage, 0) / dayTrades.length : 0
        };
      });
      
      // Análise por ativo
      const assetAnalysis = {};
      processedTrades.forEach(trade => {
        if (!assetAnalysis[trade.asset]) {
          assetAnalysis[trade.asset] = {
            trades: 0,
            wins: 0,
            totalProfit: 0
          };
        }
        
        assetAnalysis[trade.asset].trades++;
        if (trade.profit > 0) {
          assetAnalysis[trade.asset].wins++;
        }
        assetAnalysis[trade.asset].totalProfit += trade.profit;
      });
      
      // Calcular win rate por ativo
      Object.keys(assetAnalysis).forEach(asset => {
        assetAnalysis[asset].winRate = (assetAnalysis[asset].wins / assetAnalysis[asset].trades) * 100;
      });
      
      // Métricas de risco
      const avgRiskPercentage = processedTrades.reduce((sum, t) => sum + t.riskPercentage, 0) / totalTrades;
      const maxDrawdown = this.calculateMaxDrawdown(processedTrades);
      
      return {
        summary: {
          totalTrades,
          winRate,
          profitFactor,
          avgRiskPercentage,
          maxDrawdown
        },
        dayAnalysis,
        assetAnalysis,
        recentTrades: processedTrades.slice(-10).reverse() // 10 trades mais recentes
      };
    }
    
    /*Calcula o drawdown máximo*/
    calculateMaxDrawdown(trades) {
      if (!trades || trades.length === 0) return 0;
      
      let balance = 10000; // Valor inicial arbitrário
      let peak = balance;
      let maxDrawdown = 0;
      
      trades.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(trade => {
        balance += trade.profit;
        
        if (balance > peak) {
          peak = balance;
        }
        
        const drawdown = (peak - balance) / peak * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      });
      
      return maxDrawdown;
    }
    
    /* Chama a API de IA para gerar insights */
async callAIApi(tradeData) {
  const prompt = this.generateAIPrompt(tradeData);
  const response = await fetch("https://backend-trading-journal.onrender.com/api/ia-insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });
  if (!response.ok) throw new Error("Backend AI API Error");
  const result = await response.json();
  // Assumindo que seu parseAIResponse espera o texto:
  return this.parseAIResponse(result.choices[0].message.content, tradeData);
}

/*Gera o prompt para a API de IA*/
    generateAIPrompt(tradeData) {
      const { summary, dayAnalysis, assetAnalysis, recentTrades } = tradeData;
      
      // Resumo estatístico em formato conciso
      const stats = [
        `Total de trades: ${summary.totalTrades}`,
        `Taxa de acerto: ${summary.winRate.toFixed(1)}%`,
        `Fator de lucro: ${summary.profitFactor.toFixed(2)}`,
        `Risco médio por trade: ${summary.avgRiskPercentage.toFixed(1)}%`,
        `Drawdown máximo: ${summary.maxDrawdown.toFixed(1)}%`
      ].join('\n');
      
      // Analise diária
      const days = dayAnalysis
        .filter(d => d.trades > 0)
        .map(d => `${d.day}: ${d.trades} trades, ${d.winRate.toFixed(1)}% de acerto, lucro médio ${d.avgProfit.toFixed(2)}%`)
        .join('\n');
      
      // Análise por ativo
      const assets = Object.entries(assetAnalysis)
        .map(([asset, data]) => `${asset}: ${data.trades} trades, ${data.winRate.toFixed(1)}% de acerto, lucro total $${data.totalProfit.toFixed(2)}`)
        .join('\n');
      
      // Trades recentes
      const recent = recentTrades
        .map(t => `${new Date(t.date).toLocaleDateString()}: ${t.asset}, ${t.profit > 0 ? '+' : ''}$${t.profit.toFixed(2)} (${t.profit > 0 ? '+' : ''}${t.profitPercentage.toFixed(2)}%), comentário: ${t.comment}`)
        .join('\n');
      
      return `
  Analise os seguintes dados de trading e forneça insights relevantes e recomendações concretas:
  
  RESUMO ESTATÍSTICO:
  ${stats}
  
  ANÁLISE POR DIA DA SEMANA:
  ${days}
  
  ANÁLISE POR ATIVO:
  ${assets}
  
  TRADES RECENTES:
  ${recent}
  
  Com base nessas informações, forneça:
  1. Um padrão comportamental identificado (quando ganha mais/menos, melhor/pior dia, etc.)
  2. Um insight específico sobre os ativos (qual tem melhor performance e por quê)
  3. Uma recomendação concreta para melhorar a performance
  4. Um alerta sobre possíveis riscos identificados
  
  Formate sua resposta em JSON com esta estrutura exata (isso é crucial):
  {
    "behaviorPattern": {
      "title": "Título do padrão identificado",
      "description": "Descrição detalhada do padrão",
      "metric": "Métrica principal (ex: '75% win rate às terças')"
    },
    "assetInsight": {
      "title": "Título do insight sobre ativos",
      "description": "Descrição detalhada sobre performance dos ativos",
      "bestAsset": "Melhor ativo identificado"
    },
    "recommendation": {
      "title": "Título da recomendação",
      "description": "Descrição detalhada da recomendação",
      "actionItem": "Ação concreta para implementar"
    },
    "riskAlert": {
      "title": "Título do alerta de risco",
      "description": "Descrição detalhada do risco",
      "severity": "Alta/Média/Baixa"
    }
  }
  `;
    }
    
    /*Processa a resposta da IA e extrai insights estruturados*/
    parseAIResponse(responseText, tradeData) {
      try {
        // Tentar extrair o JSON da resposta
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const insights = JSON.parse(jsonStr);
          return insights;
        }
      } catch (error) {
        console.error('Erro ao analisar resposta da IA:', error);
      }
      
      // Fallback para insights locais se não conseguir extrair o JSON
      return this.generateLocalInsights(tradeData);
    }
    
    /*Gera insights localmente (fallback quando a API falha)*/
    generateLocalInsights(tradeData) {
      const { summary, dayAnalysis, assetAnalysis } = tradeData;
      
      // Encontrar o melhor e pior dia
      const sortedDays = [...dayAnalysis].filter(d => d.trades >= 3).sort((a, b) => b.winRate - a.winRate);
      const bestDay = sortedDays.length > 0 ? sortedDays[0] : null;
      const worstDay = sortedDays.length > 0 ? sortedDays[sortedDays.length - 1] : null;
      
      // Encontrar o melhor ativo
      const assetEntries = Object.entries(assetAnalysis)
        .filter(([_, data]) => data.trades >= 3)
        .sort((a, b) => b[1].winRate - a[1].winRate);
      const bestAsset = assetEntries.length > 0 ? assetEntries[0][0] : null;
      
      return {
        behaviorPattern: {
          title: bestDay ? `Performance superior às ${bestDay.day}s` : "Padrão de trading inconsistente",
          description: bestDay 
            ? `Você tem um win rate de ${bestDay.winRate.toFixed(1)}% nas ${bestDay.day}s, significativamente acima da sua média geral de ${summary.winRate.toFixed(1)}%. Considere concentrar mais operações neste dia.` 
            : "Ainda não há dados suficientes para identificar um padrão claro nos seus dias de trading. Continue registrando suas operações.",
          metric: bestDay ? `${bestDay.winRate.toFixed(1)}% win rate às ${bestDay.day}s` : "Dados insuficientes"
        },
        assetInsight: {
          title: bestAsset ? `${bestAsset} é seu melhor ativo` : "Diversificação de ativos",
          description: bestAsset 
            ? `Seu desempenho com ${bestAsset} é superior, com win rate de ${assetAnalysis[bestAsset].winRate.toFixed(1)}% em ${assetAnalysis[bestAsset].trades} trades. Considere focar mais neste ativo.` 
            : "Você opera diversos ativos, mas ainda não há um padrão claro de performance superior em nenhum específico.",
          bestAsset: bestAsset || "Não identificado"
        },
        recommendation: {
          title: summary.winRate < 50 ? "Revisar estratégia de saída" : "Aumentar posição nos trades vencedores",
          description: summary.winRate < 50 
            ? `Com um win rate de ${summary.winRate.toFixed(1)}%, sua prioridade deve ser melhorar a identificação de pontos de saída. Considere usar stop loss mais amplos ou take profits mais conservadores.` 
            : `Seu win rate de ${summary.winRate.toFixed(1)}% é sólido. Considere aumentar o tamanho das posições nos setups que você já demonstra consistência.`,
          actionItem: summary.winRate < 50 ? "Reduza em 25% o número de trades e foque na qualidade" : "Aumente gradualmente o tamanho das posições em 10-15% nos melhores setups"
        },
        riskAlert: {
          title: summary.maxDrawdown > 15 ? "Alto drawdown detectado" : "Gerenciamento de risco razoável",
          description: summary.maxDrawdown > 15 
            ? `Seu drawdown máximo de ${summary.maxDrawdown.toFixed(1)}% é consideravelmente alto. Isso pode indicar posições muito grandes ou stop losses inadequados.` 
            : `Seu drawdown máximo de ${summary.maxDrawdown.toFixed(1)}% está dentro de parâmetros aceitáveis, indicando um bom gerenciamento de risco.`,
          severity: summary.maxDrawdown > 20 ? "Alta" : summary.maxDrawdown > 10 ? "Média" : "Baixa"
        }
      };
    }
    
    /*Renderiza os insights gerados pela IA*/
    renderAIInsights() {
      const container = document.getElementById('ai-insights-content');
      if (!container || !this.aiInsights) return;
      
      const {behaviorPattern, assetInsight, recommendation, riskAlert} = this.aiInsights;
      
      const html = `
        <div class="ai-insight-card">
          <h4 class="ai-insight-title">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ${behaviorPattern.title}
          </h4>
          <div class="ai-insight-body">
            ${behaviorPattern.description}
          </div>
          <div class="ai-insight-metric">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ${behaviorPattern.metric}
          </div>
        </div>
        
        <div class="ai-insight-card">
          <h4 class="ai-insight-title">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ${assetInsight.title}
          </h4>
          <div class="ai-insight-body">
            ${assetInsight.description}
          </div>
          <div class="ai-insight-metric positive">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Melhor ativo: ${assetInsight.bestAsset}
          </div>
        </div>
        
        <div class="ai-insight-card">
          <h4 class="ai-insight-title">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m0 0h-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ${recommendation.title}
          </h4>
          <div class="ai-insight-body">
            ${recommendation.description}
          </div>
          <div class="ai-insight-metric">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.5 17.5L3 6V3H6L17.5 14.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M13 19L19 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 16L20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19 21L21 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ${recommendation.actionItem}
          </div>
        </div>
        
        <div class="ai-insight-card">
          <h4 class="ai-insight-title">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 9V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ${riskAlert.title}
          </h4>
          <div class="ai-insight-body">
            ${riskAlert.description}
          </div>
          <div class="ai-insight-metric ${riskAlert.severity === 'Alta' ? 'negative' : riskAlert.severity === 'Média' ? '' : 'positive'}">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.5 10C16.5 11.38 16.04 12.63 15.25 13.62L12 17.85L8.75 13.62C7.96 12.63 7.5 11.38 7.5 10C7.5 7.24 9.74 5 12.5 5C15.26 5 17.5 7.24 17.5 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12.5" cy="10" r="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Severidade: ${riskAlert.severity}
          </div>
        </div>
      `;
      
      container.innerHTML = html;
    }
  }
  
  // Inicializar o componente quando o documento estiver carregado
  document.addEventListener('DOMContentLoaded', () => {
    if (window.assetTrackerApp) {
      // Adicionar ao App já existente
      window.tradingJournalAI = new TradingJournalAI(window.assetTrackerApp);
    }
  });