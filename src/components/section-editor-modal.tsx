
"use client";

import React, { useEffect, useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTempoFlow } from '@/contexts/tempo-flow-context';
import type { TempoSection, TimeSignature, Subdivision } from '@/lib/types'; 
import { SECTION_COLORS, TIME_SIGNATURES, SUBDIVISIONS, DEFAULT_TEMPO, DEFAULT_TIME_SIGNATURE, DEFAULT_SUBDIVISION, DEFAULT_MEASURES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import { Check, Trash2, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const sectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tempo: z.coerce.number().min(20, "Tempo must be at least 20 BPM").max(200, "Tempo must be at most 200 BPM"),
  endTempo: z.coerce.number().min(20, "End tempo must be at least 20 BPM").max(200, "End tempo must be at most 200 BPM").optional().or(z.literal('')),
  timeSignature: z.enum(TIME_SIGNATURES as [TimeSignature, ...TimeSignature[]]), 
  subdivision: z.enum(SUBDIVISIONS as [Subdivision, ...Subdivision[]]),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  measures: z.coerce.number().min(1, "Must have at least 1 measure").max(128, "Cannot exceed 128 measures"),
  accentedBeats: z.array(z.number()).optional(),
  isLoopable: z.boolean().optional(),
}).refine(data => !data.endTempo || data.endTempo === '' || (data.endTempo >= 20 && data.endTempo <= 200), {
    message: "End tempo must be between 20 and 200 BPM if specified.",
    path: ["endTempo"],
});


type SectionFormData = z.infer<typeof sectionSchema>;

interface SectionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: TempoSection | null;
}

const SectionEditorModal: React.FC<SectionEditorModalProps> = ({ isOpen, onClose, section }) => {
  const { addSection, updateSection, deleteSection, sections, defaultPlaybackSettings } = useTempoFlow();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors }, setValue } = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: '',
      tempo: DEFAULT_TEMPO,
      endTempo: undefined,
      timeSignature: DEFAULT_TIME_SIGNATURE,
      subdivision: DEFAULT_SUBDIVISION,
      color: SECTION_COLORS[0],
      measures: DEFAULT_MEASURES,
      accentedBeats: [0],
      isLoopable: false,
    },
  });

  const currentColor = useWatch({ control, name: 'color' });

  useEffect(() => {
    if (isOpen) { 
      if (section) {
        reset({
          ...section,
          endTempo: section.endTempo || undefined, 
          accentedBeats: section.accentedBeats || [0],
          isLoopable: section.isLoopable || false,
        });
      } else {
        reset({
          name: `Section ${sections.length + 1}`,
          tempo: defaultPlaybackSettings.tempo,
          endTempo: defaultPlaybackSettings.endTempo || undefined,
          timeSignature: defaultPlaybackSettings.timeSignature,
          subdivision: defaultPlaybackSettings.subdivision,
          color: SECTION_COLORS[sections.length % SECTION_COLORS.length],
          measures: DEFAULT_MEASURES,
          accentedBeats: defaultPlaybackSettings.accentedBeats || [0],
          isLoopable: false,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, reset, isOpen, sections.length, defaultPlaybackSettings]);


  const onSubmit = (data: SectionFormData) => {
    const processedData = {
      ...data,
      endTempo: data.endTempo === '' || data.endTempo === undefined ? undefined : Number(data.endTempo),
      accentedBeats: data.accentedBeats || [0],
      isLoopable: data.isLoopable || false,
    };
    if (section) {
      updateSection(section.id, processedData);
    } else {
      addSection(processedData);
    }
    onClose();
  };

  const handleDeleteConfirmed = () => {
    if (section) {
      deleteSection(section.id);
    }
    setIsDeleteDialogOpen(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent 
          className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{section ? 'Edit Section' : 'Add New Section'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div>
              <Label htmlFor="name" className="text-sm">Section Name</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input id="name" {...register('name')} className="flex-grow text-sm h-9" />
                <Edit3 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              </div>
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              <div>
                <Label htmlFor="tempo" className="text-xs sm:text-sm">Start Tempo</Label>
                <Input id="tempo" type="number" {...register('tempo')} className="mt-1 text-sm h-9" />
                {errors.tempo && <p className="text-xs text-destructive mt-1">{errors.tempo.message}</p>}
              </div>
              <div>
                <Label htmlFor="endTempo" className="text-xs sm:text-sm">End Tempo</Label>
                <Input id="endTempo" type="number" {...register('endTempo')} placeholder="Optional" className="mt-1 text-sm h-9" />
                {errors.endTempo && <p className="text-xs text-destructive mt-1">{errors.endTempo.message}</p>}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="measures" className="text-xs sm:text-sm">Measures</Label>
                <Input id="measures" type="number" {...register('measures')} className="mt-1 text-sm h-9" />
                {errors.measures && <p className="text-xs text-destructive mt-1">{errors.measures.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div>
                <Label htmlFor="timeSignature" className="text-xs sm:text-sm">Beats</Label>
                <Controller
                  name="timeSignature"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || DEFAULT_TIME_SIGNATURE}>
                      <SelectTrigger id="timeSignature" className="mt-1 h-9 text-sm">
                        <SelectValue placeholder="Select number of beats" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SIGNATURES.map(tsValue => ( 
                          <SelectItem key={tsValue} value={tsValue}>{tsValue}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.timeSignature && <p className="text-xs text-destructive mt-1">{errors.timeSignature.message}</p>}
              </div>

              <div>
                <Label htmlFor="subdivision" className="text-xs sm:text-sm">Subdivision</Label>
                <Controller
                  name="subdivision"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || DEFAULT_SUBDIVISION}>
                      <SelectTrigger id="subdivision" className="mt-1 h-9 text-sm">
                        <SelectValue placeholder="Select subdivision" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBDIVISIONS.map(sub => (
                          <SelectItem key={sub} value={sub}>{sub} Notes</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.subdivision && <p className="text-xs text-destructive mt-1">{errors.subdivision.message}</p>}
              </div>
            </div>
            
            <div>
              <Label htmlFor="color" className="text-xs sm:text-sm">Section Color</Label>
              <div className="flex gap-2 mt-2">
                {SECTION_COLORS.map(c => (
                  <button
                    type="button"
                    key={c}
                    className={cn(
                      "w-6 h-6 sm:w-7 sm:h-7 rounded-md border-2 cursor-pointer focus:outline-none transition-all duration-150 ease-in-out flex items-center justify-center",
                      currentColor === c 
                        ? 'ring-2 ring-offset-2 ring-primary border-primary/75 scale-110' 
                        : 'border-muted hover:border-muted-foreground'
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setValue('color', c, { shouldValidate: true, shouldDirty: true })}
                    aria-label={`Select color ${c}`}
                  >
                    {currentColor === c && <Check className="h-4 w-4 text-white mix-blend-difference" />}
                  </button>
                ))}
              </div>
              {errors.color && <p className="text-xs text-destructive mt-1">{errors.color.message}</p>}
            </div>


            <DialogFooter className="flex-row justify-between items-center gap-2">
              {section && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  size="sm"
                  className="h-9"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                 <DialogClose asChild>
                    <Button type="button" variant="outline" size="sm" className="h-9">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" size="sm" className="h-9">{section ? 'Save' : 'Add'}</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {section && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the section "{section.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default SectionEditorModal;
