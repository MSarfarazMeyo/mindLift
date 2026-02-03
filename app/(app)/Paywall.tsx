import { Redirect, router } from 'expo-router';
import { useRC } from '@/lib/revenuecat';
import CustomPaywall from '../(auth)/CustomPaywall';

const Page = () => {
  const ctx = useRC();

  return <CustomPaywall />;
};

export default Page;
