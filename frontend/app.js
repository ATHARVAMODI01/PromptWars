const API_BASE = window.location.origin.includes("127.0.0.1") || window.location.origin.includes("localhost") ? `${window.location.origin}/api` : "/api";

let currentCandidateId = "cand-demo-001";
let loadedReport = null;

document.addEventListener("DOMContentLoaded", () => {
  // Load initial demo state if backend ready
  loadCandidateData(currentCandidateId);
});

function switchTab(tabId) {
  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));

  const targetScreen = document.getElementById(tabId);
  if (targetScreen) targetScreen.classList.add("active");

  // Highlight corresponding nav button
  const btns = document.querySelectorAll(".nav-btn");
  btns.forEach(btn => {
    if (btn.getAttribute("onclick").includes(tabId)) {
      btn.classList.add("active");
    }
  });

  if (tabId === 'screen-compare') {
    renderComparisonScreen();
  }
}

function onCandidateSelectChange() {
  const sel = document.getElementById("candidate-selector");
  currentCandidateId = sel.value;
  loadCandidateData(currentCandidateId);
}

async function loadDemoDataAndEvaluate() {
  try {
    switchTab('screen-pipeline');
    
    // Seed demo candidates
    const res = await fetch(`${API_BASE}/demo/load`, { method: "POST" });
    const data = await res.json();
    
    // Evaluate candidate A & B
    await fetch(`${API_BASE}/candidates/${data.candidate_a_id}/evaluate`, { method: "POST" });
    await fetch(`${API_BASE}/candidates/${data.candidate_a_id}/debate`, { method: "POST" });
    await fetch(`${API_BASE}/candidates/${data.candidate_a_id}/decision`, { method: "POST" });

    await fetch(`${API_BASE}/candidates/${data.candidate_b_id}/evaluate`, { method: "POST" });
    await fetch(`${API_BASE}/candidates/${data.candidate_b_id}/debate`, { method: "POST" });
    await fetch(`${API_BASE}/candidates/${data.candidate_b_id}/decision`, { method: "POST" });

    currentCandidateId = data.candidate_a_id;
    document.getElementById("candidate-selector").value = currentCandidateId;
    
    await loadCandidateData(currentCandidateId);
    switchTab('screen-overview');
  } catch (err) {
    console.error("Failed to load demo data:", err);
    alert("Backend connection error. Make sure FastAPI server is running at http://127.0.0.1:8000");
  }
}

async function loadCandidateData(candidateId) {
  try {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}/report`);
    if (!res.ok) {
      // Run evaluation pipeline if report missing
      await fetch(`${API_BASE}/candidates/${candidateId}/evaluate`, { method: "POST" });
      await fetch(`${API_BASE}/candidates/${candidateId}/debate`, { method: "POST" });
      await fetch(`${API_BASE}/candidates/${candidateId}/decision`, { method: "POST" });
      const retryRes = await fetch(`${API_BASE}/candidates/${candidateId}/report`);
      loadedReport = await retryRes.json();
    } else {
      loadedReport = await res.json();
    }

    renderCandidateOverview(loadedReport);
    renderIndependentAgents(loadedReport.initial_evaluations);
    renderDebateRoom(loadedReport.debate_summary.messages, loadedReport.opinion_changes);
    renderOpinionRevisions(loadedReport.opinion_changes);
    renderFinalDecision(loadedReport.final_decision);
  } catch (err) {
    console.error("Error loading candidate report:", err);
  }
}

function renderCandidateOverview(report) {
  const header = document.getElementById("candidate-header");
  header.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2 style="font-size: 1.75rem; font-weight: 700;">${report.candidate_name}</h2>
        <p style="color: var(--text-muted);">${report.target_role}</p>
      </div>
      <span class="badge ${getBadgeClass(report.final_decision.recommendation)}">
        ${report.final_decision.recommendation} (${report.final_decision.confidence} CONFIDENCE)
      </span>
    </div>
  `;

  // Capabilities
  const capContainer = document.getElementById("cand-capabilities");
  capContainer.innerHTML = (report.profile_summary.skills || []).map(s => 
    `<span style="display: inline-block; background: rgba(255,255,255,0.06); border: 1px solid var(--border-color); padding: 0.25rem 0.65rem; border-radius: 6px; font-size: 0.85rem; margin: 0.2rem;">${s}</span>`
  ).join("");

  // Gaps
  const gapsContainer = document.getElementById("cand-gaps");
  gapsContainer.innerHTML = (report.profile_summary.gaps || []).map(g => 
    `<div style="color: #fca5a5; font-size: 0.9rem; margin-bottom: 0.5rem;">• ${g}</div>`
  ).join("");

  // Evidence list
  const evContainer = document.getElementById("cand-evidence-list");
  evContainer.innerHTML = (report.evidence_registry || []).map(e => `
    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(15,23,42,0.6); padding: 0.5rem; border-radius: 6px;">
      <span class="evidence-chip" onclick="openEvidenceModal('${e.evidence_id}')">${e.evidence_id}</span>
      <span style="font-size: 0.8rem; color: var(--text-muted);">${e.source} - ${e.section}</span>
    </div>
  `).join("");
}

