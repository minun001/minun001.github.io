(function () {
  var WORKSPACE_HELPER_STORAGE_KEY = 'workspace.helperBaseUrl';
  var WORKSPACE_HELPER_TOKEN_PREFIX = 'workspace.helperSessionToken:';
  var DEFAULT_HELPER_BASE_URL = 'https://tobacco-tournament-growth-revision.trycloudflare.com';
  var DEFAULT_CONTEXT_CANDIDATES = [128, 256, 512, 1024, 2048, 4096, 8192, 16384];

  var state = {
    file: null,
    preview: null,
    result: null,
    apiBaseUrl: '',
    helperToken: ''
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function text(node, value) {
    if (node) node.textContent = value;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getConfig() {
    var raw = window.TIMESFM_WORKSPACE_CONFIG || {};
    return Object.assign({
      apiMode: 'workspace-helper',
      healthEndpoint: '/timesfm/health',
      previewEndpoint: '/timesfm/preview',
      forecastEndpoint: '/timesfm/forecast',
      maxUploadMb: 25
    }, raw);
  }

  function getWorkspaceConfig() {
    return Object.assign({
      provider: 'remote-helper',
      localAuth: {
        helperBaseUrl: DEFAULT_HELPER_BASE_URL,
        sessionEndpoint: '/local-auth/session'
      }
    }, window.WORKSPACE_AUTH_CONFIG || {});
  }

  function isLoopback(hostname) {
    return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1';
  }

  function normalizeHttpsUrl(value, options) {
    var raw = String(value || '').trim();
    if (!raw) return '';
    if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
    try {
      var parsed = new URL(raw);
      var allowLocalHttp = options && options.allowLocalHttp && isLoopback(parsed.hostname);
      if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && allowLocalHttp)) return '';
      if (window.location.protocol === 'https:' && parsed.protocol !== 'https:') return '';
      parsed.hash = '';
      parsed.search = '';
      return parsed.toString().replace(/\/+$/, '');
    } catch (_error) {
      return '';
    }
  }

  function getQueryValue(name) {
    try {
      return new URLSearchParams(window.location.search).get(name) || '';
    } catch (_error) {
      return '';
    }
  }

  function getStoredValue(key) {
    try {
      return window.localStorage.getItem(key) || '';
    } catch (_error) {
      return '';
    }
  }

  function setStoredValue(key, value) {
    try {
      if (value) window.localStorage.setItem(key, value);
      else window.localStorage.removeItem(key);
    } catch (_error) {}
  }

  function getSessionValue(key) {
    try {
      return window.sessionStorage.getItem(key) || '';
    } catch (_error) {
      return '';
    }
  }

  function joinUrl(base, path) {
    var safeBase = String(base || '').replace(/\/+$/, '');
    var safePath = String(path || '').replace(/^\/?/, '/');
    return safeBase + safePath;
  }

  function normalizeHelperBaseUrl(value) {
    return normalizeHttpsUrl(value, { allowLocalHttp: true });
  }

  function resolveHelperBaseUrl(config) {
    var queryOverride = normalizeHelperBaseUrl(getQueryValue('workspaceHelper') || getQueryValue('helper'));
    if (queryOverride) {
      setStoredValue(WORKSPACE_HELPER_STORAGE_KEY, queryOverride);
      return queryOverride;
    }
    var provider = String((config && config.provider) || '').toLowerCase();
    var configuredHelper = normalizeHelperBaseUrl((config.localAuth || {}).helperBaseUrl);
    if (configuredHelper) return configuredHelper;
    if (provider === 'local-helper') return window.location.origin;
    return normalizeHelperBaseUrl(getStoredValue(WORKSPACE_HELPER_STORAGE_KEY)) ||
      normalizeHelperBaseUrl(DEFAULT_HELPER_BASE_URL);
  }

  function getHelperToken(helperBaseUrl) {
    var key = WORKSPACE_HELPER_TOKEN_PREFIX + helperBaseUrl;
    return getSessionValue(key) || getStoredValue(key);
  }

  async function checkWorkspaceSession() {
    var config = getWorkspaceConfig();
    var helperBaseUrl = resolveHelperBaseUrl(config);
    var sessionPath = ((config.localAuth || {}).sessionEndpoint || '/local-auth/session');
    var endpoint = /^https?:\/\//i.test(sessionPath) ? sessionPath : joinUrl(helperBaseUrl, sessionPath);
    var helperToken = getHelperToken(helperBaseUrl);
    if (!helperBaseUrl) return { authenticated: false, helperBaseUrl: '', helperToken: '' };
    var headers = {};
    if (helperToken) headers.Authorization = 'Bearer ' + helperToken;
    var sameOrigin = new URL(endpoint, window.location.href).origin === window.location.origin;
    var response = await window.fetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
      credentials: sameOrigin ? 'same-origin' : 'omit',
      headers: headers
    });
    var payload = {};
    try {
      payload = await response.json();
    } catch (_error) {}
    return {
      authenticated: response.ok && payload && payload.ok !== false && payload.configured !== false && payload.authenticated === true,
      helperBaseUrl: helperBaseUrl,
      helperToken: helperToken
    };
  }

  function setStatus(label, tone) {
    var chip = byId('timesfm-api-status');
    if (!chip) return;
    chip.textContent = label;
    chip.setAttribute('data-tone', tone || 'neutral');
  }

  function setMessage(message, tone) {
    var node = byId('timesfm-message');
    if (!node) return;
    node.textContent = message;
    node.setAttribute('data-tone', tone || 'neutral');
  }

  function setBusy(button, isBusy, label) {
    if (!button) return;
    button.disabled = Boolean(isBusy);
    if (label) button.textContent = label;
  }

  function formatBytes(bytes) {
    var value = Number(bytes) || 0;
    if (value < 1024) return value + ' B';
    if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB';
    return (value / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function estimateRowsFromText(textValue) {
    if (!textValue) return 0;
    return Math.max(0, textValue.split(/\r\n|\n|\r/).filter(Boolean).length - 1);
  }

  async function estimateFileRows(file) {
    if (!file) return 0;
    var sample = await file.slice(0, Math.min(file.size, 1024 * 1024)).text();
    var estimated = estimateRowsFromText(sample);
    if (file.size > sample.length && estimated > 0) {
      estimated = Math.round(estimated * (file.size / sample.length));
    }
    return estimated;
  }

  function isAllowedFile(file) {
    if (!file) return false;
    var name = String(file.name || '').toLowerCase();
    return name.endsWith('.csv') || name.endsWith('.tsv');
  }

  async function setFile(file) {
    var config = getConfig();
    var meta = byId('timesfm-file-meta');
    if (!file) {
      state.file = null;
      text(meta, 'No file selected.');
      return;
    }
    if (!isAllowedFile(file)) {
      state.file = null;
      text(meta, 'Unsupported file. Use CSV or TSV.');
      return;
    }
    if (file.size > config.maxUploadMb * 1024 * 1024) {
      state.file = null;
      text(meta, 'File is too large. Maximum upload size is ' + config.maxUploadMb + ' MB.');
      return;
    }
    state.file = file;
    var rows = await estimateFileRows(file);
    text(meta, file.name + ' - ' + formatBytes(file.size) + ' - about ' + rows.toLocaleString() + ' rows detected client-side.');
  }

  function populateSelect(select, options, placeholder) {
    if (!select) return;
    var html = placeholder ? '<option value="">' + escapeHtml(placeholder) + '</option>' : '';
    html += options.map(function (option) {
      return '<option value="' + escapeHtml(option) + '">' + escapeHtml(option) + '</option>';
    }).join('');
    select.innerHTML = html;
  }

  function detectDefaultColumns(columns) {
    var names = columns.map(function (column) { return column.name; });
    var timestamp = columns.find(function (column) {
      return /date|time|timestamp|datetime/i.test(column.name) || /datetime/i.test(column.dtype || '');
    });
    var target = columns.find(function (column) {
      return column.name !== (timestamp && timestamp.name) && /int|float|numeric|double/i.test(column.dtype || '');
    });
    return {
      names: names,
      timestamp: timestamp ? timestamp.name : names[0],
      target: target ? target.name : names[1] || names[0]
    };
  }

  function renderPreview(payload) {
    state.preview = payload;
    var columns = Array.isArray(payload.columns) ? payload.columns : [];
    var defaults = detectDefaultColumns(columns);
    populateSelect(byId('timesfm-timestamp-col'), defaults.names, 'Select timestamp column');
    populateSelect(byId('timesfm-target-col'), defaults.names, 'Select target column');
    populateSelect(byId('timesfm-series-col'), defaults.names, 'None');
    populateSelect(byId('timesfm-series-id'), [], 'Preview will load series IDs');
    byId('timesfm-timestamp-col').value = defaults.timestamp || '';
    byId('timesfm-target-col').value = defaults.target || '';

    var warningText = (payload.warnings || []).length ? ' Warnings: ' + payload.warnings.join(' ') : '';
    var rangeText = payload.timestamp_range
      ? ' Timestamp range: ' + payload.timestamp_range.start + ' to ' + payload.timestamp_range.end + '.'
      : '';
    text(byId('timesfm-preview-summary'), 'Detected ' + (payload.row_count || 0).toLocaleString() + ' rows and ' + columns.length + ' columns.' + rangeText + warningText);

    var sampleRows = Array.isArray(payload.sample_rows) ? payload.sample_rows : [];
    var tableNode = byId('timesfm-sample-table');
    if (!tableNode || !sampleRows.length) {
      if (tableNode) tableNode.innerHTML = '';
      return;
    }
    var head = defaults.names.map(function (name) {
      return '<th>' + escapeHtml(name) + '</th>';
    }).join('');
    var body = sampleRows.map(function (row) {
      return '<tr>' + defaults.names.map(function (name) {
        return '<td>' + escapeHtml(row[name]) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    tableNode.innerHTML = '<table><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table>';
    updateSeriesIdOptions();
  }

  function updateSeriesIdOptions() {
    var seriesColumn = byId('timesfm-series-col');
    var seriesSelect = byId('timesfm-series-id');
    if (!seriesColumn || !seriesSelect || !state.preview) return;
    var column = seriesColumn.value;
    var values = (state.preview.series_values && state.preview.series_values[column]) || [];
    populateSelect(seriesSelect, values, values.length ? 'All matching rows' : 'No series filter');
  }

  async function requestJson(endpoint, options) {
    var response = await window.fetch(endpoint, options);
    var payload = {};
    try {
      payload = await response.json();
    } catch (_error) {}
    if (!response.ok || payload.ok === false) {
      var message = (payload && (payload.detail || payload.error || payload.message)) || 'Request failed with status ' + response.status + '.';
      var error = new Error(typeof message === 'string' ? message : JSON.stringify(message));
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  function classifyBridgeError(error) {
    var status = error && error.status;
    var message = error && error.message ? error.message : '';
    var lower = message.toLowerCase();

    if (status === 401 || status === 403 || lower.indexOf('login required') !== -1 || lower.indexOf('unauthorized') !== -1) {
      return {
        label: 'Auth required',
        tone: 'auth',
        message: 'Your Workspace session is not active for the helper. Sign in from /workspace/ first, then return here.'
      };
    }

    if (status === 404 || lower.indexOf('not found') !== -1) {
      return {
        label: 'Helper update needed',
        tone: 'warn',
        message: 'The Workspace helper is reachable, but it does not expose the TimesFM bridge yet. Restart the helper with the latest repository code.'
      };
    }

    if (lower.indexOf('not configured') !== -1 || (lower.indexOf('timesfm api') !== -1 && lower.indexOf('configured') !== -1)) {
      return {
        label: 'GPU bridge setup needed',
        tone: 'warn',
        message: 'Workspace is signed in, but the helper has not been started with TimesFM API settings yet. Configure TIMESFM_API_BASE_URL and TIMESFM_API_TOKEN on the helper.'
      };
    }

    if (status === 502 || status === 504 || lower.indexOf('cannot reach') !== -1 || lower.indexOf('connection') !== -1 || lower.indexOf('timeout') !== -1) {
      return {
        label: 'aibig9 offline',
        tone: 'warn',
        message: 'The Workspace helper is ready, but it cannot reach the aibig9 TimesFM backend. Check the GPU server process or tunnel.'
      };
    }

    return {
      label: 'GPU bridge unavailable',
      tone: 'warn',
      message: message || 'Cannot reach the aibig9 TimesFM backend through the Workspace helper yet.'
    };
  }

  function showBridgeError(error) {
    var info = classifyBridgeError(error);
    setStatus(info.label, info.tone);
    setMessage(info.message, info.tone === 'auth' ? 'error' : 'warn');
    return info;
  }

  function buildHelperAuthHeaders() {
    return state.helperToken ? { Authorization: 'Bearer ' + state.helperToken } : {};
  }

  function helperCredentials(endpoint) {
    try {
      return new URL(endpoint, window.location.href).origin === window.location.origin ? 'same-origin' : 'omit';
    } catch (_error) {
      return 'omit';
    }
  }

  async function checkApiHealth() {
    var config = getConfig();
    if (!state.apiBaseUrl) {
      setStatus('Workspace helper unavailable', 'error');
      setMessage('Cannot reach the Workspace helper. Sign in from /workspace/ again, then reopen this tool.', 'error');
      return null;
    }
    try {
      var endpoint = joinUrl(state.apiBaseUrl, config.healthEndpoint);
      var payload = await requestJson(endpoint, {
        method: 'GET',
        headers: buildHelperAuthHeaders(),
        cache: 'no-store',
        credentials: helperCredentials(endpoint)
      });
      if (payload.cuda_available === false || payload.device === 'cpu') {
        setStatus('GPU unavailable', 'warn');
        setMessage('The TimesFM backend responded, but CUDA is not available. Forecasts may be slow until aibig9 is using GPU.', 'warn');
      } else {
        setStatus('aibig9 GPU ready', 'ok');
        setMessage('aibig9 TimesFM backend is reachable through the Workspace helper.', 'neutral');
      }
      return payload;
    } catch (error) {
      showBridgeError(error);
      return null;
    }
  }

  async function previewColumns() {
    var button = byId('timesfm-preview-button');
    var config = getConfig();
    if (!state.file) {
      setMessage('Could not parse the file. Use CSV/TSV with one timestamp column and one numeric target column.', 'error');
      return;
    }
    if (!state.apiBaseUrl) {
      setStatus('Workspace helper unavailable', 'error');
      setMessage('Cannot reach the Workspace helper. Sign in from /workspace/ again, then reopen this tool.', 'error');
      return;
    }
    var form = new FormData();
    form.append('file', state.file);
    setBusy(button, true, 'Previewing...');
    try {
      var endpoint = joinUrl(state.apiBaseUrl, config.previewEndpoint);
      var payload = await requestJson(endpoint, {
        method: 'POST',
        body: form,
        headers: buildHelperAuthHeaders(),
        cache: 'no-store',
        credentials: helperCredentials(endpoint)
      });
      renderPreview(payload);
      setMessage('Preview loaded. Select columns and forecast windows next.', 'neutral');
    } catch (error) {
      showBridgeError(error);
    } finally {
      setBusy(button, false, 'Preview columns');
    }
  }

  function getSelectedCandidates() {
    var selected = Array.prototype.slice.call(document.querySelectorAll('input[name="timesfm-context-candidate"]:checked'))
      .map(function (input) { return Number(input.value); })
      .filter(function (value) { return DEFAULT_CONTEXT_CANDIDATES.indexOf(value) !== -1; });
    return selected.length ? selected : [1024];
  }

  function appendField(form, name, value) {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      form.append(name, String(value).trim());
    }
  }

  function buildForecastForm() {
    var form = new FormData();
    form.append('file', state.file);
    appendField(form, 'timestamp_col', byId('timesfm-timestamp-col').value);
    appendField(form, 'target_col', byId('timesfm-target-col').value);
    appendField(form, 'series_id_col', byId('timesfm-series-col').value);
    appendField(form, 'selected_series_id', byId('timesfm-series-id').value);
    appendField(form, 'train_start', byId('timesfm-train-start').value);
    appendField(form, 'train_end', byId('timesfm-train-end').value);
    appendField(form, 'test_start', byId('timesfm-test-start').value);
    appendField(form, 'test_end', byId('timesfm-test-end').value);
    appendField(form, 'validation_mode', byId('timesfm-validation-mode').value);
    appendField(form, 'validation_ratio', byId('timesfm-validation-ratio').value);
    appendField(form, 'context_mode', byId('timesfm-context-mode').value);
    form.append('context_candidates', JSON.stringify(getSelectedCandidates()));
    return form;
  }

  function card(label, value) {
    return '<div class="timesfm-result-card"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value == null ? '-' : value) + '</strong></div>';
  }

  function metricCard(label, metrics) {
    if (!metrics) return '';
    var parts = ['MAE ' + formatMetric(metrics.mae), 'RMSE ' + formatMetric(metrics.rmse), 'sMAPE ' + formatMetric(metrics.smape)];
    if (metrics.interval_coverage_q10_q90 != null) parts.push('q10-q90 ' + formatMetric(metrics.interval_coverage_q10_q90));
    return '<div class="timesfm-metric-card"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(parts.join(' | ')) + '</strong></div>';
  }

  function formatMetric(value) {
    var numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return '-';
    return Math.abs(numberValue) >= 100 ? numberValue.toFixed(1) : numberValue.toFixed(3);
  }

  function renderMeta(result) {
    var meta = result.meta || {};
    var split = meta.split || {};
    var html = [
      card('Model', meta.model_id),
      card('Device', [meta.device, meta.gpu_name].filter(Boolean).join(' / ')),
      card('Context length', meta.chosen_context_length),
      card('Frequency', meta.frequency),
      card('Train rows', meta.train_row_count),
      card('Validation rows', meta.validation_row_count),
      card('Test rows', meta.test_row_count),
      card('Horizon', meta.returned_test_points),
      card('Validation split', [split.validation_start, split.validation_end].filter(Boolean).join(' to ')),
      card('Warnings', (meta.warnings || []).join(' ') || 'None')
    ].join('');
    byId('timesfm-result-meta').innerHTML = html;
  }

  function renderMetrics(result) {
    var metrics = result.metrics || {};
    byId('timesfm-metrics').innerHTML = [
      metricCard('Validation', metrics.validation),
      metricCard('Test', metrics.test)
    ].join('');
  }

  function toTracePoints(rows, valueKey) {
    return {
      x: rows.map(function (row) { return row.timestamp; }),
      y: rows.map(function (row) { return row[valueKey]; })
    };
  }

  function renderChart(result) {
    var node = byId('timesfm-chart');
    if (!node) return;
    var series = result.series || {};
    var traces = [];
    var train = Array.isArray(series.train_tail) ? series.train_tail : [];
    var validationActual = Array.isArray(series.validation_actual) ? series.validation_actual : [];
    var validationForecast = Array.isArray(series.validation_forecast) ? series.validation_forecast : [];
    var testActual = Array.isArray(series.test_actual) ? series.test_actual : [];
    var testForecast = Array.isArray(series.test_forecast) ? series.test_forecast : [];

    if (train.length) {
      var trainPoints = toTracePoints(train, 'value');
      traces.push({ x: trainPoints.x, y: trainPoints.y, name: 'Train tail actual', mode: 'lines', line: { color: '#64748b', width: 2 } });
    }
    if (validationActual.length) {
      var valActualPoints = toTracePoints(validationActual, 'value');
      traces.push({ x: valActualPoints.x, y: valActualPoints.y, name: 'Validation actual', mode: 'lines', line: { color: '#0f766e', width: 2 } });
    }
    if (validationForecast.length) {
      var valForecastPoints = toTracePoints(validationForecast, 'yhat');
      traces.push({ x: valForecastPoints.x, y: valForecastPoints.y, name: 'Validation forecast', mode: 'lines', line: { color: '#14b8a6', width: 2, dash: 'dot' } });
    }
    if (testActual.length) {
      var testActualPoints = toTracePoints(testActual, 'value');
      traces.push({ x: testActualPoints.x, y: testActualPoints.y, name: 'Test actual', mode: 'lines', line: { color: '#111827', width: 2 } });
    }
    if (testForecast.length) {
      var q10 = testForecast.filter(function (row) { return row.q10 != null; });
      var q90 = testForecast.filter(function (row) { return row.q90 != null; });
      if (q10.length && q90.length && q10.length === q90.length) {
        traces.push({
          x: q90.map(function (row) { return row.timestamp; }).concat(q10.map(function (row) { return row.timestamp; }).reverse()),
          y: q90.map(function (row) { return row.q90; }).concat(q10.map(function (row) { return row.q10; }).reverse()),
          fill: 'toself',
          fillcolor: 'rgba(29,78,216,.13)',
          line: { color: 'rgba(29,78,216,0)' },
          hoverinfo: 'skip',
          name: 'q10-q90 interval',
          type: 'scatter'
        });
      }
      var testForecastPoints = toTracePoints(testForecast, 'yhat');
      traces.push({ x: testForecastPoints.x, y: testForecastPoints.y, name: 'TimesFM test forecast', mode: 'lines', line: { color: '#1d4ed8', width: 3 } });
    }

    if (!window.Plotly) {
      node.innerHTML = '<div class="timesfm-message">Plotly did not load. Download the JSON result to inspect forecast series.</div>';
      return;
    }

    window.Plotly.newPlot(node, traces, {
      margin: { t: 24, r: 18, b: 48, l: 54 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: '#ffffff',
      hovermode: 'x unified',
      legend: { orientation: 'h', y: -0.24 },
      xaxis: { gridcolor: 'rgba(15,23,42,.08)' },
      yaxis: { gridcolor: 'rgba(15,23,42,.08)', zerolinecolor: 'rgba(15,23,42,.1)' }
    }, {
      responsive: true,
      displaylogo: false
    });
  }

  function renderResult(result) {
    state.result = result;
    renderMeta(result);
    renderMetrics(result);
    renderChart(result);
    setMessage('Forecast complete. Downloads are ready.', 'neutral');
    byId('timesfm-download-csv').disabled = false;
    byId('timesfm-download-json').disabled = false;
  }

  async function runForecast() {
    var button = byId('timesfm-forecast-button');
    var config = getConfig();
    if (!state.file) {
      setMessage('Could not parse the file. Use CSV/TSV with one timestamp column and one numeric target column.', 'error');
      return;
    }
    if (!state.apiBaseUrl) {
      setStatus('Workspace helper unavailable', 'error');
      setMessage('Cannot reach the Workspace helper. Sign in from /workspace/ again, then reopen this tool.', 'error');
      return;
    }
    setBusy(button, true, 'Running on aibig9...');
    setMessage('Submitting forecast request to aibig9. Large models can take a moment.', 'neutral');
    try {
      var endpoint = joinUrl(state.apiBaseUrl, config.forecastEndpoint);
      var payload = await requestJson(endpoint, {
        method: 'POST',
        body: buildForecastForm(),
        headers: buildHelperAuthHeaders(),
        cache: 'no-store',
        credentials: helperCredentials(endpoint)
      });
      renderResult(payload);
    } catch (error) {
      showBridgeError(error);
    } finally {
      setBusy(button, false, 'Run TimesFM forecast on aibig9');
    }
  }

  function download(filename, content, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  function downloadJson() {
    if (!state.result) return;
    download('timesfm-result.json', JSON.stringify(state.result, null, 2), 'application/json');
  }

  function downloadCsv() {
    if (!state.result || !state.result.series) return;
    var rows = state.result.series.test_forecast || [];
    var header = ['timestamp', 'yhat', 'q10', 'q90'];
    var csv = header.join(',') + '\n' + rows.map(function (row) {
      return header.map(function (key) {
        var value = row[key] == null ? '' : String(row[key]);
        return '"' + value.replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\n');
    download('timesfm-forecast.csv', csv, 'text/csv');
  }

  function bindEvents() {
    var dropzone = byId('timesfm-dropzone');
    var fileInput = byId('timesfm-file-input');

    if (dropzone) {
      ['dragenter', 'dragover'].forEach(function (eventName) {
        dropzone.addEventListener(eventName, function (event) {
          event.preventDefault();
          dropzone.classList.add('is-dragging');
        });
      });
      ['dragleave', 'drop'].forEach(function (eventName) {
        dropzone.addEventListener(eventName, function (event) {
          event.preventDefault();
          dropzone.classList.remove('is-dragging');
        });
      });
      dropzone.addEventListener('drop', function (event) {
        var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
        setFile(file);
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', function () {
        setFile(fileInput.files && fileInput.files[0]);
      });
    }

    byId('timesfm-health-button').addEventListener('click', checkApiHealth);
    byId('timesfm-preview-button').addEventListener('click', previewColumns);
    byId('timesfm-forecast-button').addEventListener('click', runForecast);
    byId('timesfm-download-json').addEventListener('click', downloadJson);
    byId('timesfm-download-csv').addEventListener('click', downloadCsv);
    byId('timesfm-series-col').addEventListener('change', updateSeriesIdOptions);
  }

  async function init() {
    if (!document.querySelector('[data-timesfm-page]')) return;
    var authGate = byId('timesfm-auth-gate');
    var app = byId('timesfm-app');
    try {
      var session = await checkWorkspaceSession();
      if (!session.authenticated) {
        if (authGate) authGate.hidden = false;
        if (app) app.hidden = true;
        setStatus('Auth required', 'auth');
        return;
      }
      state.apiBaseUrl = session.helperBaseUrl;
      state.helperToken = session.helperToken || '';
    } catch (_error) {
      if (authGate) authGate.hidden = false;
      if (app) app.hidden = true;
      setStatus('Auth required', 'auth');
      return;
    }

    if (authGate) authGate.hidden = true;
    if (app) app.hidden = false;
    bindEvents();
    checkApiHealth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
