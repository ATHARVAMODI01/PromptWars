const API_BASE = window.location.origin.includes("127.0.0.1") || window.location.origin.includes("localhost") ? `${window.location.origin}/api` : "/api";

let currentCandidateId = "cand-demo-001";
let loadedReport = null;

document.addEventListener("DOMContentLoaded", () => {
  // Load initial demo state if backend ready
  loadCandidateData(currentCandidateId);

  // Global Esc key listener to close modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeEvidenceModal();
    }
  });
});

function announceToScreenReader(message) {
  const announcer = document.getElementById("live-announcer");
  if (announcer) {
    announcer.innerText = message;
  }
}

function switchTab(tabId) {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.remove("active");
    btn.setAttribute("aria-selected", "false");
  });
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));

  const targetScreen = document.getElementById(tabId);
  if (targetScreen) {
    targetScreen.classList.add("active");
    targetScreen.focus();
  }

  // Highlight corresponding nav button
  const activeBtn = document.querySelector(`.nav-btn[aria-controls="${tabId}"]`) || document.querySelector(`.nav-btn[onclick*="${tabId}"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");
    activeBtn.setAttribute("aria-selected", "true");
  }

  announceToScreenReader(`Switched to ${tabId.replace('screen-', '')} view`);

  if (tabId === 'screen-compare') {
    renderComparisonScreen();
  }
}

function onCandidateSelectChange() {
  const sel = document.getElementById("candidate-selector");
  currentCandidateId = sel.value;
  announceToScreenReader(`Selected ${sel.options[sel.selectedIndex].text}`);
  loadCandidateData(currentCandidateId);
}

async function loadDemoDataAndEvaluate() {
  try {
    switchTab('screen-pipeline');
    announceToScreenReader("Starting multi-agent candidate pipeline evaluation");
    
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
    announceToScreenReader("Multi-agent candidate evaluation complete");
    switchTab('screen-overview');
  } catch (err) {
    console.error("Failed to load demo data:", err);
    alert("Backend connection error. Make sure server is running.");
  }
}

async function loadCandidateData(candidateId) {
  try {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}/report`);
    if (!res.ok) {
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
        <h2 style="font-size: 1.75rem; font-weight: 700; color: #ffffff;">${report.candidate_name}</h2>
        <p style="color: #cbd5e1; font-weight: 500;">${report.target_role}</p>
      </div>
      <span class="badge ${getBadgeClass(report.final_decision.recommendation)}">
        ${report.final_decision.recommendation} (${report.final_decision.confidence} CONFIDENCE)
      </span>
    </div>
  `;

  // Capabilities
  const capContainer = document.getElementById("cand-capabilities");
  capContainer.innerHTML = (report.profile_summary.skills || []).map(s => 
    `<span style="display: inline-block; background: rgba(255,255,255,0.1); border: 1px solid var(--border-color); color: #ffffff; padding: 0.3rem 0.75rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; margin: 0.2rem;">${s}</span>`
  ).join("");

  // Gaps
  const gapsContainer = document.getElementById("cand-gaps");
  gapsContainer.innerHTML = (report.profile_summary.gaps || []).map(g => 
    `<div style="color: #fca5a5; font-size: 0.95rem; margin-bottom: 0.5rem; font-weight: 500;">• ${g}</div>`
  ).join("");

  // Evidence list
  const evContainer = document.getElementById("cand-evidence-list");
  evContainer.innerHTML = (report.evidence_registry || []).map(e => `
    <div style="display: flex; justify-content: space-between; align-items: center; background: #0f172a; padding: 0.6rem; border-radius: 8px; border: 1px solid var(--border-color);">
      <button class="evidence-chip" tabindex="0" aria-label="View evidence ${e.evidence_id} quote" onclick="openEvidenceModal('${e.evidence_id}')" onkeydown="if(event.key==='Enter'||event.key===' ')openEvidenceModal('${e.evidence_id}')">${e.evidence_id}</button>
      <span style="font-size: 0.85rem; color: #cbd5e1;">${e.source} - ${e.section}</span>
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

    const card = document.createElement("article");
    card.className = `glass-panel agent-card ${meta.class}`;
    card.setAttribute("tabindex", "0");
    card.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <span class="badge ${meta.badge}">${meta.title}</span>
          <span class="badge ${getBadgeClass(ev.recommendation)}">${ev.recommendation}</span>
        </div>
        <p style="font-size: 0.95rem; color: #ffffff; margin-bottom: 1rem; line-height: 1.6;">${ev.reasoning}</p>
        
        <h4 style="font-size: 0.8rem; text-transform: uppercase; color: #cbd5e1; margin-bottom: 0.5rem; letter-spacing: 0.05em;">Strengths</h4>
        <ul style="font-size: 0.875rem; color: #ffffff; margin-left: 1.2rem; margin-bottom: 1rem;">
          ${(ev.strengths || []).map(s => `<li>${s}</li>`).join("")}
        </ul>

        <h4 style="font-size: 0.8rem; text-transform: uppercase; color: #cbd5e1; margin-bottom: 0.5rem; letter-spacing: 0.05em;">Concerns</h4>
        <ul style="font-size: 0.875rem; color: #fca5a5; margin-left: 1.2rem; margin-bottom: 1rem;">
          ${(ev.concerns || []).map(c => `<li>${c}</li>`).join("")}
        </ul>
      </div>

      <div>
        <h4 style="font-size: 0.8rem; text-transform: uppercase; color: #cbd5e1; margin-bottom: 0.5rem;">Cites Evidence</h4>
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          ${(ev.evidence || []).map(e => `<button class="evidence-chip" tabindex="0" aria-label="Evidence quote ${e.evidence_id}" onclick="openEvidenceModal('${e.evidence_id}')" onkeydown="if(event.key==='Enter'||event.key===' ')openEvidenceModal('${e.evidence_id}')">${e.evidence_id}</button>`).join("")}
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
    const changeTrigger = opinionChanges.find(oc => oc.trigger_message_id === msg.message_id || (oc.changed && oc.agent_type === msg.agent_type && msg.changes_position));

    const card = document.createElement("article");
    card.className = "glass-panel debate-turn-card";
    card.setAttribute("tabindex", "0");
    
    let stanceClass = "stance-agree";
    if (msg.stance === "DISAGREE") stanceClass = "stance-disagree";
    if (msg.stance === "PARTIAL") stanceClass = "stance-partial";
    if (msg.stance === "CLARIFY") stanceClass = "stance-clarify";

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <span style="font-size: 0.75rem; color: #cbd5e1; font-weight: 600;">ROUND ${msg.round_number}</span>
          <span class="badge ${getAgentBadgeClass(msg.agent_type)}">${msg.agent_type.toUpperCase()}</span>
          ${msg.target_agent ? `<span style="font-size: 0.85rem; color: #94a3b8; font-weight: 600;">➔ ${msg.target_agent.toUpperCase()}</span>` : ''}
        </div>
        <span class="badge ${stanceClass}">${msg.stance}</span>
      </div>

      <p style="font-size: 1rem; color: #ffffff; margin-bottom: 0.75rem; line-height: 1.6;">${msg.message}</p>

      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <span style="font-size: 0.75rem; color: #cbd5e1; font-weight: 600;">Evidence Cited:</span>
        ${(msg.evidence_ids || []).map(id => `<button class="evidence-chip" tabindex="0" aria-label="Evidence quote ${id}" onclick="openEvidenceModal('${id}')" onkeydown="if(event.key==='Enter'||event.key===' ')openEvidenceModal('${id}')">${id}</button>`).join("")}
      </div>
    `;

    container.appendChild(card);

    if (changeTrigger && msg.changes_position) {
      const changeCard = document.createElement("aside");
      changeCard.className = "opinion-changed-card";
      changeCard.setAttribute("tabindex", "0");
      changeCard.innerHTML = `
        <span style="font-size: 1.5rem;" aria-hidden="true">⚡</span>
        <div>
          <strong style="color: #fde047; font-size: 0.95rem;">OPINION REVISED: ${msg.agent_type.toUpperCase()} AGENT</strong>
          <p style="font-size: 0.875rem; color: #fef08a;">Updated position to <strong>${msg.new_recommendation || 'BORDERLINE'}</strong> based on debate evidence.</p>
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
          `<span style="color: #fde047; font-weight: 800;">YES ⚡</span>` : 
          `<span style="color: #cbd5e1;">NO</span>`}
      </td>
      <td style="font-size: 0.9rem; color: #ffffff;">${oc.reason}</td>
    </tr>
  `).join("");
}

function renderFinalDecision(decision) {
  const header = document.getElementById("final-decision-header");
  header.innerHTML = `
    <div class="glass-panel" style="padding: 2rem; text-align: center; border-color: var(--primary);">
      <span style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; color: #cbd5e1; font-weight: 700;">FINAL PANEL RECOMMENDATION</span>
      <h2 style="font-size: 2.25rem; font-weight: 800; margin: 0.5rem 0;">
        <span class="badge ${getBadgeClass(decision.recommendation)}" style="font-size: 1.5rem; padding: 0.5rem 1.5rem;">${decision.recommendation}</span>
      </h2>
      <p style="color: #cbd5e1; font-size: 1rem; font-weight: 600;">Confidence Level: <strong style="color: #ffffff;">${decision.confidence}</strong></p>
      <p style="max-width: 800px; margin: 1rem auto 0 auto; font-size: 1.05rem; color: #ffffff; text-align: left; line-height: 1.7;">
        ${decision.final_reasoning}
      </p>
    </div>
  `;

  document.getElementById("final-strengths").innerHTML = (decision.strengths || []).map(s => `<div style="margin-bottom: 0.5rem; color: #ffffff;">✓ ${s}</div>`).join("");
  document.getElementById("final-concerns").innerHTML = (decision.concerns || []).map(c => `<div style="margin-bottom: 0.5rem; color: #fca5a5;">• ${c}</div>`).join("");

  const stepsContainer = document.getElementById("reasoning-steps-container");
  stepsContainer.innerHTML = (decision.reasoning_steps || []).map(step => `
    <div style="display: flex; gap: 1rem; margin-bottom: 1rem; padding: 0.85rem; background: #0f172a; border-radius: 8px; border: 1px solid var(--border-color);">
      <span style="font-family: 'JetBrains Mono'; font-weight: 800; color: #818cf8;">STEP ${step.step}</span>
      <div>
        <strong style="font-size: 0.95rem; color: #ffffff;">${step.title}</strong>
        <p style="font-size: 0.875rem; color: #cbd5e1; margin-top: 0.2rem;">${step.content}</p>
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
        <h3 style="font-size: 1.2rem; font-weight: 700; color: #818cf8; margin-bottom: 0.5rem;">Panel Verdict Summary</h3>
        <p style="color: #ffffff; font-size: 1rem; line-height: 1.6;">${comp.panel_summary}</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
        ${comp.candidates.map(c => `
          <div class="glass-panel" style="padding: 1.5rem;" tabindex="0">
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: #ffffff;">${c.name}</h3>
            <span class="badge ${getBadgeClass(c.recommendation)}" style="margin-bottom: 1rem;">${c.recommendation}</span>
            
            <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem;">
              <div><strong style="color: #ffffff;">Technical Depth:</strong> <span style="color: #cbd5e1;">${c.technical_depth}</span></div>
              <div><strong style="color: #ffffff;">Integrity & Honesty:</strong> <span style="color: #cbd5e1;">${c.integrity_accountability}</span></div>
              <div><strong style="color: #ffffff;">Production Readiness:</strong> <span style="color: #cbd5e1;">${c.production_readiness}</span></div>
              <div><strong style="color: #ffffff;">Skeptic Finding:</strong> <span style="color: #fca5a5;">${c.skeptic_finding}</span></div>
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
      <span style="background: rgba(255,255,255,0.12); color: #ffffff; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">${s}</span>
    `).join("");

    const modal = document.getElementById("evidence-modal");
    modal.classList.add("active");
    modal.focus();
    announceToScreenReader(`Opened evidence modal for ${ev.evidence_id}`);
  } catch (err) {
    console.error("Failed to fetch evidence quote:", err);
  }
}

function closeEvidenceModal() {
  const modal = document.getElementById("evidence-modal");
  if (modal) {
    modal.classList.remove("active");
    announceToScreenReader("Closed evidence modal");
  }
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
