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
    helperToken: '',
    bridgeReady: false
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

  function setBridgeDetail(message, tone) {
    var node = byId('timesfm-bridge-detail');
    if (!node) return;
    node.textContent = message;
    node.setAttribute('data-tone', tone || 'neutral');
  }

  function setDisabled(id, disabled, title) {
    var node = byId(id);
    if (!node) return;
    node.disabled = Boolean(disabled);
    if (title) node.title = title;
    else node.removeAttribute('title');
  }

  function updateActionButtons() {
    var bridgeMissingTitle = 'GPU bridge is not ready yet. Check the bridge status first.';
    var fileMissingTitle = 'Select a CSV or TSV file first.';
    var previewMissingTitle = 'Preview columns before running a forecast.';
    var previewDisabled = !state.file;
    var forecastDisabled = !state.bridgeReady || !state.file || !state.preview;
    setDisabled('timesfm-preview-button', previewDisabled, state.file ? '' : fileMissingTitle);
    setDisabled('timesfm-forecast-button', forecastDisabled, !state.bridgeReady ? bridgeMissingTitle : (!state.file ? fileMissingTitle : (state.preview ? '' : previewMissingTitle)));
  }

  function setBridgeReady(isReady, message, tone) {
    state.bridgeReady = Boolean(isReady);
    setBridgeDetail(message, tone);
    updateActionButtons();
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
    clearPreviewAndResult();
    if (!file) {
      state.file = null;
      text(meta, 'No file selected.');
      updateActionButtons();
      return;
    }
    if (!isAllowedFile(file)) {
      state.file = null;
      text(meta, 'Unsupported file. Use CSV or TSV.');
      updateActionButtons();
      return;
    }
    if (file.size > config.maxUploadMb * 1024 * 1024) {
      state.file = null;
      text(meta, 'File is too large. Maximum upload size is ' + config.maxUploadMb + ' MB.');
      updateActionButtons();
      return;
    }
    state.file = file;
    var rows = await estimateFileRows(file);
    text(meta, file.name + ' - ' + formatBytes(file.size) + ' - about ' + rows.toLocaleString() + ' rows detected client-side.');
    updateActionButtons();
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

  function parseDelimitedLine(line, delimiter) {
    var cells = [];
    var current = '';
    var inQuotes = false;
    for (var index = 0; index < line.length; index += 1) {
      var character = line[index];
      var nextCharacter = line[index + 1];
      if (character === '"' && inQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = !inQuotes;
      } else if (character === delimiter && !inQuotes) {
        cells.push(current);
        current = '';
      } else {
        current += character;
      }
    }
    cells.push(current);
    return cells.map(function (cell) { return cell.trim(); });
  }

  function inferLocalColumnType(values) {
    var nonEmpty = values.filter(function (value) { return String(value || '').trim() !== ''; });
    if (!nonEmpty.length) return 'empty';
    var numericCount = nonEmpty.filter(function (value) { return Number.isFinite(Number(value)); }).length;
    if (numericCount / nonEmpty.length >= 0.85) return 'numeric';
    var dateCount = nonEmpty.filter(function (value) {
      var timestamp = Date.parse(value);
      return Number.isFinite(timestamp);
    }).length;
    if (dateCount / nonEmpty.length >= 0.85) return 'datetime-like';
    return 'text';
  }

  function inferTimestampRange(rows, columns) {
    var timestampColumn = columns.find(function (column) {
      return /date|time|timestamp|datetime/i.test(column.name) || /datetime/i.test(column.dtype || '');
    });
    if (!timestampColumn) return null;
    var timestamps = rows.map(function (row) {
      var timestamp = Date.parse(row[timestampColumn.name]);
      return Number.isFinite(timestamp) ? timestamp : null;
    }).filter(function (value) { return value !== null; }).sort(function (left, right) { return left - right; });
    if (!timestamps.length) return null;
    return {
      column: timestampColumn.name,
      start: new Date(timestamps[0]).toISOString(),
      end: new Date(timestamps[timestamps.length - 1]).toISOString()
    };
  }

  function parseTimestampMs(value) {
    var timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  function toDateTimeLocalValue(value) {
    if (!value) return '';
    var raw = String(value).trim();
    var match = raw.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2}))?/);
    if (match) return match[1] + 'T' + (match[2] || '00:00');
    var timestamp = parseTimestampMs(value);
    return timestamp === null ? '' : new Date(timestamp).toISOString().slice(0, 16);
  }

  function buildSuggestedWindowFromTimestamps(timestamps) {
    var unique = timestamps
      .filter(function (value) { return value !== null; })
      .sort(function (left, right) { return left - right; })
      .filter(function (value, index, values) { return index === 0 || value !== values[index - 1]; });
    var total = unique.length;
    if (total < 2) return null;
    var testCount = total >= 40
      ? Math.min(Math.max(8, Math.round(total * 0.2)), total - 32)
      : Math.min(Math.max(1, Math.round(total * 0.2)), total - 1);
    if (testCount < 1) return null;
    var splitIndex = total - testCount;
    return {
      train_start: new Date(unique[0]).toISOString(),
      train_end: new Date(unique[splitIndex - 1]).toISOString(),
      test_start: new Date(unique[splitIndex]).toISOString(),
      test_end: new Date(unique[total - 1]).toISOString(),
      note: 'Auto-filled from detected timestamps; adjust if needed.'
    };
  }

  function inferSuggestedWindow(rows, columns, timestampRange) {
    var columnName = timestampRange && timestampRange.column;
    if (!columnName) {
      var timestampColumn = columns.find(function (column) {
        return /date|time|timestamp|datetime/i.test(column.name) || /datetime/i.test(column.dtype || '');
      });
      columnName = timestampColumn && timestampColumn.name;
    }
    if (!columnName) return null;
    var timestamps = rows.map(function (row) { return parseTimestampMs(row[columnName]); });
    return buildSuggestedWindowFromTimestamps(timestamps);
  }

  function fallbackSuggestedWindow(payload) {
    var range = payload && payload.timestamp_range;
    if (!range || !range.start || !range.end) return null;
    var start = parseTimestampMs(range.start);
    var end = parseTimestampMs(range.end);
    if (start === null || end === null || end <= start) return null;
    var rowCount = Math.max(2, Number(payload.row_count) || 2);
    if (rowCount < 3) return null;
    var step = Math.max(1, Math.round((end - start) / Math.max(1, rowCount - 1)));
    var testCount = rowCount >= 40
      ? Math.min(Math.max(8, Math.round(rowCount * 0.2)), rowCount - 32)
      : Math.min(Math.max(1, Math.round(rowCount * 0.2)), rowCount - 1);
    var splitIndex = rowCount - testCount;
    var trainEnd = Math.min(end - step, start + (step * (splitIndex - 1)));
    var testStart = Math.min(end, start + (step * splitIndex));
    if (trainEnd <= start || testStart > end) return null;
    return {
      train_start: range.start,
      train_end: new Date(trainEnd).toISOString(),
      test_start: new Date(testStart).toISOString(),
      test_end: range.end,
      note: 'Auto-filled from detected timestamp range; adjust if needed.'
    };
  }

  function formatWindowText(windowValue) {
    if (!windowValue) return '';
    var trainStart = toDateTimeLocalValue(windowValue.train_start);
    var trainEnd = toDateTimeLocalValue(windowValue.train_end);
    var testStart = toDateTimeLocalValue(windowValue.test_start);
    var testEnd = toDateTimeLocalValue(windowValue.test_end);
    if (!trainStart || !trainEnd || !testStart || !testEnd) return '';
    return ' Suggested dates: train ' + trainStart.replace('T', ' ') + ' to ' + trainEnd.replace('T', ' ')
      + ', test ' + testStart.replace('T', ' ') + ' to ' + testEnd.replace('T', ' ') + '.';
  }

  function applySuggestedDateWindow(payload) {
    var windowValue = (payload && (payload.suggested_window || payload.suggestedWindow)) || fallbackSuggestedWindow(payload);
    var ids = {
      train_start: 'timesfm-train-start',
      train_end: 'timesfm-train-end',
      test_start: 'timesfm-test-start',
      test_end: 'timesfm-test-end'
    };
    var applied = true;
    Object.keys(ids).forEach(function (key) {
      var node = byId(ids[key]);
      var value = toDateTimeLocalValue(windowValue && windowValue[key]);
      if (!node || !value) {
        applied = false;
        return;
      }
      node.value = value;
    });
    return applied ? formatWindowText(windowValue) : '';
  }

  async function buildLocalPreviewPayload(file) {
    var textValue = await file.text();
    var lines = textValue.split(/\r\n|\n|\r/).filter(function (line) { return line.trim() !== ''; });
    if (lines.length < 2) {
      throw new Error('Could not parse the file. Use CSV/TSV with a header row and at least one data row.');
    }
    var delimiter = lines[0].indexOf('\t') !== -1 ? '\t' : ',';
    var headers = parseDelimitedLine(lines[0], delimiter).map(function (header, index) {
      return header || 'column_' + (index + 1);
    });
    var dataLines = lines.slice(1);
    var parsedRows = dataLines.map(function (line) {
      var cells = parseDelimitedLine(line, delimiter);
      var row = {};
      headers.forEach(function (header, index) {
        row[header] = cells[index] == null ? '' : cells[index];
      });
      return row;
    });
    var columns = headers.map(function (header) {
      var values = parsedRows.map(function (row) { return row[header]; });
      return {
        name: header,
        dtype: inferLocalColumnType(values),
        non_null: values.filter(function (value) { return String(value || '').trim() !== ''; }).length
      };
    });
    var warnings = ['Local browser preview is active because the aibig9 bridge is not ready. Forecast still requires the Workspace helper/backend.'];
    if (!columns.some(function (column) { return column.dtype === 'numeric'; })) {
      warnings.push('No numeric target candidate was detected in the sampled data.');
    }
    var timestampRange = inferTimestampRange(parsedRows, columns);
    return {
      ok: true,
      columns: columns,
      row_count: parsedRows.length,
      sample_rows: parsedRows.slice(0, 5),
      timestamp_range: timestampRange,
      suggested_window: inferSuggestedWindow(parsedRows, columns, timestampRange),
      warnings: warnings
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
    var windowText = applySuggestedDateWindow(payload);
    text(byId('timesfm-preview-summary'), 'Detected ' + (payload.row_count || 0).toLocaleString() + ' rows and ' + columns.length + ' columns.' + rangeText + windowText + warningText);

    var sampleRows = Array.isArray(payload.sample_rows) ? payload.sample_rows : [];
    var tableNode = byId('timesfm-sample-table');
    if (!tableNode || !sampleRows.length) {
      if (tableNode) tableNode.innerHTML = '';
      updateActionButtons();
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
    updateActionButtons();
  }

  function updateSeriesIdOptions() {
    var seriesColumn = byId('timesfm-series-col');
    var seriesSelect = byId('timesfm-series-id');
    if (!seriesColumn || !seriesSelect || !state.preview) return;
    var column = seriesColumn.value;
    var values = (state.preview.series_values && state.preview.series_values[column]) || [];
    populateSelect(seriesSelect, values, values.length ? 'All matching rows' : 'No series filter');
  }

  function clearPreviewAndResult() {
    state.preview = null;
    state.result = null;
    populateSelect(byId('timesfm-timestamp-col'), [], 'Preview columns first');
    populateSelect(byId('timesfm-target-col'), [], 'Preview columns first');
    populateSelect(byId('timesfm-series-col'), [], 'None');
    populateSelect(byId('timesfm-series-id'), [], 'No series filter');
    ['timesfm-train-start', 'timesfm-train-end', 'timesfm-test-start', 'timesfm-test-end'].forEach(function (id) {
      var node = byId(id);
      if (node) node.value = '';
    });
    text(byId('timesfm-preview-summary'), 'Preview a file to detect columns and sample rows.');
    var sampleTable = byId('timesfm-sample-table');
    if (sampleTable) sampleTable.innerHTML = '';
    var resultMeta = byId('timesfm-result-meta');
    if (resultMeta) resultMeta.innerHTML = '';
    var metrics = byId('timesfm-metrics');
    if (metrics) metrics.innerHTML = '';
    var chart = byId('timesfm-chart');
    if (chart) chart.innerHTML = '';
    setDisabled('timesfm-download-csv', true);
    setDisabled('timesfm-download-json', true);
    updateActionButtons();
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
        message: 'Your Workspace helper session is not active. Open Workspace, sign in there, then return to this tool.'
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
        message: 'Workspace is signed in, but the helper is missing private aibig9 TimesFM bridge settings. Start the helper with the backend URL and token.'
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
    setBridgeReady(false, info.message, info.tone);
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
      setBridgeReady(false, 'Cannot reach the Workspace helper from this browser session.', 'error');
      setMessage('Cannot reach the Workspace helper. Open Workspace again, sign in there, then reopen this tool.', 'error');
      return null;
    }
    try {
      setStatus('Checking bridge', 'idle');
      setBridgeReady(false, 'Checking Workspace helper and aibig9 bridge readiness.', 'neutral');
      var endpoint = joinUrl(state.apiBaseUrl, config.healthEndpoint);
      var payload = await requestJson(endpoint, {
        method: 'GET',
        headers: buildHelperAuthHeaders(),
        cache: 'no-store',
        credentials: helperCredentials(endpoint)
      });
      if (payload.cuda_available === false || payload.device === 'cpu') {
        setStatus('GPU unavailable', 'warn');
        setBridgeReady(true, 'The TimesFM backend responded, but CUDA is not available. You can test the flow, but forecasts may be slow.', 'warn');
        setMessage('The TimesFM backend responded, but CUDA is not available. Forecasts may be slow until aibig9 is using GPU.', 'warn');
      } else {
        setStatus('aibig9 GPU ready', 'ok');
        setBridgeReady(true, 'aibig9 TimesFM backend is reachable through the Workspace helper.', 'ok');
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
      setBridgeReady(false, 'Cannot reach the Workspace helper from this browser session.', 'error');
      setMessage('Workspace helper is unavailable, so columns will be previewed locally. Forecast requires Workspace helper access.', 'warn');
      try {
        renderPreview(await buildLocalPreviewPayload(state.file));
      } catch (error) {
        setMessage(error.message || 'Could not parse the file. Use CSV/TSV with one timestamp column and one numeric target column.', 'error');
      }
      updateActionButtons();
      return;
    }
    if (!state.bridgeReady) {
      setMessage('GPU bridge is not ready, so columns will be previewed locally. Forecast requires the aibig9 bridge.', 'warn');
      try {
        renderPreview(await buildLocalPreviewPayload(state.file));
      } catch (error) {
        setMessage(error.message || 'Could not parse the file. Use CSV/TSV with one timestamp column and one numeric target column.', 'error');
      }
      updateActionButtons();
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
      updateActionButtons();
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
    var parts = ['MAE ' + formatMetric(metrics.mae), 'RMSE ' + formatMetric(metrics.rmse), 'MAPE ' + formatPercentMetric(metrics.mape)];
    if (metrics.interval_coverage_q10_q90 != null) parts.push('q10-q90 ' + formatPercentMetric(metrics.interval_coverage_q10_q90));
    return '<div class="timesfm-metric-card"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(parts.join(' | ')) + '</strong></div>';
  }

  function formatMetric(value) {
    var numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return '-';
    return Math.abs(numberValue) >= 100 ? numberValue.toFixed(1) : numberValue.toFixed(3);
  }

  function formatPercentMetric(value) {
    var formatted = formatMetric(value);
    return formatted === '-' ? formatted : formatted + '%';
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
      setBridgeReady(false, 'Cannot reach the Workspace helper from this browser session.', 'error');
      setMessage('Cannot reach the Workspace helper. Open Workspace again, sign in there, then reopen this tool.', 'error');
      return;
    }
    if (!state.bridgeReady) {
      setMessage('The GPU bridge is not ready yet. Use Check GPU bridge before running a forecast.', 'warn');
      return;
    }
    if (!state.preview) {
      setMessage('Preview columns first so the timestamp and target fields are mapped before forecasting.', 'warn');
      return;
    }
    if (!byId('timesfm-timestamp-col').value || !byId('timesfm-target-col').value) {
      setMessage('Select both timestamp and target columns before running a forecast.', 'error');
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
      updateActionButtons();
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

    [
      ['timesfm-health-button', 'click', checkApiHealth],
      ['timesfm-preview-button', 'click', previewColumns],
      ['timesfm-forecast-button', 'click', runForecast],
      ['timesfm-download-json', 'click', downloadJson],
      ['timesfm-download-csv', 'click', downloadCsv],
      ['timesfm-series-col', 'change', updateSeriesIdOptions]
    ].forEach(function (binding) {
      var node = byId(binding[0]);
      if (node) node.addEventListener(binding[1], binding[2]);
    });
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
    setBridgeReady(false, 'Checking Workspace helper and aibig9 bridge readiness.', 'neutral');
    clearPreviewAndResult();
    bindEvents();
    checkApiHealth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
