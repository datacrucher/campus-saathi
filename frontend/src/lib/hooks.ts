import { useEffect } from 'react';
import { useCases } from '../data/CaseStore';

/** True while the signed-in user's cases are first being fetched. */
export function useDataLoading() {
  return useCases().loading;
}

export function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Campus Saathi`;
  }, [title]);
}
