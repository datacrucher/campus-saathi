import { useEffect } from 'react';
import { useCases } from '../data/CaseStore';

export function useDataLoading() {
  return useCases().loading;
}

export function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Campus Saathi`;
  }, [title]);
}
