import { EXPO_PUBLIC_STRIPE_SECRET_KEY } from '@/constants/ApiUrl';
import { useStripe } from '@stripe/stripe-react-native';
import { Alert } from 'react-native';

export const useCheckout = () => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const STRIPE_SECRET_KEY = EXPO_PUBLIC_STRIPE_SECRET_KEY;

    // Handle one-time payment for lifetime plan
    const createOneTimePayment = async (selectedPlan: any, customerId: any) => {
        try {
            console.log("Creating one-time payment with:", { selectedPlan, customerId });

            // 1. Create a payment intent for one-time payment
            const paymentIntentResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `amount=${selectedPlan.unit_amount}&currency=usd&customer=${customerId}&automatic_payment_methods[enabled]=true&metadata[app_plan]=${selectedPlan.product.metadata.app_plan}`,
            });

            const paymentIntentData = await paymentIntentResponse.json();

            if (paymentIntentData.error) {
                throw new Error(`Payment intent error: ${paymentIntentData.error.message}`);
            }

            const clientSecret = paymentIntentData.client_secret;
            console.log("Created payment intent");

            // 2. Create an ephemeral key for the customer
            const ephemeralKeyResponse = await fetch('https://api.stripe.com/v1/ephemeral_keys', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
                    'Stripe-Version': '2022-11-15',
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `customer=${customerId}`,
            });

            const ephemeralKey = await ephemeralKeyResponse.json();

            if (ephemeralKey.error) {
                throw new Error(`Ephemeral key error: ${ephemeralKey.error.message}`);
            }

            console.log("Created ephemeral key");

            // 3. Initialize Payment Sheet
            const { error: initError } = await initPaymentSheet({
                paymentIntentClientSecret: clientSecret,
                customerEphemeralKeySecret: ephemeralKey.secret,
                customerId,
                merchantDisplayName: 'MindLift',
                allowsDelayedPaymentMethods: true,
            });

            if (initError) {
                if (initError.code === 'Canceled') {
                    return { canceled: true };
                }
                throw new Error(`Payment sheet initialization error: ${initError.message}`);
            }

            // 4. Present Payment Sheet
            const { error: paymentError } = await presentPaymentSheet();

            if (paymentError) {
                if (paymentError.code === 'Canceled') {
                    return { canceled: true };
                }
                throw new Error(`Payment sheet error: ${paymentError.message}`);
            }

            // 5. Verify the payment intent status
            const verifyResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentData.id}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.error) {
                throw new Error(`Payment verification error: ${verifyData.error.message}`);
            }

            if (verifyData.status !== 'succeeded') {
                throw new Error(`Payment not completed. Status: ${verifyData.status}`);
            }

            console.log("One-time payment completed successfully");
            Alert.alert('Success', 'Your lifetime plan purchase has been completed successfully!');

            return {
                success: true,
                paymentIntentId: paymentIntentData.id
            };
        } catch (error: any) {
            console.error('Stripe error:', error);
            Alert.alert('Payment Failed', error.message || 'Unknown error');
            return { error: error.message };
        }
    };


    const createSubscription = async (selectedPlan: any, customerId: any, planType?: string) => {
        try {

            // Different approach for trial vs regular subscriptions
            let clientSecret;
            let intentId;
            let intentType;
            let paymentIntentData: any = null; // Initialize this variable

            if (planType === 'trial') {
                // For trials, use Setup Intent to collect payment method without charging
                const setupIntentResponse = await fetch('https://api.stripe.com/v1/setup_intents', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `customer=${customerId}&automatic_payment_methods[enabled]=true`,
                });

                const setupIntentData = await setupIntentResponse.json();

                if (setupIntentData.error) {
                    throw new Error(`Setup intent error: ${setupIntentData.error.message}`);
                }

                clientSecret = setupIntentData.client_secret;
                intentId = setupIntentData.id;
                intentType = 'setup';
                console.log("Created setup intent");
            } else {
                // For regular subscriptions, use Payment Intent with full amount
                const paymentIntentResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `amount=${selectedPlan.unit_amount}&currency=usd&customer=${customerId}&automatic_payment_methods[enabled]=true`,
                });

                paymentIntentData = await paymentIntentResponse.json();

                if (paymentIntentData.error) {
                    throw new Error(`Payment intent error: ${paymentIntentData.error.message}`);
                }

                clientSecret = paymentIntentData.client_secret;
                intentId = paymentIntentData.id;
                intentType = 'payment';
                console.log("Created payment intent");
            }

            // 2. Create an ephemeral key for the customer
            const ephemeralKeyResponse = await fetch('https://api.stripe.com/v1/ephemeral_keys', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
                    'Stripe-Version': '2022-11-15',
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `customer=${customerId}`,
            });

            const ephemeralKey = await ephemeralKeyResponse.json();

            if (ephemeralKey.error) {
                throw new Error(`Ephemeral key error: ${ephemeralKey.error.message}`);
            }

            console.log("Created ephemeral key");

            // 3. Initialize Payment Sheet - works for both setup intent and payment intent
            const { error: initError } = await initPaymentSheet({
                // Use the appropriate client secret based on intent type
                ...(intentType === 'setup'
                    ? { setupIntentClientSecret: clientSecret }
                    : { paymentIntentClientSecret: clientSecret }),
                customerEphemeralKeySecret: ephemeralKey.secret,
                customerId,
                merchantDisplayName: 'MindLift',
                primaryButtonLabel: planType === 'trial' ? 'Add Payment Method' : 'Pay Now',

            });

            if (initError) {
                throw new Error(`Payment sheet initialization error: ${initError.message}`);
            }

            // 4. Present Payment Sheet
            const { error: paymentError } = await presentPaymentSheet();

            if (paymentError) {
                if (paymentError.code === 'Canceled') {
                    return { canceled: true };
                }
                throw new Error(`Payment sheet error: ${paymentError.message}`);
            }

            console.log("Payment sheet presented successfully");

            // Get the payment method
            let paymentMethodId;
            let retrievedSetupIntent: any = null;
            let retrievedPaymentIntent: any = null;

            if (intentType === 'setup') {
                // For setup intent, retrieve the setup intent to get the payment method
                const retrieveSetupIntentResponse = await fetch(`https://api.stripe.com/v1/setup_intents/${intentId}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });

                retrievedSetupIntent = await retrieveSetupIntentResponse.json();

                if (retrievedSetupIntent.error) {
                    throw new Error(`Error retrieving setup intent: ${retrievedSetupIntent.error.message}`);
                }

                if (!retrievedSetupIntent.payment_method) {
                    throw new Error('Payment method not found in the completed setup intent');
                }

                paymentMethodId = retrievedSetupIntent.payment_method;
            } else {
                // For payment intent, retrieve the payment intent to get the payment method
                const retrievePaymentIntentResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${intentId}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });

                retrievedPaymentIntent = await retrievePaymentIntentResponse.json();

                if (retrievedPaymentIntent.error) {
                    throw new Error(`Error retrieving payment intent: ${retrievedPaymentIntent.error.message}`);
                }

                if (!retrievedPaymentIntent.payment_method) {
                    throw new Error('Payment method not found in the completed payment intent');
                }

                paymentMethodId = retrievedPaymentIntent.payment_method;
            }

            // 5. Now create the subscription with the confirmed payment method
            // Use the payment method from whichever intent type was used
            const paymentMethod = intentType === 'setup'
                ? retrievedSetupIntent.payment_method
                : retrievedPaymentIntent.payment_method;

            let subscriptionBody = `customer=${customerId}&items[0][price]=${selectedPlan.id}&collection_method=charge_automatically&default_payment_method=${paymentMethod}`;

            // Add trial period for trial plans
            if (planType === 'trial') {
                const trialPeriodDays = 3; // 3-day trial as shown in your UI
                subscriptionBody += `&trial_period_days=${trialPeriodDays}`;
            }

            const subscriptionResponse = await fetch('https://api.stripe.com/v1/subscriptions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: subscriptionBody,
            });

            const subscriptionData = await subscriptionResponse.json();

            if (subscriptionData.error) {
                throw new Error(`Subscription error: ${subscriptionData.error.message}`);
            }

            console.log("Created subscription successfully");

            if (planType === 'trial') {
                Alert.alert(
                    'Trial Activated',
                    'Your 3-day free trial has been activated! Your payment method has been saved and will be charged when the trial period ends, unless you cancel before then.'
                );
            } else {
                Alert.alert('Success', 'Your subscription has been completed successfully!');
            }

            return {
                success: true,
                subscriptionId: subscriptionData.id,
                // Only include paymentIntentId if it exists (for non-trial flows)
                ...(paymentIntentData ? { paymentIntentId: paymentIntentData.id } : {})
            };
        } catch (error: any) {
            console.error('Stripe error:', error);
            Alert.alert('Payment Failed', error.message || 'Unknown error');
            return { error: error.message };
        }
    };

    // Handler to determine which payment function to use
    const processPayment = async (selectedPlan: any, customerId: any, planType: string) => {
        // Check if it's a lifetime plan (one-time payment) or a subscription
        if (planType === 'lifetime') {
            return await createOneTimePayment(selectedPlan, customerId);
        } else {
            return await createSubscription(selectedPlan, customerId, planType);
        }
    };

    return { processPayment };
};














// const createSubscription = async (selectedPlan: any, customerId: any, planType?: string) => {
//     try {
//         console.log("Creating subscription with:", { selectedPlan, customerId, planType });

//         // For trial plans, we can directly create a subscription with a trial period
//         if (planType === 'trial') {
//             const trialPeriodDays = 3; // 3-day trial as shown in your UI

//             // Create subscription with trial period - no payment required initially
//             const subscriptionResponse = await fetch('https://api.stripe.com/v1/subscriptions', {
//                 method: 'POST',
//                 headers: {
//                     Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
//                     'Content-Type': 'application/x-www-form-urlencoded',
//                 },
//                 body: `customer=${customerId}&items[0][price]=${selectedPlan.id}&trial_period_days=${trialPeriodDays}`,
//             });

//             const subscriptionData = await subscriptionResponse.json();

//             if (subscriptionData.error) {
//                 throw new Error(`Trial subscription error: ${subscriptionData.error.message}`);
//             }

//             console.log("Created trial subscription successfully");
//             Alert.alert('Success', 'Your free trial has been activated! You will not be charged until the trial period ends.');

//             return {
//                 success: true,
//                 subscriptionId: subscriptionData.id,
//             };
//         }

//         // For regular subscriptions (monthly/yearly), continue with the payment flow
//         // 1. Create a payment intent first
//         const paymentIntentResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
//             method: 'POST',
//             headers: {
//                 Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
//                 'Content-Type': 'application/x-www-form-urlencoded',
//             },
//             body: `amount=${selectedPlan.unit_amount}&currency=usd&customer=${customerId}&automatic_payment_methods[enabled]=true`,
//         });

//         const paymentIntentData = await paymentIntentResponse.json();

//         if (paymentIntentData.error) {
//             throw new Error(`Payment intent error: ${paymentIntentData.error.message}`);
//         }

//         const clientSecret = paymentIntentData.client_secret;
//         console.log("Created payment intent");

//         // 2. Create an ephemeral key for the customer
//         const ephemeralKeyResponse = await fetch('https://api.stripe.com/v1/ephemeral_keys', {
//             method: 'POST',
//             headers: {
//                 Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
//                 'Stripe-Version': '2022-11-15',
//                 'Content-Type': 'application/x-www-form-urlencoded',
//             },
//             body: `customer=${customerId}`,
//         });

//         const ephemeralKey = await ephemeralKeyResponse.json();

//         if (ephemeralKey.error) {
//             throw new Error(`Ephemeral key error: ${ephemeralKey.error.message}`);
//         }

//         console.log("Created ephemeral key");

//         // 3. Initialize Payment Sheet
//         const { error: initError } = await initPaymentSheet({
//             paymentIntentClientSecret: clientSecret,
//             customerEphemeralKeySecret: ephemeralKey.secret,
//             customerId,
//             merchantDisplayName: 'Your App Name',
//         });

//         if (initError) {
//             throw new Error(`Payment sheet initialization error: ${initError.message}`);
//         }

//         // 4. Present Payment Sheet
//         const { error: paymentError } = await presentPaymentSheet();

//         if (paymentError) {
//             if (paymentError.code === 'Canceled') {
//                 return { canceled: true };
//             }
//             throw new Error(`Payment sheet error: ${paymentError.message}`);
//         }

//         console.log("Payment sheet presented successfully");

//         // Retrieve the payment intent to get the payment method
//         const retrievePaymentIntentResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentData.id}`, {
//             method: 'GET',
//             headers: {
//                 Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
//                 'Content-Type': 'application/x-www-form-urlencoded',
//             },
//         });

//         const retrievedPaymentIntent = await retrievePaymentIntentResponse.json();

//         if (retrievedPaymentIntent.error) {
//             throw new Error(`Error retrieving payment intent: ${retrievedPaymentIntent.error.message}`);
//         }

//         if (!retrievedPaymentIntent.payment_method) {
//             throw new Error('Payment method not found in the completed payment intent');
//         }

//         console.log("Retrieved payment method ID:", retrievedPaymentIntent.payment_method);

//         // 5. Now create the subscription with the confirmed payment method
//         const subscriptionResponse = await fetch('https://api.stripe.com/v1/subscriptions', {
//             method: 'POST',
//             headers: {
//                 Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
//                 'Content-Type': 'application/x-www-form-urlencoded',
//             },
//             body: `customer=${customerId}&items[0][price]=${selectedPlan.id}&collection_method=charge_automatically&default_payment_method=${retrievedPaymentIntent.payment_method}`,
//         });

//         const subscriptionData = await subscriptionResponse.json();

//         if (subscriptionData.error) {
//             throw new Error(`Subscription error: ${subscriptionData.error.message}`);
//         }

//         console.log("Created subscription successfully");
//         Alert.alert('Success', 'Your subscription has been completed successfully!');

//         return {
//             success: true,
//             subscriptionId: subscriptionData.id,
//             paymentIntentId: paymentIntentData.id
//         };
//     } catch (error: any) {
//         console.error('Stripe error:', error);
//         Alert.alert('Payment Failed', error.message || 'Unknown error');
//         return { error: error.message };
//     }
// };