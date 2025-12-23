
"use client";

import React, { useState, useRef } from 'react';
import { useTempoFlow } from '@/contexts/tempo-flow-context';
import { Button } from '@/components/ui/button';
import { Upload, Download, Library, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { Preset } from '@/lib/types';
import PresetLibraryDialog from './preset-library-dialog'; // New import

const PresetManager: React.FC = () => {
  const { presets, sections, importPresets } = useTempoFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryMode, setLibraryMode] = useState<'manage' | 'save'>('manage');

  const handleExportPresets = () => {
    if (presets.length === 0) {
      toast({ title: "Info", description: "No presets to export." });
      return;
    }
    // For now, export flattens presets, folder structure is not included in JSON
    const presetsToExport = presets.map(({ folderId, ...rest }) => rest); 
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(presetsToExport, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = 'tempo-flow-presets.json';
    link.click();
    toast({ title: "Success", description: "All presets exported." });
  };

  const handleImportPresets = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string) as Preset[];
          // Add basic validation if needed
          if (Array.isArray(imported)) {
            // Imported presets will not have folderId or will be assigned to root
            const presetsWithClearedFolderId = imported.map(p => ({...p, folderId: undefined}));
            importPresets(presetsWithClearedFolderId);
            toast({ title: "Success", description: "Presets imported successfully." });
          } else {
            throw new Error("Invalid file format");
          }
        } catch (error) {
          toast({ title: "Error", description: "Failed to import presets. Invalid file format.", variant: "destructive" });
        }
      };
      reader.readAsText(file);
      if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
    }
  };

  const openLibraryForSave = () => {
    if (sections.length === 0) {
      toast({ title: "Error", description: "Cannot save an empty set of sections as a preset.", variant: "destructive" });
      return;
    }
    setLibraryMode('save');
    setIsLibraryOpen(true);
  };

  const openLibraryForManage = () => {
    setLibraryMode('manage');
    setIsLibraryOpen(true);
  };

  return (
    <div className="space-y-2 w-full">
      <Button variant="outline" className="w-full justify-start" onClick={openLibraryForSave} disabled={sections.length === 0}>
        <Save className="mr-2 h-4 w-4" /> Save Current as Preset...
      </Button>
      <Button variant="outline" className="w-full justify-start" onClick={openLibraryForManage}>
        <Library className="mr-2 h-4 w-4" /> Manage & Load Presets
      </Button>
      <Button variant="outline" className="w-full justify-start" onClick={handleExportPresets} disabled={presets.length === 0}>
        <Download className="mr-2 h-4 w-4" /> Export All Presets
      </Button>
      <Button variant="outline" className="w-full justify-start" onClick={() => fileInputRef.current?.click()}>
        <Upload className="mr-2 h-4 w-4" /> Import Presets
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        onChange={handleImportPresets}
        className="hidden"
      />
      {isLibraryOpen && (
        <PresetLibraryDialog
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          mode={libraryMode}
        />
      )}
    </div>
  );
};

export default PresetManager;
