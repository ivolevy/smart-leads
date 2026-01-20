import React from 'react';
import { Mail, Phone, ExternalLink, ShieldCheck, Clock, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ResultsTable = ({ empresas, onSendEmail }) => {
  
  const exportCSV = () => {
    const headers = ['Nombre', 'Email', 'Teléfono', 'Website', 'Rubro', 'Dirección'];
    const rows = empresas.map(e => [
      e.nombre, e.email || '', e.telefono || '', e.website || '', e.rubro || '', e.direccion || ''
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(r => r.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "b2b_leads.csv");
    document.body.appendChild(link);
    link.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Leads B2B", 14, 15);
    
    const tableColumn = ["Nombre", "Email", "Teléfono", "Website"];
    const tableRows = empresas.map(e => [
      e.nombre, e.email || 'N/A', e.telefono || 'N/A', e.website || 'N/A'
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save("b2b_leads.pdf");
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Empresas Encontradas ({empresas.length})</h2>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg">
            <Download size={16} /> CSV
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg">
            <Download size={16} /> PDF
          </button>
        </div>
      </div>

      <div className="glass overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Rubro</th>
                <th>Estado</th>
                <th>Contacto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((empresa) => (
                <tr key={empresa.id || empresa.osm_id} className="hover:bg-white/5 transition-colors">
                  <td>
                    <div className="font-semibold">{empresa.nombre}</div>
                    <div className="text-xs text-text-secondary truncate max-w-[200px]">{empresa.direccion}</div>
                  </td>
                  <td>
                    <span className="text-xs bg-primary-color/20 text-primary-color px-2 py-1 rounded">
                      {empresa.rubro}
                    </span>
                  </td>
                  <td>
                    {empresa.validada ? (
                      <div className="flex items-center gap-1 status-valid text-xs">
                        <ShieldCheck size={14} /> Validada
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 status-pending text-xs">
                        <Clock size={14} /> Pendiente
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      {empresa.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-text-secondary" /> {empresa.email}
                        </div>
                      )}
                      {empresa.telefono && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-text-secondary" /> {empresa.telefono}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {empresa.website && (
                        <a 
                          href={empresa.website} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-text-secondary hover:text-white"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                      {empresa.email && (
                        <button 
                          onClick={() => onSendEmail(empresa)}
                          className="p-2 btn-accent rounded-full"
                          title="Enviar Email"
                        >
                          <Mail size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {empresas.length === 0 && (
            <div className="p-10 text-center text-text-secondary">
              No hay resultados para mostrar. Inicia una búsqueda arriba.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsTable;
