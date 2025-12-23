
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTempoFlow } from '@/contexts/tempo-flow-context';
import type { Preset, Folder } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FolderPlus, Trash2, FileText, ChevronDown, ChevronRight, PackageOpen, Save, Upload, Download, CalendarDays } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

interface PresetLibraryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'manage' | 'save';
}

const PresetLibraryDialog: React.FC<PresetLibraryDialogProps> = ({ isOpen, onClose, mode }) => {
  const { 
    sections, 
    presets, 
    folders, 
    savePreset: contextSavePreset, 
    loadPreset, 
    deletePreset, 
    addFolder,
    deleteFolder: contextDeleteFolder,
    importPresets: contextImportPresets,
  } = useTempoFlow();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentTab, setCurrentTab] = useState<'manage' | 'save'>(mode);
  
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [selectedFolderForSave, setSelectedFolderForSave] = useState<string | undefined>(undefined);
  const [newFolderNameToSaveDialog, setNewFolderNameToSaveDialog] = useState('');


  const [newFolderNameManageTab, setNewFolderNameManageTab] = useState(''); // Renamed for clarity
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [itemToDelete, setItemToDelete] = useState<{ type: 'preset' | 'folder', id: string, name: string } | null>(null);


  useEffect(() => {
    setCurrentTab(mode);
    if (mode === 'save') {
      setNewPresetName(''); 
      setNewPresetDescription('');
      setSelectedFolderForSave(undefined);
      setNewFolderNameToSaveDialog('');
    }
  }, [isOpen, mode]);

  const handleSaveFolderManageTab = () => {
    if (newFolderNameManageTab.trim() === '') {
      toast({ title: "Error", description: "Folder name cannot be empty.", variant: "destructive" });
      return;
    }
    addFolder(newFolderNameManageTab.trim());
    setNewFolderNameManageTab('');
    toast({ title: "Success", description: `Folder "${newFolderNameManageTab.trim()}" created.` });
  };

  const handleSavePreset = () => {
    if (newPresetName.trim() === '') {
      toast({ title: "Error", description: "Preset name cannot be empty.", variant: "destructive" });
      return;
    }
    if (sections.length === 0) {
      toast({ title: "Error", description: "Cannot save an empty set of sections.", variant: "destructive" });
      return;
    }

    let folderIdToSaveTo: string | undefined = selectedFolderForSave === 'root' ? undefined : selectedFolderForSave;

    if (newFolderNameToSaveDialog.trim() !== '') {
      if (folders.find(f => f.name.toLowerCase() === newFolderNameToSaveDialog.trim().toLowerCase())) {
        toast({ title: "Error", description: `Folder "${newFolderNameToSaveDialog.trim()}" already exists. Please choose it from the list or use a different name.`, variant: "destructive", duration: 5000 });
        return;
      }
      folderIdToSaveTo = addFolder(newFolderNameToSaveDialog.trim());
      toast({ title: "Folder Created", description: `Folder "${newFolderNameToSaveDialog.trim()}" created successfully.` });
    }
    
    contextSavePreset(newPresetName.trim(), folderIdToSaveTo, newPresetDescription.trim());
    toast({ title: "Success", description: `Preset "${newPresetName.trim()}" saved.` });
    
    setNewPresetName('');
    setNewPresetDescription('');
    setSelectedFolderForSave(undefined);
    setNewFolderNameToSaveDialog('');
    onClose(); 
  };
  
  const handleLoadPreset = (id: string) => {
    loadPreset(id);
    const loaded = presets.find(p => p.id === id);
    toast({ title: "Success", description: `Preset "${loaded?.name}" loaded.` });
    onClose();
  };

  const handleDeleteConfirmed = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'preset') {
      deletePreset(itemToDelete.id);
      toast({ title: "Success", description: `Preset "${itemToDelete.name}" deleted.` });
    } else if (itemToDelete.type === 'folder') {
      const presetsInFolder = presets.filter(p => p.folderId === itemToDelete.id);
      if (presetsInFolder.length > 0) {
         toast({ title: "Folder Deleted", description: `Folder "${itemToDelete.name}" deleted. Its presets are now in root.`, duration: 5000 });
      } else {
        toast({ title: "Success", description: `Folder "${itemToDelete.name}" deleted.` });
      }
      contextDeleteFolder(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const rootPresets = presets.filter(p => !p.folderId);

  const handleExportPresets = () => {
    if (presets.length === 0) {
      toast({ title: "Info", description: "No presets to export." });
      return;
    }
    const presetsToExport = presets.map(({ folderId, ...rest }) => ({
        ...rest,
    }));
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(presetsToExport, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = 'tempo-flow-presets.json';
    link.click();
    toast({ title: "Success", description: "All presets exported." });
  };

  const handleImportFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          if (Array.isArray(importedData) && importedData.every(p => p.id && p.name && Array.isArray(p.sections))) {
            contextImportPresets(importedData as Preset[]);
            toast({ title: "Success", description: "Presets imported successfully." });
          } else {
            throw new Error("Invalid file format. Expected an array of presets.");
          }
        } catch (error) {
          toast({ title: "Error", description: `Failed to import presets. ${error instanceof Error ? error.message : 'Invalid file format.'}`, variant: "destructive" });
        }
      };
      reader.readAsText(file);
      if(fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };


  const renderPresetItem = (preset: Preset) => (
    <div key={preset.id} className="flex flex-col p-2 hover:bg-muted/50 rounded-md group space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{preset.name}</span>
        </div>
        <div className="space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={() => handleLoadPreset(preset.id)}>Load</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setItemToDelete({ type: 'preset', id: preset.id, name: preset.name })}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {preset.description && (
        <p className="text-xs text-muted-foreground pl-6 truncate">{preset.description}</p>
      )}
      {preset.updatedAt && (
         <div className="flex items-center text-xs text-muted-foreground/80 pl-6">
            <CalendarDays className="mr-1.5 h-3 w-3" />
            <span>Updated: {format(new Date(preset.updatedAt), "MMM d, yyyy")}</span>
         </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[80vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Preset Library</DialogTitle>
          <DialogDescription>Manage your saved presets and folders, or save your current setup.</DialogDescription>
        </DialogHeader>

        <div className="flex border-b">
          <Button variant={currentTab === 'manage' ? 'ghost' : 'ghost'} onClick={() => setCurrentTab('manage')} 
                  className={cn("py-3 px-4 rounded-none", currentTab === 'manage' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground')}>
            <PackageOpen className="mr-2 h-4 w-4"/> Manage & Load
          </Button>
          <Button variant={currentTab === 'save' ? 'ghost' : 'ghost'} onClick={() => setCurrentTab('save')}
                  className={cn("py-3 px-4 rounded-none", currentTab === 'save' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground')}
                  disabled={sections.length === 0}>
            <Save className="mr-2 h-4 w-4"/> Save Current Setup
          </Button>
        </div>

        <ScrollArea className="flex-grow overflow-y-auto p-1 pr-3 -mr-2">
          {currentTab === 'manage' && (
            <div className="py-4 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="newFolderNameManageTab" className="text-sm font-medium">Create New Folder</Label>
                <div className="flex space-x-2 mt-1">
                  <Input 
                    id="newFolderNameManageTab" 
                    value={newFolderNameManageTab} 
                    onChange={(e) => setNewFolderNameManageTab(e.target.value)}
                    placeholder="E.g., Song Ideas, Practice Routines"
                  />
                  <Button onClick={handleSaveFolderManageTab} variant="outline">
                    <FolderPlus className="mr-2 h-4 w-4" /> Add Folder
                  </Button>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleExportPresets} disabled={presets.length === 0}>
                  <Download className="mr-2 h-4 w-4" /> Export All
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" /> Import Presets
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleImportFileSelect}
                  className="hidden"
                />
              </div>


              <div className="space-y-3">
                {folders.map(folder => {
                  const presetsInFolder = presets.filter(p => p.folderId === folder.id);
                  const isExpanded = !!expandedFolders[folder.id];
                  return (
                    <div key={folder.id} className="py-2">
                      <div 
                        className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md cursor-pointer group"
                        onClick={() => toggleFolderExpansion(folder.id)}
                      >
                        <div className="flex items-center space-x-2">
                          {isExpanded ? <ChevronDown className="h-5 w-5"/> : <ChevronRight className="h-5 w-5"/>}
                          <svg viewBox="0 0 24 24" width="20" height="20" className="text-primary fill-current" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.23A2 2 0 0 0 10.07 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path></svg>
                          <span className="font-medium">{folder.name}</span>
                          <span className="text-xs text-muted-foreground">({presetsInFolder.length})</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setItemToDelete({ type: 'folder', id: folder.id, name: folder.name });}}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {isExpanded && (
                        <div className="pl-10 mt-1 space-y-1 border-l ml-[13px]">
                          {presetsInFolder.length > 0 ? (
                            presetsInFolder.map(renderPresetItem)
                          ) : (
                            <p className="text-xs text-muted-foreground p-2">No presets in this folder.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="py-2">
                 <div className="flex items-center p-2 space-x-2 mb-1">
                    <svg viewBox="0 0 24 24" width="20" height="20" className="text-muted-foreground fill-current" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.23A2 2 0 0 0 10.07 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path></svg>
                    <h3 className="text-md font-semibold"> Root Presets 
                        <span className="text-xs text-muted-foreground ml-1">({rootPresets.length})</span>
                    </h3>
                 </div>
                {rootPresets.length > 0 ? (
                  <div className="pl-10 mt-1 space-y-1 border-l ml-[13px]">
                    {rootPresets.map(renderPresetItem)}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground p-2 pl-10">No presets in root. Save a preset or import some!</p>
                )}
              </div>
            </div>
          )}

          {currentTab === 'save' && (
            <div className="py-6 space-y-6">
              <p className="text-sm text-muted-foreground">
                Save your current set of tempo sections as a new preset.
              </p>
              <div>
                <Label htmlFor="newPresetName">Preset Name</Label>
                <Input 
                  id="newPresetName" 
                  value={newPresetName} 
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="My Awesome Beat Sequence"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="newPresetDescription">Description (Optional)</Label>
                <Textarea 
                  id="newPresetDescription" 
                  value={newPresetDescription} 
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                  placeholder="A short description for this preset..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="selectFolderForSave">Save to Folder (Optional)</Label>
                <Select value={selectedFolderForSave} onValueChange={setSelectedFolderForSave} disabled={!!newFolderNameToSaveDialog.trim()}>
                  <SelectTrigger id="selectFolderForSave" className="mt-1">
                    <SelectValue placeholder="Select a folder or save to root" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">No Folder (Save to Root)</SelectItem>
                    {folders.map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
               <div>
                <Label htmlFor="newFolderNameToSaveDialog">Or, Create & Save to New Folder</Label>
                <Input 
                  id="newFolderNameToSaveDialog" 
                  value={newFolderNameToSaveDialog} 
                  onChange={(e) => setNewFolderNameToSaveDialog(e.target.value)}
                  placeholder="E.g., My New Songs"
                  className="mt-1"
                />
                {newFolderNameToSaveDialog.trim() && folders.find(f => f.name.toLowerCase() === newFolderNameToSaveDialog.trim().toLowerCase()) && (
                  <p className="text-xs text-destructive mt-1">A folder with this name already exists. The preset will be saved to the existing folder if you proceed.</p>
                )}
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleSavePreset}>Save Preset</Button>
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="mt-auto pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
          </DialogClose>
        </DialogFooter>

        {itemToDelete && (
          <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the {itemToDelete.type} "{itemToDelete.name}".
                  {itemToDelete.type === 'folder' && presets.some(p => p.folderId === itemToDelete.id) && (
                     " Presets in this folder will be moved to root."
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PresetLibraryDialog;

