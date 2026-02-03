import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRC } from '@/lib/revenuecat';
import { useRouter } from 'expo-router';

const SubscriptionButton = () => {
  const router = useRouter();
  const { subscriptionStatus, subscriptionType } = useRC();

  // Map subscriptionStatus to user-friendly label
  const statusLabels: Record<string, string> = {
    active: 'Active',
    canceled: 'Canceled',
    expired: 'Expired',
    none: 'No Subscription',
  };

  const statusLabel = statusLabels[subscriptionStatus] || 'Unknown Status';

  const buttonText = subscriptionType
    ? `Manage Subscription (${subscriptionType} — ${statusLabel})`
    : 'Subscription';

  const handleSubscription = () => {
    router.push('/Paywall');
  };

  return (
    <TouchableOpacity style={styles.menuItem} onPress={handleSubscription}>
      <View style={styles.menuItemContent}>
        <Ionicons name="card" size={24} color="#3498db" />
        <Text style={styles.menuItemText}>{buttonText}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#95a5a6" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 12,
  },
});

export default SubscriptionButton;
