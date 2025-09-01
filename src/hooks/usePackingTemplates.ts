import { useState, useCallback } from 'react';
import { PackingTemplate, PackingItem, TripType, Trip } from '../types';
import { hybridDataService } from '../services/hybridDataService';
import { createPackingTemplate, loadPackingTemplate, filterCompatibleTemplates } from '../utils/templateHelpers';

interface UsePackingTemplatesReturn {
  availableTemplates: PackingTemplate[];
  loadingTemplates: boolean;
  savingTemplate: boolean;
  currentTemplateName: string;
  loadedTemplateName: string;
  setCurrentTemplateName: (name: string) => void;
  setLoadedTemplateName: (name: string) => void;
  loadTemplates: () => Promise<void>;
  saveTemplate: (name: string, items: PackingItem[], tripType: TripType) => Promise<void>;
  applyTemplate: (template: PackingTemplate, tripId: string, trip: Trip) => PackingItem[];
  deleteTemplate: (templateId: string) => Promise<void>;
}

export const usePackingTemplates = (): UsePackingTemplatesReturn => {
  const [availableTemplates, setAvailableTemplates] = useState<PackingTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [currentTemplateName, setCurrentTemplateName] = useState<string>('');
  const [loadedTemplateName, setLoadedTemplateName] = useState<string>('');

  const loadTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true);
      const templates = await hybridDataService.getPackingTemplates();
      setAvailableTemplates(templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      setAvailableTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  const saveTemplate = useCallback(async (name: string, items: PackingItem[], tripType: TripType) => {
    try {
      setSavingTemplate(true);
      const template = createPackingTemplate(name, tripType, items);
      await hybridDataService.savePackingTemplate(template);
      await loadTemplates();
      setCurrentTemplateName(name);
    } catch (error) {
      console.error('Failed to save template:', error);
      throw error;
    } finally {
      setSavingTemplate(false);
    }
  }, [loadTemplates]);

  const applyTemplate = useCallback((template: PackingTemplate, tripId: string, trip: Trip): PackingItem[] => {
    return loadPackingTemplate(template, tripId, trip);
  }, []);

  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      // For now, we'll filter out the template locally
      // TODO: Add deletePackingTemplate method to hybridDataService
      const filtered = availableTemplates.filter(t => t.id !== templateId);
      setAvailableTemplates(filtered);
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw error;
    }
  }, [availableTemplates]);

  return {
    availableTemplates,
    loadingTemplates,
    savingTemplate,
    currentTemplateName,
    loadedTemplateName,
    setCurrentTemplateName,
    setLoadedTemplateName,
    loadTemplates,
    saveTemplate,
    applyTemplate,
    deleteTemplate
  };
};