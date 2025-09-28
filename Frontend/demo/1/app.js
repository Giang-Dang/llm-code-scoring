/*
  RubricScore – Demo MVP (Vanilla JS)
  Keeps data client-side only. This code favors clarity and readability.
*/

(function initApp() {
  const appState = {
    question: {
      title: "",
      prompt: "",
      constraints: "",
      expectedFormat: "",
    },
    rubric: {
      criteria: [],
    },
    submissions: [],
    templates: loadTemplatesFromStorage(),
    ui: {
      currentStep: 1,
      largeFont: false,
    },
  };

  /* Utility */
  function generateId(prefix) {
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const timestamp = Date.now().toString(36);
    return `${prefix}_${timestamp}_${randomSuffix}`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function sum(values) {
    return values.reduce((acc, n) => acc + Number(n || 0), 0);
  }

  function createElement(tagName, className, attrs) {
    const el = document.createElement(tagName);
    if (className) el.className = className;
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
    }
    return el;
  }

  function setText(el, text) {
    el.textContent = String(text);
  }

  function loadTemplatesFromStorage() {
    try {
      const raw = localStorage.getItem("rubricTemplates");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveTemplatesToStorage(templates) {
    try {
      localStorage.setItem("rubricTemplates", JSON.stringify(templates));
    } catch (e) {
      /* ignore */
    }
  }

  /* Step Navigation */
  const stepSections = [
    document.getElementById("step-1"),
    document.getElementById("step-2"),
    document.getElementById("step-3"),
  ];
  const progressButtons = Array.from(document.querySelectorAll(".progress-step"));

  function goToStep(stepIndex) {
    appState.ui.currentStep = stepIndex;
    stepSections.forEach((sec, idx) => {
      const isVisible = idx === stepIndex - 1;
      sec.classList.toggle("is-visible", isVisible);
      sec.setAttribute("aria-hidden", String(!isVisible));
    });
    progressButtons.forEach((btn) => {
      const target = Number(btn.dataset.step);
      const isActive = target === stepIndex;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-current", isActive ? "step" : "false");
    });
    updateQuestionPreview();
    renderRubricPreview();
    renderSubmissionsPreview();
  }

  progressButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const stepNum = Number(btn.dataset.step);
      goToStep(stepNum);
    });
  });

  document.getElementById("to-step-2").addEventListener("click", () => goToStep(2));
  document.getElementById("to-step-3").addEventListener("click", () => goToStep(3));

  document.getElementById("btn-skip-dashboard").addEventListener("click", () => showDashboard());

  /* Large font toggle */
  const largeFontToggle = document.getElementById("toggle-large-font");
  largeFontToggle.addEventListener("change", () => {
    appState.ui.largeFont = largeFontToggle.checked;
    document.documentElement.classList.toggle("large-font", appState.ui.largeFont);
  });

  /* Step 1: Question */
  const elQuestionTitle = document.getElementById("question-title");
  const elQuestionPrompt = document.getElementById("question-prompt");
  const elQuestionConstraints = document.getElementById("question-constraints");
  const elQuestionOutput = document.getElementById("question-output");

  [elQuestionTitle, elQuestionPrompt, elQuestionConstraints, elQuestionOutput].forEach((el) => {
    el.addEventListener("input", () => {
      appState.question.title = elQuestionTitle.value.trim();
      appState.question.prompt = elQuestionPrompt.value.trim();
      appState.question.constraints = elQuestionConstraints.value.trim();
      appState.question.expectedFormat = elQuestionOutput.value.trim();
      updateQuestionPreview();
    });
  });

  function updateQuestionPreview() {
    const container = document.getElementById("preview-question");
    container.innerHTML = "";

    const title = createElement("div", "muted");
    setText(title, appState.question.title || "(Title will appear here)");

    const prompt = createElement("div");
    setText(prompt, appState.question.prompt || "Problem statement preview…");

    const detailsList = createElement("ul");
    detailsList.style.margin = "10px 0 0 16px";

    const liConstraints = createElement("li");
    setText(liConstraints, `Constraints: ${appState.question.constraints || "—"}`);

    const liOutput = createElement("li");
    setText(liOutput, `Expected Output: ${appState.question.expectedFormat || "—"}`);

    detailsList.appendChild(liConstraints);
    detailsList.appendChild(liOutput);

    container.appendChild(title);
    container.appendChild(prompt);
    container.appendChild(detailsList);
  }

  /* Step 2: Rubric Builder */
  const rubricRowsContainer = document.getElementById("rubric-rows");
  const btnAddCriterion = document.getElementById("btn-add-criterion");
  const btnApplyTemplate = document.getElementById("btn-apply-template");
  const btnSaveTemplate = document.getElementById("btn-save-template");
  const btnLoadSaved = document.getElementById("btn-load-saved");
  const rubricTemplateSelect = document.getElementById("rubric-template-select");

  btnAddCriterion.addEventListener("click", () => {
    const newCriterion = {
      id: generateId("crit"),
      name: "New Criterion",
      description: "",
      maxPoints: 5,
      weightPercent: 25,
      automated: false,
    };
    appState.rubric.criteria.push(newCriterion);
    renderRubricRows();
    renderRubricPreview();
  });

  btnApplyTemplate.addEventListener("click", () => {
    const selected = rubricTemplateSelect.value;
    if (!selected) return;
    if (selected === "intro") {
      appState.rubric.criteria = [
        { id: generateId("crit"), name: "Correctness", description: "Meets problem requirements and edge cases.", maxPoints: 10, weightPercent: 40, automated: false },
        { id: generateId("crit"), name: "Readability", description: "Clear structure and naming.", maxPoints: 5, weightPercent: 20, automated: true },
        { id: generateId("crit"), name: "Documentation", description: "Comments and explanations.", maxPoints: 5, weightPercent: 20, automated: true },
        { id: generateId("crit"), name: "Efficiency", description: "Reasonable time/space complexity.", maxPoints: 5, weightPercent: 20, automated: true },
      ];
    } else if (selected === "style") {
      appState.rubric.criteria = [
        { id: generateId("crit"), name: "Naming", description: "Descriptive identifiers.", maxPoints: 5, weightPercent: 30, automated: true },
        { id: generateId("crit"), name: "Formatting", description: "Consistent style and linting.", maxPoints: 5, weightPercent: 30, automated: true },
        { id: generateId("crit"), name: "Comments", description: "Helpful, concise documentation.", maxPoints: 5, weightPercent: 20, automated: true },
        { id: generateId("crit"), name: "Structure", description: "Modular and maintainable.", maxPoints: 5, weightPercent: 20, automated: false },
      ];
    }
    renderRubricRows();
    renderRubricPreview();
  });

  btnSaveTemplate.addEventListener("click", () => {
    const name = prompt("Template name?");
    if (!name) return;
    const tpl = {
      id: generateId("tpl"),
      name,
      criteria: JSON.parse(JSON.stringify(appState.rubric.criteria)),
    };
    appState.templates.push(tpl);
    saveTemplatesToStorage(appState.templates);
    alert("Template saved.");
  });

  btnLoadSaved.addEventListener("click", () => {
    if (!appState.templates.length) {
      alert("No saved templates yet.");
      return;
    }
    const choices = appState.templates.map((t, i) => `${i + 1}. ${t.name}`).join("\n");
    const pick = prompt(`Choose template by number:\n${choices}`);
    if (!pick) return;
    const idx = Number(pick) - 1;
    if (!appState.templates[idx]) return;
    appState.rubric.criteria = JSON.parse(JSON.stringify(appState.templates[idx].criteria));
    renderRubricRows();
    renderRubricPreview();
  });

  function renderRubricRows() {
    rubricRowsContainer.innerHTML = "";
    appState.rubric.criteria.forEach((crit, index) => {
      const row = createElement("div", "rubric-row", { role: "row" });

      const cName = createElement("div");
      const inputName = createElement("input", null, { type: "text", value: crit.name, "aria-label": "Criterion name" });
      inputName.addEventListener("input", () => { crit.name = inputName.value; renderRubricPreview(); });
      cName.appendChild(inputName);

      const cDesc = createElement("div");
      const inputDesc = createElement("input", null, { type: "text", value: crit.description, "aria-label": "Criterion description" });
      inputDesc.addEventListener("input", () => { crit.description = inputDesc.value; renderRubricPreview(); });
      cDesc.appendChild(inputDesc);

      const cPoints = createElement("div", "num");
      const inputPoints = createElement("input", null, { type: "number", min: "0", value: String(crit.maxPoints), "aria-label": "Max points" });
      inputPoints.addEventListener("input", () => { crit.maxPoints = clamp(Number(inputPoints.value), 0, 1000); renderRubricPreview(); });
      cPoints.appendChild(inputPoints);

      const cWeight = createElement("div", "num");
      const inputWeight = createElement("input", null, { type: "number", min: "0", max: "100", value: String(crit.weightPercent), "aria-label": "Weight percent" });
      inputWeight.addEventListener("input", () => { crit.weightPercent = clamp(Number(inputWeight.value), 0, 100); renderRubricPreview(); });
      cWeight.appendChild(inputWeight);

      const cAuto = createElement("div", "num");
      const inputAuto = createElement("input", null, { type: "checkbox", "aria-label": "Automated criterion" });
      inputAuto.checked = Boolean(crit.automated);
      inputAuto.addEventListener("change", () => { crit.automated = inputAuto.checked; renderRubricPreview(); });
      cAuto.appendChild(inputAuto);

      const cActions = createElement("div", "row-actions actions-col");
      const btnUp = createElement("button", "icon-btn", { title: "Move up" });
      setText(btnUp, "↑");
      btnUp.addEventListener("click", () => moveCriterion(index, -1));
      const btnDown = createElement("button", "icon-btn", { title: "Move down" });
      setText(btnDown, "↓");
      btnDown.addEventListener("click", () => moveCriterion(index, 1));
      const btnDelete = createElement("button", "icon-btn", { title: "Delete" });
      setText(btnDelete, "🗑");
      btnDelete.addEventListener("click", () => deleteCriterion(index));

      cActions.appendChild(btnUp);
      cActions.appendChild(btnDown);
      cActions.appendChild(btnDelete);

      row.appendChild(cName);
      row.appendChild(cDesc);
      row.appendChild(cPoints);
      row.appendChild(cWeight);
      row.appendChild(cAuto);
      row.appendChild(cActions);
      rubricRowsContainer.appendChild(row);
    });
  }

  function moveCriterion(index, delta) {
    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= appState.rubric.criteria.length) return;
    const list = appState.rubric.criteria;
    const [moved] = list.splice(index, 1);
    list.splice(newIndex, 0, moved);
    renderRubricRows();
    renderRubricPreview();
  }

  function deleteCriterion(index) {
    appState.rubric.criteria.splice(index, 1);
    renderRubricRows();
    renderRubricPreview();
  }

  function renderRubricPreview() {
    const container = document.getElementById("preview-rubric");
    container.innerHTML = "";

    if (!appState.rubric.criteria.length) {
      container.innerHTML = "<span class=\"muted\">Rubric preview will appear here…</span>";
      return;
    }

    const totalPoints = sum(appState.rubric.criteria.map(c => c.maxPoints));
    const list = createElement("div");

    appState.rubric.criteria.forEach((c) => {
      const item = createElement("div", "report-rubric-item");
      const title = createElement("div");
      title.innerHTML = `<strong>${escapeHtml(c.name)}</strong> • ${escapeHtml(c.description || "")} <span class=\"muted\">(${c.maxPoints} pts, ${c.weightPercent}%${c.automated ? ", auto" : ""})</span>`;
      item.appendChild(title);

      const barRow = createElement("div", "report-chart bar-row");
      const label = createElement("div");
      setText(label, c.name);
      const bg = createElement("div", "bar-bg");
      const fill = createElement("div", "bar-fill");
      const pct = totalPoints ? Math.round((c.maxPoints / totalPoints) * 100) : 0;
      fill.style.width = `${pct}%`;
      bg.appendChild(fill);
      const right = createElement("div");
      setText(right, `${pct}%`);
      barRow.appendChild(label);
      barRow.appendChild(bg);
      barRow.appendChild(right);

      item.appendChild(barRow);
      list.appendChild(item);
    });

    container.appendChild(list);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"]+/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]));
  }

  /* Step 3: Code Input */
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const tabPanels = {
    single: document.getElementById("tab-single"),
    batch: document.getElementById("tab-batch"),
  };

  tabs.forEach((t) => t.addEventListener("click", () => switchTab(t.dataset.tab)));

  function switchTab(tabName) {
    tabs.forEach((t) => {
      const active = t.dataset.tab === tabName;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    });
    Object.entries(tabPanels).forEach(([name, panel]) => {
      const visible = name === tabName;
      panel.classList.toggle("is-visible", visible);
      panel.setAttribute("aria-hidden", String(!visible));
    });
  }

  const elSingleName = document.getElementById("single-name");
  const elSingleLanguage = document.getElementById("single-language");
  const elSingleCode = document.getElementById("single-code");

  document.getElementById("btn-add-single").addEventListener("click", () => {
    const name = elSingleName.value.trim() || "Student";
    const language = elSingleLanguage.value;
    const code = elSingleCode.value;
    if (!code.trim()) {
      alert("Please paste code.");
      return;
    }
    addSubmission({ name, language, code });
    elSingleCode.value = "";
    renderSubmissionsPreview();
  });

  document.getElementById("btn-go-dashboard").addEventListener("click", () => showDashboard());

  const elBulkPaste = document.getElementById("bulk-paste");
  document.getElementById("btn-parse-bulk").addEventListener("click", () => {
    const raw = elBulkPaste.value;
    const blocks = raw.split(/\n-{3,}\n/);
    const added = [];
    blocks.forEach((block) => {
      const lines = block.split(/\n/);
      let name = "Student";
      let language = "auto";
      const codeLines = [];
      lines.forEach((ln) => {
        const nameMatch = ln.match(/^\s*Name:\s*(.+)$/i);
        const langMatch = ln.match(/^\s*Language:\s*(.+)$/i);
        if (nameMatch) name = nameMatch[1].trim();
        else if (langMatch) language = langMatch[1].trim().toLowerCase();
        else codeLines.push(ln);
      });
      const code = codeLines.join("\n").trim();
      if (code) {
        added.push(addSubmission({ name, language, code }));
      }
    });
    if (added.length) {
      elBulkPaste.value = "";
      renderSubmissionsPreview();
      alert(`Added ${added.length} submissions.`);
    } else {
      alert("No valid entries found.");
    }
  });

  document.getElementById("btn-upload-csv").addEventListener("click", () => {
    const fileInput = document.getElementById("csv-file");
    if (!fileInput.files || !fileInput.files[0]) {
      alert("Choose a CSV file first.");
      return;
    }
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const rows = parseCsv(text);
        let count = 0;
        rows.forEach((r) => {
          if (r.code) {
            addSubmission({ name: r.name || "Student", language: (r.language || "auto").toLowerCase(), code: r.code });
            count += 1;
          }
        });
        renderSubmissionsPreview();
        alert(`Added ${count} submissions.`);
      } catch (e) {
        alert("CSV parse error.");
      }
    };
    reader.readAsText(file);
  });

  function parseCsv(text) {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows = [];
    for (let i = 1; i < lines.length; i += 1) {
      const cols = splitCsvLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = cols[idx] ? cols[idx].trim() : "";
      });
      rows.push(row);
    }
    return rows;
  }

  function splitCsvLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  function addSubmission({ name, language, code }) {
    const id = generateId("sub");
    const normalizedLanguage = language === "auto" ? autoDetectLanguage(code) : language;
    const rubricScores = computeAutoScoresForCode(code, normalizedLanguage, appState.rubric.criteria);
    const autoScore = sum(Object.values(rubricScores));
    const manualAdjustment = 0;
    const finalScore = autoScore + manualAdjustment;
    const submission = { id, name, language: normalizedLanguage, code, rubricScores, autoScore, manualAdjustment, finalScore, comments: "" };
    appState.submissions.push(submission);
    return submission;
  }

  function autoDetectLanguage(code) {
    const snippet = code.slice(0, 500).toLowerCase();
    if (/(def\s+\w+\(|import\s+\w+|#:)/.test(snippet)) return "python";
    if (/(function\s+\w+\(|=>|console\.log)/.test(snippet)) return "javascript";
    if (/(public\s+class|System\.out\.println|static\s+void\s+main)/i.test(code)) return "java";
    if (/#include\s+<|std::|int\s+main\s*\(/.test(code)) return "c++";
    return "javascript";
  }

  function computeAutoScoresForCode(code, language, criteria) {
    const scoresByCriterionId = {};
    criteria.forEach((c) => {
      if (!c.automated) {
        scoresByCriterionId[c.id] = 0;
        return;
      }
      const maxPts = Number(c.maxPoints) || 0;
      const nameLower = (c.name || "").toLowerCase();
      let score = 0;
      if (nameLower.includes("readability")) score = scoreReadability(code, language, maxPts);
      else if (nameLower.includes("documentation") || nameLower.includes("comments")) score = scoreDocumentation(code, language, maxPts);
      else if (nameLower.includes("efficiency") || nameLower.includes("performance")) score = scoreEfficiency(code, language, maxPts);
      else if (nameLower.includes("naming") || nameLower.includes("formatting") || nameLower.includes("style")) score = scoreStyle(code, language, maxPts);
      else score = Math.round(maxPts * 0.5);
      scoresByCriterionId[c.id] = clamp(score, 0, maxPts);
    });
    return scoresByCriterionId;
  }

  function scoreReadability(code, language, maxPts) {
    const numLines = code.split(/\r?\n/).length;
    const avgLineLength = sum(code.split(/\r?\n/).map(l => l.length)) / Math.max(1, numLines);
    let score = maxPts * 0.4;
    if (avgLineLength < 80) score += maxPts * 0.25;
    if (!/(\t| {2,})\S/.test(code)) score -= maxPts * 0.1;
    if (/(\b[a-z]{2,}\d{1,}\b)/.test(code)) score += maxPts * 0.05;
    if (/\b([A-Z][a-z]+){2,}\b/.test(code)) score += maxPts * 0.1;
    return Math.round(clamp(score, 0, maxPts));
  }

  function scoreDocumentation(code, language, maxPts) {
    let score = 0;
    const hasBlockComment = /\/\*[\s\S]*?\*\//.test(code) || /"""[\s\S]*?"""|'''[\s\S]*?'''/.test(code);
    const hasLineComments = /(\s+|^)\/(\/|\*)|#\s|--\s/.test(code);
    if (hasBlockComment) score += maxPts * 0.6;
    if (hasLineComments) score += maxPts * 0.3;
    if (/TODO|FIXME|NOTE\s*:/.test(code)) score -= maxPts * 0.15;
    return Math.round(clamp(score, 0, maxPts));
  }

  function scoreEfficiency(code, language, maxPts) {
    const hasNestedLoops = /(for|while)[\s\S]*?(for|while)/.test(code);
    const hasInefficientPatterns = /Array\.from\(new\s+Array\(|\.sort\(\)\s*;/.test(code);
    let score = maxPts * 0.7;
    if (hasNestedLoops) score -= maxPts * 0.3;
    if (hasInefficientPatterns) score -= maxPts * 0.15;
    return Math.round(clamp(score, 0, maxPts));
  }

  function scoreStyle(code, language, maxPts) {
    let score = maxPts * 0.5;
    if (/\bconst\b|\blet\b|;\s*$/.test(code)) score += maxPts * 0.1;
    if (/^[\t ]{2,}\S/m.test(code)) score += maxPts * 0.15;
    if (!/eval\(/.test(code) && !/global\s+/.test(code)) score += maxPts * 0.15;
    return Math.round(clamp(score, 0, maxPts));
  }

  /* Submissions Preview */
  function renderSubmissionsPreview() {
    const container = document.getElementById("preview-submissions");
    container.innerHTML = "";
    if (!appState.submissions.length) {
      container.innerHTML = "<span class=\"muted\">No submissions yet.</span>";
      return;
    }
    appState.submissions.slice(-5).forEach((s) => {
      const wrap = createElement("div", "score-chip");
      const name = createElement("div");
      name.style.minWidth = "140px";
      setText(name, s.name);
      const bar = createElement("div", "bar");
      const totalMax = sum(appState.rubric.criteria.map(c => c.maxPoints));
      const pct = totalMax ? Math.round((s.finalScore / totalMax) * 100) : 0;
      bar.style.width = `${pct}%`;
      const pctText = createElement("div", "muted");
      setText(pctText, `${pct}%`);
      wrap.appendChild(name);
      wrap.appendChild(bar);
      wrap.appendChild(pctText);
      container.appendChild(wrap);
    });
  }

  /* Dashboard */
  const dashboardSection = document.getElementById("dashboard");
  const dashRows = document.getElementById("dash-rows");
  const btnExportCsv = document.getElementById("btn-export-csv");
  const btnBulkComment = document.getElementById("btn-bulk-comment");
  const selectAllCheckbox = document.getElementById("select-all");

  function showDashboard() {
    document.querySelector(".wizard").style.display = "none";
    dashboardSection.classList.add("is-visible");
    dashboardSection.setAttribute("aria-hidden", "false");
    renderDashboardRows();
  }

  function renderDashboardRows() {
    dashRows.innerHTML = "";
    appState.submissions.forEach((s) => {
      const row = createElement("div", "dash-row", { role: "row" });

      const cSelect = createElement("div", "shrink");
      const cb = createElement("input", null, { type: "checkbox", "data-id": s.id, "aria-label": `Select ${s.name}` });
      cSelect.appendChild(cb);

      const cName = createElement("div");
      setText(cName, s.name);

      const cAuto = createElement("div", "num");
      setText(cAuto, s.autoScore);

      const cAdj = createElement("div", "num");
      const inputAdj = createElement("input", null, { type: "number", step: "1", value: String(s.manualAdjustment) });
      inputAdj.addEventListener("input", () => {
        s.manualAdjustment = Number(inputAdj.value || 0);
        s.finalScore = s.autoScore + s.manualAdjustment;
        setText(cFinal, s.finalScore);
      });
      cAdj.appendChild(inputAdj);

      const cFinal = createElement("div", "num");
      setText(cFinal, s.finalScore);

      const cActions = createElement("div", "row-actions actions-col");
      const btnExpand = createElement("button", "icon-btn", { title: "Details" });
      setText(btnExpand, "▾");
      const btnReport = createElement("button", "icon-btn", { title: "Open student report" });
      setText(btnReport, "📊");
      const btnComment = createElement("button", "icon-btn", { title: "Add comment" });
      setText(btnComment, "💬");

      cActions.appendChild(btnExpand);
      cActions.appendChild(btnReport);
      cActions.appendChild(btnComment);

      row.appendChild(cSelect);
      row.appendChild(cName);
      row.appendChild(cAuto);
      row.appendChild(cAdj);
      row.appendChild(cFinal);
      row.appendChild(cActions);

      const expand = createElement("div", "dash-expand");
      expand.style.display = "none";

      const breakdownTitle = createElement("h4");
      setText(breakdownTitle, "Rubric Breakdown");
      expand.appendChild(breakdownTitle);

      appState.rubric.criteria.forEach((c) => {
        const rowItem = createElement("div", "report-rubric-item");
        const label = createElement("div");
        const got = s.rubricScores[c.id] || 0;
        label.innerHTML = `<strong>${escapeHtml(c.name)}</strong> • <span class=\"muted\">${got} / ${c.maxPoints}</span>`;
        rowItem.appendChild(label);
        if (!c.automated) {
          const manualWrap = createElement("div");
          const inputManual = createElement("input", null, { type: "number", min: "0", max: String(c.maxPoints), value: String(got) });
          inputManual.addEventListener("input", () => {
            const newVal = clamp(Number(inputManual.value || 0), 0, c.maxPoints);
            s.rubricScores[c.id] = newVal;
            s.autoScore = sum(Object.values(s.rubricScores));
            s.finalScore = s.autoScore + s.manualAdjustment;
            setText(cAuto, s.autoScore);
            setText(cFinal, s.finalScore);
          });
          manualWrap.appendChild(inputManual);
          rowItem.appendChild(manualWrap);
        }
        expand.appendChild(rowItem);
      });

      const commentWrap = createElement("div");
      const commentInput = createElement("textarea", null, { rows: "2", placeholder: "Comments for the student…" });
      commentInput.value = s.comments || "";
      commentInput.addEventListener("input", () => { s.comments = commentInput.value; });
      commentWrap.appendChild(commentInput);
      expand.appendChild(commentWrap);

      btnExpand.addEventListener("click", () => {
        const isHidden = expand.style.display === "none";
        expand.style.display = isHidden ? "block" : "none";
      });

      btnReport.addEventListener("click", () => openStudentReport(s));

      btnComment.addEventListener("click", () => {
        const txt = prompt("Enter a quick comment:", s.comments || "");
        if (txt !== null) {
          s.comments = txt;
          commentInput.value = txt;
        }
      });

      dashRows.appendChild(row);
      dashRows.appendChild(expand);
    });
  }

  btnExportCsv.addEventListener("click", () => {
    const headers = ["name", "autoScore", "manualAdjustment", "finalScore", "comments"];
    const rows = appState.submissions.map((s) => [s.name, s.autoScore, s.manualAdjustment, s.finalScore, (s.comments || "").replace(/\n/g, " ")]);
    const csv = [headers.join(",")].concat(rows.map(r => r.join(","))).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scores_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  selectAllCheckbox.addEventListener("change", () => {
    Array.from(dashRows.querySelectorAll("input[type=checkbox]"))
      .forEach(cb => { cb.checked = selectAllCheckbox.checked; });
  });

  btnBulkComment.addEventListener("click", () => {
    const txt = prompt("Comment to apply to selected students:");
    if (!txt) return;
    const selectedIds = Array.from(dashRows.querySelectorAll("input[type=checkbox]:checked"))
      .map(cb => cb.getAttribute("data-id"));
    appState.submissions.forEach((s) => {
      if (selectedIds.includes(s.id)) {
        s.comments = s.comments ? `${s.comments}\n${txt}` : txt;
      }
    });
    renderDashboardRows();
  });

  /* Student Report Modal */
  const modal = document.getElementById("report-modal");
  const modalClose = document.getElementById("report-close");
  const modalDone = document.getElementById("report-done");
  const reportStudent = document.getElementById("report-student");
  const reportChart = document.getElementById("report-chart");
  const reportRubric = document.getElementById("report-rubric");
  const reportCode = document.getElementById("report-code");

  function openStudentReport(sub) {
    reportStudent.innerHTML = `<strong>${escapeHtml(sub.name)}</strong> • ${escapeHtml(sub.language.toUpperCase())} • Final: ${sub.finalScore}`;

    reportChart.innerHTML = "";
    const totalMax = sum(appState.rubric.criteria.map(c => c.maxPoints));
    appState.rubric.criteria.forEach((c) => {
      const row = createElement("div", "bar-row");
      const label = createElement("div");
      setText(label, c.name);
      const bg = createElement("div", "bar-bg");
      const fill = createElement("div", "bar-fill");
      const got = sub.rubricScores[c.id] || 0;
      const pct = c.maxPoints ? Math.round((got / c.maxPoints) * 100) : 0;
      fill.style.width = `${pct}%`;
      bg.appendChild(fill);
      const right = createElement("div");
      setText(right, `${got}/${c.maxPoints}`);
      row.appendChild(label);
      row.appendChild(bg);
      row.appendChild(right);
      reportChart.appendChild(row);
    });

    reportRubric.innerHTML = "";
    appState.rubric.criteria.forEach((c) => {
      const item = createElement("div", "report-rubric-item");
      const got = sub.rubricScores[c.id] || 0;
      const symbol = got >= c.maxPoints * 0.6 ? "✓" : "✗";
      item.innerHTML = `<div><strong>${symbol} ${escapeHtml(c.name)}</strong> <span class=\"muted\">${got}/${c.maxPoints}</span></div><div class=\"muted\">${escapeHtml(c.description || "")}</div>`;
      reportRubric.appendChild(item);
    });

    renderAnnotatedCode(reportCode, sub.code);

    modal.classList.add("is-visible");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeStudentReport() {
    modal.classList.remove("is-visible");
    modal.setAttribute("aria-hidden", "true");
  }

  modalClose.addEventListener("click", closeStudentReport);
  modalDone.addEventListener("click", closeStudentReport);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeStudentReport(); });

  function renderAnnotatedCode(container, code) {
    container.innerHTML = "";
    const lines = code.split(/\r?\n/);
    lines.forEach((line, idx) => {
      const row = createElement("div", "code-line");
      const ln = createElement("div", "code-line-num");
      setText(ln, String(idx + 1).padStart(3, " "));
      const content = createElement("div");
      const annotation = getAnnotationForLine(line);
      if (annotation) {
        const wrap = createElement("div", "code-annot");
        wrap.textContent = line;
        wrap.title = annotation;
        content.appendChild(wrap);
      } else {
        content.textContent = line;
      }
      row.appendChild(ln);
      row.appendChild(content);
      container.appendChild(row);
    });
  }

  function getAnnotationForLine(line) {
    if (/TODO|FIXME/.test(line)) return "Contains TODO/FIXME";
    if (/console\.log|print\(/.test(line)) return "Debug print statement";
    if (/eval\(/.test(line)) return "Avoid eval for security";
    return "";
  }

  /* Initial state */
  renderRubricRows();
  renderRubricPreview();
  updateQuestionPreview();
  renderSubmissionsPreview();

  /* Keyboard navigation helpers */
  document.addEventListener("keydown", (e) => {
    if (e.altKey && !e.shiftKey && !e.ctrlKey) {
      if (e.key === "1") goToStep(1);
      if (e.key === "2") goToStep(2);
      if (e.key === "3") goToStep(3);
    }
  });
})();
