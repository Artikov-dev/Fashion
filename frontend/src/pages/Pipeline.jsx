import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  fetchLeads, fetchStages, updateLeadStage, moveLeadLocally, createLead,
} from '../slices/leadsSlice';
import { fetchContacts } from '../slices/contactsSlice';
import Badge    from '../components/UI/Badge';
import Modal    from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';

function fmt(n) {
  return Number(n || 0).toLocaleString('uz-UZ') + " so'm";
}

function LeadCard({ lead, index }) {
  const priorityBorder = {
    low: 'border-l-gray-200 dark:border-l-white/10',
    medium: 'border-l-amber-400',
    high: 'border-l-orange-500',
    urgent: 'border-l-red-500',
  };

  return (
    <Draggable draggableId={String(lead.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            bg-white dark:bg-[#0F172A] rounded-xl p-3 mb-2
            border border-gray-100 dark:border-white/5 border-l-4 ${priorityBorder[lead.priority] || priorityBorder.medium}
            shadow-sm cursor-grab active:cursor-grabbing
            ${snapshot.isDragging ? 'shadow-xl ring-2 ring-[#185FA5]/30 rotate-1' : 'hover:shadow-md'}
            transition-all duration-150
          `}
        >
          <p className="text-sm font-medium text-gray-800 dark:text-white/85 leading-snug line-clamp-2">
            {lead.title}
          </p>
          {lead.contact && (
            <p className="text-xs text-gray-400 dark:text-white/30 mt-1 truncate">
              {lead.contact.full_name}
              {lead.contact.company ? ` • ${lead.contact.company}` : ''}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-semibold text-[#185FA5] dark:text-blue-400">
              {fmt(lead.value)}
            </span>
            <Badge value={lead.priority} />
          </div>
        </div>
      )}
    </Draggable>
  );
}

function StageColumn({ stage, leads }) {
  const totalValue = leads.reduce((s, l) => s + (Number(l.value) || 0), 0);

  return (
    <div className="flex flex-col w-64 flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: stage.color }} />
          <span className="text-sm font-semibold text-gray-700 dark:text-white/80 truncate max-w-[130px]">
            {stage.name}
          </span>
          <span className="text-xs font-medium text-gray-400 dark:text-white/30 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded-full">
            {leads.length}
          </span>
        </div>
      </div>
      <div className="text-xs text-gray-400 dark:text-white/25 mb-2">
        {fmt(totalValue)}
      </div>

      {/* Droppable zone */}
      <Droppable droppableId={String(stage.id)}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 min-h-[200px] rounded-xl p-2 transition-colors duration-150
              ${snapshot.isDraggingOver
                ? 'bg-[#185FA5]/8 dark:bg-[#185FA5]/10 border-2 border-dashed border-[#185FA5]/40'
                : 'bg-gray-50 dark:bg-white/[0.02] border-2 border-dashed border-transparent'}
            `}
          >
            {leads.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-20 text-xs text-gray-300 dark:text-white/15">
                Lead yo'q
              </div>
            )}
            {leads.map((lead, i) => (
              <LeadCard key={lead.id} lead={lead} index={i} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function Pipeline() {
  const dispatch = useDispatch();
  const { items: leads, stages, loading } = useSelector((s) => s.leads);
  const { items: contacts } = useSelector((s) => s.contacts);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', contact_id: '', value: '', pipeline_stage_id: '', priority: 'medium' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchLeads({ status: 'open', per_page: 100 }));
    dispatch(fetchStages());
    dispatch(fetchContacts({ per_page: 100 }));
  }, [dispatch]);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const leadId  = Number(draggableId);
    const stageId = Number(destination.droppableId);

    dispatch(moveLeadLocally({ leadId, stageId }));
    dispatch(updateLeadStage({ id: leadId, pipeline_stage_id: stageId }));
  };

  const leadsInStage = (stageId) =>
    leads.filter((l) => l.pipeline_stage_id === stageId && l.status === 'open');

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    await dispatch(createLead({
      title:             form.title,
      contact_id:        Number(form.contact_id),
      value:             Number(form.value) || 0,
      pipeline_stage_id: form.pipeline_stage_id ? Number(form.pipeline_stage_id) : null,
      priority:          form.priority,
    }));
    setSaving(false);
    setModalOpen(false);
    setForm({ title: '', contact_id: '', value: '', pipeline_stage_id: '', priority: 'medium' });
    dispatch(fetchLeads({ status: 'open', per_page: 100 }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Pipeline</h1>
          <p className="text-sm text-gray-500 dark:text-white/40 mt-0.5">
            {leads.filter((l) => l.status === 'open').length} ta faol lead
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#185FA5] text-white text-sm font-medium rounded-xl hover:bg-[#1451A0] transition-colors"
        >
          <span>+</span> Yangi lead
        </button>
      </div>

      {/* Kanban board */}
      {stages.length === 0 && loading ? (
        <div className="flex items-center justify-center flex-1 text-gray-400 dark:text-white/30">
          Yuklanmoqda…
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 min-w-max">
              {stages.map((stage) => (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  leads={leadsInStage(stage.id)}
                />
              ))}
            </div>
          </DragDropContext>
        </div>
      )}

      {/* Create Lead Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Yangi lead">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">Sarlavha *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5]"
              placeholder="Lead sarlavhasi"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">Kontakt *</label>
            <select
              required
              value={form.contact_id}
              onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5]"
            >
              <option value="">Kontakt tanlang</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">Summa (so'm)</label>
              <input
                type="number"
                min="0"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5]"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">Muhimlik</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5]"
              >
                <option value="low">Past</option>
                <option value="medium">O'rta</option>
                <option value="high">Yuqori</option>
                <option value="urgent">Shoshilinch</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">Bosqich</label>
            <select
              value={form.pipeline_stage_id}
              onChange={(e) => setForm({ ...form, pipeline_stage_id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5]"
            >
              <option value="">Bosqich tanlang</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Bekor
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 text-sm font-medium rounded-xl bg-[#185FA5] text-white hover:bg-[#1451A0] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saqlanmoqda…' : 'Yaratish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
