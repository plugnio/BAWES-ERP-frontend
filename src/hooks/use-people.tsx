import { useState, useCallback } from 'react';
import type { CreatePersonDto, UpdatePersonDto } from '@bawes/erp-api-sdk';
import { usePeople as usePeopleService } from './use-services';

interface Person {
  id: string;
  nameEn: string;
  nameAr: string;
  accountStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface UsePeopleReturn {
  people: Person[];
  selectedPerson: Person | null;
  isLoading: boolean;
  error: string | null;
  loadPeople: () => Promise<void>;
  loadPerson: (id: string) => Promise<void>;
  createPerson: (data: CreatePersonDto) => Promise<void>;
  updatePerson: (id: string, data: UpdatePersonDto) => Promise<void>;
  removePerson: (id: string) => Promise<void>;
}

export function usePeople(): UsePeopleReturn {
  const peopleService = usePeopleService();
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown) => {
    if (err && typeof err === 'object' && 'message' in err) {
      setError(err.message as string);
    } else {
      setError('An unexpected error occurred');
    }
    setIsLoading(false);
  };

  const loadPeople = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await peopleService.findAll();
      setPeople(result);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadPerson = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await peopleService.findOne(id);
      setSelectedPerson(result);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createPerson = async (data: CreatePersonDto) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await peopleService.create(data);
      setPeople(prev => [...prev, result]);
      setSelectedPerson(result);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePerson = async (id: string, data: UpdatePersonDto) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await peopleService.update(id, data);
      setPeople(prev => prev.map(p => p.id === id ? result : p));
      setSelectedPerson(result);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removePerson = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await peopleService.remove(id);
      setPeople(prev => prev.filter(p => p.id !== id));
      if (selectedPerson?.id === id) {
        setSelectedPerson(null);
      }
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    people,
    selectedPerson,
    isLoading,
    error,
    loadPeople,
    loadPerson,
    createPerson,
    updatePerson,
    removePerson
  };
} 