function renderIndependentAgents(initialEvals) {
  const container = document.getElementById("initial-agents-container");
  container.innerHTML = "";

  const agentOrder = ["technical", "hr_culture", "hiring_manager", "skeptic"];
  const agentTitles = {
    technical: { title: "Technical Agent", badge: "badge-tech", class: "tech" },
    hr_culture: { title: "HR / Culture Agent", badge: "badge-hr", class: "hr" },
    hiring_manager: { title: "Hiring Manager Agent", badge: "badge-hm", class: "hm" },
    skeptic: { title: "Skeptic Agent", badge: "badge-skeptic", class: "skeptic" }
  };

  agentOrder.forEach(key => {
    const ev = initialEvals[key];
    if (!ev) return;
    const meta = agentTitles[key];

    const card = document.createElement("div");
    card.className = `glass-panel agent-card ${meta.class}`;
    card.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <span class="badge ${meta.badge}">${meta.title}</span>
          <span class="badge ${getBadgeClass(ev.recommendation)}">${ev.recommendation}</span>
        </div>
        <p style="font-size: 0.9rem; color: #e2e8f0; margin-bottom: 1rem;">${ev.reasoning}</p>
        
        <h4 style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem;">Strengths</h4>
        <ul style="font-size: 0.85rem; color: #cbd5e1; margin-left: 1.2rem; margin-bottom: 1rem;">
          ${(ev.strengths || []).map(s => `<li>${s}</li>`).join("")}
        </ul>

        <h4 style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem;">Concerns</h4>
        <ul style="font-size: 0.85rem; color: #fca5a5; margin-left: 1.2rem; margin-bottom: 1rem;">
          ${(ev.concerns || []).map(c => `<li>${c}</li>`).join("")}
        </ul>
      </div>

      <div>
        <h4 style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem;">Cites Evidence</h4>
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          ${(ev.evidence || []).map(e => `<span class="evidence-chip" onclick="openEvidenceModal('${e.evidence_id}')">${e.evidence_id}</span>`).join("")}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderDebateRoom(messages, opinionChanges) {
  const container = document.getElementById("debate-timeline-container");
  container.innerHTML = "";

  messages.forEach(msg => {
    // Check if this turn triggered an opinion change
    const changeTrigger = opinionChanges.find(oc => oc.trigger_message_id === msg.message_id || (oc.changed && oc.agent_type === msg.agent_type && msg.changes_position));

    const card = document.createElement("div");
    card.className = "glass-panel debate-turn-card";
    
    let stanceClass = "stance-agree";
    if (msg.stance === "DISAGREE") stanceClass = "stance-disagree";
    if (msg.stance === "PARTIAL") stanceClass = "stance-partial";
    if (msg.stance === "CLARIFY") stanceClass = "stance-clarify";

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <span style="font-size: 0.75rem; color: var(--text-muted);">ROUND ${msg.round_number}</span>
          <span class="badge ${getAgentBadgeClass(msg.agent_type)}">${msg.agent_type.toUpperCase()}</span>
          ${msg.target_agent ? `<span style="font-size: 0.85rem; color: var(--text-subtle);">➔ ${msg.target_agent.toUpperCase()}</span>` : ''}
        </div>
        <span class="badge ${stanceClass}">${msg.stance}</span>
      </div>

      <p style="font-size: 0.95rem; color: #f1f5f9; margin-bottom: 0.75rem;">${msg.message}</p>

      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <span style="font-size: 0.75rem; color: var(--text-muted);">Evidence Cited:</span>
        ${(msg.evidence_ids || []).map(id => `<span class="evidence-chip" onclick="openEvidenceModal('${id}')">${id}</span>`).join("")}
      </div>
    `;

    container.appendChild(card);

    if (changeTrigger && msg.changes_position) {
      const changeCard = document.createElement("div");
      changeCard.className = "opinion-changed-card";
      changeCard.innerHTML = `
        <span style="font-size: 1.5rem;">⚡</span>
        <div>
          <strong style="color: #fbbf24; font-size: 0.9rem;">OPINION REVISED: ${msg.agent_type.toUpperCase()} AGENT</strong>
          <p style="font-size: 0.85rem; color: #fef08a;">Updated position to <strong>${msg.new_recommendation || 'BORDERLINE'}</strong> based on debate evidence.</p>
        </div>
      `;
      container.appendChild(changeCard);
    }
  });
}

function renderOpinionRevisions(opinionChanges) {
  const tbody = document.getElementById("opinion-revisions-tbody");
  tbody.innerHTML = opinionChanges.map(oc => `
    <tr>
      <td><span class="badge ${getAgentBadgeClass(oc.agent_type)}">${oc.agent_type.toUpperCase()}</span></td>
      <td><span class="badge ${getBadgeClass(oc.initial_recommendation)}">${oc.initial_recommendation}</span></td>
      <td><span class="badge ${getBadgeClass(oc.final_recommendation)}">${oc.final_recommendation}</span></td>
      <td>
        ${oc.changed ? 
          `<span style="color: #fbbf24; font-weight: 700;">YES ⚡</span>` : 
          `<span style="color: var(--text-muted);">NO</span>`}
      </td>
      <td style="font-size: 0.875rem; color: var(--text-muted);">${oc.reason}</td>
    </tr>
  `).join("");
}

function renderFinalDecision(decision) {
  const header = document.getElementById("final-decision-header");
  header.innerHTML = `
    <div class="glass-panel" style="padding: 2rem; text-align: center; border-color: var(--primary);">
      <span style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted);">FINAL PANEL RECOMMENDATION</span>
      <h2 style="font-size: 2.25rem; font-weight: 800; margin: 0.5rem 0;">
        <span class="badge ${getBadgeClass(decision.recommendation)}" style="font-size: 1.5rem; padding: 0.5rem 1.5rem;">${decision.recommendation}</span>
      </h2>
      <p style="color: var(--text-muted); font-size: 0.95rem;">Confidence Level: <strong>${decision.confidence}</strong></p>
      <p style="max-width: 800px; margin: 1rem auto 0 auto; font-size: 1.05rem; color: #f1f5f9; text-align: left;">
        ${decision.final_reasoning}
      </p>
    </div>
  `;

  document.getElementById("final-strengths").innerHTML = (decision.strengths || []).map(s => `<div style="margin-bottom: 0.5rem;">✓ ${s}</div>`).join("");
  document.getElementById("final-concerns").innerHTML = (decision.concerns || []).map(c => `<div style="margin-bottom: 0.5rem;">• ${c}</div>`).join("");

  const stepsContainer = document.getElementById("reasoning-steps-container");
  stepsContainer.innerHTML = (decision.reasoning_steps || []).map(step => `
    <div style="display: flex; gap: 1rem; margin-bottom: 1rem; padding: 0.75rem; background: rgba(15,23,42,0.5); border-radius: 8px;">
      <span style="font-family: 'JetBrains Mono'; font-weight: 700; color: var(--primary);">STEP ${step.step}</span>
      <div>
        <strong style="font-size: 0.95rem; color: #fff;">${step.title}</strong>
        <p style="font-size: 0.875rem; color: var(--text-muted);">${step.content}</p>
      </div>
    </div>
  `).join("");
}

async function renderComparisonScreen() {
  try {
    const res = await fetch(`${API_BASE}/reports/comparison`);
    const comp = await res.json();
    
    const container = document.getElementById("comparison-container");
    container.innerHTML = `
      <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem;">Panel Verdict Summary</h3>
        <p style="color: #e2e8f0; font-size: 1rem;">${comp.panel_summary}</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
        ${comp.candidates.map(c => `
          <div class="glass-panel" style="padding: 1.5rem;">
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">${c.name}</h3>
            <span class="badge ${getBadgeClass(c.recommendation)}" style="margin-bottom: 1rem;">${c.recommendation}</span>
            
            <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem;">
              <div><strong>Technical Depth:</strong> <span style="color: var(--text-muted);">${c.technical_depth}</span></div>
              <div><strong>Integrity & Honesty:</strong> <span style="color: var(--text-muted);">${c.integrity_accountability}</span></div>
              <div><strong>Production Readiness:</strong> <span style="color: var(--text-muted);">${c.production_readiness}</span></div>
              <div><strong>Skeptic Finding:</strong> <span style="color: #fca5a5;">${c.skeptic_finding}</span></div>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  } catch (err) {
    console.error("Comparison load error:", err);
  }
}

async function openEvidenceModal(evidenceId) {
  try {
    const res = await fetch(`${API_BASE}/candidates/${currentCandidateId}/evidence/${evidenceId}`);
    const ev = await res.json();

    document.getElementById("modal-ev-id").innerText = ev.evidence_id;
    document.getElementById("modal-ev-source").innerText = ev.source.toUpperCase();
    document.getElementById("modal-ev-section").innerText = ev.section;
    document.getElementById("modal-ev-quote").innerText = `"${ev.quote}"`;

    document.getElementById("modal-ev-supports").innerHTML = (ev.supports || []).map(s => `
      <span style="background: rgba(255,255,255,0.08); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">${s}</span>
    `).join("");

    document.getElementById("evidence-modal").classList.add("active");
  } catch (err) {
    console.error("Failed to fetch evidence quote:", err);
  }
}

function closeEvidenceModal() {
  document.getElementById("evidence-modal").classList.remove("active");
}

function getBadgeClass(rec) {
  if (!rec) return "badge-hire";
  const r = rec.toUpperCase();
  if (r.includes("STRONG HIRE")) return "badge-strong-hire";
  if (r.includes("STRONG NO")) return "badge-no-hire";
  if (r.includes("HIRE") && !r.includes("NO HIRE")) return "badge-hire";
  if (r.includes("BORDERLINE")) return "badge-borderline";
  if (r.includes("NO HIRE")) return "badge-no-hire";
  return "badge-hire";
}

function getAgentBadgeClass(agentType) {
  if (agentType === "technical") return "badge-tech";
  if (agentType === "hr_culture") return "badge-hr";
  if (agentType === "hiring_manager") return "badge-hm";
  if (agentType === "skeptic") return "badge-skeptic";
  return "badge-tech";
}
