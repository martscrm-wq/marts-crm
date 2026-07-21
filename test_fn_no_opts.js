function openCrmClientForm(clientId){
  const c=clientId?getCrmClients().find(x=>x.id===clientId):null;
  const employees=STORAGE.get('employees',[]);
  const empOpts="";
  const sourceOpts="";
  const statusOpts="";
  const stageOpts="";
  const projects=STORAGE.get('sales',[]).map(s=>s.project).filter(Boolean);
  const projOpts="";
  const projOpts=uniqueProjects.map(p=>`<option value="${p}" ${c&&c.preferredProject===p?'selected':''}>${p}</option>`).join('');
  const myTeamIds=currentUser?getTeamUserIds(currentUser.username):[];
  const allUsers=getAllUsers();
  const userOpts="";
  const userOpts=teamUsers.map(u=>`<option value="${u.username}" ${c&&c.assignedUser===u.username?'selected':''}>${u.fullName||u.username} (${t(u.role)})</option>`).join('');

  const html=`<h3>${c?t('crm_editClient'):t('crm_addClient')}</h3>
  <div class="form-row">
    <div class="form-group"><label>${t('crm_clientName')} *</label><input type="text" id="crm_name" value="${c?c.name:''}" required></div>
    <div class="form-group"><label>${t('crm_clientPhone')}</label><input type="text" id="crm_phone" value="${c?c.phone||'':''}"></div>
  </div>
  <div class="form-row">
    <div class="form-group"><label>${t('crm_clientEmail')}</label><input type="email" id="crm_email" value="${c?c.email||'':''}"></div>
    <div class="form-group"><label>${t('crm_clientNationalId')}</label><input type="text" id="crm_nationalId" value="${c?c.nationalId||'':''}"></div>
  </div>
  <div class="form-row">
    <div class="form-group"><label>${t('crm_clientSource')}</label><select id="crm_source">${sourceOpts}</select></div>
    <div class="form-group"><label>${t('crm_clientStatus')}</label><select id="crm_status">${statusOpts}</select></div>
  </div>
  <div class="form-row">
    <div class="form-group"><label>${t('crm_stage')}</label><select id="crm_stage">${stageOpts}</select></div>
    <div class="form-group"><label>${t('crm_clientBudget')}</label><input type="number" id="crm_budget" value="${c?c.budget||'':''}" min="0"></div>
    <div class="form-group"><label>${t('crm_clientAssigned')}</label><select id="crm_assigned"><option value="">--</option>${empOpts}</select></div>
  </div>
  <div class="form-row">
    <div class="form-group"><label>${t('crm_clientAssignedUser')}</label><select id="crm_assignedUser"><option value="">--</option>${userOpts}</select></div>
    <div class="form-group"><label>${t('crm_clientPreferredProject')}</label><select id="crm_prefProject"><option value="">--</option>${projOpts}</select></div>
  </div>
  <div class="form-group full"><label>${t('crm_clientPreferredUnit')}</label><input type="text" id="crm_prefUnit" value="${c?c.preferredUnit||'':''}"></div>
  <div class="form-group full"><label>${t('crm_clientAddress')}</label><input type="text" id="crm_address" value="${c?c.address||'':''}"></div>
  <div class="form-row">
    <div class="form-group"><label>${t('crm_clientNextFollowUp')}</label><input type="date" id="crm_nextFollowUp" value="${c?c.nextFollowUp||'':''}"></div>
    <div class="form-group"><label>${t('integ_campaignName')}</label><input type="text" id="crm_campaignName" value="${c?c.campaignName||'':''}" placeholder="${lang==='ar'?'اسم الحملة الإعلانية':'Ad campaign name'}"></div>
  </div>
  <div class="form-group full"><label>${t('crm_clientNotes')}</label><input type="text" id="crm_notes" value="${c?c.notes||'':''}"></div>
  <div class="form-group full"><label>${lang==='ar'?'المرفقات (مستندات الحجز/الصفقة)':'Attachments (Reservation/Deal Documents)'}</label>
    <div id="crmAttachmentsList" style="margin-bottom:8px">${(c&&c.attachments)?c.attachments.map((a,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:var(--crm-card-bg);border:1px solid var(--crm-card-border);border-radius:6px;margin-bottom:4px;font-size:12px"><i class="fas fa-file" style="color:var(--primary)"></i><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.name}</span><span style="color:var(--text-light);font-size:10px">${a.size||''}</span><button type="button" class="btn btn-danger btn-sm" style="padding:1px 4px;font-size:9px" onclick="removeCrmAttachment(${i},'${clientId||''}')"><i class="fas fa-times"></i></button></div>`).join(''):'')}</div>
    <input type="file" id="crm_attachments" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onchange="handleCrmAttachmentSelect(event,'${clientId||''}')" style="font-size:12px">
    <div style="font-size:10px;color:var(--text-light);margin-top:4px">${lang==='ar'?'PDF, صورة, أو مستند Word (حد أقصى 5MB)':'PDF, Image, or Word doc (max 5MB)'}</div>
  </div>
  <div class="modal-actions">
    <button class="btn btn-primary" onclick="saveCrmClient('${clientId||''}')"><i class="fas fa-save"></i> ${t('save')}</button>
    <button class="btn btn-outline" onclick="closeModal()">${t('cancel')}</button>
  </div>`;
  document.getElementById('modalContainer').innerHTML=html;
  document.getElementById('modalContainer').style.width='700px';
  document.getElementById('modalOverlay').classList.add('active');
}
