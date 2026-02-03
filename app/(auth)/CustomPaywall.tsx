import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Purchases from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { useRC } from '@/lib/revenuecat';
import * as StoreReview from 'expo-store-review';

const FEATURES = [
  { icon: 'chatbubbles', text: 'Unlimited daily supportive messages' },
  { icon: 'analytics', text: 'Advanced mood tracking insights' },
  { icon: 'book', text: 'Personalized journal prompts' },
  { icon: 'game-controller', text: 'Access to all interactive games' },
  { icon: 'trending-up', text: 'Progress tracking and reports' },
  { icon: 'remove-circle', text: 'Ad-free experience' },
];

export default function CustomPaywall() {
  const { setCustomerInfo, isSubscriber, customerInfo } = useRC();
  const [selectedPlan, setSelectedPlan] = useState('$rc_annual');
  const [loading, setLoading] = useState(false);
  const [offering, setOffering] = useState<any>(null);

  useEffect(() => {
    loadOfferings();
  }, []);

  console.log('offering', offering);

  const loadOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setOffering(offerings.current);
        // Default to annual if available
        const annualPkg = offerings.current.availablePackages.find(
          (p) => p.packageType === 'ANNUAL',
        );
        setSelectedPlan(
          annualPkg?.identifier ||
            offerings.current.availablePackages[0]?.identifier ||
            '$rc_annual',
        );
      }
    } catch (error) {
      console.error('Failed to load offerings:', error);
    }
  };

  const requestReview = async () => {
    try {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        await StoreReview.requestReview();
      }
    } catch (error) {
      console.error('Error requesting review:', error);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await RevenueCatUI.presentCustomerCenter();
    } catch (error) {
      console.error('Error opening customer center:', error);
    }
  };

  const handlePurchase = async () => {
    try {
      setLoading(true);
      const packageToPurchase = offering?.availablePackages.find(
        (pkg: any) => pkg.identifier === selectedPlan,
      );

      if (packageToPurchase) {
        const { customerInfo } =
          await Purchases.purchasePackage(packageToPurchase);
        setCustomerInfo(customerInfo);
        await requestReview();
        router.back();
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      const customerInfo = await Purchases.restorePurchases();
      setCustomerInfo(customerInfo);
      await requestReview();
      router.back();
    } catch (error) {
      console.error('Restore error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanDetails = (packageType: string) => {
    const pkg = offering?.availablePackages.find(
      (p: any) => p.identifier === packageType,
    );
    if (!pkg) return null;

    const { product } = pkg;
    let badge = '';
    let savings = '';

    if (packageType === '$rc_annual') {
      badge = 'Most Popular';
      const monthlyPrice = offering?.monthly?.product.price || 0;
      const yearlyMonthlyPrice = product.pricePerMonth || 0;
      const savingsPercent = Math.round(
        ((monthlyPrice - yearlyMonthlyPrice) / monthlyPrice) * 100,
      );
      savings = `Save ${savingsPercent}%`;
    } else if (packageType === '$rc_lifetime') {
      badge = 'Best Value';
      savings = 'One-time payment';
    }

    return { product, badge, savings };
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            // Only go back if user has active subscription
            const hasActiveEntitlement =
              Object.keys(customerInfo?.entitlements?.active || {}).length > 0;
            if (hasActiveEntitlement) {
              router.back();
            }
          }}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&auto=format&fit=crop&q=80',
          }}
          style={styles.headerImage}
        />

        <Text style={styles.title}>
          Unlock Your Full{'\n'}Mental Wellness Journey
        </Text>
        <Text style={styles.subtitle}>
          Join thousands improving their mental health daily
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.featuresContainer}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark" size={16} color="#4CAF50" />
              </View>
              <Ionicons
                name={feature.icon as any}
                size={20}
                color="#667eea"
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plansContainer}>
          {/* Monthly Plan */}
          {offering?.availablePackages
            .filter((pkg: any) => pkg.packageType === 'MONTHLY')
            .map((pkg: any) => {
              const details = getPlanDetails(pkg.identifier);
              if (!details) return null;

              const isSelected = selectedPlan === pkg.identifier;
              const { product, badge, savings } = details;

              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[styles.planCard, isSelected && styles.selectedPlan]}
                  onPress={() => setSelectedPlan(pkg.identifier)}
                >
                  {badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  )}

                  <View style={styles.planHeader}>
                    <View style={styles.radioButton}>
                      {isSelected && <View style={styles.radioSelected} />}
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={styles.planTitle}>{product.title}</Text>
                      <Text style={styles.planDescription}>
                        {product.description}
                      </Text>
                      {savings && <Text style={styles.savings}>{savings}</Text>}
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.planPrice}>
                        {product.priceString}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

          {/* Annual Plan */}
          {offering?.availablePackages
            .filter((pkg: any) => pkg.packageType === 'ANNUAL')
            .map((pkg: any) => {
              const details = getPlanDetails(pkg.identifier);
              if (!details) return null;

              const isSelected = selectedPlan === pkg.identifier;
              const { product, badge, savings } = details;

              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[styles.planCard, isSelected && styles.selectedPlan]}
                  onPress={() => setSelectedPlan(pkg.identifier)}
                >
                  {badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  )}

                  <View style={styles.planHeader}>
                    <View style={styles.radioButton}>
                      {isSelected && <View style={styles.radioSelected} />}
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={styles.planTitle}>{product.title}</Text>
                      <Text style={styles.planDescription}>
                        {product.description}
                      </Text>
                      {savings && <Text style={styles.savings}>{savings}</Text>}
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.planPrice}>
                        {product.priceString}
                      </Text>
                    </View>
                  </View>

                  {product.introPrice && (
                    <View style={styles.trialContainer}>
                      <View style={styles.trialBadge}>
                        <Text style={styles.trialBadgeText}>🎉 FREE TRIAL</Text>
                      </View>
                      <Text style={styles.trialText}>
                        {product.introPrice.periodNumberOfUnits} days completely
                        free
                      </Text>
                      <Text style={styles.trialSubtext}>
                        then {product.pricePerYearString} per year
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

          {/* Lifetime Plan */}
          {offering?.availablePackages
            .filter((pkg: any) => pkg.packageType === 'LIFETIME')
            .map((pkg: any) => {
              const details = getPlanDetails(pkg.identifier);
              if (!details) return null;

              const isSelected = selectedPlan === pkg.identifier;
              const { product, badge, savings } = details;

              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[styles.planCard, isSelected && styles.selectedPlan]}
                  onPress={() => setSelectedPlan(pkg.identifier)}
                >
                  {badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  )}

                  <View style={styles.planHeader}>
                    <View style={styles.radioButton}>
                      {isSelected && <View style={styles.radioSelected} />}
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={styles.planTitle}>{product.title}</Text>
                      <Text style={styles.planDescription}>
                        {product.description}
                      </Text>
                      {savings && <Text style={styles.savings}>{savings}</Text>}
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.planPrice}>
                        {product.priceString}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
        </View>

        <TouchableOpacity
          style={[styles.continueButton, loading && styles.disabledButton]}
          onPress={isSubscriber ? handleManageSubscription : handlePurchase}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueText}>
              {isSubscriber
                ? 'Manage Subscription'
                : selectedPlan === '$rc_annual'
                  ? 'Try for Free'
                  : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleRestore}>
            <Text style={styles.footerLink}>Restore Purchases</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>•</Text>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>•</Text>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Privacy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  headerImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    paddingVertical: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  plansContainer: {
    marginBottom: 30,
  },
  planCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPlan: {
    borderColor: '#667eea',
    backgroundColor: '#f0f2ff',
  },
  badge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#667eea',
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  savings: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 4,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  freeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  freeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 4,
  },
  trialContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  trialBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  trialBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  trialSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  trialText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  continueButton: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  continueText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },
  footerLink: {
    color: '#666',
    fontSize: 14,
  },
  footerDivider: {
    color: '#666',
    marginHorizontal: 12,
  },
});
