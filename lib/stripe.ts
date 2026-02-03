import { EXPO_PUBLIC_STRIPE_SECRET_KEY } from "@/constants/ApiUrl";
import { supabase } from "./supabase";

// lib/stripe.ts
const getStripeCustomerByEmail = async (email: string) => {
    try {
        const response = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${EXPO_PUBLIC_STRIPE_SECRET_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to retrieve Stripe customer');
        }

        // If there is a customer with the given email, return the ID
        if (data.data && data.data.length > 0) {
            return data.data[0].id; // return the customer ID
        }

        return null; // No customer found
    } catch (error) {
        console.error('Error checking Stripe customer:', error);
        throw error;
    }
};

export const createOrGetStripeCustomerId = async (email: string, name: string) => {
    try {
        // Check if the customer already exists
        const existingCustomerId = await getStripeCustomerByEmail(email);

        if (existingCustomerId) {
            console.log('Customer already exists with ID:', existingCustomerId);
            return existingCustomerId; // Return existing customer ID if found
        }

        // If no existing customer, create a new one
        const response = await fetch('https://api.stripe.com/v1/customers', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${EXPO_PUBLIC_STRIPE_SECRET_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to create Stripe customer');
        }

        return data.id; // Return new customer ID
    } catch (error) {
        console.error('Stripe customer creation failed:', error);
        throw error;
    }
};



export const fetchStripeProducts = async () => {
    try {
        const response = await fetch('https://api.stripe.com/v1/products', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${EXPO_PUBLIC_STRIPE_SECRET_KEY}`, // Never expose the secret key in frontend
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to fetch products');
        }

        return data.data; // Returns the list of products
    } catch (error) {
        console.error('Error fetching products from Stripe:', error);
        throw error;
    }
};


export const fetchAppPlanPrices = async () => {
    try {
        const response = await fetch('https://api.stripe.com/v1/prices?expand[]=data.product', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${EXPO_PUBLIC_STRIPE_SECRET_KEY}`,
            },
        });

        const data = await response.json();




        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to fetch price IDs');
        }

        const filteredPrices = data.data.filter((price: any) =>
            ['monthly', 'yearly', 'lifetime'].includes(price?.product?.metadata?.app_plan)

        );



        return filteredPrices;
    } catch (error) {
        console.error('Error fetching price IDs:', error);
        throw error;
    }
};



