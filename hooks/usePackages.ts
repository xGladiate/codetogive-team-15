import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Package, NewPackage } from '@/types/package';

export const usePackages = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch packages from Supabase
  const fetchPackages = async (): Promise<void> => {
    const supabase = await createClient();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPackages(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new package
  const addPackage = async (packageData: NewPackage): Promise<boolean> => {
    const supabase = await createClient();
    try {
      const { data, error } = await supabase
        .from('packages')
        .insert([packageData])
        .select();

      if (error) throw error;
      if (data) {
        setPackages(prev => [...data, ...prev]);
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding package');
      console.error('Error adding package:', err);
      return false;
    }
  };

  // Update existing package
  const updatePackage = async (id: number, packageData: NewPackage): Promise<boolean> => {
    const supabase = await createClient();
    try {
      const { data, error } = await supabase
        .from('packages')
        .update(packageData)
        .eq('id', id)
        .select();

      if (error) throw error;
      if (data) {
        setPackages(prev => prev.map(pkg => 
          pkg.id === id ? data[0] : pkg
        ));
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating package');
      console.error('Error updating package:', err);
      return false;
    }
  };

  // Delete package
  const deletePackage = async (id: number): Promise<boolean> => {
    const supabase = await createClient();
    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPackages(prev => prev.filter(pkg => pkg.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting package');
      console.error('Error deleting package:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return {
    packages,
    loading,
    error,
    addPackage,
    updatePackage,
    deletePackage,
    refetchPackages: fetchPackages
  };
};
