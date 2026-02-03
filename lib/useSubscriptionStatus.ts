import { EXPO_PUBLIC_STRIPE_SECRET_KEY } from '@/constants/ApiUrl';
import { useStore } from './store';
import { useEffect, useState } from 'react';

export const useSubscriptionStatus = () => {
    const STRIPE_SECRET_KEY = EXPO_PUBLIC_STRIPE_SECRET_KEY;
    const userProfile = useStore((state) => state.userProfile);
    const updateUserProfile = useStore((state) => state.updateProfile);

    const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
    const [subscriptionEndDate, setSubscriptionEndDate] = useState<any>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            const result = await checkSubscriptionStatus();
            if (!result.error) {
                setSubscriptionStatus(result.status);
                setSubscriptionEndDate(result.endDate);
            }
        };

        fetchStatus();
    }, [userProfile?.subscription_id]);

    const checkSubscriptionStatus = async () => {
        try {
            if (!userProfile?.subscription_id) return { status: null, endDate: null };

            const response = await fetch(`https://api.stripe.com/v1/subscriptions/${userProfile.subscription_id}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const subscriptionData = await response.json();

            if (subscriptionData.error) {
                throw new Error(`Error fetching subscription: ${subscriptionData.error.message}`);
            }






            const status = subscriptionData.status;
            const endDateUnix = subscriptionData.trial_end;
            const endDate = endDateUnix
                ? new Date(endDateUnix * 1000).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                })
                : null;


            try {
                if (userProfile.subscription === 'trial' && status === 'active') {
                    const profileUpdate = {
                        ...userProfile,
                        subscription: 'yearly' as any,
                    };

                    await updateUserProfile(profileUpdate);
                }
            } catch (error) {

            }

            return { status, endDate };
        } catch (error: any) {
            console.error('Error checking subscription status:', error);
            return { error: error.message };
        }
    };

    return { subscriptionStatus, subscriptionEndDate };
};
