import Purchases, { CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';
import React from 'react';
import {
  EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,
  EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
} from '@/constants/ApiUrl';

type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'none';
type SubscriptionType = 'trial' | 'yearly' | 'lifetime' | null;

const productIdToSubscriptionType: Record<string, SubscriptionType> = {
  lifetime_minfLift_plan_id: 'lifetime',
  yearly_mindlift_plan_id: 'yearly',
  weekly_mindlift_plan_with_three_day_trial_id: 'trial',
};

export const configureRevenueCat = async ({
  appUserID,
}: {
  appUserID?: string;
}): Promise<boolean> => {
  try {
    const apiKey = Platform.select({
      ios: EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
      android: EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,
    });
    if (!apiKey) {
      return false;
    }
    if (__DEV__) {
      await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }

    Purchases.configure({
      apiKey,
      appUserID,
      entitlementVerificationMode:
        Purchases.ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL,
    });
    console.log('RevenueCat configured');
    return true;
  } catch (error) {
    console.error('Error configuring RevenueCat:', error);
    return false;
  }
};

const RC = React.createContext<{
  customerInfo: CustomerInfo | null;
  isSubscriber: boolean;
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo | null>>;
  isConfigured: boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionType: SubscriptionType;
} | null>(null);

export const RCProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [customerInfo, setCustomerInfo] = React.useState<CustomerInfo | null>(
    null,
  );
  const [isConfigured, setIsConfigured] = React.useState(false);
  const mounted = React.useRef(false);
  console.log('customerInfo', customerInfo);

  React.useEffect(() => {
    if (mounted.current) {
      return;
    }

    const prepare = async () => {
      mounted.current = true;
      const configured = await configureRevenueCat({
        appUserID: '',
      });
      setIsConfigured(configured);
    };

    void prepare();
  }, []);
  const getSubscriptionData = React.useCallback(() => {
    if (!customerInfo)
      return {
        subscriptionStatus: 'none' as SubscriptionStatus,
        subscriptionType: null as SubscriptionType,
        isSubscriber: false,
      };

    // Check if user owns lifetime (or other non-subscription) product
    const ownsLifetime = customerInfo.allPurchasedProductIdentifiers.includes(
      'lifetime_minfLift_plan_id',
    );
    if (ownsLifetime) {
      return {
        subscriptionStatus: 'active', // One-time purchase means perpetual access
        subscriptionType: 'lifetime',
        isSubscriber: true,
      };
    }

    // Otherwise, fallback to subscription logic:
    const activeSubscriptionId = customerInfo.activeSubscriptions[0];
    if (!activeSubscriptionId) {
      return {
        subscriptionStatus: 'none',
        subscriptionType: null,
        isSubscriber: false,
      };
    }

    const subscriptionDetails =
      customerInfo.subscriptionsByProductIdentifier?.[activeSubscriptionId];

    if (!subscriptionDetails) {
      return {
        subscriptionStatus: 'none',
        subscriptionType: null,
        isSubscriber: false,
      };
    }

    const now = new Date();

    const expiresDate = subscriptionDetails.expiresDate
      ? new Date(subscriptionDetails.expiresDate)
      : null;
    const unsubscribeDetectedAt = subscriptionDetails.unsubscribeDetectedAt
      ? new Date(subscriptionDetails.unsubscribeDetectedAt)
      : null;
    const willRenew = subscriptionDetails.willRenew;

    let subscriptionStatus: SubscriptionStatus = 'none';

    if (
      subscriptionDetails.isActive &&
      willRenew !== false &&
      !unsubscribeDetectedAt
    ) {
      subscriptionStatus = 'active';
    } else if (
      subscriptionDetails.isActive &&
      unsubscribeDetectedAt &&
      willRenew === false
    ) {
      subscriptionStatus = 'canceled';
    } else if (expiresDate && expiresDate < now) {
      subscriptionStatus = 'expired';
    } else {
      subscriptionStatus = 'none';
    }

    const subscriptionType =
      productIdToSubscriptionType[activeSubscriptionId] || null;

    return {
      subscriptionStatus,
      subscriptionType,
      isSubscriber:
        subscriptionStatus === 'active' || subscriptionStatus === 'canceled',
    };
  }, [customerInfo]);

  const { subscriptionStatus, subscriptionType, isSubscriber } =
    getSubscriptionData();

  return (
    <RC.Provider
      value={{
        customerInfo,
        isSubscriber: isSubscriber,
        setCustomerInfo,
        isConfigured,
        subscriptionStatus: subscriptionStatus as SubscriptionStatus,
        subscriptionType: subscriptionType as SubscriptionType,
      }}
    >
      {children}
    </RC.Provider>
  );
};

export const useRC = () => {
  const ctx = React.useContext(RC);
  if (!ctx) {
    throw new Error('RevenueCat should be used within RC');
  }
  return ctx;
};
