import React, { useState } from 'react';
import { Folder, Trash2, Plus, FileText, CheckSquare, Square, ChevronRight } from 'lucide-react';

interface ProjectStep {
  id: string;
  text: string;
  isCompleted: boolean;
}

interface ProjectDocument {
  id: string;
  title: string;
  projectId: string | null;
  content: string;
}

interface ProjectRoadmapProps {
  projectId: string;
  projectName: string;
  steps?: ProjectStep[];
  documents: ProjectDocument[];
  onAddStep: (projectId: string, text: string) => void;
  onToggleStep: (projectId: string, stepId: string) => void;
  onDeleteStep: (projectId: string, stepId: string) => void;
  onSelectDoc: (id: string) => void;
  onNewDocInProject: (projectId: string) => void;
}

export default function ProjectRoadmap({
  projectId,
  projectName,
  steps = [],
  documents,
  onAddStep,
  onToggleStep,
  onDeleteStep,
  onSelectDoc,
  onNewDocInProject
}: ProjectRoadmapProps) {
  const [newStepText, setNewStepText] = useState('');

  const projectDocs = documents.filter(d => d.projectId === projectId);
  
  const totalSteps = steps.length;
  const completedSteps = steps.filter(s => s.isCompleted).length;
  const completionPercentage = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);

  const handleAddStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStepText.trim()) {
      onAddStep(projectId, newStepText.trim());
      setNewStepText('');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-light-bg dark:bg-[#1E1E1E] transition-colors duration-200 overflow-y-auto">
      
      {/* Header Panel */}
      <div className="px-8 py-6 border-b border-gray-200 dark:border-[#3F3F3F] bg-white dark:bg-[#2D2D2D]/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-azure/10 flex items-center justify-center text-brand-azure shadow-sm border border-brand-azure/20">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <span className="px-2 py-0.5 bg-brand-azure/10 text-brand-azure text-[9px] font-bold rounded-md uppercase tracking-wider">
              Project Workspace
            </span>
            <h1 className="text-lg font-bold text-neutral-800 dark:text-white leading-tight mt-0.5">
              {projectName}
            </h1>
          </div>
        </div>

        {/* Progress Metrics */}
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-450">
            <span>Roadmap Completion</span>
            <span className="font-mono">{completedSteps} of {totalSteps} steps ({completionPercentage}%)</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-orange rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-8 py-6 max-w-3xl w-full space-y-8 fade-in">
        
        {/* 1. Roadmap Checklist Section */}
        <div className="space-y-4">
          <div className="border-b border-gray-100 dark:border-[#3F3F3F] pb-2">
            <h2 className="text-xs font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase">Roadmap Steps</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Add actionable milestones or tasks to track this project.</p>
          </div>

          {/* Inline Step Creator */}
          <form onSubmit={handleAddStepSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Add a new step for this idea..."
              value={newStepText}
              onChange={(e) => setNewStepText(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3F3F3F] rounded-xl text-xs outline-none text-neutral-800 dark:text-neutral-200 focus:border-brand-azure transition-colors placeholder-gray-450"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-brand-azure hover:bg-brand-azure/95 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Checklist Items */}
          <div className="space-y-2 mt-3">
            {steps.map((step) => (
              <div 
                key={step.id}
                className="group flex items-center justify-between p-3.5 bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3F3F3F] rounded-xl transition hover:shadow-sm"
              >
                <div 
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => onToggleStep(projectId, step.id)}
                >
                  {step.isCompleted ? (
                    <CheckSquare className="w-4 h-4 text-brand-orange flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400 dark:text-neutral-500 flex-shrink-0" />
                  )}
                  <span className={`text-xs transition ${
                    step.isCompleted 
                      ? 'line-through text-gray-400 dark:text-neutral-500 font-normal' 
                      : 'text-neutral-800 dark:text-neutral-200 font-medium'
                  }`}>
                    {step.text}
                  </span>
                </div>

                <button
                  onClick={() => onDeleteStep(projectId, step.id)}
                  className="p-1 text-gray-450 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 rounded-lg transition opacity-0 group-hover:opacity-100"
                  title="Remove Step"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {totalSteps === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-[#3F3F3F] rounded-2xl text-xs text-gray-400 dark:text-neutral-500">
                No roadmap steps defined. Add a step above to get started!
              </div>
            )}
          </div>
        </div>

        {/* 2. Context Documents Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-[#3F3F3F] pb-2">
            <div>
              <h2 className="text-xs font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase">Context Notes</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Reference documents and write details belonging to this project.</p>
            </div>
            <button
              onClick={() => onNewDocInProject(projectId)}
              className="text-[11px] font-bold text-brand-azure flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3 h-3" />
              <span>Create Note</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projectDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDoc(doc.id)}
                className="bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3F3F3F] rounded-2xl p-4 cursor-pointer hover:shadow-md transition hover:-translate-y-0.5 active:translate-y-0 relative flex flex-col justify-between min-h-[100px]"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-brand-azure">
                    <FileText className="w-3.5 h-3.5" />
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-white truncate">
                      {doc.title}
                    </h4>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-neutral-450 line-clamp-2 leading-relaxed">
                    {doc.content || 'Empty document.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-[#3F3F3F]/50 flex items-center justify-end text-[9px] font-bold text-brand-azure gap-0.5">
                  <span>Open Document</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            ))}

            {projectDocs.length === 0 && (
              <div className="col-span-full text-center py-8 border-2 border-dashed border-gray-200 dark:border-[#3F3F3F] rounded-2xl text-xs text-gray-400 dark:text-neutral-500">
                No documents associated with this project. Click "Create Note" above to write one.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
