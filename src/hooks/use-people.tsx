import { useState, useCallback } from 'react';
import type { CreatePersonDto, UpdatePersonDto } from '@bawes/erp-api-sdk';
import { usePeople as usePeopleService } from './use-services';

/**
 * Represents a person in the system
 */
interface Person {
  id: string;
  nameEn: string;
  nameAr: string;
  accountStatus: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Return type for the usePeople hook
 */
interface UsePeopleReturn {
  /** List of all people */
  people: Person[];
  /** Currently selected person or null if none selected */
  selectedPerson: Person | null;
  /** Whether any operation is in progress */
  isLoading: boolean;
  /** Error message if any operation failed */
  error: string | null;
  /** Loads all people */
  loadPeople: () => Promise<void>;
  /** Loads a specific person by ID */
  loadPerson: (id: string) => Promise<void>;
  /** Creates a new person */
  createPerson: (data: CreatePersonDto) => Promise<void>;
  /** Updates an existing person */
  updatePerson: (id: string, data: UpdatePersonDto) => Promise<void>;
  /** Removes a person */
  removePerson: (id: string) => Promise<void>;
}

/**
 * Hook for managing people in the system
 * 
 * Provides functionality to create, read, update, and delete people records,
 * as well as manage the loading and error states of these operations.
 * 
 * @example
 * ```tsx
 * const { people, loadPeople, createPerson } = usePeople();
 * 
 * useEffect(() => {
 *   loadPeople();
 * }, []);
 * ```
 * 
 * @returns {UsePeopleReturn} People management state and methods
 */
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