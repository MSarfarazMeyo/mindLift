import { StyleSheet } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';


export function cn(...inputs: (string | undefined | null | false)[]): string {
    return inputs
        .flat()
        .filter(Boolean)
        .join(" ");
}

export function createStyles<T extends Record<string, object>>(styles: T): T {
    return StyleSheet.create(styles);
}



type ActionType = 'set' | 'get' | 'remove';

export const firstLoginStorage = async (type: ActionType, value?: boolean): Promise<boolean | void> => {
    const key = 'firstLogin';

    try {
        if (type === 'set' && value !== undefined) {
            await AsyncStorage.setItem(key, value ? 'true' : 'false');
            console.log('First login value saved:', value);
        }

        if (type === 'get') {
            const storedValue = await AsyncStorage.getItem(key);
            return storedValue === 'true'; // return true only if explicitly 'true'
        }

        if (type === 'remove') {
            await AsyncStorage.removeItem(key);
            console.log('First login value removed');
        }
    } catch (error) {
        console.error(`Error during ${type} operation on ${key}:`, error);
        if (type === 'get') return false; // fallback
    }
};

export const loginEmailStorage = async (type: 'set' | 'get' | 'remove', value?: string): Promise<string | void> => {
    const key = 'loginEmail';
    try {
        if (type === 'set' && value) {
            await AsyncStorage.setItem(key, value);
            console.log('Login email saved:', value);
        }
        if (type === 'get') {
            const storedValue = await AsyncStorage.getItem(key);
            return storedValue || '';
        }
        if (type === 'remove') {
            await AsyncStorage.removeItem(key);
            console.log('Login email removed');
        }
    } catch (error) {
        console.error(`Error during ${type} operation on ${key}:`, error);
    }
};
