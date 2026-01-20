import React, { useState } from 'react';
import { Eye, Code, Save } from 'lucide-react';

const TemplateEditor = ({ onSave }) => {
  const [template, setTemplate] = useState({
    nombre: 'Presentación Estándar',
    subject: 'Propuesta de Colaboración para {nombre}',
    body_html: '<h1>Hola {nombre}</h1><p>Hemos visto su empresa en {ciudad} y nos encantaría colaborar...</p>'
  });
  const [view, setView] = useState('edit'); // 'edit' or 'preview'

  const handleSave = () => {
    onSave(template);
  };

  const renderPreview = () => {
    let html = template.body_html;
    html = html.replace(/{nombre}/g, 'Empresa Ejemplo');
    html = html.replace(/{ciudad}/g, 'Ciudad Ejemplo');
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="glass p-6 mt-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Editor de Plantillas</h2>
        <div className="flex bg-white/5 rounded-lg p-1">
          <button 
            onClick={() => setView('edit')}
            className={`px-4 py-2 rounded-md text-sm transition-all ${view === 'edit' ? 'bg-primary-color text-white' : 'text-text-secondary'}`}
          >
            <Code size={16} className="inline mr-2" /> Editar
          </button>
          <button 
            onClick={() => setView('preview')}
            className={`px-4 py-2 rounded-md text-sm transition-all ${view === 'preview' ? 'bg-primary-color text-white' : 'text-text-secondary'}`}
          >
            <Eye size={16} className="inline mr-2" /> Vista Previa
          </button>
        </div>
      </div>

      {view === 'edit' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Asunto</label>
            <input 
              type="text" 
              value={template.subject}
              onChange={(e) => setTemplate({...template, subject: e.target.value})}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Cuerpo (HTML)</label>
            <textarea 
              value={template.body_html}
              onChange={(e) => setTemplate({...template, body_html: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-sm h-64 font-mono outline-none focus:border-primary-color transition-colors"
            />
          </div>
          <p className="text-xs text-text-secondary">
            Usa placeholders: <code className="text-primary-color">{'{nombre}'}</code>, <code className="text-primary-color">{'{ciudad}'}</code>, <code className="text-primary-color">{'{email}'}</code>
          </p>
        </div>
      ) : (
        <div className="bg-white text-gray-900 rounded-lg p-8 min-h-[300px]">
          <div className="border-b pb-4 mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase">Asunto:</span>
            <span className="ml-2 font-medium">{template.subject.replace(/{nombre}/g, 'Empresa Ejemplo')}</span>
          </div>
          {renderPreview()}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          <Save size={18} /> Guardar Plantilla
        </button>
      </div>
    </div>
  );
};

export default TemplateEditor;
