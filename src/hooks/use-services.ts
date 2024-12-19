import { useMemo } from 'react';
import { BaseService } from '@/services';

interface Services {
  baseService: BaseService;
}

export function useServices(): Services {
  return useMemo(
    () => ({
      baseService: new BaseService(),
    }),
    []
  );
} 